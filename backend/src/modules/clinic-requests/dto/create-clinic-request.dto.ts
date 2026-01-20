import { IsString, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateClinicRequestDto {
  @ApiProperty({ description: 'ID de la clínica a la que solicita unirse' })
  @IsUUID()
  clinicId: string;

  @ApiPropertyOptional({ description: 'Mensaje opcional del fisioterapeuta' })
  @IsString()
  @IsOptional()
  message?: string;
}
