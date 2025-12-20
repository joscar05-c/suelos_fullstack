import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  MinLength,
} from 'class-validator';

export class CreateChacraDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsNumber()
  @IsPositive({ message: 'El área debe ser un número positivo' })
  areaHa: number;

  @IsOptional()
  @IsString()
  ubicacion?: string;

  @IsOptional()
  @IsString()
  descripcion?: string;
}
