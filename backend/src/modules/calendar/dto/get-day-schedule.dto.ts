import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GetDayScheduleDto {
  @ApiProperty({ description: 'Fecha (YYYY-MM-DD)' })
  @IsDateString()
  date: string;
}
