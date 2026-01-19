import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByEmail(email: string, clinicId?: string) {
    return this.prisma.user.findFirst({
      where: { 
        email,
        ...(clinicId && { clinicId }),
      },
      include: {
        clinic: true,
        physiotherapist: true,
        patient: true,
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: {
        clinic: true,
        physiotherapist: true,
        patient: true,
      },
    });
  }
}
