import {
  DatosEntradaCalculo,
  ResultadoCalculo,
  AlertaDiagnostico,
  EquilibrioCationico,
  BalanceNutricional,
  RecomendacionFertilizacion,
  EnmiendaCalcica,
  EtapaCronograma,
  AcumuladorNutrientes,
  FuenteFertilizante,
} from '../models/agronomic.models';
import {
  CONSTANTES_QUIMICAS,
  TEXTURAS_SUELO,
  TASAS_MINERALIZACION,
  FACTORES_NUTRIENTES,
  EFICIENCIAS_NUTRIENTES,
  RANGOS_IDEALES,
  RELACIONES_CATIONICAS,
  NIVELES_CRITICOS_MICRO,
  REQUERIMIENTOS_CULTIVO_CAFE,
  FUENTES_FERTILIZANTES,
} from '../constants/agronomic-tables.constant';

/**
 * 🌿 MOTOR DE CÁLCULO AGRONÓMICO PURO (Offline Soil Calculation Engine)
 * 
 * Implementa las metodologías certificadas de:
 * - UNALM (Universidad Nacional Agraria La Molina) - DOC 1
 * - JNC / INIA (Programa de Asistentes Técnicos de Cafés Especiales) - DOC 2
 * - Algoritmo en Cascada con compensación estequiométrica multielemental
 * 
 * Características:
 * - 100% independiente de servidores, frameworks o bases de datos externas.
 * - Ejecución síncrona en cliente en < 5ms.
 * - Soporta cálculo de dosis por hectárea, número de sacos (50 kg) y gramos por planta.
 */
export class SoilCalculationEngine {
  /**
   * Ejecuta el análisis completo de suelo y balance de fertilización
   */
  public static calcular(datos: DatosEntradaCalculo): ResultadoCalculo {
    // 1. Constantes y parámetros básicos
    const eficiencias = EFICIENCIAS_NUTRIENTES;
    const plantasHa = datos.densidadPlantasHa || CONSTANTES_QUIMICAS.DENSIDAD_PLANTAS_DEFAULT;

    // 2. Buscar textura y densidad aparente
    const textura = TEXTURAS_SUELO.find((t) => t.id === datos.idTextura) || TEXTURAS_SUELO[2]; // Default Franco
    const densidad = textura.densidadAparente;

    // 3. Buscar tasa de mineralización por zona
    const tasa = TASAS_MINERALIZACION.find((z) => z.id === datos.idZona) || TASAS_MINERALIZACION[3]; // Default Selva > 600
    const porcentajeMineralizacion = tasa.porcentaje;

    // 4. Factores de conversión y disponibilidad
    const factorN = FACTORES_NUTRIENTES.find((f) => f.elemento === 'N')!;
    const factorP = FACTORES_NUTRIENTES.find((f) => f.elemento === 'P')!;
    const factorK = FACTORES_NUTRIENTES.find((f) => f.elemento === 'K')!;

    // 5. Cálculo del Peso de la Capa Arable (PCA en toneladas)
    // PCA = Área (m²) * Densidad Aparente * Profundidad (m)
    const areaM2 = datos.areaHa * 10000;
    const pcaToneladas = areaM2 * densidad * datos.profundidadMetros;

    // 6. Nitrógeno disponible a partir de Materia Orgánica (MO)
    const moTotal = pcaToneladas * (datos.materiaOrganica / 100);
    const nOrganico = moTotal * 0.05; // 5% de la MO es nitrógeno orgánico
    const nMineralizado = nOrganico * (porcentajeMineralizacion / 100);
    const nMineralizadoKg = nMineralizado * 1000; // t -> kg
    const nDisponible = nMineralizadoKg * factorN.disponibilidad; // 30% disponibilidad

    // 7. Fósforo disponible (P2O5)
    const pElementalKg = (datos.fosforoPpm * pcaToneladas) / 1000;
    const p2o5Total = pElementalKg * factorP.factorConversion; // P elemental -> P2O5 (2.29)
    const pDisponible = p2o5Total * factorP.disponibilidad; // 20% disponibilidad

    // 8. Potasio disponible (K2O)
    const kElementalKg = (datos.potasioPpm * pcaToneladas) / 1000;
    const k2oTotal = kElementalKg * factorK.factorConversion; // K elemental -> K2O (1.205)
    const kDisponible = k2oTotal * factorK.disponibilidad; // 40% disponibilidad

    // 9. Magnesio disponible (MgO)
    const mg_ppm = datos.mgIntercambiable * CONSTANTES_QUIMICAS.EQ_MG * 10;
    const mg_total_kg = mg_ppm * (pcaToneladas / 1000);
    const mgo_total_kg = mg_total_kg * CONSTANTES_QUIMICAS.FACTOR_MG_A_MGO;
    const mgoDisponible = mgo_total_kg * 0.70; // 70% disponibilidad

    // 10. Azufre disponible (S)
    const tieneDatoAzufre = datos.s_ppm !== null && datos.s_ppm !== undefined;
    const sDisponible = tieneDatoAzufre ? (datos.s_ppm! * pcaToneladas) / 1000 : 0;

    // 11. Cálculos de Química de Suelo y CICE
    const sumaBases =
      datos.caIntercambiable +
      datos.mgIntercambiable +
      datos.kIntercambiable +
      datos.naIntercambiable;

    const cicEfectiva = sumaBases + datos.acidezIntercambiable;
    const porcentajeSatAcidez =
      cicEfectiva > 0 ? (datos.acidezIntercambiable / cicEfectiva) * 100 : 0;
    const porcentajeSatBases =
      cicEfectiva > 0 ? (sumaBases / cicEfectiva) * 100 : 0;

    // 12. Equilibrio Catiónico (Anexo 5)
    const equilibrioCationico = this.interpretarRelacionesCationicas(
      datos.caIntercambiable,
      datos.mgIntercambiable,
      datos.kIntercambiable,
    );

    // 13. Diagnóstico frente a Rangos Óptimos
    const alertasDiagnostico = this.diagnosticarPropiedadesQuimicas(
      datos.ph,
      datos.materiaOrganica,
      datos.ce,
      porcentajeSatAcidez,
      porcentajeSatBases,
      cicEfectiva,
    );

    // 14. Balance Nutricional (Interpolación según Meta en qq/ha)
    const balanceNutricional = this.calcularBalanceNutricional(
      datos.metaRendimiento,
      nDisponible,
      pDisponible,
      kDisponible,
      mgoDisponible,
      sDisponible,
      tieneDatoAzufre,
    );

    // 15. Diagnóstico de Micronutrientes (Anexo 10)
    const micronutrientes = this.interpretarMicronutrientes(
      datos.b_ppm,
      datos.cu_ppm,
      datos.zn_ppm,
      datos.mn_ppm,
      datos.fe_ppm,
      balanceNutricional,
    );

    // Combinar todas las alertas diagnósticas
    const alertas: AlertaDiagnostico[] = [
      ...alertasDiagnostico,
      ...equilibrioCationico.alertas,
      ...micronutrientes.alertas,
    ];

    // 16. Recomendación de Fertilización Comercial con ALGORITMO EN CASCADA
    const recomendacion_fertilizacion = this.calcularFertilizacionCascada(
      balanceNutricional.N.deficit,
      balanceNutricional.P2O5.deficit,
      balanceNutricional.K2O.deficit,
      balanceNutricional.MgO.deficit,
      balanceNutricional.S.deficit,
      eficiencias.N,
      eficiencias.P,
      eficiencias.K,
      datos.idFuenteN,
      datos.idFuenteP,
      datos.idFuenteK,
      datos.ph,
      plantasHa,
    );

    // 17. Enmienda Cálcica (Deduciendo aportes de CaO del Guano u orgánicos)
    const aporteExternoCaO = recomendacion_fertilizacion.acumulador_total.CaO_total_kg;
    const enmienda_calcica = this.calcularEnmiendaCalcio(
      datos.caIntercambiable,
      datos.mgIntercambiable,
      pcaToneladas,
      eficiencias.Ca_Enmienda,
      datos.idFuenteCa,
      aporteExternoCaO,
      plantasHa,
    );

    // 18. Cronograma de Aplicación Fraccionada (DOC 1 y DOC 2)
    const cronograma = this.generarCronograma(
      recomendacion_fertilizacion,
      enmienda_calcica,
      plantasHa,
    );

    return {
      pcaToneladas: Number(pcaToneladas.toFixed(3)),
      nitrogenoDisponibleKg: Number(nDisponible.toFixed(3)),
      fosforoDisponibleKg: Number(pDisponible.toFixed(3)),
      potasioDisponibleKg: Number(kDisponible.toFixed(3)),
      magnesioDisponibleKg: Number(mgoDisponible.toFixed(3)),
      azufreDisponibleKg: Number(sDisponible.toFixed(3)),
      sumaBases: Number(sumaBases.toFixed(3)),
      cicEfectiva: Number(cicEfectiva.toFixed(3)),
      porcentajeSatAcidez: Number(porcentajeSatAcidez.toFixed(3)),
      porcentajeSatBases: Number(porcentajeSatBases.toFixed(3)),
      equilibrioCationico,
      micronutrientes: micronutrientes.diagnostico,
      balanceNutricional,
      enmienda_calcica,
      recomendacion_fertilizacion,
      cronograma,
      alertas,
    };
  }

