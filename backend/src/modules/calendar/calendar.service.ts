import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AppointmentStatus, BookingStatus } from '@prisma/client';

export interface TimeBlock {
  startTime: string;
  endTime: string;
  type: 'appointment' | 'activity' | 'available' | 'unavailable';
  id?: string;
  title?: string;
  description?: string;
  status?: string;
  patientName?: string;
  participantsCount?: number;
}

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getPhysiotherapistDaySchedule(physiotherapistId: string, dateStr: string) {
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { id: physiotherapistId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Fisioterapeuta no encontrado');
    }

    const date = new Date(dateStr);
    const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];

    // 1. Obtener disponibilidad base
    const availability = await this.prisma.availability.findFirst({
      where: {
        physiotherapistId,
        dayOfWeek: dayOfWeek as any,
        isAvailable: true,
      },
    });

    if (!availability) {
      return {
        physiotherapistId,
        physiotherapistName: `${physiotherapist.user.firstName} ${physiotherapist.user.lastName}`,
        date: dateStr,
        dayOfWeek,
        isWorkingDay: false,
        blocks: [],
      };
    }

    // 2. Obtener citas del día
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const appointments = await this.prisma.appointment.findMany({
      where: {
        physiotherapistId,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
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
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // 3. Obtener actividades grupales asignadas
    const assignedActivities = await this.prisma.physiotherapistActivity.findMany({
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
            bookings: {
              where: {
                sessionDate: {
                  gte: startOfDay,
                  lte: endOfDay,
                },
                status: {
                  not: BookingStatus.CANCELLED,
                },
              },
            },
          },
        },
      },
    });

    // 4. Construir bloques de tiempo
    const blocks: TimeBlock[] = [];

    // Añadir citas
    appointments.forEach(appointment => {
      blocks.push({
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        type: 'appointment',
        id: appointment.id,
        title: `Cita: ${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
        description: appointment.reason || 'Sin motivo especificado',
        status: appointment.status,
        patientName: `${appointment.patient.user.firstName} ${appointment.patient.user.lastName}`,
      });
    });

    // Añadir actividades grupales (BLOQUEAN el calendario)
    assignedActivities.forEach(assignment => {
      assignment.activity.schedules.forEach(schedule => {
        blocks.push({
          startTime: this.combineDateAndTime(date, schedule.startTime),
          endTime: this.combineDateAndTime(date, schedule.endTime),
          type: 'activity',
          id: assignment.activity.id,
          title: `Actividad: ${assignment.activity.name}`,
          description: `${assignment.activity.type} - ${assignment.activity.difficulty}`,
          participantsCount: assignment.activity.bookings.length,
        });
      });
    });

    // Ordenar bloques por hora de inicio
    blocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
      physiotherapistId,
      physiotherapistName: `${physiotherapist.user.firstName} ${physiotherapist.user.lastName}`,
      date: dateStr,
      dayOfWeek,
      isWorkingDay: true,
      workingHours: {
        start: availability.startTime,
        end: availability.endTime,
      },
      blocks,
      summary: {
        totalAppointments: appointments.length,
        totalActivities: assignedActivities.length,
        busyTime: this.calculateBusyTime(blocks),
      },
    };
  }

  async getPhysiotherapistWeekSchedule(physiotherapistId: string, startDateStr: string) {
    const startDate = new Date(startDateStr);
    const weekSchedule = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const daySchedule = await this.getPhysiotherapistDaySchedule(physiotherapistId, dateStr);
      weekSchedule.push(daySchedule);
    }

    return {
      physiotherapistId,
      weekStart: startDateStr,
      days: weekSchedule,
    };
  }

  async getMyPhysiotherapistDaySchedule(userId: string, dateStr: string) {
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { userId },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Perfil de fisioterapeuta no encontrado');
    }

    return this.getPhysiotherapistDaySchedule(physiotherapist.id, dateStr);
  }

  async getMyPhysiotherapistWeekSchedule(userId: string, startDateStr: string) {
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { userId },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Perfil de fisioterapeuta no encontrado');
    }

    return this.getPhysiotherapistWeekSchedule(physiotherapist.id, startDateStr);
  }

  async getMyPatientDaySchedule(userId: string, dateStr: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    const date = new Date(dateStr);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Obtener citas del paciente
    const appointments = await this.prisma.appointment.findMany({
      where: {
        patientId: patient.id,
        startTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: AppointmentStatus.CANCELLED,
        },
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
      orderBy: {
        startTime: 'asc',
      },
    });

    // Obtener reservas de actividades
    const activityBookings = await this.prisma.activityBooking.findMany({
      where: {
        patientId: patient.id,
        sessionDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
        status: {
          not: BookingStatus.CANCELLED,
        },
      },
      include: {
        activity: {
          include: {
            schedules: true,
          },
        },
      },
      orderBy: {
        sessionDate: 'asc',
      },
    });

    const blocks: TimeBlock[] = [];

    // Añadir citas
    appointments.forEach(appointment => {
      blocks.push({
        startTime: appointment.startTime.toISOString(),
        endTime: appointment.endTime.toISOString(),
        type: 'appointment',
        id: appointment.id,
        title: `Fisioterapia con ${appointment.physiotherapist.user.firstName} ${appointment.physiotherapist.user.lastName}`,
        description: appointment.reason || 'Cita de fisioterapia',
        status: appointment.status,
      });
    });

    // Añadir actividades
    activityBookings.forEach(booking => {
      const dayOfWeek = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'][date.getDay()];
      const schedule = booking.activity.schedules.find(s => s.dayOfWeek === dayOfWeek);
      
      if (schedule) {
        blocks.push({
          startTime: this.combineDateAndTime(date, schedule.startTime),
          endTime: this.combineDateAndTime(date, schedule.endTime),
          type: 'activity',
          id: booking.id,
          title: booking.activity.name,
          description: `${booking.activity.type} - ${booking.activity.difficulty}`,
          status: booking.status,
        });
      }
    });

    blocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

    return {
      patientId: patient.id,
      patientName: `${patient.user.firstName} ${patient.user.lastName}`,
      date: dateStr,
      blocks,
      summary: {
        totalAppointments: appointments.length,
        totalActivities: activityBookings.length,
      },
    };
  }

  async getMyPatientWeekSchedule(userId: string, startDateStr: string) {
    const startDate = new Date(startDateStr);
    const weekSchedule = [];

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const daySchedule = await this.getMyPatientDaySchedule(userId, dateStr);
      weekSchedule.push(daySchedule);
    }

    return {
      userId,
      weekStart: startDateStr,
      days: weekSchedule,
    };
  }

  async getClinicDayOverview(clinicId: string, dateStr: string) {
    const physiotherapists = await this.prisma.physiotherapist.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    const schedules = await Promise.all(
      physiotherapists.map(physio => 
        this.getPhysiotherapistDaySchedule(physio.id, dateStr)
      ),
    );

    const totalAppointments = schedules.reduce((sum, s) => sum + s.summary.totalAppointments, 0);
    const totalActivities = schedules.reduce((sum, s) => sum + s.summary.totalActivities, 0);

    return {
      clinicId,
      date: dateStr,
      physiotherapists: schedules,
      summary: {
        totalPhysiotherapists: physiotherapists.length,
        totalAppointments,
        totalActivities,
      },
    };
  }

  async getAvailableSlots(physiotherapistId: string, dateStr: string, durationMinutes: number) {
    const daySchedule = await this.getPhysiotherapistDaySchedule(physiotherapistId, dateStr);

    if (!daySchedule.isWorkingDay) {
      return {
        physiotherapistId,
        date: dateStr,
        available: false,
        slots: [],
      };
    }

    // Convertir horario laboral a minutos desde medianoche
    const [startHour, startMinute] = daySchedule.workingHours.start.split(':').map(Number);
    const [endHour, endMinute] = daySchedule.workingHours.end.split(':').map(Number);
    
    const workStart = startHour * 60 + startMinute;
    const workEnd = endHour * 60 + endMinute;

    // Generar slots de tiempo disponibles
    const slots = [];
    const occupiedSlots = daySchedule.blocks.map(block => {
      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      return {
        start: start.getHours() * 60 + start.getMinutes(),
        end: end.getHours() * 60 + end.getMinutes(),
      };
    });

    for (let time = workStart; time + durationMinutes <= workEnd; time += 30) {
      const slotEnd = time + durationMinutes;
      
      // Verificar si el slot está libre
      const isOccupied = occupiedSlots.some(occupied => 
        (time >= occupied.start && time < occupied.end) ||
        (slotEnd > occupied.start && slotEnd <= occupied.end) ||
        (time <= occupied.start && slotEnd >= occupied.end)
      );

      if (!isOccupied) {
        const hour = Math.floor(time / 60);
        const minute = time % 60;
        const slotTime = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
        
        slots.push({
          time: slotTime,
          datetime: this.combineDateAndTime(new Date(dateStr), slotTime),
          durationMinutes,
        });
      }
    }

    return {
      physiotherapistId,
      date: dateStr,
      available: slots.length > 0,
      workingHours: daySchedule.workingHours,
      slots,
    };
  }

  private combineDateAndTime(date: Date, timeStr: string): string {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const combined = new Date(date);
    combined.setHours(hours, minutes, 0, 0);
    return combined.toISOString();
  }

  private calculateBusyTime(blocks: TimeBlock[]): string {
    let totalMinutes = 0;
    
    blocks.forEach(block => {
      const start = new Date(block.startTime);
      const end = new Date(block.endTime);
      const duration = (end.getTime() - start.getTime()) / 1000 / 60;
      totalMinutes += duration;
    });

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    
    return `${hours}h ${minutes}m`;
  }
}
