import { IsNumber, IsPositive, Min } from 'class-validator';

export class DatosEntradaDto {
  @IsNumber()
  @IsPositive()
  areaHa: number; // Área en hectáreas

  @IsNumber()
  @IsPositive()
  profundidadMetros: number; // Profundidad en metros

  @IsNumber()
  @IsPositive()
  idTextura: number; // ID de la textura del suelo

  @IsNumber()
  @Min(0)
  materiaOrganica: number; // Porcentaje de materia orgánica

  @IsNumber()
  @Min(0)
  fosforoPpm: number; // Fósforo en partes por millón

  @IsNumber()
  @Min(0)
  potasioPpm: number; // Potasio en partes por millón

  @IsNumber()
  @IsPositive()
  idZona: number; // ID de la zona climática
}
