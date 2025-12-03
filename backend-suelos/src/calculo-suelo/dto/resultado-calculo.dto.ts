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
}

export interface RecomendacionFertilizacion {
  Nitrogeno: {
    producto: string;
    deficit_original: number; // Déficit antes de aplicar eficiencia
    deficit_teorico_con_eficiencia: number; // Déficit / eficiencia
    aportado_por_otros: number; // Aporte acumulado de P y K
    deficit_neto: number; // Déficit real a cubrir (teorico - aportado)
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
  };
  Fosforo: {
    producto: string;
    deficit_original: number;
    dosis_pura_requerida: number;
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
  };
  Potasio: {
    producto: string;
    deficit_original: number;
    aportado_por_fosforo: number; // K aportado por el fertilizante de P
    deficit_neto: number; // Déficit real a cubrir
    eficiencia_usada: string;
    cantidad_kg_ha: number;
    cantidad_sacos_50kg: number;
  };
  // NUEVO: Acumulador completo de todos los nutrientes
  acumulador_total: {
    N_total_kg: number;
    P2O5_total_kg: number;
    K2O_total_kg: number;
    CaO_total_kg: number;
    MgO_total_kg: number;
    S_total_kg: number;
    Zn_total_kg: number;
    B_total_kg: number;
    Cu_total_kg: number;
    Mn_total_kg: number;
    Fe_total_kg: number;
  };
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

export class ResultadoCalculoDto {
  // Resultados de nutrientes disponibles
  pcaToneladas: number; // PCA en toneladas
  nitrogenoDisponibleKg: number; // N disponible en kg
  fosforoDisponibleKg: number; // P disponible en kg
  potasioDisponibleKg: number; // K disponible en kg
  magnesioDisponibleKg: number; // Mg disponible en kg
  azufreDisponibleKg: number; // S disponible en kg

  // Resultados de interpretación química
  sumaBases: number; // Ca + Mg + K + Na (meq/100g)
  cicEfectiva: number; // CIC Efectiva (meq/100g)
  porcentajeSatAcidez: number; // % Saturación de Acidez
  porcentajeSatBases: number; // % Saturación de Bases

  // Equilibrio de Relaciones Catiónicas (Página 7 PDF)
  equilibrioCationico: EquilibrioCationico;

  // Micronutrientes (Página 8 PDF)
  micronutrientes?: Record<
    string,
    {
      valor: number;
      diagnostico: string;
      recomendacion: string;
    }
  >;

  // Balance Nutricional (Página 9 PDF)
  balanceNutricional?: BalanceNutricional;

  // Enmienda Cálcica (Págs 7-8 PDF - Relación Ca/Mg)
  enmienda_calcica?: EnmiendaCalcica;

  // Recomendación de Fertilización Comercial (Anexo 7 y 9 PDF)
  recomendacion_fertilizacion?: RecomendacionFertilizacion;

  // Cronograma de Aplicación (Pág 11 PDF - Tabla de Fraccionamiento)
  cronograma?: EtapaCronograma[];

  // Diagnóstico
  alertas: AlertaDiagnostico[]; // Array de alertas/diagnósticos
}
