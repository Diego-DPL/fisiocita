import { 
  Injectable, 
  BadRequestException,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateClinicRequestDto } from './dto/create-clinic-request.dto';
import { RespondClinicRequestDto } from './dto/respond-clinic-request.dto';
import { ClinicRequestStatus } from '@prisma/client';

@Injectable()
export class ClinicRequestsService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, createDto: CreateClinicRequestDto) {
    // Verificar que el usuario sea fisioterapeuta
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { physiotherapist: true },
    });

    if (!user || !user.physiotherapist) {
      throw new BadRequestException('Usuario no es fisioterapeuta');
    }

    // Verificar que no exista una solicitud pendiente
    const existingRequest = await this.prisma.clinicRequest.findFirst({
      where: {
        clinicId: createDto.clinicId,
        physiotherapistId: user.physiotherapist.id,
        status: ClinicRequestStatus.PENDING,
      },
    });

    if (existingRequest) {
      throw new BadRequestException('Ya existe una solicitud pendiente para esta clínica');
    }

    // Verificar que el fisio no pertenezca ya a esa clínica
    if (user.physiotherapist.clinicId === createDto.clinicId) {
      throw new BadRequestException('Ya perteneces a esta clínica');
    }

    // Crear la solicitud
    const request = await this.prisma.clinicRequest.create({
      data: {
        clinicId: createDto.clinicId,
        physiotherapistId: user.physiotherapist.id,
        userId: userId,
        message: createDto.message,
      },
      include: {
        clinic: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        physiotherapist: {
          select: {
            id: true,
            licenseNumber: true,
            specialization: true,
            yearsOfExperience: true,
          },
        },
      },
    });

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: createDto.clinicId,
        userId: userId,
        action: 'CREATE_CLINIC_REQUEST',
        entity: 'clinic_request',
        entityId: request.id,
      },
    });

    return request;
  }

  async findPendingByClinic(clinicId: string) {
    return this.prisma.clinicRequest.findMany({
      where: {
        clinicId,
        status: ClinicRequestStatus.PENDING,
      },
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
        physiotherapist: {
          select: {
            id: true,
            licenseNumber: true,
            specialization: true,
            bio: true,
            yearsOfExperience: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findByPhysiotherapist(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { physiotherapist: true },
    });

    if (!user || !user.physiotherapist) {
      return [];
    }

    return this.prisma.clinicRequest.findMany({
      where: {
        physiotherapistId: user.physiotherapist.id,
      },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async respond(
    requestId: string,
    clinicId: string,
    adminId: string,
    respondDto: RespondClinicRequestDto,
  ) {
    // Verificar que la solicitud existe y pertenece a la clínica
    const request = await this.prisma.clinicRequest.findUnique({
      where: { id: requestId },
      include: {
        physiotherapist: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    if (request.clinicId !== clinicId) {
      throw new ForbiddenException('No tienes permisos para esta solicitud');
    }

    if (request.status !== ClinicRequestStatus.PENDING) {
      throw new BadRequestException('Esta solicitud ya fue procesada');
    }

    // Actualizar la solicitud
    const updatedRequest = await this.prisma.clinicRequest.update({
      where: { id: requestId },
      data: {
        status: respondDto.status,
        responseMessage: respondDto.responseMessage,
        respondedBy: adminId,
        respondedAt: new Date(),
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        physiotherapist: true,
        clinic: true,
      },
    });

    // Si se aprobó, actualizar la clínica del fisioterapeuta
    if (respondDto.status === ClinicRequestStatus.APPROVED) {
      await this.prisma.physiotherapist.update({
        where: { id: request.physiotherapistId },
        data: {
          clinicId: clinicId,
        },
      });

      // También actualizar el usuario
      await this.prisma.user.update({
        where: { id: request.userId },
        data: {
          clinicId: clinicId,
        },
      });
    }

    // Audit log
    await this.prisma.auditLog.create({
      data: {
        clinicId: clinicId,
        userId: adminId,
        action: respondDto.status === ClinicRequestStatus.APPROVED 
          ? 'APPROVE_CLINIC_REQUEST' 
          : 'REJECT_CLINIC_REQUEST',
        entity: 'clinic_request',
        entityId: requestId,
        changes: {
          status: respondDto.status,
          responseMessage: respondDto.responseMessage,
        },
      },
    });

    return updatedRequest;
  }
}
