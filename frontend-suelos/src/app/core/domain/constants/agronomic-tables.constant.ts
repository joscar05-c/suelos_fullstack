import {
  TexturaSuelo,
  TasaMineralizacion,
  FactorNutriente,
  EficienciasNutriente,
  RangoIdeal,
  RelacionCationica,
  NivelCriticoMicro,
  RequerimientoCultivo,
  FuenteFertilizante,
} from '../models/agronomic.models';

/**
 * Constantes químicas estequiométricas (Pesos Equivalentes en g/eq)
 * Utilizadas para conversiones entre meq/100g -> ppm -> kg/ha
 */
export const CONSTANTES_QUIMICAS = {
  EQ_CA: 20.04, // Peso equivalente del Calcio (40.08 / 2)
  EQ_MG: 12.15, // Peso equivalente del Magnesio (24.30 / 2)
  EQ_K: 39.10,  // Peso equivalente del Potasio (39.10 / 1)
  EQ_NA: 23.00, // Peso equivalente del Sodio (23.00 / 1)
  EQ_AL: 9.00,  // Peso equivalente del Aluminio (27.00 / 3)
  FACTOR_MG_A_MGO: 1.658, // Conversión Mg elemental a MgO (40.3 / 24.31)
  FACTOR_CA_A_CAO: 1.399, // Conversión Ca elemental a CaO (56.08 / 40.08)
  DENSIDAD_PLANTAS_DEFAULT: 5000, // Plantas de café por hectárea según DOC 2 (JNC/INIA)
};

/**
 * 1. Texturas de Suelo y Densidades Aparentes (Anexo 2 - UNALM)
 */
export const TEXTURAS_SUELO: TexturaSuelo[] = [
  { id: 1, nombre: 'Arenoso', densidadAparente: 1.70 },
  { id: 2, nombre: 'Franco Arenoso', densidadAparente: 1.60 },
  { id: 3, nombre: 'Franco', densidadAparente: 1.50 },
  { id: 4, nombre: 'Franco Arcilloso', densidadAparente: 1.35 },
  { id: 5, nombre: 'Arcilloso', densidadAparente: 1.20 },
];

/**
 * 2. Tasas de Mineralización de Materia Orgánica por Región (Anexo 3 - UNALM)
 */
export const TASAS_MINERALIZACION: TasaMineralizacion[] = [
  { id: 1, zona: 'Costa', porcentaje: 2.00 },
  { id: 2, zona: 'Sierra > 4000', porcentaje: 0.90 },
  { id: 3, zona: 'Sierra < 4000', porcentaje: 1.50 },
  { id: 4, zona: 'Selva > 600', porcentaje: 3.00 },
  { id: 5, zona: 'Selva < 600', porcentaje: 3.50 },
];

/**
 * 3. Factores de Conversión y Disponibilidad Biológica de Nutrientes (Anexo 4 - UNALM)
 */
export const FACTORES_NUTRIENTES: FactorNutriente[] = [
  { elemento: 'N', disponibilidad: 0.30, factorConversion: 1.0 },
  { elemento: 'P', disponibilidad: 0.20, factorConversion: 2.29 }, // P elemental -> P2O5
  { elemento: 'K', disponibilidad: 0.40, factorConversion: 1.205 }, // K elemental -> K2O
  { elemento: 'Ca', disponibilidad: 0.70, factorConversion: 1.399 }, // Ca elemental -> CaO
  { elemento: 'Mg', disponibilidad: 0.60, factorConversion: 1.658 }, // Mg elemental -> MgO
  { elemento: 'S', disponibilidad: 1.00, factorConversion: 3.0 },
];

/**
 * 4. Eficiencias de Absorción y Uso de Fertilizantes (Anexo 7 - UNALM)
 */
export const EFICIENCIAS_NUTRIENTES: EficienciasNutriente = {
  N: 0.60, // 60%
  P: 0.25, // 25%
  K: 0.70, // 70%
  Ca_Enmienda: 0.70, // 70%
};

/**
 * 5. Rangos Óptimos para el Cultivo de Café (Anexo 1 - ICAFE / UNALM / Carvajal)
 */
