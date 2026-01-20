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
import { ActivitiesService } from './activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';
import { UpdateActivityDto } from './dto/update-activity.dto';
import { CreateScheduleDto } from './dto/create-schedule.dto';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole, ActivityType } from '@prisma/client';

@ApiTags('Activities')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('activities')
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  @Post()
  @ClinicAdmin()
  @ApiOperation({ summary: 'Crear actividad grupal (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Actividad creada' })
  @ApiResponse({ status: 400, description: 'Validación fallida' })
  async create(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() createDto: CreateActivityDto,
  ) {
    return this.activitiesService.create(clinicId, user.id, createDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar actividades de la clínica' })
  @ApiQuery({ name: 'type', required: false, enum: ActivityType })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de actividades' })
  async findAll(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Query('type') type?: ActivityType,
    @Query('isActive') isActive?: string,
  ) {
    const targetClinicId = user.role === UserRole.SUPER_ADMIN && !clinicId ? undefined : clinicId;
    
    return this.activitiesService.findAll(
      targetClinicId,
      type,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get('available')
  @Roles(UserRole.PATIENT)
  @ApiOperation({ summary: 'Listar actividades disponibles para reservar (PATIENT)' })
  @ApiResponse({ status: 200, description: 'Actividades con plazas disponibles' })
  async findAvailable(@CurrentClinicId() clinicId: string) {
    return this.activitiesService.findAvailableForBooking(clinicId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de una actividad' })
  @ApiResponse({ status: 200, description: 'Actividad encontrada' })
  @ApiResponse({ status: 404, description: 'Actividad no encontrada' })
  async findOne(@Param('id') id: string) {
    return this.activitiesService.findOne(id);
  }

  @Get(':id/schedules')
  @ApiOperation({ summary: 'Obtener horarios de una actividad' })
  @ApiResponse({ status: 200, description: 'Horarios de la actividad' })
  async findSchedules(@Param('id') id: string) {
    return this.activitiesService.findSchedules(id);
  }

  @Get(':id/bookings')
  @Roles(UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN, UserRole.PHYSIOTHERAPIST)
  @ApiOperation({ summary: 'Obtener reservas de una actividad' })
  @ApiResponse({ status: 200, description: 'Reservas de la actividad' })
  async findBookings(
    @Param('id') id: string,
    @Query('sessionDate') sessionDate?: string,
  ) {
    return this.activitiesService.findBookings(id, sessionDate);
  }

  @Get(':id/participants-count')
  @ApiOperation({ summary: 'Contar participantes de una sesión específica' })
  @ApiQuery({ name: 'sessionDate', required: true, type: String })
  @ApiResponse({ status: 200, description: 'Número de participantes' })
  async countParticipants(
    @Param('id') id: string,
    @Query('sessionDate') sessionDate: string,
  ) {
    return this.activitiesService.countParticipants(id, sessionDate);
  }

  @Patch(':id')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Actualizar actividad (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Actividad actualizada' })
  async update(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdateActivityDto,
  ) {
    return this.activitiesService.update(id, clinicId, user.id, updateDto);
  }

  @Post(':id/schedules')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Añadir horario a actividad (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 201, description: 'Horario añadido' })
  async addSchedule(
    @Param('id') activityId: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() scheduleDto: CreateScheduleDto,
  ) {
    return this.activitiesService.addSchedule(activityId, clinicId, scheduleDto);
  }

  @Delete(':id/schedules/:scheduleId')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar horario de actividad (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Horario eliminado' })
  async removeSchedule(
    @Param('id') activityId: string,
    @Param('scheduleId') scheduleId: string,
    @CurrentClinicId() clinicId: string,
  ) {
    return this.activitiesService.removeSchedule(scheduleId, clinicId);
  }

  @Post(':id/book')
  @Roles(UserRole.PATIENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Reservar plaza en actividad (PATIENT)' })
  @ApiResponse({ status: 201, description: 'Reserva creada' })
  @ApiResponse({ status: 400, description: 'No hay plazas disponibles' })
  async bookActivity(
    @Param('id') activityId: string,
    @CurrentUser() user: any,
    @Body() bookingDto: CreateBookingDto,
  ) {
    return this.activitiesService.createBooking(activityId, user.id, bookingDto);
  }

  @Post(':id/bookings/:bookingId/cancel')
  @Roles(UserRole.PATIENT, UserRole.CLINIC_ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar reserva' })
  @ApiResponse({ status: 200, description: 'Reserva cancelada' })
  async cancelBooking(
    @Param('id') activityId: string,
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() cancelDto: CancelBookingDto,
  ) {
    return this.activitiesService.cancelBooking(bookingId, user, cancelDto.cancellationReason);
  }

  @Delete(':id')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar actividad (soft delete, solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Actividad desactivada' })
  async remove(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.activitiesService.deactivate(id, clinicId, user.id);
  }
}
