import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ClinicsService } from './clinics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('clinics')
@Controller('clinics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ClinicsController {
  constructor(private readonly clinicsService: ClinicsService) {}

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas las clínicas (solo SUPER_ADMIN)' })
  findAll() {
    return this.clinicsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una clínica' })
  findOne(@Param('id') id: string) {
    return this.clinicsService.findOne(id);
  }
}
