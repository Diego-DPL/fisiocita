import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignToActivityDto {
  @ApiProperty({ description: 'ID de la actividad' })
  @IsUUID()
  activityId: string;
}
