export interface SolicitudCalculo {
  areaHa: number;
  profundidadMetros: number;
  idTextura: number;
  materiaOrganica: number;
  fosforoPpm: number;
  potasioPpm: number;
  idZona: number;
  // Nuevos campos químicos
  ph: number;
  ce: number;
  caIntercambiable: number;
  mgIntercambiable: number;
  kIntercambiable: number;
  naIntercambiable: number;
  acidezIntercambiable: number;
  // Micronutrientes opcionales
  b_ppm?: number;
  cu_ppm?: number;
  zn_ppm?: number;
  mn_ppm?: number;
  fe_ppm?: number;
  s_ppm?: number; // Azufre (ppm) - Nuevo campo
  // Meta de rendimiento
  metaRendimiento: number;
  // Estrategia de fertilización - Fuentes comerciales (opcionales)
  idFuenteN?: number;
  idFuenteP?: number;
  idFuenteK?: number;
  idFuenteCa?: number;
}

export interface AlertaDiagnostico {
  parametro: string;
  mensaje: string;
  severidad: 'baja' | 'media' | 'alta';
}

export interface EquilibrioCationico {
  ca_mg: number;
  ca_k: number;
  mg_k: number;
  k_mg: number;
  alertas: AlertaDiagnostico[];
}

export interface BalanceNutricional {
  metaQuintales: number;
  N: {
    requerido: number;
    suministroSuelo: number;
    deficit: number;
  };
  P2O5: {
    requerido: number;
    suministroSuelo: number;
    deficit: number;
  };
  K2O: {
    requerido: number;
    suministroSuelo: number;
    deficit: number;
  };
  // Nutrientes secundarios (opcionales)
  MgO?: {
    requerido: number;
    suministroSuelo: number;
    deficit: number;
  };
  S?: {
    requerido: number;
    suministroSuelo: number;
    deficit: number;
  };
}

// Interfaz genérica para recomendaciones de nutrientes
export interface RecomendacionNutriente {
  producto: string;
  dosis_pura_requerida: number;
  eficiencia_usada?: string;
  cantidad_kg_ha: number;
  cantidad_sacos_50kg: number;
  deficit_original?: number;
  deficit_ajustado?: number;
  aporta_nitrogeno?: number;
  aporta_potasio?: number;
  aporte_de_otros_fertilizantes?: number;
}

export interface RecomendacionFertilizacion {
  Nitrogeno: {
    producto: string;
    dosis_pura_requerida: number;
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
    aporte_de_otros_fertilizantes: number;
    deficit_original: number;
    deficit_ajustado: number;
  };
  Fosforo: {
    producto: string;
    dosis_pura_requerida: number;
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
    aporta_nitrogeno: number;
    aporta_potasio: number;
  };
  Potasio: {
    producto: string;
    dosis_pura_requerida: number;
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
    aporta_nitrogeno: number;
    deficit_original: number;
    deficit_ajustado: number;
  };
  // Nuevos nutrientes secundarios (opcionales)
  Magnesio?: RecomendacionNutriente; // Dolomita o Sulfato de Magnesio
  Azufre?: RecomendacionNutriente;   // Azufre Elemental o Sulfatos
}

export interface EnmiendaCalcica {
  requiere_enmienda: boolean;
  relacion_ca_mg: number;
  mensaje?: string;
  ca_actual_meq?: number;
  ca_ideal_meq?: number;
  deficit_ca_meq?: number;
  kg_cao_requerido?: number;
  eficiencia_usada?: string;
  producto?: string;
  riqueza_cao?: string;
  kg_comercial_ha?: number;
  sacos_50kg?: number;
}

export interface AplicacionCronograma {
  producto: string;
  dosis_kg: number;
  sacos: number;
}

export interface EtapaCronograma {
  etapa: string;
  momento: string;
  aplicaciones: AplicacionCronograma[];
}

export interface RespuestaCalculo {
  pcaToneladas: number;
  nitrogenoDisponibleKg: number;
  fosforoDisponibleKg: number;
  potasioDisponibleKg: number;
  magnesioDisponibleKg: number; // Nuevo: Magnesio disponible
  azufreDisponibleKg: number;   // Nuevo: Azufre disponible
  // Nuevos campos de interpretación química
  sumaBases: number;
  cicEfectiva: number;
  porcentajeSatAcidez: number;
  porcentajeSatBases: number;
  equilibrioCationico: EquilibrioCationico;
  micronutrientes?: Record<string, {
    valor: number;
    diagnostico: string;
    recomendacion: string;
  }>;
  balanceNutricional?: BalanceNutricional;
  enmienda_calcica?: EnmiendaCalcica;
  recomendacion_fertilizacion?: RecomendacionFertilizacion;
  cronograma?: EtapaCronograma[];
  alertas: AlertaDiagnostico[];
}