  /**
   * Interpretación de Relaciones Catiónicas (Ca/Mg, Ca/K, Mg/K, K/Mg)
   */
  private static interpretarRelacionesCationicas(
    ca: number,
    mg: number,
    k: number,
  ): EquilibrioCationico {
    const alertas: AlertaDiagnostico[] = [];

    const rel_ca_mg = mg > 0 ? ca / mg : 0;
    const rel_ca_k = k > 0 ? ca / k : 0;
    const rel_mg_k = k > 0 ? mg / k : 0;
    const rel_k_mg = mg > 0 ? k / mg : 0;

    const mapRel = new Map(RELACIONES_CATIONICAS.map((r) => [r.nombre, r]));
    const rangoCaMg = mapRel.get('Ca/Mg');
    const rangoCaK = mapRel.get('Ca/K');
    const rangoMgK = mapRel.get('Mg/K');
    const rangoKMg = mapRel.get('K/Mg');

    if (rangoCaMg) {
      if (rel_ca_mg < rangoCaMg.min) {
        alertas.push({
          parametro: 'Ca/Mg',
          mensaje: `Deficiencia relativa de Calcio (Ca/Mg: ${rel_ca_mg.toFixed(2)}). Ideal: ${rangoCaMg.min}-${rangoCaMg.max}`,
          severidad: 'alta',
        });
      } else if (rel_ca_mg > rangoCaMg.max) {
        alertas.push({
          parametro: 'Ca/Mg',
          mensaje: `Exceso relativo de Calcio (Ca/Mg: ${rel_ca_mg.toFixed(2)}). Ideal: ${rangoCaMg.min}-${rangoCaMg.max}`,
          severidad: 'media',
        });
      }
    }

    if (rangoMgK) {
      if (rel_mg_k > rangoMgK.max) {
        alertas.push({
          parametro: 'Mg/K',
          mensaje: `Deficiencia de Potasio inducida por exceso de Magnesio (Mg/K: ${rel_mg_k.toFixed(2)}). Ideal: ${rangoMgK.min}-${rangoMgK.max}`,
          severidad: 'alta',
        });
      } else if (rel_mg_k < rangoMgK.min) {
        alertas.push({
          parametro: 'Mg/K',
          mensaje: `Baja relación Mg/K (${rel_mg_k.toFixed(2)}). Ideal: ${rangoMgK.min}-${rangoMgK.max}`,
          severidad: 'baja',
        });
      }
    }

    if (rangoCaK) {
      if (rel_ca_k < rangoCaK.min || rel_ca_k > rangoCaK.max) {
        alertas.push({
          parametro: 'Ca/K',
          mensaje: `Desequilibrio Calcio/Potasio (Ca/K: ${rel_ca_k.toFixed(2)}). Ideal: ${rangoCaK.min}-${rangoCaK.max}`,
          severidad: 'media',
        });
      }
    }

    if (rangoKMg) {
      if (rel_k_mg < rangoKMg.min || rel_k_mg > rangoKMg.max) {
        alertas.push({
          parametro: 'K/Mg',
          mensaje: `Desequilibrio K/Mg (${rel_k_mg.toFixed(2)}). Ideal: ${rangoKMg.min}-${rangoKMg.max}`,
          severidad: 'baja',
        });
      }
    }

    return {
      ca_mg: Number(rel_ca_mg.toFixed(3)),
      ca_k: Number(rel_ca_k.toFixed(3)),
      mg_k: Number(rel_mg_k.toFixed(3)),
      k_mg: Number(rel_k_mg.toFixed(3)),
      alertas,
    };
  }

