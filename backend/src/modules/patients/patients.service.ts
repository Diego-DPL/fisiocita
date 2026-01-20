import { 
  Injectable, 
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { UserRole } from '@prisma/client';

@Injectable()
export class PatientsService {
  constructor(private prisma: PrismaService) {}

  async findAll(clinicId?: string, isActive?: boolean, search?: string) {
    const whereClause: any = {
      ...(clinicId && { clinicId }),
      ...(isActive !== undefined && { isActive }),
    };

    // Búsqueda por nombre o email
    if (search) {
      whereClause.user = {
        OR: [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { email: { contains: search, mode: 'insensitive' } },
        ],
      };
    }

    return this.prisma.patient.findMany({
      where: whereClause,
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
            activityBookings: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string, user: any) {
    const patient = await this.prisma.patient.findUnique({
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
            activityBookings: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Pacientes solo pueden ver su propio perfil
    if (user.role === UserRole.PATIENT && patient.userId !== user.id) {
      throw new ForbiddenException('No tienes permisos para ver este perfil');
    }

    // Fisioterapeutas solo pueden ver pacientes de su clínica
    if (user.role === UserRole.PHYSIOTHERAPIST && patient.clinicId !== user.clinicId) {
      throw new ForbiddenException('No tienes permisos para ver este paciente');
    }

    // CLINIC_ADMIN solo puede ver pacientes de su clínica
    if (user.role === UserRole.CLINIC_ADMIN && patient.clinicId !== user.clinicId) {
      throw new ForbiddenException('No tienes permisos para ver este paciente');
    }

    return patient;
  }

  async findByUserId(userId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
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
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    return patient;
  }

  async findAppointments(patientId: string, user: any) {
    const patient = await this.findOne(patientId, user);

    return this.prisma.appointment.findMany({
      where: {
        patientId,
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
        startTime: 'desc',
      },
    });
  }

  async findActivityBookings(patientId: string, user: any) {
    const patient = await this.findOne(patientId, user);

    return this.prisma.activityBooking.findMany({
      where: {
        patientId,
      },
      include: {
        activity: {
          include: {
            schedules: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async updateByUserId(userId: string, updateDto: UpdatePatientDto) {
    const patient = await this.prisma.patient.findUnique({
      where: { userId },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente no encontrado');
    }

    // Pacientes no pueden cambiar isActive
    const { isActive, ...safeUpdateDto } = updateDto;

    return this.prisma.patient.update({
      where: { userId },
      data: safeUpdateDto,
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
  }

  async update(
    id: string,
    clinicId: string,
    adminId: string,
    updateDto: UpdatePatientDto,
  ) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    // Verificar que pertenece a la clínica del admin
    if (patient.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para editar este paciente');
    }

    const updated = await this.prisma.patient.update({
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
        action: 'UPDATE_PATIENT',
        entity: 'patient',
        entityId: id,
        changes: updateDto as any,
      },
    });

    return updated;
  }

  async deactivate(id: string, clinicId: string, adminId: string) {
    const patient = await this.prisma.patient.findUnique({
      where: { id },
    });

    if (!patient) {
      throw new NotFoundException('Paciente no encontrado');
    }

    if (patient.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para desactivar este paciente');
    }

    await this.prisma.patient.update({
      where: { id },
      data: {
        isActive: false,
      },
    });

    // También desactivar el usuario
    await this.prisma.user.update({
      where: { id: patient.userId },
      data: {
        isActive: false,
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId,
        userId: adminId,
        action: 'DEACTIVATE_PATIENT',
        entity: 'patient',
        entityId: id,
      },
    });

    return;
  }
}
