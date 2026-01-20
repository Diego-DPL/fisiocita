import { IsUUID, IsDateString, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAppointmentDto {
  @ApiProperty({ description: 'ID del paciente' })
  @IsUUID()
  patientId: string;

  @ApiProperty({ description: 'ID del fisioterapeuta' })
  @IsUUID()
  physiotherapistId: string;

  @ApiProperty({ description: 'Fecha y hora de inicio (ISO 8601)' })
  @IsDateString()
  startTime: string;

  @ApiProperty({ description: 'Fecha y hora de fin (ISO 8601)' })
  @IsDateString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Motivo de la cita' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notas iniciales' })
  @IsString()
  @IsOptional()
  notes?: string;
}