  /**
   * Diagnóstico de Parámetros Químicos frente a Rangos Ideales
   */
  private static diagnosticarPropiedadesQuimicas(
    ph: number,
    mo: number,
    ce: number,
    satAcidez: number,
    satBases: number,
    cicEfectiva: number,
  ): AlertaDiagnostico[] {
    const alertas: AlertaDiagnostico[] = [];
    const map = new Map(RANGOS_IDEALES.map((r) => [r.parametro, r]));

    const rPH = map.get('PH');
    if (rPH) {
      if (ph < (rPH.valorMin || 4.5)) {
        alertas.push({
          parametro: 'pH',
          mensaje: `Suelo fuertemente ácido (pH: ${ph}). Ideal: ${rPH.valorMin}-${rPH.valorMax}`,
          severidad: 'alta',
        });
      } else if (rPH.valorMax && ph > rPH.valorMax) {
        alertas.push({
          parametro: 'pH',
          mensaje: `Suelo alcalino para café (pH: ${ph}). Ideal: ${rPH.valorMin}-${rPH.valorMax}`,
          severidad: 'media',
        });
      }
    }

    const rMO = map.get('MATERIA_ORGANICA');
    if (rMO && rMO.valorMin && mo < rMO.valorMin) {
      alertas.push({
        parametro: 'Materia Orgánica',
        mensaje: `Bajo contenido de materia orgánica (${mo}%). Ideal: > ${rMO.valorMin}%`,
        severidad: 'media',
      });
    }

    const rSatAcidez = map.get('SAT_ACIDEZ');
    if (rSatAcidez && rSatAcidez.valorMax && satAcidez > rSatAcidez.valorMax) {
      alertas.push({
        parametro: 'Saturación de Acidez',
        mensaje: `Riesgo de toxicidad por Aluminio (${satAcidez.toFixed(1)}%). Ideal: < ${rSatAcidez.valorMax}%`,
        severidad: 'alta',
      });
    }

    const rSatBases = map.get('SAT_BASES');
    if (rSatBases) {
      if (rSatBases.valorMin && satBases < rSatBases.valorMin) {
        alertas.push({
          parametro: 'Saturación de Bases',
          mensaje: `Baja saturación de bases (${satBases.toFixed(1)}%). Ideal: ${rSatBases.valorMin}-${rSatBases.valorMax}%`,
          severidad: 'media',
        });
      } else if (rSatBases.valorMax && satBases > rSatBases.valorMax) {
        alertas.push({
          parametro: 'Saturación de Bases',
          mensaje: `Alta saturación de bases (${satBases.toFixed(1)}%). Ideal: ${rSatBases.valorMin}-${rSatBases.valorMax}%`,
          severidad: 'baja',
        });
      }
    }

    const rCE = map.get('CONDUCTIVIDAD_ELECTRICA');
    if (rCE && rCE.valorMax && ce > rCE.valorMax) {
      alertas.push({
        parametro: 'Conductividad Eléctrica',
        mensaje: `Problema de salinidad (${ce} dS/m). Ideal: < ${rCE.valorMax} dS/m`,
        severidad: 'alta',
      });
    }

    const rCIC = map.get('CIC_EFECTIVA');
    if (rCIC && rCIC.valorMin && cicEfectiva < rCIC.valorMin) {
      alertas.push({
        parametro: 'CIC Efectiva',
        mensaje: `Baja Capacidad de Intercambio Catiónico (${cicEfectiva.toFixed(1)} meq/100g). Ideal: > ${rCIC.valorMin}`,
        severidad: 'media',
      });
    }

    return alertas;
  }

