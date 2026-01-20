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
import { AppointmentsService } from './appointments.service';
import { CreateAppointmentDto } from './dto/create-appointment.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';
import { CancelAppointmentDto } from './dto/cancel-appointment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole, AppointmentStatus } from '@prisma/client';

@ApiTags('Appointments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  @Roles(UserRole.CLINIC_ADMIN, UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Crear nueva cita' })
  @ApiResponse({ status: 201, description: 'Cita creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Conflicto de horario o validación fallida' })
  async create(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() createDto: CreateAppointmentDto,
  ) {
    return this.appointmentsService.create(clinicId, user.id, user.role, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar citas de la clínica' })
  @ApiQuery({ name: 'physiotherapistId', required: false, type: String })
  @ApiQuery({ name: 'patientId', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiQuery({ name: 'startDate', required: false, type: String, description: 'Fecha inicio (ISO 8601)' })
  @ApiQuery({ name: 'endDate', required: false, type: String, description: 'Fecha fin (ISO 8601)' })
  @ApiResponse({ status: 200, description: 'Lista de citas' })
  async findAll(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Query('physiotherapistId') physiotherapistId?: string,
    @Query('patientId') patientId?: string,
    @Query('status') status?: AppointmentStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.appointmentsService.findAll(
      clinicId,
      user,
      {
        physiotherapistId,
        patientId,
        status,
        startDate,
        endDate,
      },
    );
  }

  @Get('my-appointments')
  @Roles(UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Mis citas (fisioterapeuta o paciente)' })
  @ApiQuery({ name: 'status', required: false, enum: AppointmentStatus })
  @ApiResponse({ status: 200, description: 'Mis citas' })
  async getMyAppointments(
    @CurrentUser() user: any,
    @Query('status') status?: AppointmentStatus,
  ) {
    return this.appointmentsService.getMyAppointments(user, status);
  }

  @Get('availability/:physiotherapistId')
  @ApiOperation({ summary: 'Verificar disponibilidad de un fisioterapeuta' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Franjas horarias disponibles' })
  async checkAvailability(
    @Param('physiotherapistId') physiotherapistId: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(physiotherapistId, date);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una cita' })
  @ApiResponse({ status: 200, description: 'Cita encontrada' })
  @ApiResponse({ status: 404, description: 'Cita no encontrada' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.PHYSIOTHERAPIST)
  @ApiOperation({ summary: 'Actualizar cita' })
  @ApiResponse({ status: 200, description: 'Cita actualizada' })
  @ApiResponse({ status: 400, description: 'Conflicto de horario' })
  async update(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateAppointmentDto,
  ) {
    return this.appointmentsService.update(id, clinicId, user, updateDto);
  }

  @Post(':id/confirm')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.PHYSIOTHERAPIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirmar cita' })
  @ApiResponse({ status: 200, description: 'Cita confirmada' })
  async confirm(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, user, AppointmentStatus.CONFIRMED);
  }

  @Post(':id/complete')
  @Roles(UserRole.PHYSIOTHERAPIST)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Completar cita (solo fisioterapeuta)' })
  @ApiResponse({ status: 200, description: 'Cita completada' })
  async complete(
    @Param('id') id: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.updateStatus(id, user, AppointmentStatus.COMPLETED);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar cita' })
  @ApiResponse({ status: 200, description: 'Cita cancelada' })
  async cancel(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Body() cancelDto: CancelAppointmentDto,
  ) {
    return this.appointmentsService.cancel(id, user, cancelDto.cancellationReason);
  }

  @Delete(':id')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar cita (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Cita eliminada' })
  async remove(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.appointmentsService.remove(id, clinicId, user.id);
  }
}
