import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';

@Injectable()
export class ClinicGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const clinicIdFromParams = request.params.clinicId;
    const clinicIdFromQuery = request.query.clinicId;
    const clinicIdFromBody = request.body?.clinicId;

    // Si no hay clinicId en la request, permitir (se validará en el servicio)
    const requestClinicId = clinicIdFromParams || clinicIdFromQuery || clinicIdFromBody;
    
    if (!requestClinicId) {
      return true;
    }

    // Validar que el usuario pertenece a la clínica que está intentando acceder
    if (user.clinicId !== requestClinicId) {
      throw new ForbiddenException('No tienes acceso a esta clínica');
    }

    return true;
  }
}
