export type TipoFertilizante =
  | 'NITROGENADO_SIMPLE'
  | 'FOSFATADO_SIMPLE'
  | 'POTASICO_SIMPLE'
  | 'COMPUESTO'
  | 'ORGANICO'
  | 'ENMIENDA'
  | 'MICRONUTRIENTE';

export interface TexturaSuelo {
  id: number;
  nombre: string;
  densidadAparente: number; // g/cm3 o t/m3
}

export interface TasaMineralizacion {
  id: number;
  zona: string;
  porcentaje: number; // %
}

export interface FactorNutriente {
  elemento: 'N' | 'P' | 'K' | 'Ca' | 'Mg' | 'S';
  disponibilidad: number; // Factor 0.0 - 1.0
  factorConversion: number; // e.g. 2.29 para P -> P2O5
}

export interface EficienciasNutriente {
  N: number; // 0.60
  P: number; // 0.25
  K: number; // 0.70
  Ca_Enmienda: number; // 0.70
}

export interface RangoIdeal {
  parametro: string;
  valorMin?: number;
  valorMax?: number;
  unidad: string;
  descripcion: string;
}

export interface RelacionCationica {
  nombre: 'Ca/Mg' | 'Ca/K' | 'Mg/K' | 'K/Mg';
  min: number;
  max: number;
}

export interface NivelCriticoMicro {
  elemento: 'B' | 'Cu' | 'Zn' | 'Mn' | 'Fe';
  nivel: 'Bajo' | 'Medio' | 'Alto';
  min: number;
  max?: number;
}

export interface RequerimientoCultivo {
  cultivo: string;
  metaQuintales: number;
  n: number;
  p2o5: number;
  k2o: number;
  cao: number;
  mgo: number;
  s: number;
  b: number;
  cu: number;
  zn: number;
  mn: number;
  fe: number;
}

export interface FuenteFertilizante {
  id: number;
  nombre: string;
  clasificacion: TipoFertilizante;
  porc_n: number;
  porc_p2o5: number;
  porc_k2o: number;
  porc_cao: number;
  porc_mgo: number;
  porc_s: number;
  porc_b: number;
  porc_cu: number;
  porc_zn: number;
  porc_mn: number;
  porc_fe: number;
}

export interface DatosEntradaCalculo {
  cultivo?: string; // Opcional: 'Cafe' | 'Cacao' (default 'Cafe')
  areaHa: number;
  profundidadMetros: number;
  idTextura: number;
  materiaOrganica: number; // %
  fosforoPpm: number; // ppm
  potasioPpm: number; // ppm
  idZona: number;
  ph: number;
  ce: number; // dS/m
  caIntercambiable: number; // meq/100g
  mgIntercambiable: number; // meq/100g
  kIntercambiable: number; // meq/100g
  naIntercambiable: number; // meq/100g
  acidezIntercambiable: number; // meq/100g (Al + H)
  b_ppm?: number;
  cu_ppm?: number;
  zn_ppm?: number;
  mn_ppm?: number;
  fe_ppm?: number;
  s_ppm?: number;
  metaRendimiento: number; // qq/ha (e.g. 10, 20, 30, 40, 50, 60)
  idFuenteN?: number;
  idFuenteP?: number;
  idFuenteK?: number;
  idFuenteCa?: number;
  densidadPlantasHa?: number; // Opcional: número de plantas/ha (default 5000 para café según DOC 2)
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
  N: { requerido: number; suministroSuelo: number; deficit: number };
  P2O5: { requerido: number; suministroSuelo: number; deficit: number };
  K2O: { requerido: number; suministroSuelo: number; deficit: number };
  MgO: { requerido: number; suministroSuelo: number; deficit: number };
  S: { requerido: number; suministroSuelo: number; deficit: number };
  micronutrientes?: {
    B: number;
    Cu: number;
    Zn: number;
    Mn: number;
    Fe: number;
  };
}

export interface RecomendacionNutriente {
  producto: string;
  dosis_pura_requerida: number;
  eficiencia_usada?: string;
  cantidad_kg_ha: number;
  cantidad_sacos_50kg: number;
  gramos_por_planta?: number; // Nuevo aporte según DOC 2
  deficit_original?: number;
  deficit_ajustado?: number;
  deficit_neto?: number;
  aporta_nitrogeno?: number;
  aporta_potasio?: number;
  aporte_de_otros_fertilizantes?: number;
  aportado_por_otros?: number;
  riqueza_n?: string;
  criterio?: string;
}

export interface AcumuladorNutrientes {
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
}

export interface RecomendacionFertilizacion {
  Nitrogeno: RecomendacionNutriente & {
    deficit_teorico_con_eficiencia?: number;
    aportado_por_otros?: number;
  };
  Fosforo: RecomendacionNutriente;
  Potasio: RecomendacionNutriente & {
    aportado_por_fosforo?: number;
  };
  Magnesio?: RecomendacionNutriente;
  Azufre?: RecomendacionNutriente;
  acumulador_total: AcumuladorNutrientes;
}

export interface EnmiendaCalcica {
  requiere_enmienda: boolean;
  relacion_ca_mg: number;
  mensaje?: string;
  ca_actual_meq?: number;
  ca_ideal_meq?: number;
  deficit_ca_meq?: number;
  kg_cao_requerido_total?: number;
  aporte_externo_cao?: number;
  kg_cao_neto?: number;
  kg_cao_requerido?: number;
  eficiencia_usada?: string;
  producto?: string;
  riqueza_cao?: string;
  kg_comercial_ha?: number;
  sacos_50kg?: number;
  gramos_por_planta?: number;
}

export interface AplicacionCronograma {
  producto: string;
  dosis_kg: number;
  sacos: number;
  gramos_planta?: number;
}

export interface EtapaCronograma {
  etapa: string;
  momento: string;
  aplicaciones: AplicacionCronograma[];
}

export interface ResultadoCalculo {
  pcaToneladas: number;
  nitrogenoDisponibleKg: number;
  fosforoDisponibleKg: number;
  potasioDisponibleKg: number;
  magnesioDisponibleKg: number;
  azufreDisponibleKg: number;
  sumaBases: number;
  cicEfectiva: number;
  porcentajeSatAcidez: number;
  porcentajeSatBases: number;
  equilibrioCationico: EquilibrioCationico;
  micronutrientes?: Record<
    string,
    {
      valor: number;
      diagnostico: string;
      recomendacion: string;
    }
  >;
  balanceNutricional: BalanceNutricional;
  enmienda_calcica: EnmiendaCalcica;
  recomendacion_fertilizacion: RecomendacionFertilizacion;
  cronograma: EtapaCronograma[];
  alertas: AlertaDiagnostico[];
}
