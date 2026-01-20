import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelAppointmentDto {
  @ApiPropertyOptional({ description: 'Motivo de la cancelación' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
