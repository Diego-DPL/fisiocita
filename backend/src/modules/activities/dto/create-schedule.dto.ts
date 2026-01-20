import { IsEnum, IsString, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { DayOfWeek } from '@prisma/client';

export class CreateScheduleDto {
  @ApiProperty({ description: 'Día de la semana', enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  dayOfWeek: DayOfWeek;

  @ApiProperty({ description: 'Hora de inicio (HH:MM)' })
  @IsString()
  startTime: string;

  @ApiProperty({ description: 'Hora de fin (HH:MM)' })
  @IsString()
  endTime: string;

  @ApiPropertyOptional({ description: 'Fecha de inicio de validez (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  startDate?: string;

  @ApiPropertyOptional({ description: 'Fecha de fin de validez (ISO 8601)' })
  @IsDateString()
  @IsOptional()
  endDate?: string;
}
