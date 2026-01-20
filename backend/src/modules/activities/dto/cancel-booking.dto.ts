import { IsString, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelBookingDto {
  @ApiPropertyOptional({ description: 'Motivo de la cancelación' })
  @IsString()
  @IsOptional()
  cancellationReason?: string;
}