export const RANGOS_IDEALES: RangoIdeal[] = [
  {
    parametro: 'PH',
    valorMin: 4.5,
    valorMax: 6.5,
    unidad: 'pH',
    descripcion: 'Rango ideal de pH para cultivo de café',
  },
  {
    parametro: 'MATERIA_ORGANICA',
    valorMin: 4.0,
    unidad: '%',
    descripcion: 'Materia orgánica ideal > 4%',
  },
  {
    parametro: 'SAT_ACIDEZ',
    valorMax: 30.0,
    unidad: '%',
    descripcion: 'Saturación de acidez ideal < 30%',
  },
  {
    parametro: 'SAT_BASES',
    valorMin: 60.0,
    valorMax: 80.0,
    unidad: '%',
    descripcion: 'Saturación de bases entre 60-80%',
  },
  {
    parametro: 'CONDUCTIVIDAD_ELECTRICA',
    valorMax: 1.0,
    unidad: 'dS/m',
    descripcion: 'Conductividad eléctrica < 1 dS/m',
  },
  {
    parametro: 'CIC_EFECTIVA',
    valorMin: 12.0,
    unidad: 'meq/100g',
    descripcion: 'Capacidad de Intercambio Catiónico Efectiva > 12 meq/100g',
  },
  {
    parametro: 'P_PPM',
    valorMin: 14.0,
    unidad: 'ppm',
    descripcion: 'Fósforo disponible > 14 ppm',
  },
  {
    parametro: 'K_INTERCAMBIABLE',
    valorMin: 0.29,
    valorMax: 0.70,
    unidad: 'meq/100g',
    descripcion: 'Potasio intercambiable 0.29 - 0.70 meq/100g',
  },
  {
    parametro: 'CA_INTERCAMBIABLE',
    valorMin: 4.0,
    valorMax: 8.0,
    unidad: 'meq/100g',
    descripcion: 'Calcio intercambiable 4 - 8 meq/100g',
  },
  {
    parametro: 'MG_INTERCAMBIABLE',
    valorMin: 1.0,
    valorMax: 2.0,
    unidad: 'meq/100g',
    descripcion: 'Magnesio intercambiable 1 - 2 meq/100g',
  },
  {
    parametro: 'ALUMINIO_INTERCAMBIABLE',
    valorMin: 0.0,
    valorMax: 1.0,
    unidad: 'meq/100g',
    descripcion: 'Aluminio intercambiable < 1 meq/100g',
  },
];

/**
 * 6. Relaciones Catiónicas Críticas (Anexo 5 - UNALM)
 */
export const RELACIONES_CATIONICAS: RelacionCationica[] = [
  { nombre: 'Ca/Mg', min: 5.0, max: 8.0 },
  { nombre: 'Ca/K', min: 14.0, max: 16.0 },
  { nombre: 'Mg/K', min: 1.8, max: 2.5 },
  { nombre: 'K/Mg', min: 0.2, max: 0.3 },
];

/**
 * 7. Niveles Críticos de Micronutrientes (Anexo 10 - Sociedad Colombiana de la Ciencia del Suelo)
 */
export const NIVELES_CRITICOS_MICRO: NivelCriticoMicro[] = [
  // Boro (B)
  { elemento: 'B', nivel: 'Bajo', min: 0, max: 0.3 },
  { elemento: 'B', nivel: 'Medio', min: 0.3, max: 0.5 },
  { elemento: 'B', nivel: 'Alto', min: 0.5 },
  // Cobre (Cu)
  { elemento: 'Cu', nivel: 'Bajo', min: 0, max: 0.4 },
  { elemento: 'Cu', nivel: 'Medio', min: 0.4, max: 0.8 },
  { elemento: 'Cu', nivel: 'Alto', min: 0.8 },
  // Zinc (Zn)
  { elemento: 'Zn', nivel: 'Bajo', min: 0, max: 4.0 },
  { elemento: 'Zn', nivel: 'Medio', min: 4.0, max: 6.0 },
  { elemento: 'Zn', nivel: 'Alto', min: 6.0 },
  // Manganeso (Mn)
  { elemento: 'Mn', nivel: 'Bajo', min: 0, max: 3.0 },
  { elemento: 'Mn', nivel: 'Medio', min: 3.0, max: 5.0 },
  { elemento: 'Mn', nivel: 'Alto', min: 5.0 },
  // Hierro (Fe)
  { elemento: 'Fe', nivel: 'Bajo', min: 0, max: 30.0 },
  { elemento: 'Fe', nivel: 'Medio', min: 30.0, max: 50.0 },
  { elemento: 'Fe', nivel: 'Alto', min: 50.0 },
];

