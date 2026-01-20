import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetWeekScheduleDto {
  @ApiProperty({ description: 'Fecha de inicio de la semana (YYYY-MM-DD)' })
  @IsDateString()
  startDate: string;
}
