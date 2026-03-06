import { IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { DatosEntradaDto } from '../../calculo-suelo/dto/datos-entrada.dto';

export class CalcularYGuardarDto {
  @IsOptional()
  @IsString()
  nombreMuestra?: string;

  @ValidateNested()
  @Type(() => DatosEntradaDto)
  datos: DatosEntradaDto;
}
