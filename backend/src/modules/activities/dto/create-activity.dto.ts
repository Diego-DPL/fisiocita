import { IsString, IsEnum, IsInt, Min, Max, IsOptional, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ActivityType, ActivityDifficulty } from '@prisma/client';

export class CreateActivityDto {
  @ApiProperty({ description: 'ID del fisioterapeuta responsable' })
  @IsUUID()
  physiotherapistId: string;

  @ApiProperty({ description: 'Nombre de la actividad' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Descripción de la actividad' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Tipo de actividad', enum: ActivityType })
  @IsEnum(ActivityType)
  type: ActivityType;

  @ApiProperty({ description: 'Nivel de dificultad', enum: ActivityDifficulty })
  @IsEnum(ActivityDifficulty)
  difficulty: ActivityDifficulty;

  @ApiProperty({ description: 'Máximo de participantes' })
  @IsInt()
  @Min(1)
  @Max(50)
  maxParticipants: number;

  @ApiProperty({ description: 'Duración en minutos' })
  @IsInt()
  @Min(15)
  @Max(240)
  durationMinutes: number;

  @ApiPropertyOptional({ description: 'Precio' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'URL de imagen' })
  @IsString()
  @IsOptional()
  imageUrl?: string;
}
