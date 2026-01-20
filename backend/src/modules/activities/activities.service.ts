import { 
  Injectable, 
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { ActivityType, UserRole, BookingStatus } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(private prisma: PrismaService) {}

  async create(clinicId: string, userId: string, createDto: CreateActivityDto) {
    // Verificar que el fisioterapeuta existe y pertenece a la clínica
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { id: createDto.physiotherapistId },
    });

    if (!physiotherapist || physiotherapist.clinicId !== clinicId) {
      throw new BadRequestException('Fisioterapeuta no encontrado en esta clínica');
    }

    const activity = await this.prisma.activity.create({
      data: {
        clinicId,
        ...createDto,
      },
      include: {
        physiotherapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        schedules: true,
        _count: {
          select: {
            bookings: true,
            assignedPhysiotherapists: true,
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId,
        action: 'CREATE_ACTIVITY',
        entity: 'activity',
        entityId: activity.id,
      },
    });

    return activity;
  }

  async findAll(clinicId?: string, type?: ActivityType, isActive?: boolean) {
    return this.prisma.activity.findMany({
      where: {
        ...(clinicId && { clinicId }),
        ...(type && { type }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        physiotherapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        schedules: {
          where: {
            isActive: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        _count: {
          select: {
            bookings: true,
            assignedPhysiotherapists: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAvailableForBooking(clinicId: string) {
    const activities = await this.prisma.activity.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      include: {
        physiotherapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        schedules: {
          where: {
            isActive: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    // Filtrar actividades que tengan horarios activos
    return activities.filter(activity => activity.schedules.length > 0);
  }

  async findOne(id: string) {
    const activity = await this.prisma.activity.findUnique({
      where: { id },
      include: {
        physiotherapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        schedules: {
          where: {
            isActive: true,
          },
          orderBy: [
            { dayOfWeek: 'asc' },
            { startTime: 'asc' },
          ],
        },
        assignedPhysiotherapists: {
          where: {
            isActive: true,
          },
          include: {
            physiotherapist: {
              include: {
                user: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    return activity;
  }

  async findSchedules(activityId: string) {
    const activity = await this.findOne(activityId);

    return activity.schedules;
  }

  async findBookings(activityId: string, sessionDate?: string) {
    const activity = await this.findOne(activityId);

    const whereClause: any = {
      activityId,
    };

    if (sessionDate) {
      const date = new Date(sessionDate);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      whereClause.sessionDate = {
        gte: startOfDay,
        lte: endOfDay,
      };
    }

    return this.prisma.activityBooking.findMany({
      where: whereClause,
      include: {
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    });
  }

  async countParticipants(activityId: string, sessionDate: string) {
    const date = new Date(sessionDate);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.activityBooking.count({
      where: {
        activityId,
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });

    const activity = await this.findOne(activityId);

    return {
      activityId,
      sessionDate,
      currentParticipants: count,
      maxParticipants: activity.maxParticipants,
      availableSlots: activity.maxParticipants - count,
      isFull: count >= activity.maxParticipants,
    };
  }

  async update(
    id: string,
    clinicId: string,
    userId: string,
    updateDto: UpdateActivityDto,
  ) {
    const activity = await this.findOne(id);

    if (activity.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para editar esta actividad');
    }

    // Si cambia el fisioterapeuta, verificar que pertenece a la clínica
    if (updateDto.physiotherapistId) {
      const physiotherapist = await this.prisma.physiotherapist.findUnique({
        where: { id: updateDto.physiotherapistId },
      });

      if (!physiotherapist || physiotherapist.clinicId !== clinicId) {
        throw new BadRequestException('Fisioterapeuta no encontrado en esta clínica');
      }
    }

    const updated = await this.prisma.activity.update({
      where: { id },
      data: updateDto as any,
      include: {
        physiotherapist: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        schedules: true,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId,
        action: 'UPDATE_ACTIVITY',
        entity: 'activity',
        entityId: id,
        changes: updateDto as any,
      },
    });

    return updated;
  }

  async addSchedule(
    activityId: string,
    clinicId: string,
    scheduleDto: CreateScheduleDto,
  ) {
    const activity = await this.findOne(activityId);

    if (activity.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para editar esta actividad');
    }

    // Validar formato de hora (HH:MM)
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleDto.startTime) || !timeRegex.test(scheduleDto.endTime)) {
      throw new BadRequestException('Formato de hora inválido. Usa HH:MM');
    }

    if (scheduleDto.startTime >= scheduleDto.endTime) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    const schedule = await this.prisma.activitySchedule.create({
      data: {
        clinicId,
        activityId,
        ...scheduleDto,
        startDate: scheduleDto.startDate ? new Date(scheduleDto.startDate) : undefined,
        endDate: scheduleDto.endDate ? new Date(scheduleDto.endDate) : undefined,
      },
    });

    return schedule;
  }

  async removeSchedule(scheduleId: string, clinicId: string) {
    const schedule = await this.prisma.activitySchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!schedule) {
      throw new NotFoundException('Horario no encontrado');
    }

    if (schedule.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para eliminar este horario');
    }

    // Soft delete
    await this.prisma.activitySchedule.update({
      where: { id: scheduleId },
      data: { isActive: false },
    });

    return;
  }

  async createBooking(
    activityId: string,
    userId: string,
    bookingDto: CreateBookingDto,
  ) {
    const activity = await this.findOne(activityId);

    if (!activity.isActive) {
      throw new BadRequestException('La actividad no está activa');
    }

    // Obtener paciente
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    // Verificar que el paciente pertenece a la misma clínica
    if (patient.clinicId !== activity.clinicId) {
      throw new BadRequestException('Solo puedes reservar actividades de tu clínica');
    }

    const sessionDate = new Date(bookingDto.sessionDate);

    // Verificar que la fecha no es en el pasado
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (sessionDate < today) {
      throw new BadRequestException('No se pueden hacer reservas en el pasado');
    }

    // Verificar que no esté ya reservado para esa sesión
    const existingBooking = await this.prisma.activityBooking.findFirst({
      where: {
        activityId,
        patientId: patient.id,
        sessionDate,
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
    });

    if (existingBooking) {
      throw new BadRequestException('Ya tienes una reserva para esta sesión');
    }

    // Verificar disponibilidad de plazas
    const participantCount = await this.countParticipants(activityId, bookingDto.sessionDate);

    if (participantCount.isFull) {
      throw new BadRequestException('No hay plazas disponibles para esta sesión');
    }

    // Crear la reserva
    const booking = await this.prisma.activityBooking.create({
      data: {
        clinicId: activity.clinicId,
        activityId,
        patientId: patient.id,
        sessionDate,
        notes: bookingDto.notes,
        status: BookingStatus.CONFIRMED,
      },
      include: {
        activity: {
          select: {
            name: true,
            type: true,
            durationMinutes: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: activity.clinicId,
        userId,
        action: 'CREATE_ACTIVITY_BOOKING',
        entity: 'activity_booking',
        entityId: booking.id,
      },
    });

    return booking;
  }

  async cancelBooking(bookingId: string, user: any, cancellationReason?: string) {
    const booking = await this.prisma.activityBooking.findUnique({
      where: { id: bookingId },
      include: {
        patient: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Reserva no encontrada');
    }

    // Pacientes solo pueden cancelar sus propias reservas
    if (user.role === UserRole.PATIENT && booking.patient.userId !== user.id) {
      throw new ForbiddenException('Solo puedes cancelar tus propias reservas');
    }

    if (booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('La reserva ya está cancelada');
    }

    if (booking.status === BookingStatus.ATTENDED) {
      throw new BadRequestException('No se puede cancelar una sesión completada');
    }

    const updated = await this.prisma.activityBooking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationReason,
      },
      include: {
        activity: {
          select: {
            name: true,
          },
        },
        patient: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: booking.clinicId,
        userId: user.id,
        action: 'CANCEL_ACTIVITY_BOOKING',
        entity: 'activity_booking',
        entityId: bookingId,
      },
    });

    return updated;
  }

  async deactivate(id: string, clinicId: string, userId: string) {
    const activity = await this.findOne(id);

    if (activity.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para desactivar esta actividad');
    }

    await this.prisma.activity.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId,
        action: 'DEACTIVATE_ACTIVITY',
        entity: 'activity',
        entityId: id,
      },
    });

    return;
  }
}
