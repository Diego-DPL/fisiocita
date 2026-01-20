import { 
  Controller, 
  Get, 
  Post,
  Patch, 
  Delete,
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { PatientsService } from './patients.service';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Patients')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  @Get()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHYSIOTHERAPIST)
  @ApiOperation({ summary: 'Listar pacientes de la clínica' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiQuery({ name: 'search', required: false, type: String, description: 'Buscar por nombre o email' })
  @ApiResponse({ status: 200, description: 'Lista de pacientes' })
  async findAll(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    // SUPER_ADMIN puede ver todas las clínicas si no especifica
    const targetClinicId = user.role === UserRole.SUPER_ADMIN && !clinicId ? undefined : clinicId;
    
    return this.patientsService.findAll(
      targetClinicId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      search,
    );
  }

  @Get('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Obtener mi perfil de paciente' })
  @ApiResponse({ status: 200, description: 'Perfil del paciente' })
  async getMyProfile(@CurrentUser() user: any) {
    return this.patientsService.findByUserId(user.id);
  }

  @Get(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Obtener detalles de un paciente' })
  @ApiResponse({ status: 200, description: 'Paciente encontrado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.findOne(id, user);
  }

  @Get(':id/appointments')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Obtener citas de un paciente' })
  @ApiResponse({ status: 200, description: 'Citas del paciente' })
  async findAppointments(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.findAppointments(id, user);
  }

  @Get(':id/activity-bookings')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Obtener reservas de actividades de un paciente' })
  @ApiResponse({ status: 200, description: 'Reservas del paciente' })
  async findActivityBookings(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.findActivityBookings(id, user);
  }

  @Patch('me')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Actualizar mi perfil de paciente' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado' })
  async updateMyProfile(
    @CurrentUser() user: any,
    @Body() updateDto: UpdatePatientDto,
  ) {
    return this.patientsService.updateByUserId(user.id, updateDto);
  }

  @Patch(':id')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Actualizar paciente (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Paciente actualizado' })
  @ApiResponse({ status: 404, description: 'Paciente no encontrado' })
  async update(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdatePatientDto,
  ) {
    return this.patientsService.update(id, clinicId, user.id, updateDto);
  }

  @Delete(':id')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar paciente (soft delete, solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Paciente desactivado' })
  async remove(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.patientsService.deactivate(id, clinicId, user.id);
  }
}
