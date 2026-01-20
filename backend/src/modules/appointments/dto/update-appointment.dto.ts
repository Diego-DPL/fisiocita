import { IsDateString, IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { AppointmentStatus } from '@prisma/client';

export class UpdateAppointmentDto {
  @ApiPropertyOptional({ description: 'Fecha y hora de inicio (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startTime?: string;

  @ApiPropertyOptional({ description: 'Fecha y hora de fin (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endTime?: string;

  @ApiPropertyOptional({ description: 'Motivo de la cita' })
  @IsString()
  @IsOptional()
  reason?: string;

  @ApiPropertyOptional({ description: 'Notas' })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiPropertyOptional({ description: 'Estado de la cita', enum: AppointmentStatus })
  @IsEnum(AppointmentStatus)
  @IsOptional()
  status?: AppointmentStatus;

  @ApiPropertyOptional({ description: 'Notas de diagnóstico' })
  @IsString()
  @IsOptional()
  diagnosisNotes?: string;

  @ApiPropertyOptional({ description: 'Notas de tratamiento' })
  @IsString()
  @IsOptional()
  treatmentNotes?: string;
}
