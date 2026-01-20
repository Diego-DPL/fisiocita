import { IsString, IsOptional, IsInt, Min, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePhysiotherapistDto {
  @ApiPropertyOptional({ description: 'Número de licencia profesional' })
  @IsString()
  @IsOptional()
  licenseNumber?: string;

  @ApiPropertyOptional({ description: 'Especialización' })
  @IsString()
  @IsOptional()
  specialization?: string;

  @ApiPropertyOptional({ description: 'Biografía profesional' })
  @IsString()
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ description: 'Años de experiencia' })
  @IsInt()
  @Min(0)
  @IsOptional()
  yearsOfExperience?: number;
}
