import { PartialType } from '@nestjs/swagger';
import { CreatePhysiotherapistDto } from './create-physiotherapist.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdatePhysiotherapistDto extends PartialType(CreatePhysiotherapistDto) {
  @ApiPropertyOptional({ description: 'Estado activo/inactivo' })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
