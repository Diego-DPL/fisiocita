import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClinicRequestStatus } from '@prisma/client';

export class RespondClinicRequestDto {
  @ApiProperty({ 
    enum: ClinicRequestStatus,
    description: 'APPROVED o REJECTED',
    example: 'APPROVED'
  })
  @IsEnum(ClinicRequestStatus)
  status: ClinicRequestStatus;

  @ApiPropertyOptional({ description: 'Mensaje de respuesta de la clínica' })
  @IsString()
  @IsOptional()
  responseMessage?: string;
}
