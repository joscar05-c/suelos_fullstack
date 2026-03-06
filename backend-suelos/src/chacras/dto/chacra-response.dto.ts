export class ChacraResponseDto {
  id: number;
  nombre: string;
  areaHa: number;
  ubicacion?: string;
  descripcion?: string;
  createdAt: Date;
  updatedAt: Date;
  totalCalculos?: number;
  ultimoCalculo?: Date;
}

export class ChacraDetalleResponseDto extends ChacraResponseDto {
  calculos?: CalculoResumenDto[];
}

export class CalculoResumenDto {
  id: number;
  fecha: Date;
  nombreMuestra: string;
  metaRendimiento: number;
  ph: number;
  materiaOrganica: number;
  alertasCount: number;
  createdAt: Date;
}

export class CalculoCompletoResponseDto {
  id: number;
  fecha: Date;
  nombreMuestra: string;
  chacraId: number;
  datosEntrada: any;
  resultados: any;
  createdAt: Date;
}

export class CalculoGuardadoResponseDto {
  calculoId: number;
  chacraNombre: string;
  message: string;
  resultado?: any;
}