  /**
   * Balance Nutricional: Interpolación Lineal Continua entre vecinos reales
   */
  private static calcularBalanceNutricional(
    metaRendimiento: number,
    nDisponible: number,
    pDisponible: number,
    kDisponible: number,
    mgoDisponible: number,
    sDisponible: number,
    tieneDatoAzufre: boolean,
  ): BalanceNutricional {
    const list = [...REQUERIMIENTOS_CULTIVO_CAFE].sort((a, b) => a.metaQuintales - b.metaQuintales);

    let reqMin = list[0];
    let reqMax = list[list.length - 1];

    for (let i = 0; i < list.length; i++) {
      const r = list[i];
      if (r.metaQuintales === metaRendimiento) {
        reqMin = r;
        reqMax = r;
        break;
      }
      if (r.metaQuintales <= metaRendimiento) {
        reqMin = r;
      }
      if (r.metaQuintales >= metaRendimiento && reqMax.metaQuintales > r.metaQuintales) {
        reqMax = r;
      }
    }

    let nReq: number;
    let p2o5Req: number;
    let k2oReq: number;
    let mgoReq: number;
    let sReq: number;
    let bReq: number;
    let cuReq: number;
    let znReq: number;
    let mnReq: number;
    let feReq: number;

    if (reqMin.metaQuintales === reqMax.metaQuintales) {
      nReq = reqMin.n;
      p2o5Req = reqMin.p2o5;
      k2oReq = reqMin.k2o;
      mgoReq = reqMin.mgo;
      sReq = reqMin.s;
      bReq = reqMin.b;
      cuReq = reqMin.cu;
      znReq = reqMin.zn;
      mnReq = reqMin.mn;
      feReq = reqMin.fe;
    } else {
      const factor = (metaRendimiento - reqMin.metaQuintales) / (reqMax.metaQuintales - reqMin.metaQuintales);
      nReq = reqMin.n + (reqMax.n - reqMin.n) * factor;
      p2o5Req = reqMin.p2o5 + (reqMax.p2o5 - reqMin.p2o5) * factor;
      k2oReq = reqMin.k2o + (reqMax.k2o - reqMin.k2o) * factor;
      mgoReq = reqMin.mgo + (reqMax.mgo - reqMin.mgo) * factor;
      sReq = reqMin.s + (reqMax.s - reqMin.s) * factor;
      bReq = reqMin.b + (reqMax.b - reqMin.b) * factor;
      cuReq = reqMin.cu + (reqMax.cu - reqMin.cu) * factor;
      znReq = reqMin.zn + (reqMax.zn - reqMin.zn) * factor;
      mnReq = reqMin.mn + (reqMax.mn - reqMin.mn) * factor;
      feReq = reqMin.fe + (reqMax.fe - reqMin.fe) * factor;
    }

    const deficitN = Math.max(0, nReq - nDisponible);
    const deficitP2O5 = Math.max(0, p2o5Req - pDisponible);
    const deficitK2O = Math.max(0, k2oReq - kDisponible);
    const deficitMgO = Math.max(0, mgoReq - mgoDisponible);
    const deficitS = tieneDatoAzufre ? Math.max(0, sReq - sDisponible) : 0;

    return {
      metaQuintales: metaRendimiento,
      N: {
        requerido: Number(nReq.toFixed(3)),
        suministroSuelo: Number(nDisponible.toFixed(3)),
        deficit: Number(deficitN.toFixed(3)),
      },
      P2O5: {
        requerido: Number(p2o5Req.toFixed(3)),
        suministroSuelo: Number(pDisponible.toFixed(3)),
        deficit: Number(deficitP2O5.toFixed(3)),
      },
      K2O: {
        requerido: Number(k2oReq.toFixed(3)),
        suministroSuelo: Number(kDisponible.toFixed(3)),
        deficit: Number(deficitK2O.toFixed(3)),
      },
      MgO: {
        requerido: Number(mgoReq.toFixed(3)),
        suministroSuelo: Number(mgoDisponible.toFixed(3)),
        deficit: Number(deficitMgO.toFixed(3)),
      },
      S: {
        requerido: Number(sReq.toFixed(3)),
        suministroSuelo: Number(sDisponible.toFixed(3)),
        deficit: Number(deficitS.toFixed(3)),
      },
      micronutrientes: {
        B: Number(bReq.toFixed(3)),
        Cu: Number(cuReq.toFixed(3)),
        Zn: Number(znReq.toFixed(3)),
        Mn: Number(mnReq.toFixed(3)),
        Fe: Number(feReq.toFixed(3)),
      },
    };
  }