/**
 * 8. Requerimientos Nutricionales del Cultivo de Café según Meta de Rendimiento (Anexo 11 - UNALM / Sánchez)
 */
export const REQUERIMIENTOS_CULTIVO_CAFE: RequerimientoCultivo[] = [
  {
    cultivo: 'Cafe',
    metaQuintales: 10,
    n: 56,
    p2o5: 9,
    k2o: 63,
    cao: 18,
    mgo: 7.5,
    s: 4.5,
    b: 1.0,
    cu: 1.0,
    zn: 1.0,
    mn: 1.0,
    fe: 2.0,
  },
  {
    cultivo: 'Cafe',
    metaQuintales: 20,
    n: 112,
    p2o5: 18,
    k2o: 125,
    cao: 36,
    mgo: 15.0,
    s: 9.0,
    b: 2.0,
    cu: 1.5,
    zn: 1.5,
    mn: 1.5,
    fe: 3.0,
  },
  {
    cultivo: 'Cafe',
    metaQuintales: 30,
    n: 168,
    p2o5: 27,
    k2o: 188,
    cao: 54,
    mgo: 22.5,
    s: 13.5,
    b: 3.0,
    cu: 1.8,
    zn: 1.8,
    mn: 1.8,
    fe: 4.0,
  },
  {
    cultivo: 'Cafe',
    metaQuintales: 40,
    n: 224,
    p2o5: 36,
    k2o: 250,
    cao: 72,
    mgo: 30.0,
    s: 18.0,
    b: 4.0,
    cu: 2.1,
    zn: 2.1,
    mn: 2.1,
    fe: 5.0,
  },
  {
    cultivo: 'Cafe',
    metaQuintales: 50,
    n: 280,
    p2o5: 45,
    k2o: 313,
    cao: 90,
    mgo: 37.5,
    s: 22.5,
    b: 5.0,
    cu: 2.3,
    zn: 2.3,
    mn: 2.3,
    fe: 6.0,
  },
  {
    cultivo: 'Cafe',
    metaQuintales: 60,
    n: 336,
    p2o5: 54,
    k2o: 376,
    cao: 108,
    mgo: 45.0,
    s: 27.0,
    b: 6.0,
    cu: 2.4,
    zn: 2.4,
    mn: 2.4,
    fe: 7.0,
  },
];

/**
 * 9. Catálogo Completo de 24 Fertilizantes Comerciales, Orgánicos y Enmiendas
 * Datos certificados según Anexo 9-A y 9-B de DOC 1
 */
