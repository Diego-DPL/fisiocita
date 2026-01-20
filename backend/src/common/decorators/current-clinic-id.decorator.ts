import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Extrae el clinicId del usuario autenticado
 */
export const CurrentClinicId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.clinicId;
  },
);