  /**
   * Interpretación de Micronutrientes
   */
  private static interpretarMicronutrientes(
    b_ppm?: number,
    cu_ppm?: number,
    zn_ppm?: number,
    mn_ppm?: number,
    fe_ppm?: number,
    balance?: BalanceNutricional,
  ) {
    const alertas: AlertaDiagnostico[] = [];
    const diagnostico: Record<string, any> = {};

    const productosMicros: Record<string, { key: string; nombre: string; formula: string }> = {
      Zn: { key: 'Zn', nombre: 'Sulfato de Zinc (ZnSO4)', formula: 'Sulfato de Zinc' },
      B: { key: 'B', nombre: 'Ulexita o Boro comercial', formula: 'Ulexita' },
      Cu: { key: 'Cu', nombre: 'Sulfato de Cobre (CuSO4)', formula: 'Sulfato de Cobre' },
      Mn: { key: 'Mn', nombre: 'Sulfato de Manganeso (MnSO4)', formula: 'Sulfato de Manganeso' },
      Fe: { key: 'Fe', nombre: 'Sulfato Ferroso (FeSO4) o quelato', formula: 'Sulfato Ferroso' },
    };

    const evaluar = (elem: 'B' | 'Cu' | 'Zn' | 'Mn' | 'Fe', valor?: number, nombre = '') => {
      if (valor === undefined || valor === null) return;
      const nivelMedio = NIVELES_CRITICOS_MICRO.find((n) => n.elemento === elem && n.nivel === 'Medio');
      if (!nivelMedio) return;

      const conf = productosMicros[elem];
      let estado = 'SUFICIENTE';
      let recomendacion = 'Nivel adecuado';

      if (valor < nivelMedio.min) {
        estado = 'DEFICIENTE';
        const dosis = (balance?.micronutrientes as any)?.[conf.key];
        recomendacion = dosis ? `Aplicar ${dosis.toFixed(2)} kg de ${conf.nombre}` : `Aplicar ${conf.formula}`;
        alertas.push({
          parametro: nombre,
          mensaje: `Deficiencia de ${nombre} (${valor} ppm). Nivel crítico: > ${nivelMedio.min} ppm. ${recomendacion}`,
          severidad: 'alta',
        });
      }

      diagnostico[elem] = {
        valor: Number(valor.toFixed(2)),
        diagnostico: estado,
        recomendacion,
      };
    };

    evaluar('Zn', zn_ppm, 'Zinc');
    evaluar('B', b_ppm, 'Boro');
    evaluar('Cu', cu_ppm, 'Cobre');
    evaluar('Mn', mn_ppm, 'Manganeso');
    evaluar('Fe', fe_ppm, 'Hierro');

    return { diagnostico, alertas };
  }

