import { 
  Injectable, 
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { UserRole, AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(private prisma: PrismaService) {}

  async create(
    clinicId: string,
    userId: string,
    userRole: UserRole,
    createDto: CreateAppointmentDto,
  ) {
    const { patientId, physiotherapistId, startTime, endTime, reason, notes } = createDto;

    // Validar que el fisioterapeuta pertenece a la clínica
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { id: physiotherapistId },
    });

    if (!physiotherapist || physiotherapist.clinicId !== clinicId) {
      throw new BadRequestException('Fisioterapeuta no encontrado en esta clínica');
    }

    // Validar que el paciente pertenece a la clínica
    const patient = await this.prisma.patient.findUnique({
      where: { id: patientId },
    });

    if (!patient || patient.clinicId !== clinicId) {
      throw new BadRequestException('Paciente no encontrado en esta clínica');
    }

    // Si es paciente, solo puede crear citas para sí mismo
    if (userRole === UserRole.PATIENT && patient.userId !== userId) {
      throw new ForbiddenException('Solo puedes crear citas para ti mismo');
    }

    // Validar que startTime es antes de endTime
    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
    }

    // Validar que la cita no es en el pasado
    if (start < new Date()) {
      throw new BadRequestException('No se pueden crear citas en el pasado');
    }

    // Verificar disponibilidad del fisioterapeuta
    await this.validateAvailability(physiotherapistId, start, end);

    // Crear la cita
    const appointment = await this.prisma.appointment.create({
      data: {
        clinicId,
        patientId,
        physiotherapistId,
        startTime: start,
        endTime: end,
        reason,
        notes,
        status: userRole === UserRole.PATIENT ? AppointmentStatus.PENDING : AppointmentStatus.CONFIRMED,
      },
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
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId,
        action: 'CREATE_APPOINTMENT',
        entity: 'appointment',
        entityId: appointment.id,
      },
    });

    return appointment;
  }

  async validateAvailability(
    physiotherapistId: string,
    startTime: Date,
    endTime: Date,
    excludeAppointmentId?: string,
  ) {
    // 1. Verificar que el fisioterapeuta tiene disponibilidad ese día de la semana
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][startTime.getDay()];
    
    const availability = await this.prisma.availability.findFirst({
      where: {
        physiotherapistId,
        dayOfWeek: dayOfWeek as any,
        isAvailable: true,
      },
    });

    if (!availability) {
      throw new BadRequestException(`El fisioterapeuta no tiene disponibilidad los ${dayOfWeek}`);
    }

    // Convertir startTime y endTime a formato HH:MM para comparar
    const appointmentStartTime = `${String(startTime.getHours()).padStart(2, '0')}:${String(startTime.getMinutes()).padStart(2, '0')}`;
    const appointmentEndTime = `${String(endTime.getHours()).padStart(2, '0')}:${String(endTime.getMinutes()).padStart(2, '0')}`;

    if (appointmentStartTime < availability.startTime || appointmentEndTime > availability.endTime) {
      throw new BadRequestException(
        `El horario debe estar entre ${availability.startTime} y ${availability.endTime}`,
      );
    }

    // 2. Verificar que no haya conflictos con otras citas
    const conflictingAppointments = await this.prisma.appointment.findMany({
      where: {
        physiotherapistId,
        status: {
          not: AppointmentStatus.CANCELLED,
        },
        ...(excludeAppointmentId && { id: { not: excludeAppointmentId } }),
        OR: [
          {
            AND: [
              { startTime: { lte: startTime } },
              { endTime: { gt: startTime } },
            ],
          },
          {
            AND: [
              { startTime: { lt: endTime } },
              { endTime: { gte: endTime } },
            ],
          },
          {
            AND: [
              { startTime: { gte: startTime } },
              { endTime: { lte: endTime } },
            ],
          },
        ],
      },
    });

    if (conflictingAppointments.length > 0) {
      throw new BadRequestException('El fisioterapeuta ya tiene una cita en ese horario');
    }

    // 3. Verificar que no esté asignado a una actividad grupal en ese horario
    const dayOfWeekForActivity = startTime.getDay();
    const conflictingActivities = await this.prisma.physiotherapistActivity.findMany({
      where: {
        physiotherapistId,
        isActive: true,
        activity: {
          isActive: true,
          schedules: {
            some: {
              isActive: true,
              dayOfWeek: dayOfWeek as any,
            },
          },
        },
      },
      include: {
        activity: {
          include: {
            schedules: {
              where: {
                dayOfWeek: dayOfWeek as any,
                isActive: true,
              },
            },
          },
        },
      },
    });

    for (const assignment of conflictingActivities) {
      for (const schedule of assignment.activity.schedules) {
        if (
          (appointmentStartTime >= schedule.startTime && appointmentStartTime < schedule.endTime) ||
          (appointmentEndTime > schedule.startTime && appointmentEndTime <= schedule.endTime) ||
          (appointmentStartTime <= schedule.startTime && appointmentEndTime >= schedule.endTime)
        ) {
          throw new BadRequestException(
            `El fisioterapeuta tiene una actividad grupal (${assignment.activity.name}) en ese horario`,
          );
        }
      }
    }

    return true;
  }

  async findAll(
    clinicId: string,
    user: any,
    filters: {
      physiotherapistId?: string;
      patientId?: string;
      status?: AppointmentStatus;
      startDate?: string;
      endDate?: string;
    },
  ) {
    const whereClause: any = {
      clinicId,
    };

    // Aplicar filtros
    if (filters.physiotherapistId) {
      whereClause.physiotherapistId = filters.physiotherapistId;
    }

    if (filters.patientId) {
      whereClause.patientId = filters.patientId;
    }

    if (filters.status) {
      whereClause.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      whereClause.startTime = {};
      if (filters.startDate) {
        whereClause.startTime.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        whereClause.startTime.lte = new Date(filters.endDate);
      }
    }

    // Fisioterapeutas solo ven sus propias citas
    if (user.role === UserRole.PHYSIOTHERAPIST) {
      const physiotherapist = await this.prisma.physiotherapist.findUnique({
        where: { userId: user.id },
      });
      if (physiotherapist) {
        whereClause.physiotherapistId = physiotherapist.id;
      }
    }

    // Pacientes solo ven sus propias citas
    if (user.role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });
      if (patient) {
        whereClause.patientId = patient.id;
      }
    }

    return this.prisma.appointment.findMany({
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
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async getMyAppointments(user: any, status?: AppointmentStatus) {
    const whereClause: any = {
      ...(status && { status }),
    };

    if (user.role === UserRole.PHYSIOTHERAPIST) {
      const physiotherapist = await this.prisma.physiotherapist.findUnique({
        where: { userId: user.id },
      });
      if (!physiotherapist) {
        throw new NotFoundException('Perfil de fisioterapeuta no encontrado');
      }
      whereClause.physiotherapistId = physiotherapist.id;
    } else if (user.role === UserRole.PATIENT) {
      const patient = await this.prisma.patient.findUnique({
        where: { userId: user.id },
      });
      if (!patient) {
        throw new NotFoundException('Perfil de paciente no encontrado');
      }
      whereClause.patientId = patient.id;
    }

    return this.prisma.appointment.findMany({
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
      orderBy: {
        startTime: 'asc',
      },
    });
  }

  async getAvailableSlots(physiotherapistId: string, dateStr: string) {
    const date = new Date(dateStr);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];

    // Obtener disponibilidad del fisioterapeuta
    const availability = await this.prisma.availability.findFirst({
      where: {
        physiotherapistId,
        dayOfWeek: dayOfWeek as any,
        isAvailable: true,
      },
    });

    if (!availability) {
      return {
        date: dateStr,
        dayOfWeek,
        available: false,
        message: 'El fisioterapeuta no trabaja este día',
        slots: [],
      };
    }

    // Obtener citas existentes
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        physiotherapistId,
        status: { not: AppointmentStatus.CANCELLED },
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    });

    // Obtener actividades grupales
    const activities = await this.prisma.physiotherapistActivity.findMany({
      where: {
        physiotherapistId,
        isActive: true,
        activity: {
          isActive: true,
          schedules: {
            some: {
              dayOfWeek: dayOfWeek as any,
              isActive: true,
            },
          },
        },
      },
      include: {
        activity: {
          include: {
            schedules: {
              where: {
                dayOfWeek: dayOfWeek as any,
                isActive: true,
              },
            },
          },
        },
      },
    });

    return {
      date: dateStr,
      dayOfWeek,
      available: true,
      workingHours: {
        start: availability.startTime,
        end: availability.endTime,
      },
      bookedSlots: appointments.map(apt => ({
        start: apt.startTime,
        end: apt.endTime,
        type: 'appointment',
      })),
      activitySlots: activities.flatMap(act =>
        act.activity.schedules.map(schedule => ({
          start: schedule.startTime,
          end: schedule.endTime,
          type: 'activity',
          activityName: act.activity.name,
        })),
      ),
    };
  }

  async findOne(id: string, user: any) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                phone: true,
              },
            },
          },
        },
        physiotherapist: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    // Verificar permisos
    if (user.role === UserRole.PATIENT && appointment.patient.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta cita');
    }

    if (user.role === UserRole.PHYSIOTHERAPIST && appointment.physiotherapist.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver esta cita');
    }

    if (user.role === UserRole.CLINIC_ADMIN && appointment.clinicId !== user.clinicId) {
      throw new ForbiddenException('No tienes permisos para ver esta cita');
    }

    return appointment;
  }

  async update(
    id: string,
    clinicId: string,
    user: any,
    updateDto: UpdateAppointmentDto,
  ) {
    const appointment = await this.findOne(id, user);

    // No se puede modificar una cita cancelada o completada
    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('No se puede modificar una cita cancelada');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede modificar una cita completada');
    }

    // Si se cambia el horario, validar disponibilidad
    if (updateDto.startTime || updateDto.endTime) {
      const newStartTime = updateDto.startTime ? new Date(updateDto.startTime) : appointment.startTime;
      const newEndTime = updateDto.endTime ? new Date(updateDto.endTime) : appointment.endTime;

      if (newStartTime >= newEndTime) {
        throw new BadRequestException('La hora de inicio debe ser anterior a la hora de fin');
      }

      await this.validateAvailability(
        appointment.physiotherapistId,
        newStartTime,
        newEndTime,
        id,
      );

      updateDto.startTime = newStartTime.toISOString();
      updateDto.endTime = newEndTime.toISOString();
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: updateDto as any,
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
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: user.id,
        action: 'UPDATE_APPOINTMENT',
        entity: 'appointment',
        entityId: id,
        changes: updateDto as any,
      },
    });

    return updated;
  }

  async updateStatus(id: string, user: any, status: AppointmentStatus) {
    const appointment = await this.findOne(id, user);

    // Solo fisioterapeutas pueden completar citas
    if (status === AppointmentStatus.COMPLETED && user.role !== UserRole.PHYSIOTHERAPIST) {
      throw new ForbiddenException('Solo fisioterapeutas pueden completar citas');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: { status },
      include: {
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
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: appointment.clinicId,
        userId: user.id,
        action: `APPOINTMENT_${status}`,
        entity: 'appointment',
        entityId: id,
      },
    });

    return updated;
  }

  async cancel(id: string, user: any, cancellationReason?: string) {
    const appointment = await this.findOne(id, user);

    if (appointment.status === AppointmentStatus.CANCELLED) {
      throw new BadRequestException('La cita ya está cancelada');
    }

    if (appointment.status === AppointmentStatus.COMPLETED) {
      throw new BadRequestException('No se puede cancelar una cita completada');
    }

    const updated = await this.prisma.appointment.update({
      where: { id },
      data: {
        status: AppointmentStatus.CANCELLED,
        cancelledAt: new Date(),
        cancelledBy: user.id,
        cancellationReason,
      },
      include: {
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
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: appointment.clinicId,
        userId: user.id,
        action: 'CANCEL_APPOINTMENT',
        entity: 'appointment',
        entityId: id,
      },
    });

    return updated;
  }

  async remove(id: string, clinicId: string, adminId: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment) {
      throw new NotFoundException('Cita no encontrada');
    }

    if (appointment.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para eliminar esta cita');
    }

    await this.prisma.appointment.delete({
      where: { id },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: adminId,
        action: 'DELETE_APPOINTMENT',
        entity: 'appointment',
        entityId: id,
      },
    });

    return;
  }
}
