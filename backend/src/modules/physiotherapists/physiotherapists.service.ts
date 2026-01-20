import { 
  Injectable, 
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePhysiotherapistDto } from './dto/update-physiotherapist.dto';

@Injectable()
export class PhysiotherapistsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicId?: string, isActive?: boolean) {
    return this.prisma.physiotherapist.findMany({
      where: {
        ...(clinicId && { clinicId }),
        ...(isActive !== undefined && { isActive }),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            appointments: true,
            activities: true,
            assignedActivities: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatar: true,
            role: true,
          },
        },
        clinic: true,
        _count: {
          select: {
            appointments: true,
            activities: true,
            assignedActivities: true,
          },
        },
      },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Fisioterapeuta no encontrado');
    }

    return physiotherapist;
  }

  async findAvailabilities(id: string) {
    const physiotherapist = await this.findOne(id);

    return this.prisma.availability.findMany({
      where: {
        physiotherapistId: id,
      },
      orderBy: [
        { dayOfWeek: 'asc' },
        { startTime: 'asc' },
      ],
    });
  }

  async findActivities(id: string) {
    const physiotherapist = await this.findOne(id);

    return this.prisma.physiotherapistActivity.findMany({
      where: {
        physiotherapistId: id,
        isActive: true,
      },
      include: {
        activity: {
          include: {
            schedules: true,
          },
        },
      },
      orderBy: {
        assignedAt: 'desc',
      },
    });
  }

  async update(
    id: string,
    clinicId: string,
    adminId: string,
    updateDto: UpdatePhysiotherapistDto,
  ) {
    const physiotherapist = await this.findOne(id);

    // Verificar que pertenece a la clínica del admin
    if (physiotherapist.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para editar este fisioterapeuta');
    }

    const updated = await this.prisma.physiotherapist.update({
      where: { id },
      data: updateDto,
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
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: adminId,
        action: 'UPDATE_PHYSIOTHERAPIST',
        entity: 'physiotherapist',
        entityId: id,
        changes: updateDto as any,
      },
    });

    return updated;
  }

  async assignToActivity(
    physiotherapistId: string,
    activityId: string,
    clinicId: string,
    adminId: string,
  ) {
    // Verificar que el fisio y la actividad existen y pertenecen a la clínica
    const physiotherapist = await this.prisma.physiotherapist.findUnique({
      where: { id: physiotherapistId },
    });

    if (!physiotherapist) {
      throw new NotFoundException('Fisioterapeuta no encontrado');
    }

    if (physiotherapist.clinicId !== clinicId) {
      throw new ForbiddenException('El fisioterapeuta no pertenece a tu clínica');
    }

    const activity = await this.prisma.activity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException('Actividad no encontrada');
    }

    if (activity.clinicId !== clinicId) {
      throw new ForbiddenException('La actividad no pertenece a tu clínica');
    }

    // Verificar que no esté ya asignado
    const existing = await this.prisma.physiotherapistActivity.findUnique({
      where: {
        physiotherapistId_activityId: {
          physiotherapistId,
          activityId,
        },
      },
    });

    if (existing && existing.isActive) {
      throw new BadRequestException('El fisioterapeuta ya está asignado a esta actividad');
    }

    // Si existe pero está inactivo, reactivarlo
    if (existing && !existing.isActive) {
      const reactivated = await this.prisma.physiotherapistActivity.update({
        where: { id: existing.id },
        data: {
          isActive: true,
          assignedBy: adminId,
          assignedAt: new Date(),
        },
        include: {
          activity: true,
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

      await this.prisma.auditLog.create({
        data: {
          clinicId,
          userId: adminId,
          action: 'REASSIGN_PHYSIOTHERAPIST_TO_ACTIVITY',
          entity: 'physiotherapist_activity',
          entityId: existing.id,
        },
      });

      return reactivated;
    }

    // Crear nueva asignación
    const assignment = await this.prisma.physiotherapistActivity.create({
      data: {
        clinicId,
        physiotherapistId,
        activityId,
        assignedBy: adminId,
      },
      include: {
        activity: true,
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
        userId: adminId,
        action: 'ASSIGN_PHYSIOTHERAPIST_TO_ACTIVITY',
        entity: 'physiotherapist_activity',
        entityId: assignment.id,
      },
    });

    return assignment;
  }

  async unassignFromActivity(
    physiotherapistId: string,
    activityId: string,
    clinicId: string,
  ) {
    const assignment = await this.prisma.physiotherapistActivity.findUnique({
      where: {
        physiotherapistId_activityId: {
          physiotherapistId,
          activityId,
        },
      },
    });

    if (!assignment) {
      throw new NotFoundException('Asignación no encontrada');
    }

    if (assignment.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para esta acción');
    }

    // Soft delete
    await this.prisma.physiotherapistActivity.update({
      where: { id: assignment.id },
      data: {
        isActive: false,
      },
    });

    return;
  }

  async deactivate(id: string, clinicId: string, adminId: string) {
    const physiotherapist = await this.findOne(id);

    if (physiotherapist.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para desactivar este fisioterapeuta');
    }

    await this.prisma.physiotherapist.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // También desactivar el usuario
    await this.prisma.user.update({
      where: { id: physiotherapist.userId },
      data: {
        isActive: false,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: adminId,
        action: 'DEACTIVATE_PHYSIOTHERAPIST',
        entity: 'physiotherapist',
        entityId: id,
      },
    });

    return;
  }
}
