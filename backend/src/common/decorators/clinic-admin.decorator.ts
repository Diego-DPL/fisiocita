import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

/**
 * Decorator para endpoints que requieren ser CLINIC_ADMIN o SUPER_ADMIN
 */
export const ClinicAdmin = () => SetMetadata(ROLES_KEY, [UserRole.CLINIC_ADMIN, UserRole.SUPER_ADMIN]);
