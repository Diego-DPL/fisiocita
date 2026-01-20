import { 
  Controller, 
  Get, 
  Post, 
  Patch,
  Body, 
  Param, 
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { ClinicRequestsService } from './clinic-requests.service';
import { CreateClinicRequestDto } from './dto/create-clinic-request.dto';
import { RespondClinicRequestDto } from './dto/respond-clinic-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ClinicAdmin } from '../../common/decorators/clinic-admin.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { CurrentClinicId } from '../../common/decorators/current-clinic-id.decorator';
import { UserRole } from '@prisma/client';

@ApiTags('Clinic Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('clinic-requests')
export class ClinicRequestsController {
  constructor(private readonly clinicRequestsService: ClinicRequestsService) {}

  @Post()
  @Roles(UserRole.PHYSIOTHERAPIST)
  @ApiOperation({ summary: 'Fisioterapeuta solicita unirse a una clínica' })
  @ApiResponse({ status: 201, description: 'Solicitud creada exitosamente' })
  @ApiResponse({ status: 400, description: 'Ya existe una solicitud pendiente o el fisio ya pertenece a esa clínica' })
  async create(
    @CurrentUser() user: any,
    @Body() createDto: CreateClinicRequestDto,
  ) {
    return this.clinicRequestsService.create(user.id, createDto);
  }

  @Get('pending')
  @ClinicAdmin()
  @ApiOperation({ summary: 'Listar solicitudes pendientes de la clínica' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes pendientes' })
  async findPending(@CurrentClinicId() clinicId: string) {
    return this.clinicRequestsService.findPendingByClinic(clinicId);
  }

  @Get('my-requests')
  @Roles(UserRole.PHYSIOTHERAPIST)
  @ApiOperation({ summary: 'Listar mis solicitudes enviadas' })
  @ApiResponse({ status: 200, description: 'Lista de solicitudes del fisioterapeuta' })
  async findMyRequests(@CurrentUser() user: any) {
    return this.clinicRequestsService.findByPhysiotherapist(user.id);
  }

  @Patch(':id/respond')
  @ClinicAdmin()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Aprobar o rechazar solicitud (solo CLINIC_ADMIN)' })
  @ApiResponse({ status: 200, description: 'Solicitud procesada' })
  @ApiResponse({ status: 404, description: 'Solicitud no encontrada' })
  async respond(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @CurrentClinicId() clinicId: string,
    @Body() respondDto: RespondClinicRequestDto,
  ) {
    return this.clinicRequestsService.respond(id, clinicId, user.id, respondDto);
  }
}
