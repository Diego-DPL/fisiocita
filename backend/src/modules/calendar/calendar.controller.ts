import { 
  Controller, 
  Get, 
  Param, 
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { CalendarService } from './calendar.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Calendar')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calendar')
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get('physiotherapist/:id/day')
  @ApiOperation({ summary: 'Obtener agenda del día de un fisioterapeuta' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Agenda del día con bloques de tiempo' })
  async getPhysiotherapistDaySchedule(
    @Param('id') physiotherapistId: string,
    @Query('date') date: string,
  ) {
    return this.calendarService.getPhysiotherapistDaySchedule(physiotherapistId, date);
  }

  @Get('physiotherapist/:id/week')
  @ApiOperation({ summary: 'Obtener agenda semanal de un fisioterapeuta' })
  @ApiQuery({ name: 'startDate', required: true, type: String, description: 'Fecha inicio (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Agenda semanal (7 días)' })
  async getPhysiotherapistWeekSchedule(
    @Param('id') physiotherapistId: string,
    @Query('startDate') startDate: string,
  ) {
    return this.calendarService.getPhysiotherapistWeekSchedule(physiotherapistId, startDate);
  }

  @Get('my-schedule')
  @Roles(UserRole.PHYSIOTHERAPIST, UserRole.PATIENT)
  @ApiOperation({ summary: 'Mi agenda personal' })
  @ApiQuery({ name: 'date', required: false, type: String, description: 'Fecha (YYYY-MM-DD), default: hoy' })
  @ApiQuery({ name: 'view', required: false, enum: ['day', 'week'], description: 'Tipo de vista, default: day' })
  @ApiResponse({ status: 200, description: 'Mi agenda' })
  async getMySchedule(
    @CurrentUser() user: any,
    @Query('date') date?: string,
    @Query('view') view: 'day' | 'week' = 'day',
  ) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    if (user.role === UserRole.PHYSIOTHERAPIST) {
      if (view === 'week') {
        return this.calendarService.getMyPhysiotherapistWeekSchedule(user.id, targetDate);
      }
      return this.calendarService.getMyPhysiotherapistDaySchedule(user.id, targetDate);
    } else if (user.role === UserRole.PATIENT) {
      if (view === 'week') {
        return this.calendarService.getMyPatientWeekSchedule(user.id, targetDate);
      }
      return this.calendarService.getMyPatientDaySchedule(user.id, targetDate);
    }
  }

  @Get('clinic/overview')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Vista general del calendario de la clínica (solo ADMIN)' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha (YYYY-MM-DD)' })
  @ApiResponse({ status: 200, description: 'Agenda de todos los fisioterapeutas de la clínica' })
  async getClinicOverview(
    @CurrentClinicId() clinicId: string,
    @Query('date') date: string,
  ) {
    return this.calendarService.getClinicDayOverview(clinicId, date);
  }

  @Get('available-slots/:physiotherapistId')
  @ApiOperation({ summary: 'Obtener slots disponibles para citas' })
  @ApiQuery({ name: 'date', required: true, type: String, description: 'Fecha (YYYY-MM-DD)' })
  @ApiQuery({ name: 'duration', required: false, type: Number, description: 'Duración en minutos, default: 60' })
  @ApiResponse({ status: 200, description: 'Lista de slots disponibles' })
  async getAvailableSlots(
    @Param('physiotherapistId') physiotherapistId: string,
    @Query('date') date: string,
    @Query('duration') duration?: string,
  ) {
    const durationMinutes = duration ? parseInt(duration) : 60;
    return this.calendarService.getAvailableSlots(physiotherapistId, date, durationMinutes);
  }
}
