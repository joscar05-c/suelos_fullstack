import { IsNumber, IsPositive, Min, IsOptional } from 'class-validator';

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

  // Nuevos campos para interpretación química
  @IsNumber()
  @Min(0)
  ph: number; // pH del suelo

  @IsNumber()
  @Min(0)
  ce: number; // Conductividad eléctrica (dS/m)

  @IsNumber()
  @Min(0)
  caIntercambiable: number; // Calcio intercambiable (meq/100g)

  @IsNumber()
  @Min(0)
  mgIntercambiable: number; // Magnesio intercambiable (meq/100g)

  @IsNumber()
  @Min(0)
  kIntercambiable: number; // Potasio intercambiable (meq/100g) - NO es el ppm

  @IsNumber()
  @Min(0)
  naIntercambiable: number; // Sodio intercambiable (meq/100g)

  @IsNumber()
  @Min(0)
  acidezIntercambiable: number; // Acidez intercambiable (Al + H) (meq/100g)

  // Micronutrientes (ppm) - Opcionales
  @IsNumber()
  @Min(0)
  b_ppm?: number; // Boro (ppm)

  @IsNumber()
  @Min(0)
  cu_ppm?: number; // Cobre (ppm)

  @IsNumber()
  @Min(0)
  zn_ppm?: number; // Zinc (ppm)

  @IsNumber()
  @Min(0)
  mn_ppm?: number; // Manganeso (ppm)

  @IsNumber()
  @Min(0)
  fe_ppm?: number; // Hierro (ppm)

  @IsOptional()
  @IsNumber()
  @Min(0)
  s_ppm?: number; // Azufre (ppm) - Nuevo campo

  @IsNumber()
  @IsPositive()
  metaRendimiento: number; // Meta de producción en quintales/ha (20, 30, 40, 50, 60)

  // Fuentes de Fertilizantes (Opcionales - Defaults: Urea, SFT, KCl)
  @IsOptional()
  @IsNumber()
  @IsPositive()
  idFuenteN?: number; // ID de fuente de Nitrógeno (Default: Urea)

  @IsOptional()
  @IsNumber()
  @IsPositive()
  idFuenteP?: number; // ID de fuente de Fósforo (Default: SFT)

  @IsOptional()
  @IsNumber()
  @IsPositive()
  idFuenteK?: number; // ID de fuente de Potasio (Default: KCl)

  @IsOptional()
  @IsNumber()
  @IsPositive()
  idFuenteCa?: number; // ID de fuente de Calcio para enmienda (ej: Cal Agrícola)
}
