import { IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateBookingDto {
  @ApiProperty({ description: 'Fecha de la sesión (ISO 8601)' })
  @IsDateString()
  sessionDate: string;

  @ApiPropertyOptional({ description: 'Notas' })
  @IsString()
  @IsOptional()
  notes?: string;
}