export const FUENTES_FERTILIZANTES: FuenteFertilizante[] = [
  // --- NITROGENADOS ---
  {
    id: 1,
    nombre: 'Sulfato de Amonio',
    clasificacion: 'NITROGENADO_SIMPLE',
    porc_n: 21,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 24,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 2,
    nombre: 'Nitrato de Amonio',
    clasificacion: 'NITROGENADO_SIMPLE',
    porc_n: 33,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 3,
    nombre: 'Urea',
    clasificacion: 'NITROGENADO_SIMPLE',
    porc_n: 45,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- FOSFATADOS ---
  {
    id: 4,
    nombre: 'Superfosfato Simple',
    clasificacion: 'FOSFATADO_SIMPLE',
    porc_n: 0,
    porc_p2o5: 21,
    porc_k2o: 0,
    porc_cao: 20,
    porc_mgo: 0,
    porc_s: 12,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 5,
    nombre: 'Superfosfato Triple (SFT)',
    clasificacion: 'FOSFATADO_SIMPLE',
    porc_n: 0,
    porc_p2o5: 46,
    porc_k2o: 0,
    porc_cao: 14,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- POTÁSICOS ---
  {
    id: 6,
    nombre: 'Cloruro de Potasio (KCl)',
    clasificacion: 'POTASICO_SIMPLE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 60,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 7,
    nombre: 'Sulfato de Potasio',
    clasificacion: 'POTASICO_SIMPLE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 50,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 18,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- COMPUESTOS ---
  {
    id: 8,
    nombre: 'Fosfato Diamónico (DAP)',
    clasificacion: 'COMPUESTO',
    porc_n: 18,
    porc_p2o5: 46,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 9,
    nombre: 'Fosfato Monoamónico (MAP)',
    clasificacion: 'COMPUESTO',
    porc_n: 11,
    porc_p2o5: 52,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 10,
    nombre: 'Sulpomag',
    clasificacion: 'COMPUESTO',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 22,
    porc_cao: 0,
    porc_mgo: 18,
    porc_s: 22,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 11,
    nombre: 'Molimax-Café',
    clasificacion: 'COMPUESTO',
    porc_n: 20,
    porc_p2o5: 7,
    porc_k2o: 20,
    porc_cao: 3,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 12,
    nombre: 'Roca Fosfórica',
    clasificacion: 'COMPUESTO',
    porc_n: 0,
    porc_p2o5: 30,
    porc_k2o: 0,
    porc_cao: 40,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- ORGÁNICOS ---
  {
    id: 13,
    nombre: 'Guano de Isla',
    clasificacion: 'ORGANICO',
    porc_n: 13,
    porc_p2o5: 12,
    porc_k2o: 2.5,
    porc_cao: 11,
    porc_mgo: 1.0,
    porc_s: 1.5,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 14,
    nombre: 'Broza del Café',
    clasificacion: 'ORGANICO',
    porc_n: 2.5,
    porc_p2o5: 0.3,
    porc_k2o: 1.9,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 15,
    nombre: 'Estiércol de Vacuno',
    clasificacion: 'ORGANICO',
    porc_n: 1.6,
    porc_p2o5: 1.2,
    porc_k2o: 1.8,
    porc_cao: 2.2,
    porc_mgo: 1.1,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 16,
    nombre: 'Compost (Pulpa)',
    clasificacion: 'ORGANICO',
    porc_n: 1.7,
    porc_p2o5: 0.18,
    porc_k2o: 2.0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- ENMIENDAS ---
  {
    id: 17,
    nombre: 'Cal Agrícola',
    clasificacion: 'ENMIENDA',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 56,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 18,
    nombre: 'Yeso Agrícola',
    clasificacion: 'ENMIENDA',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 26,
    porc_mgo: 0,
    porc_s: 18,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 19,
    nombre: 'Dolomita',
    clasificacion: 'ENMIENDA',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 30,
    porc_mgo: 20,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },

  // --- MICRONUTRIENTES ---
  {
    id: 20,
    nombre: 'Sulfato de Cobre',
    clasificacion: 'MICRONUTRIENTE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 12,
    porc_b: 0,
    porc_cu: 25,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 21,
    nombre: 'Sulfato de Zinc',
    clasificacion: 'MICRONUTRIENTE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 17,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 22,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 22,
    nombre: 'Ulexita',
    clasificacion: 'MICRONUTRIENTE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 10,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 0,
  },
  {
    id: 23,
    nombre: 'Manganeso Natural',
    clasificacion: 'MICRONUTRIENTE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 0,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 25,
    porc_fe: 0,
  },
  {
    id: 24,
    nombre: 'Sulfato de Hierro',
    clasificacion: 'MICRONUTRIENTE',
    porc_n: 0,
    porc_p2o5: 0,
    porc_k2o: 0,
    porc_cao: 0,
    porc_mgo: 0,
    porc_s: 18,
    porc_b: 0,
    porc_cu: 0,
    porc_zn: 0,
    porc_mn: 0,
    porc_fe: 20,
  },
];