  /**
   * 🔥 ALGORITMO EN CASCADA CON RASTREO MULTIELEMENTAL COMPLETO
   */
  private static calcularFertilizacionCascada(
    deficitN: number,
    deficitP2O5: number,
    deficitK2O: number,
    deficitMgO: number,
    deficitS: number,
    effN: number,
    effP: number,
    effK: number,
    idFuenteN?: number,
    idFuenteP?: number,
    idFuenteK?: number,
    ph?: number,
    plantasHa: number = CONSTANTES_QUIMICAS.DENSIDAD_PLANTAS_DEFAULT,
  ): RecomendacionFertilizacion {
    const acumulado: AcumuladorNutrientes = {
      N_total_kg: 0,
      P2O5_total_kg: 0,
      K2O_total_kg: 0,
      CaO_total_kg: 0,
      MgO_total_kg: 0,
      S_total_kg: 0,
      Zn_total_kg: 0,
      B_total_kg: 0,
      Cu_total_kg: 0,
      Mn_total_kg: 0,
      Fe_total_kg: 0,
    };

    // Selección de fuentes por ID o Defaults
    const fuenteN = FUENTES_FERTILIZANTES.find((f) => f.id === (idFuenteN || 3)) || FUENTES_FERTILIZANTES[2]; // Urea (ID 3)
    const fuenteP = FUENTES_FERTILIZANTES.find((f) => f.id === (idFuenteP || 5)) || FUENTES_FERTILIZANTES[4]; // SFT (ID 5)
    const fuenteK = FUENTES_FERTILIZANTES.find((f) => f.id === (idFuenteK || 6)) || FUENTES_FERTILIZANTES[5]; // KCl (ID 6)

    // ============================================
    // PASO 1: PRIORIDAD FÓSFORO (P)
    // ============================================
    const dosisPuraP = deficitP2O5 > 0 ? deficitP2O5 / effP : 0;
    let cantComercial_P = 0;
    let aporteN_del_P = 0;
    let aporteK_del_P = 0;

    if (dosisPuraP > 0 && fuenteP.porc_p2o5 > 0) {
      cantComercial_P = dosisPuraP / (fuenteP.porc_p2o5 / 100);
      aporteN_del_P = cantComercial_P * (fuenteP.porc_n / 100);
      aporteK_del_P = cantComercial_P * (fuenteP.porc_k2o / 100);
      this.registrarAporte(acumulado, cantComercial_P, fuenteP);
    }

    // ============================================
    // PASO 2: PRIORIDAD POTASIO (K)
    // ============================================
    const deficitK_Neto = Math.max(0, deficitK2O - acumulado.K2O_total_kg);
    const dosisPuraK = deficitK_Neto > 0 ? deficitK_Neto / effK : 0;
    let cantComercial_K = 0;
    let aporteN_del_K = 0;

    if (dosisPuraK > 0 && fuenteK.porc_k2o > 0) {
      cantComercial_K = dosisPuraK / (fuenteK.porc_k2o / 100);
      aporteN_del_K = cantComercial_K * (fuenteK.porc_n / 100);
      this.registrarAporte(acumulado, cantComercial_K, fuenteK);
    }

    // ============================================
    // PASO 3: PRIORIDAD NITRÓGENO (N)
    // ============================================
    const deficitN_Teorico = deficitN > 0 ? deficitN / effN : 0;
    const deficitN_Neto = Math.max(0, deficitN_Teorico - acumulado.N_total_kg);
    let cantComercial_N = 0;

    if (deficitN_Neto > 0 && fuenteN.porc_n > 0) {
      cantComercial_N = deficitN_Neto / (fuenteN.porc_n / 100);
      this.registrarAporte(acumulado, cantComercial_N, fuenteN);
    }

    // ============================================
    // PASO 4: MAGNESIO (MgO)
    // ============================================
    const deficitMg_Neto = Math.max(0, deficitMgO - acumulado.MgO_total_kg);
    let cantComercial_Mg = 0;
    let productoMg = 'No requerido';

    if (deficitMg_Neto > 0) {
      const fuenteMg = ph && ph < 5.5
        ? FUENTES_FERTILIZANTES.find((f) => f.nombre === 'Dolomita')
        : FUENTES_FERTILIZANTES.find((f) => f.nombre === 'Sulpomag') || FUENTES_FERTILIZANTES.find((f) => f.nombre === 'Dolomita');

      if (fuenteMg && fuenteMg.porc_mgo > 0) {
        cantComercial_Mg = deficitMg_Neto / (fuenteMg.porc_mgo / 100);
        productoMg = fuenteMg.nombre;
        this.registrarAporte(acumulado, cantComercial_Mg, fuenteMg);
      }
    }

    // ============================================
    // PASO 5: AZUFRE (S)
    // ============================================
    const deficitS_Neto = Math.max(0, deficitS - acumulado.S_total_kg);
    let cantComercial_S = 0;
    let productoS = 'No requerido';

    if (deficitS_Neto > 0) {
      const fuenteS = FUENTES_FERTILIZANTES.find((f) => f.nombre === 'Sulfato de Amonio') || FUENTES_FERTILIZANTES[0];
      if (fuenteS && fuenteS.porc_s > 0) {
        cantComercial_S = deficitS_Neto / (fuenteS.porc_s / 100);
        productoS = fuenteS.nombre;
        this.registrarAporte(acumulado, cantComercial_S, fuenteS);
      }
    }

    const calcGramosPlanta = (kgHa: number) => Number(((kgHa / plantasHa) * 1000).toFixed(2));

    return {
      Nitrogeno: {
        producto: fuenteN.nombre,
        deficit_original: Number(deficitN.toFixed(2)),
        deficit_teorico_con_eficiencia: Number(deficitN_Teorico.toFixed(2)),
        aportado_por_otros: Number(acumulado.N_total_kg.toFixed(2)),
        deficit_neto: Number(deficitN_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitN_Neto.toFixed(2)),
        eficiencia_usada: `${effN * 100}%`,
        cantidad_kg_ha: Number(cantComercial_N.toFixed(2)),
        cantidad_sacos_50kg: Number((cantComercial_N / 50).toFixed(2)),
        gramos_por_planta: calcGramosPlanta(cantComercial_N),
      },
      Fosforo: {
        producto: fuenteP.nombre,
        deficit_original: Number(deficitP2O5.toFixed(2)),
        dosis_pura_requerida: Number(dosisPuraP.toFixed(2)),
        eficiencia_usada: `${effP * 100}%`,
        cantidad_kg_ha: Number(cantComercial_P.toFixed(2)),
        cantidad_sacos_50kg: Number((cantComercial_P / 50).toFixed(2)),
        gramos_por_planta: calcGramosPlanta(cantComercial_P),
        riqueza_n: `${fuenteP.porc_n}%`,
        aporta_nitrogeno: Number(aporteN_del_P.toFixed(2)),
        aporta_potasio: Number(aporteK_del_P.toFixed(2)),
      },
      Potasio: {
        producto: fuenteK.nombre,
        deficit_original: Number(deficitK2O.toFixed(2)),
        aportado_por_fosforo: Number((deficitK2O - deficitK_Neto).toFixed(2)),
        deficit_neto: Number(deficitK_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitK_Neto.toFixed(2)),
        eficiencia_usada: `${effK * 100}%`,
        cantidad_kg_ha: Number(cantComercial_K.toFixed(2)),
        cantidad_sacos_50kg: Number((cantComercial_K / 50).toFixed(2)),
        gramos_por_planta: calcGramosPlanta(cantComercial_K),
        riqueza_n: `${fuenteK.porc_n}%`,
        aporta_nitrogeno: Number(aporteN_del_K.toFixed(2)),
      },
      Magnesio: {
        producto: productoMg,
        deficit_original: Number(deficitMgO.toFixed(2)),
        aportado_por_otros: Number((deficitMgO - deficitMg_Neto).toFixed(2)),
        deficit_neto: Number(deficitMg_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitMg_Neto.toFixed(2)),
        cantidad_kg_ha: Number(cantComercial_Mg.toFixed(2)),
        cantidad_sacos_50kg: Number((cantComercial_Mg / 50).toFixed(2)),
        gramos_por_planta: calcGramosPlanta(cantComercial_Mg),
        criterio: ph && ph < 5.5 ? 'pH ácido - Dolomita' : 'pH adecuado - Sulfato/Sulpomag',
      },
      Azufre: {
        producto: productoS,
        deficit_original: Number(deficitS.toFixed(2)),
        aportado_por_otros: Number((deficitS - deficitS_Neto).toFixed(2)),
        deficit_neto: Number(deficitS_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitS_Neto.toFixed(2)),
        cantidad_kg_ha: Number(cantComercial_S.toFixed(2)),
        cantidad_sacos_50kg: Number((cantComercial_S / 50).toFixed(2)),
        gramos_por_planta: calcGramosPlanta(cantComercial_S),
      },
      acumulador_total: {
        N_total_kg: Number(acumulado.N_total_kg.toFixed(2)),
        P2O5_total_kg: Number(acumulado.P2O5_total_kg.toFixed(2)),
        K2O_total_kg: Number(acumulado.K2O_total_kg.toFixed(2)),
        CaO_total_kg: Number(acumulado.CaO_total_kg.toFixed(2)),
        MgO_total_kg: Number(acumulado.MgO_total_kg.toFixed(2)),
        S_total_kg: Number(acumulado.S_total_kg.toFixed(2)),
        Zn_total_kg: Number(acumulado.Zn_total_kg.toFixed(2)),
        B_total_kg: Number(acumulado.B_total_kg.toFixed(2)),
        Cu_total_kg: Number(acumulado.Cu_total_kg.toFixed(2)),
        Mn_total_kg: Number(acumulado.Mn_total_kg.toFixed(2)),
        Fe_total_kg: Number(acumulado.Fe_total_kg.toFixed(2)),
      },
    };
  }

