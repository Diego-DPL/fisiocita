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
import { PhysiotherapistsService } from './physiotherapists.service';
import { UpdatePhysiotherapistDto } from './dto/update-physiotherapist.dto';
import { AssignToActivityDto } from './dto/assign-to-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Physiotherapists')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('physiotherapists')
export class PhysiotherapistsController {
  constructor(private readonly physiotherapistsService: PhysiotherapistsService) {}

  @Get()
  @ApiOperation({ summary: 'Listar fisioterapeutas de la clínica' })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Lista de fisioterapeutas' })
  async findAll(
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Query('isActive') isActive?: string,
  ) {
    // SUPER_ADMIN puede ver todas las clínicas si no especifica
    const targetClinicId = user.role === UserRole.SUPER_ADMIN && !clinicId ? undefined : clinicId;
    
    return this.physiotherapistsService.findAll(
      targetClinicId,
      isActive === 'true' ? true : isActive === 'false' ? false : undefined,
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalles de un fisioterapeuta' })
  @ApiResponse({ status: 200, description: 'Fisioterapeuta encontrado' })
  @ApiResponse({ status: 404, description: 'Fisioterapeuta no encontrado' })
  async findOne(@Param('id') id: string) {
    return this.physiotherapistsService.findOne(id);
  }

  @Get(':id/availabilities')
  @ApiOperation({ summary: 'Obtener disponibilidades de un fisioterapeuta' })
  @ApiResponse({ status: 200, description: 'Disponibilidades del fisioterapeuta' })
  async findAvailabilities(@Param('id') id: string) {
    return this.physiotherapistsService.findAvailabilities(id);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Obtener actividades asignadas a un fisioterapeuta' })
  @ApiResponse({ status: 200, description: 'Actividades del fisioterapeuta' })
  async findActivities(@Param('id') id: string) {
    return this.physiotherapistsService.findActivities(id);
  }

  @Patch(':id')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Actualizar fisioterapeuta (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Fisioterapeuta actualizado' })
  @ApiResponse({ status: 404, description: 'Fisioterapeuta no encontrado' })
  async update(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() updateDto: UpdatePhysiotherapistDto,
  ) {
    return this.physiotherapistsService.update(id, clinicId, user.id, updateDto);
  }

  @Post(':id/assign-activity')
  @ClinicAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Asignar fisioterapeuta a actividad (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Fisioterapeuta asignado a actividad' })
  @ApiResponse({ status: 400, description: 'Ya está asignado a esta actividad' })
  async assignToActivity(
    @Param('id') physiotherapistId: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
    @Body() assignDto: AssignToActivityDto,
  ) {
    return this.physiotherapistsService.assignToActivity(
      physiotherapistId,
      assignDto.activityId,
      clinicId,
      user.id,
    );
  }

  @Delete(':id/unassign-activity/:activityId')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desasignar fisioterapeuta de actividad (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Fisioterapeuta desasignado' })
  async unassignFromActivity(
    @Param('id') physiotherapistId: string,
    @Param('activityId') activityId: string,
    @CurrentClinicId() clinicId: string,
  ) {
    return this.physiotherapistsService.unassignFromActivity(
      physiotherapistId,
      activityId,
      clinicId,
    );
  }

  @Delete(':id')
  @ClinicAdmin()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Desactivar fisioterapeuta (soft delete, solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 204, description: 'Fisioterapeuta desactivado' })
  async remove(
    @Param('id') id: string,
    @CurrentClinicId() clinicId: string,
    @CurrentUser() user: any,
  ) {
    return this.physiotherapistsService.deactivate(id, clinicId, user.id);
  }
}
