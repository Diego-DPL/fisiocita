import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class ClinicsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.clinic.findMany({
      where: { isActive: true },
    });
  }

  async findOne(id: string) {
    return this.prisma.clinic.findUnique({
      where: { id },
      include: {
        users: { where: { isActive: true }, select: { id: true, email: true, firstName: true, lastName: true, role: true } },
        _count: {
          select: {
            users: true,
            physiotherapists: true,
            patients: true,
            appointments: true,
            activities: true,
          },
        },
      },
    });
  }
}