  /**
   * Enmienda Cálcica (Págs 7-8 DOC 1): Condición Ca/Mg < 5.0
   * Aplica regla del 10% de área efectiva y descuenta CaO de abonos orgánicos
   */
  private static calcularEnmiendaCalcio(
    ca_meq: number,
    mg_meq: number,
    pcaToneladas: number,
    effCa: number,
    idFuenteCa?: number,
    aporteExternoCaO: number = 0,
    plantasHa: number = CONSTANTES_QUIMICAS.DENSIDAD_PLANTAS_DEFAULT,
  ): EnmiendaCalcica {
    const relacion_ca_mg = mg_meq > 0 ? ca_meq / mg_meq : 0;

    if (relacion_ca_mg >= 5.0) {
      return {
        requiere_enmienda: false,
        relacion_ca_mg: Number(relacion_ca_mg.toFixed(2)),
        mensaje: 'Relación Ca/Mg equilibrada (≥ 5.0). No requiere enmienda cálcica.',
      };
    }

    const ca_ideal_meq = mg_meq * 5.0;
    const deficit_ca_meq = ca_ideal_meq - ca_meq;

    // meq/100g -> ppm -> kg Ca -> kg CaO
    const deficit_ca_ppm = deficit_ca_meq * CONSTANTES_QUIMICAS.EQ_CA * 10;
    const deficit_ca_kg = deficit_ca_ppm * (pcaToneladas / 1000);
    const deficit_cao_kg = deficit_ca_kg * 1.4; // Ca elemental a CaO
    const kg_cao_area_efectiva = deficit_cao_kg * 0.1; // 10% área localizada
    const kg_cao_requerido_total = kg_cao_area_efectiva / effCa; // Eficiencia 70%
    const kg_cao_neto = Math.max(0, kg_cao_requerido_total - aporteExternoCaO);

    let res: EnmiendaCalcica = {
      requiere_enmienda: true,
      relacion_ca_mg: Number(relacion_ca_mg.toFixed(2)),
      ca_actual_meq: Number(ca_meq.toFixed(2)),
      ca_ideal_meq: Number(ca_ideal_meq.toFixed(2)),
      deficit_ca_meq: Number(deficit_ca_meq.toFixed(2)),
      kg_cao_requerido_total: Number(kg_cao_requerido_total.toFixed(2)),
      aporte_externo_cao: Number(aporteExternoCaO.toFixed(2)),
      kg_cao_neto: Number(kg_cao_neto.toFixed(2)),
      kg_cao_requerido: Number(kg_cao_neto.toFixed(2)),
      eficiencia_usada: `${effCa * 100}%`,
    };

    if (kg_cao_neto > 0 && idFuenteCa) {
      const fuenteCa = FUENTES_FERTILIZANTES.find((f) => f.id === idFuenteCa);
      if (fuenteCa && fuenteCa.porc_cao > 0) {
        const kg_comercial = kg_cao_neto / (fuenteCa.porc_cao / 100);
        res = {
          ...res,
          producto: fuenteCa.nombre,
          riqueza_cao: `${fuenteCa.porc_cao}%`,
          kg_comercial_ha: Number(kg_comercial.toFixed(2)),
          sacos_50kg: Number((kg_comercial / 50).toFixed(2)),
          gramos_por_planta: Number(((kg_comercial / plantasHa) * 1000).toFixed(2)),
        };
      }
    } else if (kg_cao_neto === 0) {
      res = {
        ...res,
        requiere_enmienda: false,
        mensaje: 'Demanda de CaO completamente cubierta por fuentes orgánicas (ej. Guano de Isla).',
      };
    }

    return res;
  }

  /**
   * Fraccionamiento y Cronograma de Aplicación (3 Etapas Fenológicas)
   */
  private static generarCronograma(
    recomendacion: RecomendacionFertilizacion,
    enmienda: EnmiendaCalcica,
    plantasHa: number,
  ): EtapaCronograma[] {
    const etapas: EtapaCronograma[] = [];
    const calcGramos = (kg: number) => Number(((kg / plantasHa) * 1000).toFixed(2));

    let aporteN_Basal = 0;
    if (recomendacion.Fosforo?.aporta_nitrogeno) {
      aporteN_Basal += recomendacion.Fosforo.aporta_nitrogeno;
    }
    if (recomendacion.Potasio?.aporta_nitrogeno) {
      aporteN_Basal += recomendacion.Potasio.aporta_nitrogeno;
    }

    const datosN = recomendacion.Nitrogeno;
    const riquezaUrea = 0.45;
    const dosisTeoricaUreaTotal = (datosN.deficit_teorico_con_eficiencia || 0) / riquezaUrea;
    const cuotaFull = dosisTeoricaUreaTotal / 3;
    const ahorroUreaKg = aporteN_Basal / riquezaUrea;

    const urea_Etapa1 = Math.max(0, cuotaFull - ahorroUreaKg);
    const urea_Etapa2 = cuotaFull;
    const urea_Etapa3 = cuotaFull;

    // ETAPA 1: FLORACIÓN (Mes 1-2)
    const items1: any[] = [];
    if (urea_Etapa1 > 0) {
      items1.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa1.toFixed(2)),
        sacos: Number((urea_Etapa1 / 50).toFixed(2)),
        gramos_planta: calcGramos(urea_Etapa1),
      });
    }
    if (recomendacion.Fosforo && recomendacion.Fosforo.cantidad_kg_ha > 0) {
      items1.push({
        producto: recomendacion.Fosforo.producto,
        dosis_kg: recomendacion.Fosforo.cantidad_kg_ha,
        sacos: recomendacion.Fosforo.cantidad_sacos_50kg,
        gramos_planta: calcGramos(recomendacion.Fosforo.cantidad_kg_ha),
      });
    }
    if (recomendacion.Potasio && recomendacion.Potasio.cantidad_kg_ha > 0) {
      items1.push({
        producto: recomendacion.Potasio.producto,
        dosis_kg: recomendacion.Potasio.cantidad_kg_ha,
        sacos: recomendacion.Potasio.cantidad_sacos_50kg,
        gramos_planta: calcGramos(recomendacion.Potasio.cantidad_kg_ha),
      });
    }
    if (recomendacion.Magnesio && recomendacion.Magnesio.cantidad_kg_ha > 0) {
      items1.push({
        producto: recomendacion.Magnesio.producto,
        dosis_kg: recomendacion.Magnesio.cantidad_kg_ha,
        sacos: recomendacion.Magnesio.cantidad_sacos_50kg,
        gramos_planta: calcGramos(recomendacion.Magnesio.cantidad_kg_ha),
      });
    }
    if (enmienda && enmienda.requiere_enmienda && enmienda.kg_comercial_ha) {
      items1.push({
        producto: enmienda.producto || 'Enmienda Cálcica',
        dosis_kg: enmienda.kg_comercial_ha,
        sacos: enmienda.sacos_50kg || Number((enmienda.kg_comercial_ha / 50).toFixed(2)),
        gramos_planta: calcGramos(enmienda.kg_comercial_ha),
      });
    }
    etapas.push({ etapa: 'Inicio de Floración (1er abonamiento)', momento: 'Mes 1 - 2', aplicaciones: items1 });

    // ETAPA 2: LLENADO DE GRANO (Mes 4-5)
    const items2: any[] = [];
    if (urea_Etapa2 > 0) {
      items2.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa2.toFixed(2)),
        sacos: Number((urea_Etapa2 / 50).toFixed(2)),
        gramos_planta: calcGramos(urea_Etapa2),
      });
    }
    etapas.push({ etapa: 'Llenado de Grano (2do abonamiento)', momento: 'Mes 4 - 5', aplicaciones: items2 });

    // ETAPA 3: MADURACIÓN (Mes 7-8)
    const items3: any[] = [];
    if (urea_Etapa3 > 0) {
      items3.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa3.toFixed(2)),
        sacos: Number((urea_Etapa3 / 50).toFixed(2)),
        gramos_planta: calcGramos(urea_Etapa3),
      });
    }
    etapas.push({ etapa: 'Inicio de Maduración (3er abonamiento)', momento: 'Mes 7 - 8', aplicaciones: items3 });

    return etapas;
  }

  /**
   * Helper: acumula nutrientes de cada producto aplicado en cascada
   */
  private static registrarAporte(
    acumulado: AcumuladorNutrientes,
    cantidad: number,
    fuente: FuenteFertilizante,
  ): void {
    if (!fuente || cantidad <= 0) return;

    acumulado.N_total_kg += cantidad * (fuente.porc_n / 100);
    acumulado.P2O5_total_kg += cantidad * (fuente.porc_p2o5 / 100);
    acumulado.K2O_total_kg += cantidad * (fuente.porc_k2o / 100);

    // Solo fuentes orgánicas o enmiendas corrigen acidez con CaO
    if (fuente.clasificacion === 'ORGANICO' || fuente.clasificacion === 'ENMIENDA') {
      acumulado.CaO_total_kg += cantidad * (fuente.porc_cao / 100);
    }

    acumulado.MgO_total_kg += cantidad * (fuente.porc_mgo / 100);
    acumulado.S_total_kg += cantidad * (fuente.porc_s / 100);
    acumulado.Zn_total_kg += cantidad * (fuente.porc_zn / 100);
    acumulado.B_total_kg += cantidad * (fuente.porc_b / 100);
    acumulado.Cu_total_kg += cantidad * (fuente.porc_cu / 100);
    acumulado.Mn_total_kg += cantidad * (fuente.porc_mn / 100);
    acumulado.Fe_total_kg += cantidad * (fuente.porc_fe / 100);
  }

  // ============================================
  // MÉTODOS DE CONSULTA DE CATÁLOGOS CON FILTROS AGRONÓMICOS
  // ============================================

  public static getTexturas() {
    return TEXTURAS_SUELO;
  }

  public static getZonas() {
    return TASAS_MINERALIZACION;
  }

  public static getFertilizantesNitrogeno() {
    return FUENTES_FERTILIZANTES.filter((f) => f.porc_n > 9).sort((a, b) => b.porc_n - a.porc_n);
  }

  public static getFertilizantesFosforo() {
    return FUENTES_FERTILIZANTES.filter((f) => f.porc_p2o5 > 5).sort((a, b) => b.porc_p2o5 - a.porc_p2o5);
  }

  public static getFertilizantesPotasio() {
    return FUENTES_FERTILIZANTES.filter((f) => f.porc_k2o > 15).sort((a, b) => b.porc_k2o - a.porc_k2o);
  }

  public static getEnmiendas() {
    return FUENTES_FERTILIZANTES.filter((f) => f.clasificacion === 'ENMIENDA' || f.porc_cao > 20).sort(
      (a, b) => b.porc_cao - a.porc_cao,
    );
  }

  public static getTodosFertilizantes() {
    return FUENTES_FERTILIZANTES;
  }
}
