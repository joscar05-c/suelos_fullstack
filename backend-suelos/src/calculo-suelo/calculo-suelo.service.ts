import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';
import { RangoIdeal } from './entities/rango-ideal.entity';
import { RelacionCationica } from './entities/relacion-cationica.entity';
import { NivelCriticoMicro } from './entities/nivel-critico-micro.entity';
import { RequerimientoCultivo } from './entities/requerimiento-cultivo.entity';
import { FuenteFertilizante } from './entities/fuente-fertilizante.entity';
import { EficienciaNutriente } from './entities/eficiencia-nutriente.entity';
import { DatosEntradaDto } from './dto/datos-entrada.dto';
import {
  ResultadoCalculoDto,
  AlertaDiagnostico,
} from './dto/resultado-calculo.dto';

@Injectable()
export class CalculoSueloService {
  constructor(
    @InjectRepository(TexturaSuelo)
    private readonly texturaSueloRepository: Repository<TexturaSuelo>,
    @InjectRepository(TasaMineralizacion)
    private readonly tasaMineralizacionRepository: Repository<TasaMineralizacion>,
    @InjectRepository(FactorNutriente)
    private readonly factorNutrienteRepository: Repository<FactorNutriente>,
    @InjectRepository(RangoIdeal)
    private readonly rangoIdealRepository: Repository<RangoIdeal>,
    @InjectRepository(RelacionCationica)
    private readonly relacionCationicaRepository: Repository<RelacionCationica>,
    @InjectRepository(NivelCriticoMicro)
    private readonly nivelCriticoMicroRepository: Repository<NivelCriticoMicro>,
    @InjectRepository(RequerimientoCultivo)
    private readonly requerimientoCultivoRepository: Repository<RequerimientoCultivo>,
    @InjectRepository(FuenteFertilizante)
    private readonly fuenteFertilizanteRepository: Repository<FuenteFertilizante>,
    @InjectRepository(EficienciaNutriente)
    private readonly eficienciaNutrienteRepository: Repository<EficienciaNutriente>,
  ) {}

  async calcularNutrientes(
    datos: DatosEntradaDto,
  ): Promise<ResultadoCalculoDto> {
    // ============================================
    // A. OBTENER VARIABLES DINÁMICAS (EFICIENCIAS DE BD)
    // ============================================
    const eficiencias = await this.cargarEficiencias();
    const effN = eficiencias.N;
    const effP = eficiencias.P;
    const effK = eficiencias.K;
    const effCa = eficiencias.Ca_Enmienda;

    // ============================================
    // B. CONSTANTES QUÍMICAS (PESOS EQUIVALENTES)
    // ============================================
    // Estas constantes se usan para convertir meq/100g → ppm → kg/ha
    const EQ_CA = 20.04;  // Peso equivalente del Calcio (g/eq)
    const EQ_MG = 12.15;  // Peso equivalente del Magnesio (g/eq)
    const EQ_K = 39.10;   // Peso equivalente del Potasio (g/eq)
    const EQ_NA = 23.00;  // Peso equivalente del Sodio (g/eq)
    const EQ_AL = 9.00;   // Peso equivalente del Aluminio (g/eq) - Aproximado

    // buscar densidad aparente según idTextura
    const textura = await this.texturaSueloRepository.findOne({
      where: { id: datos.idTextura },
    });

    if (!textura) {
      throw new NotFoundException(
        `Textura de suelo con ID ${datos.idTextura} no encontrada`,
      );
    }

    // buscar tasa de mineralización según idZona
    const tasa = await this.tasaMineralizacionRepository.findOne({
      where: { id: datos.idZona },
    });

    if (!tasa) {
      throw new NotFoundException(
        `Tasa de mineralización con ID ${datos.idZona} no encontrada`,
      );
    }

    // Buscar factores de nutrientes (N, P, K)
    const factorN = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'N' },
    });
    const factorP = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'P' },
    });
    const factorK = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'K' },
    });

    if (!factorN || !factorP || !factorK) {
      throw new BadRequestException(
        'Factores de nutrientes no encontrados en la base de datos',
      );
    }

    // constantes
    const densidad = Number(textura.densidadAparente);
    const porcentajeMineralizacion = Number(tasa.porcentaje);
    const factorDisponibilidadN = Number(factorN.disponibilidad);
    const factorDisponibilidadP = Number(factorP.disponibilidad);
    const factorDisponibilidadK = Number(factorK.disponibilidad);
    const factorConversionP = Number(factorP.factorConversion);
    const factorConversionK = Number(factorK.factorConversion);

    // calculo PCA
    const areaM2 = datos.areaHa * 10000;
    const pcaToneladas = areaM2 * densidad * datos.profundidadMetros;

    //calculo de N
    const moTotal = pcaToneladas * (datos.materiaOrganica / 100);
    const nOrganico = moTotal * 0.05;
    const nMineralizado = nOrganico * (porcentajeMineralizacion / 100);
    const nMineralizadoKg = nMineralizado * 1000; // convertir toneladas a kg
    const nDisponible = nMineralizadoKg * factorDisponibilidadN;

    // calculo P
    const pElementalKg = (datos.fosforoPpm * pcaToneladas) / 1000;
    const p2o5Total = pElementalKg * factorConversionP;
    const pDisponible = p2o5Total * factorDisponibilidadP;

    // ============================================
    // CÁLCULO DE POTASIO (K2O)
    // ============================================
    // Conversión: ppm → kg/ha → K2O
    // NOTA: Este valor viene de 'potasioPpm' (análisis Mehlich), NO de kIntercambiable
    // kIntercambiable (meq/100g) se usa solo para cálculos de equilibrio catiónico
    const kElementalKg = (datos.potasioPpm * pcaToneladas) / 1000; // ppm * (Ton/1000) = kg/ha
    const k2oTotal = kElementalKg * factorConversionK; // K elemental → K2O (Factor ~1.2046)
    const kDisponible = k2oTotal * factorDisponibilidadK; // Aplicar disponibilidad (ej: 70%)

    // ============================================
    // CÁLCULO DE MAGNESIO (MgO) - NUTRIENTE SECUNDARIO
    // ============================================
    // Conversión CORRECTA: meq/100g → kg MgO/ha
    // Paso 1: Convertir meq/100g a ppm (mg/kg)
    const mg_ppm = datos.mgIntercambiable * EQ_MG * 10; // meq/100g * PesoEq * 10 = ppm
    
    // Paso 2: Convertir ppm a kg/ha usando PCA
    const mg_total_kg = mg_ppm * (pcaToneladas / 1000); // ppm * (Ton/1000) = kg/ha
    
    // Paso 3: Convertir Mg elemental a MgO (Factor 1.658 = 40.3/24.31)
    const mgo_total_kg = mg_total_kg * 1.658;
    
    // Paso 4: Aplicar disponibilidad/eficiencia (70%)
    const mgoDisponible = mgo_total_kg * 0.70;

    // ============================================
    // CÁLCULO DE AZUFRE (S) - NUTRIENTE SECUNDARIO
    // ============================================
    // Fórmula: S_Disponible = s_ppm * (PCA / 1000)
    // IMPORTANTE: Solo calcular si el usuario ingresó un valor (no null/undefined)
    // Si el dato no existe, asumimos que no se midió y NO calculamos déficit
    const sDisponible = (datos.s_ppm !== null && datos.s_ppm !== undefined) 
      ? (datos.s_ppm * pcaToneladas) / 1000 
      : 0;

    // ============================================
    // CÁLCULOS QUÍMICOS (CIC, Saturaciones)
    // ============================================

    // 1. Suma de Bases = Ca + Mg + K + Na (meq/100g)
    const sumaBases =
      datos.caIntercambiable +
      datos.mgIntercambiable +
      datos.kIntercambiable +
      datos.naIntercambiable;

    // 2. CIC Efectiva = Suma de Bases + Acidez Intercambiable
    const cicEfectiva = sumaBases + datos.acidezIntercambiable;

    // 3. % Saturación de Acidez
    const porcentajeSatAcidez =
      cicEfectiva > 0 ? (datos.acidezIntercambiable / cicEfectiva) * 100 : 0;

    // 4. % Saturación de Bases
    const porcentajeSatBases =
      cicEfectiva > 0 ? (sumaBases / cicEfectiva) * 100 : 0;

    // ============================================
    // EQUILIBRIO CATIÓNICO (Página 7 del PDF)
    // ============================================
    const equilibrioCationico = await this.interpretarRelaciones(
      datos.caIntercambiable,
      datos.mgIntercambiable,
      datos.kIntercambiable,
    );

    // ============================================
    // DIAGNÓSTICO (Comparación con Rangos Ideales)
    // ============================================
    const alertasDiagnostico = await this.diagnosticar(
      datos.ph,
      datos.materiaOrganica,
      datos.ce,
      porcentajeSatAcidez,
      porcentajeSatBases,
      cicEfectiva,
    );

    // ============================================
    // BALANCE NUTRICIONAL (Página 9 PDF)
    // ============================================
    const tieneDatoAzufre = datos.s_ppm !== null && datos.s_ppm !== undefined;
    const balanceNutricional = await this.calcularBalance(
      datos.metaRendimiento,
      nDisponible,
      pDisponible,
      kDisponible,
      mgoDisponible,
      sDisponible,
      tieneDatoAzufre, // Indicador para controlar cálculo de déficit S
    );

    // ============================================
    // MICRONUTRIENTES (Página 8 del PDF)
    // ============================================
    // NOTA: Se ejecuta DESPUÉS de calcularBalance para acceder a requerimientos dinámicos
    const micronutrientes = await this.interpretarMicronutrientes(
      datos.b_ppm,
      datos.cu_ppm,
      datos.zn_ppm,
      datos.mn_ppm,
      datos.fe_ppm,
      balanceNutricional, // Requerimientos dinámicos interpolados
    );

    // Combinar alertas de diagnóstico general + alertas de equilibrio catiónico + micronutrientes
    const alertas = [
      ...alertasDiagnostico,
      ...equilibrioCationico.alertas,
      ...micronutrientes.alertas,
    ];

    // ============================================
    // C. RECOMENDACIÓN DE FERTILIZACIÓN COMERCIAL EN CASCADA (Págs 12-13 PDF)
    // ============================================
    // IMPORTANTE: Ejecutar ANTES de calcular enmienda para acumular CaO del Guano
    const recomendacion_fertilizacion = await this.calcularFertilizacionCascada(
      balanceNutricional.N.deficit,
      balanceNutricional.P2O5.deficit,
      balanceNutricional.K2O.deficit,
      balanceNutricional.MgO.deficit,
      balanceNutricional.S.deficit,
      effN,
      effP,
      effK,
      datos.idFuenteN,
      datos.idFuenteP,
      datos.idFuenteK,
      datos.ph,
    );

    // ============================================
    // B. CALCULAR ENMIENDA CÁLCICA (Págs 7-8 PDF)
    // ============================================
    // IMPORTANTE: Ejecutar DESPUÉS de cascada para descontar CaO del Guano
    const aporteExternoCaO = recomendacion_fertilizacion.acumulador_total.CaO_total_kg;
    const enmienda_calcica = await this.calcularEnmiendaCalcio(
      datos.caIntercambiable,
      datos.mgIntercambiable,
      pcaToneladas,
      effCa,
      datos.idFuenteCa,
      aporteExternoCaO, // NUEVO: Descuenta CaO del Guano
    );

    // ============================================
    // D. GENERAR CRONOGRAMA DE APLICACIÓN (Pág 11 PDF)
    // ============================================
    const cronograma = this.generarCronograma(
      recomendacion_fertilizacion,
      enmienda_calcica,
    );

    // Retornar resultado completo con 3 decimales
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
      equilibrioCationico: {
        ca_mg: equilibrioCationico.ca_mg,
        ca_k: equilibrioCationico.ca_k,
        mg_k: equilibrioCationico.mg_k,
        k_mg: equilibrioCationico.k_mg,
        alertas: equilibrioCationico.alertas,
      },
      micronutrientes: micronutrientes.diagnostico,
      balanceNutricional,
      enmienda_calcica,
      recomendacion_fertilizacion,
      cronograma,
      alertas,
    };
  }

  /**
   * A. CARGAR EFICIENCIAS DESDE LA BASE DE DATOS (Anexo 7)
   */
  private async cargarEficiencias(): Promise<{
    N: number;
    P: number;
    K: number;
    Ca_Enmienda: number;
  }> {
    const eficiencias = await this.eficienciaNutrienteRepository.find();
    const eficienciasMap = new Map(
      eficiencias.map((e) => [e.elemento, Number(e.valor)]),
    );

    return {
      N: eficienciasMap.get('N') || 0.6,
      P: eficienciasMap.get('P') || 0.25,
      K: eficienciasMap.get('K') || 0.7,
      Ca_Enmienda: eficienciasMap.get('Ca_Enmienda') || 0.7,
    };
  }

  /**
   * B. CALCULAR ENMIENDA CÁLCICA (Lógica Págs 7-8 PDF)
   * Condición: Si (Ca/Mg) < 5.0 → Aplicar Cal Agrícola
   * 
   * NUEVO: Descuenta CaO aportado por fertilizantes orgánicos (Guano, Gallinaza, etc.)
   * 
   * @param ca_meq - Calcio intercambiable en meq/100g
   * @param mg_meq - Magnesio intercambiable en meq/100g
   * @param pcaToneladas - Peso de la capa arable en toneladas
   * @param effCa - Eficiencia de la enmienda cálcica (70% por defecto)
   * @param idFuenteCa - ID del producto de enmienda (Cal Agrícola, etc.)
   * @param aporteExternoCaO - CaO ya aportado por fertilizantes orgánicos (kg/ha)
   */
  private async calcularEnmiendaCalcio(
    ca_meq: number,
    mg_meq: number,
    pcaToneladas: number,
    effCa: number,
    idFuenteCa?: number,
    aporteExternoCaO: number = 0, 
  ) {
    const relacion_ca_mg = mg_meq > 0 ? ca_meq / mg_meq : 0;

    // Condición: Solo aplicar enmienda si Ca/Mg < 5.0
    if (relacion_ca_mg >= 5.0) {
      return {
        requiere_enmienda: false,
        relacion_ca_mg: Number(relacion_ca_mg.toFixed(2)),
        mensaje: 'Relación Ca/Mg adecuada. No requiere enmienda cálcica.',
      };
    }

    // Cálculo del déficit de Calcio
    const ca_ideal_meq = mg_meq * 5.0;
    const deficit_ca_meq = ca_ideal_meq - ca_meq;

    // ============================================
    // CONVERSIÓN CORRECTA: meq/100g → kg CaO/ha
    // ============================================
    // Paso 1: Convertir meq/100g a ppm (mg/kg)
    const EQ_CA = 20.04; // Peso equivalente del Calcio
    const deficit_ca_ppm = deficit_ca_meq * EQ_CA * 10; // meq/100g * PesoEq * 10 = ppm
    
    // Paso 2: Convertir ppm a kg/ha usando PCA
    const deficit_ca_kg = deficit_ca_ppm * (pcaToneladas / 1000); // ppm * (Ton/1000) = kg/ha
    
    // Paso 3: Convertir Ca elemental a CaO (Factor 1.4 = 40/28.09)
    const deficit_cao_kg = deficit_ca_kg * 1.4;
    
    // Paso 4: Aplicar regla del 10% (área efectiva - Pág 8)
    const kg_cao_area_efectiva = deficit_cao_kg * 0.1;

    // Aplicar eficiencia de la enmienda (70% - Anexo 7)
    let kg_cao_requerido_total = kg_cao_area_efectiva / effCa;

    // ============================================
    // NUEVO: DESCONTAR APORTE EXTERNO DE CaO (GUANO, ETC.)
    // ============================================
    // Si fertilizantes orgánicos (Guano) ya aportaron CaO, restarlo del requerimiento
    const kg_cao_neto = Math.max(0, kg_cao_requerido_total - aporteExternoCaO);

    // Calcular cantidad comercial (si se proporciona fuente)
    let resultado: any = {
      requiere_enmienda: true,
      relacion_ca_mg: Number(relacion_ca_mg.toFixed(2)),
      ca_actual_meq: Number(ca_meq.toFixed(2)),
      ca_ideal_meq: Number(ca_ideal_meq.toFixed(2)),
      deficit_ca_meq: Number(deficit_ca_meq.toFixed(2)),
      kg_cao_requerido_total: Number(kg_cao_requerido_total.toFixed(2)), // NUEVO: Antes del descuento
      aporte_externo_cao: Number(aporteExternoCaO.toFixed(2)), // NUEVO: CaO del Guano
      kg_cao_neto: Number(kg_cao_neto.toFixed(2)), // NUEVO: Después del descuento
      eficiencia_usada: `${effCa * 100}%`,
    };

    // Solo calcular producto comercial si hay déficit neto > 0
    if (kg_cao_neto > 0 && idFuenteCa) {
      const fuenteCa = await this.fuenteFertilizanteRepository.findOne({
        where: { id: idFuenteCa },
      });

      if (fuenteCa && Number(fuenteCa.porc_cao) > 0) {
        const riqueza_cao = Number(fuenteCa.porc_cao);
        const kg_comercial = kg_cao_neto / (riqueza_cao / 100);
        const sacos_50kg = kg_comercial / 50;

        resultado = {
          ...resultado,
          producto: fuenteCa.nombre,
          riqueza_cao: `${riqueza_cao}%`,
          kg_comercial_ha: Number(kg_comercial.toFixed(2)),
          sacos_50kg: Number(sacos_50kg.toFixed(2)),
        };
      }
    } else if (kg_cao_neto === 0) {
      // CASO ESPECIAL: Guano cubrió todo el requerimiento
      resultado = {
        ...resultado,
        requiere_enmienda: false,
        mensaje: `Requerimiento de CaO cubierto por fertilizantes orgánicos. No requiere enmienda adicional.`,
      };
    }

    return resultado;
  }

  /**
   * Método privado para diagnosticar el suelo comparando con rangos ideales
   */
  private async diagnosticar(
    ph: number,
    materiaOrganica: number,
    ce: number,
    satAcidez: number,
    satBases: number,
    cicEfectiva: number,
  ): Promise<AlertaDiagnostico[]> {
    const alertas: AlertaDiagnostico[] = [];

    // Obtener rangos ideales de la BD
    const rangos = await this.rangoIdealRepository.find();
    const rangosMap = new Map(rangos.map((r) => [r.parametro, r]));

    // 1. Diagnóstico de pH
    const rangoPH = rangosMap.get('PH');
    if (rangoPH) {
      if (ph < rangoPH.valorMin) {
        alertas.push({
          parametro: 'pH',
          mensaje: `Suelo fuertemente ácido (pH: ${ph}). Ideal: ${rangoPH.valorMin}-${rangoPH.valorMax}`,
          severidad: 'alta',
        });
      } else if (ph > rangoPH.valorMax) {
        alertas.push({
          parametro: 'pH',
          mensaje: `Suelo alcalino (pH: ${ph}). Ideal: ${rangoPH.valorMin}-${rangoPH.valorMax}`,
          severidad: 'media',
        });
      }
    }

    // 2. Diagnóstico de Materia Orgánica
    const rangoMO = rangosMap.get('MATERIA_ORGANICA');
    if (rangoMO && materiaOrganica < rangoMO.valorMin) {
      alertas.push({
        parametro: 'Materia Orgánica',
        mensaje: `Bajo contenido de materia orgánica (${materiaOrganica}%). Ideal: > ${rangoMO.valorMin}%`,
        severidad: 'media',
      });
    }

    // 3. Diagnóstico de Saturación de Acidez (Toxicidad por Aluminio)
    const rangoSatAcidez = rangosMap.get('SAT_ACIDEZ');
    if (rangoSatAcidez && satAcidez > rangoSatAcidez.valorMax) {
      alertas.push({
        parametro: 'Saturación de Acidez',
        mensaje: `Posible toxicidad por aluminio (${satAcidez.toFixed(1)}%). Ideal: < ${rangoSatAcidez.valorMax}%`,
        severidad: 'alta',
      });
    }

    // 4. Diagnóstico de Saturación de Bases
    const rangoSatBases = rangosMap.get('SAT_BASES');
    if (rangoSatBases) {
      if (satBases < rangoSatBases.valorMin) {
        alertas.push({
          parametro: 'Saturación de Bases',
          mensaje: `Baja saturación de bases (${satBases.toFixed(1)}%). Ideal: ${rangoSatBases.valorMin}-${rangoSatBases.valorMax}%`,
          severidad: 'media',
        });
      } else if (satBases > rangoSatBases.valorMax) {
        alertas.push({
          parametro: 'Saturación de Bases',
          mensaje: `Alta saturación de bases (${satBases.toFixed(1)}%). Ideal: ${rangoSatBases.valorMin}-${rangoSatBases.valorMax}%`,
          severidad: 'baja',
        });
      }
    }

    // 5. Diagnóstico de Conductividad Eléctrica (Salinidad)
    const rangoCE = rangosMap.get('CONDUCTIVIDAD_ELECTRICA');
    if (rangoCE && ce > rangoCE.valorMax) {
      alertas.push({
        parametro: 'Conductividad Eléctrica',
        mensaje: `Problema de salinidad (${ce} dS/m). Ideal: < ${rangoCE.valorMax} dS/m`,
        severidad: 'alta',
      });
    }

    // 6. Diagnóstico de CIC Efectiva
    const rangoCIC = rangosMap.get('CIC_EFECTIVA');
    if (rangoCIC && cicEfectiva < rangoCIC.valorMin) {
      alertas.push({
        parametro: 'CIC Efectiva',
        mensaje: `Baja capacidad de intercambio catiónico (${cicEfectiva.toFixed(1)} meq/100g). Ideal: > ${rangoCIC.valorMin} meq/100g`,
        severidad: 'media',
      });
    }

    return alertas;
  }

  /**
   * Método privado para interpretar relaciones catiónicas (Página 7 del PDF)
   * Evalúa el equilibrio entre Calcio, Magnesio y Potasio
   */
  private async interpretarRelaciones(
    ca: number,
    mg: number,
    k: number,
  ): Promise<{
    ca_mg: number;
    ca_k: number;
    mg_k: number;
    k_mg: number;
    alertas: AlertaDiagnostico[];
  }> {
    const alertas: AlertaDiagnostico[] = [];

    // ============================================
    // PASO A: Cálculos Matemáticos (Manejo de división por cero)
    // ============================================

    const rel_ca_mg = mg > 0 ? ca / mg : 0;
    const rel_ca_k = k > 0 ? ca / k : 0;
    const rel_mg_k = k > 0 ? mg / k : 0;
    const rel_k_mg = mg > 0 ? k / mg : 0;

    // ============================================
    // PASO B: Consultar Base de Datos
    // ============================================

    const relacionesBD = await this.relacionCationicaRepository.find();
    const relacionesMap = new Map(
      relacionesBD.map((r) => [r.nombre, r]),
    );

    const rangoCaMg = relacionesMap.get('Ca/Mg');
    const rangoCaK = relacionesMap.get('Ca/K');
    const rangoMgK = relacionesMap.get('Mg/K');
    const rangoKMg = relacionesMap.get('K/Mg');

    // ============================================
    // PASO C: Evaluación y Diagnóstico (Reglas del PDF Pág 7)
    // ============================================

    // 1. Diagnóstico Ca/Mg
    if (rangoCaMg) {
      if (rel_ca_mg < rangoCaMg.min) {
        alertas.push({
          parametro: 'Ca/Mg',
          mensaje: `Deficiencia de Calcio relativa (Baja relación Ca/Mg: ${rel_ca_mg.toFixed(2)}). Ideal: ${rangoCaMg.min}-${rangoCaMg.max}`,
          severidad: 'alta',
        });
      } else if (rel_ca_mg > rangoCaMg.max) {
        alertas.push({
          parametro: 'Ca/Mg',
          mensaje: `Exceso de Calcio relativo (Alta relación Ca/Mg: ${rel_ca_mg.toFixed(2)}). Ideal: ${rangoCaMg.min}-${rangoCaMg.max}`,
          severidad: 'media',
        });
      }
    }

    // 2. Diagnóstico Mg/K
    if (rangoMgK) {
      if (rel_mg_k > rangoMgK.max) {
        alertas.push({
          parametro: 'Mg/K',
          mensaje: `Posible deficiencia de Potasio inducida por exceso de Magnesio (Mg/K: ${rel_mg_k.toFixed(2)}). Ideal: ${rangoMgK.min}-${rangoMgK.max}`,
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

    // 3. Diagnóstico Ca/K
    if (rangoCaK) {
      if (rel_ca_k < rangoCaK.min || rel_ca_k > rangoCaK.max) {
        alertas.push({
          parametro: 'Ca/K',
          mensaje: `Desequilibrio entre Calcio y Potasio (Ca/K: ${rel_ca_k.toFixed(2)}). Ideal: ${rangoCaK.min}-${rangoCaK.max}`,
          severidad: 'media',
        });
      }
    }

    // 4. Diagnóstico K/Mg (Opcional - Relación inversa)
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
   * Método privado para interpretar micronutrientes (Página 8 del PDF)
   * Evalúa los niveles de Boro, Cobre, Zinc, Manganeso y Hierro
   */
  private async interpretarMicronutrientes(
    b_ppm?: number,
    cu_ppm?: number,
    zn_ppm?: number,
    mn_ppm?: number,
    fe_ppm?: number,
    balanceNutricional?: any, // Requerimientos interpolados dinámicamente
  ): Promise<{
    diagnostico: Record<string, any>;
    alertas: AlertaDiagnostico[];
  }> {
    const alertas: AlertaDiagnostico[] = [];
    const diagnostico: Record<string, any> = {};

    // ============================================
    // PASO A: Consultar Base de Datos
    // ============================================
    const nivelesBD = await this.nivelCriticoMicroRepository.find();

    // Agrupar por elemento para facilitar búsqueda
    const nivelesPorElemento = new Map<string, NivelCriticoMicro[]>();
    nivelesBD.forEach((nivel) => {
      if (!nivelesPorElemento.has(nivel.elemento)) {
        nivelesPorElemento.set(nivel.elemento, []);
      }
      nivelesPorElemento.get(nivel.elemento)!.push(nivel);
    });

    // ============================================
    // PASO B: Evaluar cada micronutriente
    // ============================================

    // Función auxiliar para evaluar un micronutriente
    const evaluar = (
      elemento: string,
      valor: number | undefined,
      nombreCompleto: string,
      formulaFertilizante: string,
    ) => {
      if (valor === undefined || valor === null) {
        return; // No evaluar si no se proporciona el valor
      }

      const niveles = nivelesPorElemento.get(elemento);
      if (!niveles || niveles.length === 0) {
        return; // No hay datos de referencia
      }

      // Buscar nivel 'Medio' para determinar el umbral
      const nivelMedio = niveles.find((n) => n.nivel === 'Medio');

      if (!nivelMedio) {
        return; // No hay datos de nivel medio
      }

      let estado: string;
      let recomendacion: string;
      let severidad: 'baja' | 'media' | 'alta' = 'baja';

      // ============================================
      // MAPEO DE PRODUCTOS Y DOSIS DINÁMICAS
      // ============================================
      const productosMicros: Record<string, { key: string; nombre: string }> = {
        'Zn': { key: 'Zn', nombre: 'ZnSO4 (Sulfato de Zinc)' },
        'B':  { key: 'B',  nombre: 'Ulexita o Boro comercial' },
        'Cu': { key: 'Cu', nombre: 'Sulfato de Cobre (CuSO4)' },
        'Mn': { key: 'Mn', nombre: 'Sulfato de Manganeso (MnSO4)' },
        'Fe': { key: 'Fe', nombre: 'Sulfato Ferroso (FeSO4) o quelato de hierro' },
      };

      // Lógica de Negocio: Si valor < min del rango Medio → DEFICIENTE
      if (valor < nivelMedio.min) {
        estado = 'DEFICIENTE';
        severidad = 'alta';

        // Recomendación DINÁMICA según requerimiento interpolado
        const config = productosMicros[elemento];
        if (config && balanceNutricional?.micronutrientes?.[config.key]) {
          const dosis = balanceNutricional.micronutrientes[config.key] || 0;
          recomendacion = `Aplicar ${dosis.toFixed(2)} kg de ${config.nombre}`;
        } else {
          // Fallback si no hay datos de balance
          recomendacion = `Aplicar ${formulaFertilizante}`;
        }

        // Agregar alerta
        alertas.push({
          parametro: nombreCompleto,
          mensaje: `Deficiencia de ${nombreCompleto} (${valor} ppm). Nivel crítico: > ${nivelMedio.min} ppm. ${recomendacion}`,
          severidad,
        });
      } else {
        estado = 'SUFICIENTE';
        recomendacion = 'Nivel adecuado';
      }

      // Agregar al diagnóstico
      diagnostico[elemento] = {
        valor: Number(valor.toFixed(2)),
        diagnostico: estado,
        recomendacion,
      };
    };

    // Evaluar cada micronutriente
    evaluar('Zn', zn_ppm, 'Zinc', 'Sulfato de Zinc');
    evaluar('B', b_ppm, 'Boro', 'Ulexita o Boro comercial');
    evaluar('Cu', cu_ppm, 'Cobre', 'Sulfato de Cobre');
    evaluar('Mn', mn_ppm, 'Manganeso', 'Sulfato de Manganeso');
    evaluar('Fe', fe_ppm, 'Hierro', 'Sulfato Ferroso o quelato');

    return {
      diagnostico,
      alertas,
    };
  }

  /**
   * ============================================
   * MÉTODO: calcularBalance
   * ============================================
   * Calcula el balance nutricional: Requerido - Suministro del Suelo = Déficit
   * Si el déficit es negativo, el suelo tiene suficiente nutriente (déficit = 0)
   * 
   * ALGORITMO: Interpolación Lineal Verdadera con Búsqueda de Vecinos
   * 
   * 1. Obtiene TODOS los requerimientos de la BD ordenados por metaQuintales ASC
   * 2. Busca vecinos reales:
   *    - reqMin: Mayor registro con meta <= metaRendimiento
   *    - reqMax: Menor registro con meta >= metaRendimiento
   * 3. Manejo de casos:
   *    - Meta exacta (ej: 30 qq): Devuelve valores exactos sin interpolar
   *    - Meta intermedia (ej: 25 qq): Interpola entre vecinos (20 y 30)
   *    - Meta menor al mínimo: Usa el primer registro
   *    - Meta mayor al máximo: Extrapola usando el último tramo
   * 4. Fórmula de interpolación:
   *    factor = (metaUsuario - metaMin) / (metaMax - metaMin)
   *    valor = valorMin + (valorMax - valorMin) * factor
   * 
   * CORRECCIÓN DEL BUG:
   * - ANTES: Usaba solo 20 qq como base → 30 qq calculaba 2.25 (1.5 * 1.5)
   * - AHORA: Lee valor real de 30 qq en BD → Devuelve 1.8 o 2.1 (según BD)
   * 
   * @example
   * // Ejemplo de interpolación:
   * // BD: 20 qq → Zn: 1.5 kg | 30 qq → Zn: 1.8 kg
   * // Usuario pide 25 qq:
   * // factor = (25 - 20) / (30 - 20) = 0.5
   * // znRequerido = 1.5 + (1.8 - 1.5) * 0.5 = 1.65 kg ✅
   */
  private async calcularBalance(
    metaRendimiento: number,
    nitrogenoDisponible: number,
    fosforoDisponible: number,
    potasioDisponible: number,
    magnesioDisponible: number,
    azufreDisponible: number,
    tieneDatoAzufre: boolean = false, // Indica si el usuario proporcionó s_ppm
  ) {
    // ============================================
    // 1. BUSCAR TODOS LOS REQUERIMIENTOS (ORDENADOS)
    // ============================================
    const todosRequerimientos = await this.requerimientoCultivoRepository.find({
      order: { metaQuintales: 'ASC' },
    });

    if (!todosRequerimientos || todosRequerimientos.length === 0) {
      throw new NotFoundException('No se encontraron requerimientos en la base de datos');
    }

    // ============================================
    // 2. BUSCAR VECINOS PARA INTERPOLACIÓN
    // ============================================
    // Algoritmo de búsqueda de vecinos:
    // - reqMin: Mayor registro con meta <= metaRendimiento
    // - reqMax: Menor registro con meta >= metaRendimiento

    let reqMin = todosRequerimientos[0]; // Inicializar con el primero
    let reqMax = todosRequerimientos[todosRequerimientos.length - 1]; // Inicializar con el último

    // Buscar vecinos exactos
    for (let i = 0; i < todosRequerimientos.length; i++) {
      const req = todosRequerimientos[i];
      
      // Si encontramos la meta exacta, ambos vecinos son el mismo
      if (req.metaQuintales === metaRendimiento) {
        reqMin = req;
        reqMax = req;
        break;
      }
      
      // Actualizar reqMin (mayor que sea <= meta)
      if (req.metaQuintales <= metaRendimiento) {
        reqMin = req;
      }
      
      // Actualizar reqMax (menor que sea >= meta)
      if (req.metaQuintales >= metaRendimiento && reqMax.metaQuintales > req.metaQuintales) {
        reqMax = req;
      }
    }

    // ============================================
    // 3. INTERPOLAR REQUERIMIENTOS (O USAR VALORES EXACTOS)
    // ============================================
    let nRequerido: number;
    let p2o5Requerido: number;
    let k2oRequerido: number;
    let mgoRequerido: number;
    let sRequerido: number;
    let bRequerido: number;
    let cuRequerido: number;
    let znRequerido: number;
    let mnRequerido: number;
    let feRequerido: number;

    if (reqMin.metaQuintales === reqMax.metaQuintales) {
      // ============================================
      // CASO 1: Meta exacta (no interpolar)
      // ============================================
      // Ejemplo: Usuario pide 30 qq y existe registro para 30 qq
      nRequerido = Number(reqMin.n);
      p2o5Requerido = Number(reqMin.p2o5);
      k2oRequerido = Number(reqMin.k2o);
      mgoRequerido = Number(reqMin.mgo);
      sRequerido = Number(reqMin.s || 0);
      bRequerido = Number(reqMin.b || 0);
      cuRequerido = Number(reqMin.cu || 0);
      znRequerido = Number(reqMin.zn || 0);
      mnRequerido = Number(reqMin.mn || 0);
      feRequerido = Number(reqMin.fe || 0);
    } else {
      // ============================================
      // CASO 2: Interpolación lineal entre vecinos
      // ============================================
      // Fórmula: valor = min + (max - min) * factor
      // factor = (metaUsuario - metaMin) / (metaMax - metaMin)
      
      const factor = (metaRendimiento - reqMin.metaQuintales) / (reqMax.metaQuintales - reqMin.metaQuintales);

      // MACRONUTRIENTES Y SECUNDARIOS
      nRequerido = Number(reqMin.n) + (Number(reqMax.n) - Number(reqMin.n)) * factor;
      p2o5Requerido = Number(reqMin.p2o5) + (Number(reqMax.p2o5) - Number(reqMin.p2o5)) * factor;
      k2oRequerido = Number(reqMin.k2o) + (Number(reqMax.k2o) - Number(reqMin.k2o)) * factor;
      mgoRequerido = Number(reqMin.mgo) + (Number(reqMax.mgo) - Number(reqMin.mgo)) * factor;
      sRequerido = Number(reqMin.s || 0) + (Number(reqMax.s || 0) - Number(reqMin.s || 0)) * factor;

      // MICRONUTRIENTES (Interpolación verdadera entre vecinos reales)
      bRequerido = Number(reqMin.b || 0) + (Number(reqMax.b || 0) - Number(reqMin.b || 0)) * factor;
      cuRequerido = Number(reqMin.cu || 0) + (Number(reqMax.cu || 0) - Number(reqMin.cu || 0)) * factor;
      znRequerido = Number(reqMin.zn || 0) + (Number(reqMax.zn || 0) - Number(reqMin.zn || 0)) * factor;
      mnRequerido = Number(reqMin.mn || 0) + (Number(reqMax.mn || 0) - Number(reqMin.mn || 0)) * factor;
      feRequerido = Number(reqMin.fe || 0) + (Number(reqMax.fe || 0) - Number(reqMin.fe || 0)) * factor;
    }

    // ============================================
    // 4. CALCULAR DÉFICITS
    // ============================================
    let deficitN = nRequerido - nitrogenoDisponible;
    let deficitP2O5 = p2o5Requerido - fosforoDisponible;
    let deficitK2O = k2oRequerido - potasioDisponible;
    let deficitMgO = mgoRequerido - magnesioDisponible;
    
    // AZUFRE: Solo calcular déficit si el usuario proporcionó el dato s_ppm
    // Si no lo ingresó, asumimos que no se requiere fertilización con S
    let deficitS = 0;
    if (tieneDatoAzufre) {
      deficitS = sRequerido - azufreDisponible;
      if (deficitS < 0) deficitS = 0;
    }

    // Si el déficit es negativo, significa que el suelo tiene suficiente
    // En este caso, el déficit a reponer es 0
    if (deficitN < 0) deficitN = 0;
    if (deficitP2O5 < 0) deficitP2O5 = 0;
    if (deficitK2O < 0) deficitK2O = 0;
    if (deficitMgO < 0) deficitMgO = 0;

    return {
      metaQuintales: metaRendimiento,
      N: {
        requerido: Number(nRequerido.toFixed(3)),
        suministroSuelo: Number(nitrogenoDisponible.toFixed(3)),
        deficit: Number(deficitN.toFixed(3)),
      },
      P2O5: {
        requerido: Number(p2o5Requerido.toFixed(3)),
        suministroSuelo: Number(fosforoDisponible.toFixed(3)),
        deficit: Number(deficitP2O5.toFixed(3)),
      },
      K2O: {
        requerido: Number(k2oRequerido.toFixed(3)),
        suministroSuelo: Number(potasioDisponible.toFixed(3)),
        deficit: Number(deficitK2O.toFixed(3)),
      },
      MgO: {
        requerido: Number(mgoRequerido.toFixed(3)),
        suministroSuelo: Number(magnesioDisponible.toFixed(3)),
        deficit: Number(deficitMgO.toFixed(3)),
      },
      S: {
        requerido: Number(sRequerido.toFixed(3)),
        suministroSuelo: Number(azufreDisponible.toFixed(3)),
        deficit: Number(deficitS.toFixed(3)),
      },
      // ============================================
      // MICRONUTRIENTES (Requerimientos dinámicos)
      // ============================================
      micronutrientes: {
        B: Number(bRequerido.toFixed(3)),   // Boro
        Cu: Number(cuRequerido.toFixed(3)), // Cobre
        Zn: Number(znRequerido.toFixed(3)), // Zinc
        Mn: Number(mnRequerido.toFixed(3)), // Manganeso
        Fe: Number(feRequerido.toFixed(3)), // Hierro
      },
    };
  }

  /**

   */
  private async calcularFertilizacionCascada(
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
  ) {
    // ============================================
    // ACUMULADOR DE NUTRIENTES (PATRÓN UNIVERSAL)
    // ============================================
    // Este objeto rastreará TODOS los nutrientes aportados por fertilizantes
    // aplicados en etapas previas de la cascada.
    // 
    // ORDEN DE APLICACIÓN:
    // 1. Fósforo (P) → aporta N, K, Ca, S, etc.
    // 2. Potasio (K) → aporta N, Mg, S, etc.
    // 3. Nitrógeno (N) → aporta S, Ca, etc.
    // 4. Secundarios (Ca, Mg, S) → descontados si ya fueron aportados
    // 5. Micronutrientes (Zn, B, Cu, Mn, Fe) → descontados si fueron aportados
    const acumulado = {
      // Macronutrientes Primarios
      N: 0,           // Nitrógeno total aportado (kg/ha)
      P2O5: 0,        // Fósforo total aportado (kg/ha)
      K2O: 0,         // Potasio total aportado (kg/ha)
      
      // Macronutrientes Secundarios
      CaO: 0,         // Calcio total aportado (kg/ha)
      MgO: 0,         // Magnesio total aportado (kg/ha)
      S: 0,           // Azufre total aportado (kg/ha)
      
      // Micronutrientes
      Zn: 0,          // Zinc total aportado (kg/ha)
      B: 0,           // Boro total aportado (kg/ha)
      Cu: 0,          // Cobre total aportado (kg/ha)
      Mn: 0,          // Manganeso total aportado (kg/ha)
      Fe: 0,          // Hierro total aportado (kg/ha)
      
      // Otros elementos (escalabilidad futura)
      Mo: 0,          // Molibdeno
      Cl: 0,          // Cloro
      Na: 0,          // Sodio
    };

    // ============================================
    // BUSCAR FUENTES DE FERTILIZANTES (Defaults del Anexo 9)
    // ============================================
    
    // Default: Urea (ID = 1)
    let fuenteN = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteN || 1 },
    });
    if (!fuenteN) {
      fuenteN = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Urea' },
      });
    }

    // Default: Superfosfato Triple (ID = 2)
    let fuenteP = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteP || 2 },
    });
    if (!fuenteP) {
      fuenteP = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Superfosfato Triple (SFT)' },
      });
    }

    // Default: Cloruro de Potasio (ID = 4)
    let fuenteK = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteK || 4 },
    });
    if (!fuenteK) {
      fuenteK = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Cloruro de Potasio (KCl)' },
      });
    }

    if (!fuenteN || !fuenteP || !fuenteK) {
      throw new NotFoundException(
        'No se encontraron las fuentes de fertilizantes en la base de datos',
      );
    }

    // Convertir porcentajes de string a number
    const porcN_fuenteN = Number(fuenteN.porc_n);
    const porcN_fuenteP = Number(fuenteP.porc_n);
    const porcN_fuenteK = Number(fuenteK.porc_n);
    const porcP_fuenteP = Number(fuenteP.porc_p2o5);
    const porcK_fuenteP = Number(fuenteP.porc_k2o);
    const porcK_fuenteK = Number(fuenteK.porc_k2o);

    // ============================================
    // CASCADA UNIVERSAL CON ACUMULADOR
    // ============================================
    // ARQUITECTURA: Cada paso calcula déficit NETO considerando aportes previos
    // ORDEN: P → K → N (macros primarios según PDF)
    // VENTAJA: Si P aporta K, se descuenta automáticamente del déficit de K
    //          Si K aporta N, se descuenta automáticamente del déficit de N
    //          Funciona con CUALQUIER fertilizante compuesto (DAP, Sulpomag, etc.)

    // ============================================
    // PASO 1: CALCULAR Y APLICAR FÓSFORO (P)
    // ============================================
    let dosisPuraP = deficitP2O5 > 0 ? deficitP2O5 / effP : 0;
    let cantComercial_P = 0;
    let aporteN_del_P = 0;
    let aporteK_del_P = 0;

    if (dosisPuraP > 0) {
      if (porcP_fuenteP === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteP.nombre} no contiene Fósforo`,
        );
      }
      cantComercial_P = dosisPuraP / (porcP_fuenteP / 100);
      
      // CALCULAR APORTES SECUNDARIOS EXPLÍCITAMENTE (para cronograma)
      aporteN_del_P = cantComercial_P * (Number(fuenteP.porc_n || 0) / 100);
      aporteK_del_P = cantComercial_P * (Number(fuenteP.porc_k2o || 0) / 100);
      
      // REGISTRAR APORTES: P + todos sus nutrientes secundarios
      this.registrarAporte(acumulado, cantComercial_P, fuenteP);
    }

    // ============================================
    // PASO 2: CALCULAR Y APLICAR POTASIO (K)
    // ============================================
    // Calcular déficit NETO de K (descontando aportes previos)
    const deficitK_Neto = Math.max(0, deficitK2O - acumulado.K2O);
    
    let dosisPuraK = deficitK_Neto > 0 ? deficitK_Neto / effK : 0;
    let cantComercial_K = 0;
    let aporteN_del_K = 0;

    if (dosisPuraK > 0) {
      if (porcK_fuenteK === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteK.nombre} no contiene Potasio`,
        );
      }
      cantComercial_K = dosisPuraK / (porcK_fuenteK / 100);
      
      // CALCULAR APORTE SECUNDARIO EXPLÍCITAMENTE (para cronograma)
      aporteN_del_K = cantComercial_K * (Number(fuenteK.porc_n || 0) / 100);
      
      // REGISTRAR APORTES: K + todos sus nutrientes secundarios (Mg, S si es Sulpomag)
      this.registrarAporte(acumulado, cantComercial_K, fuenteK);
    }

    // ============================================
    // PASO 3: CALCULAR Y APLICAR NITRÓGENO (N)
    // ============================================
    // Calcular déficit NETO de N (descontando aportes de P y K)
    const deficitN_Teorico = deficitN > 0 ? deficitN / effN : 0;
    const deficitN_Neto = Math.max(0, deficitN_Teorico - acumulado.N);
    
    let cantComercial_N = 0;

    if (deficitN_Neto > 0) {
      if (porcN_fuenteN === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteN.nombre} no contiene Nitrógeno`,
        );
      }
      cantComercial_N = deficitN_Neto / (porcN_fuenteN / 100);
      
      // REGISTRAR APORTES: N + todos sus nutrientes secundarios (S si es Sulfato de Amonio)
      this.registrarAporte(acumulado, cantComercial_N, fuenteN);
    }

    // ============================================
    // CALCULAR SACOS DE 50 KG
    // ============================================
    const sacosN = cantComercial_N / 50;
    const sacosP = cantComercial_P / 50;
    const sacosK = cantComercial_K / 50;

    // ============================================
    // PASO 4: CALCULAR Y APLICAR MAGNESIO (MgO)
    // ============================================
    // Verificar cuánto MgO ya aportaron fertilizantes anteriores (Sulpomag, Dolomita, etc.)
    const deficitMg_Neto = Math.max(0, deficitMgO - acumulado.MgO);
    
    let cantComercial_Mg = 0;
    let fuenteMg: any = null;
    let productoMg = 'No requerido';

    if (deficitMg_Neto > 0) {
      // Seleccionar fuente según pH:
      // pH < 5.5 → Dolomita (corrige pH + aporta MgO)
      // pH >= 5.5 → Sulfato de Magnesio/Kieserita (no afecta pH)
      
      if (ph && ph < 5.5) {
        // Buscar Dolomita (Cal Dolomítica)
        fuenteMg = await this.fuenteFertilizanteRepository.findOne({
          where: { nombre: 'Dolomita' },
        });
      } else {
        // Buscar Sulfato de Magnesio o Kieserita
        fuenteMg = await this.fuenteFertilizanteRepository.findOne({
          where: { nombre: 'Sulfato de Magnesio' },
        });
        
        // Si no existe, buscar Kieserita
        if (!fuenteMg) {
          fuenteMg = await this.fuenteFertilizanteRepository.findOne({
            where: { nombre: 'Kieserita' },
          });
        }
      }

      if (fuenteMg && Number(fuenteMg.porc_mgo || 0) > 0) {
        const riquezaMg = Number(fuenteMg.porc_mgo);
        cantComercial_Mg = deficitMg_Neto / (riquezaMg / 100);
        productoMg = fuenteMg.nombre;
        
        // REGISTRAR APORTES: MgO + otros nutrientes secundarios (S si es Sulfato)
        this.registrarAporte(acumulado, cantComercial_Mg, fuenteMg);
      }
    }

    // ============================================
    // PASO 5: CALCULAR Y APLICAR AZUFRE (S)
    // ============================================
    // Verificar cuánto S ya aportaron fertilizantes anteriores
    const deficitS_Neto = Math.max(0, deficitS - acumulado.S);
    
    let cantComercial_S = 0;
    let fuenteS: any = null;
    let productoS = 'No requerido';

    if (deficitS_Neto > 0) {
      // Buscar Azufre Elemental o Sulfato
      fuenteS = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Azufre Elemental' },
      });

      if (!fuenteS) {
        fuenteS = await this.fuenteFertilizanteRepository.findOne({
          where: { nombre: 'Sulfato de Amonio' },
        });
      }

      if (fuenteS && Number(fuenteS.porc_s || 0) > 0) {
        const riquezaS = Number(fuenteS.porc_s);
        cantComercial_S = deficitS_Neto / (riquezaS / 100);
        productoS = fuenteS.nombre;
        
        // REGISTRAR APORTES: S + otros nutrientes (N si es Sulfato de Amonio)
        this.registrarAporte(acumulado, cantComercial_S, fuenteS);
      }
    }

    const sacosMg = cantComercial_Mg / 50;
    const sacosS = cantComercial_S / 50;

    // ============================================
    // ESTRUCTURAR JSON FINAL CON ACUMULADOR COMPLETO
    // ============================================
    return {
      Nitrogeno: {
        producto: fuenteN.nombre,
        deficit_original: Number(deficitN.toFixed(2)),
        deficit_teorico_con_eficiencia: Number(deficitN_Teorico.toFixed(2)),
        aportado_por_otros: Number(acumulado.N.toFixed(2)),
        deficit_neto: Number(deficitN_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitN_Neto.toFixed(2)), // Dosis pura (kg/ha de N)
        eficiencia_usada: `${effN * 100}%`,
        cantidad_kg_ha: Number(cantComercial_N.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosN.toFixed(2)),
      },
      Fosforo: {
        producto: fuenteP.nombre,
        deficit_original: Number(deficitP2O5.toFixed(2)),
        dosis_pura_requerida: Number(dosisPuraP.toFixed(2)),
        eficiencia_usada: `${effP * 100}%`,
        cantidad_kg_ha: Number(cantComercial_P.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosP.toFixed(2)),
        riqueza_n: `${Number(fuenteP.porc_n || 0)}%`,
        aporta_nitrogeno: Number(aporteN_del_P.toFixed(2)), // CRUCIAL PARA CRONOGRAMA
        aporta_potasio: Number(aporteK_del_P.toFixed(2)),
      },
      Potasio: {
        producto: fuenteK.nombre,
        deficit_original: Number(deficitK2O.toFixed(2)),
        aportado_por_fosforo: Number((deficitK2O - deficitK_Neto).toFixed(2)),
        deficit_neto: Number(deficitK_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitK_Neto.toFixed(2)), // Dosis pura (kg/ha de K2O)
        eficiencia_usada: `${effK * 100}%`,
        cantidad_kg_ha: Number(cantComercial_K.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosK.toFixed(2)),
        riqueza_n: `${Number(fuenteK.porc_n || 0)}%`,
        aporta_nitrogeno: Number(aporteN_del_K.toFixed(2)), // CRUCIAL PARA CRONOGRAMA
      },
      Magnesio: {
        producto: productoMg,
        deficit_original: Number(deficitMgO.toFixed(2)),
        aportado_por_otros: Number((deficitMgO - deficitMg_Neto).toFixed(2)),
        deficit_neto: Number(deficitMg_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitMg_Neto.toFixed(2)), // Dosis pura (kg/ha de MgO)
        cantidad_kg_ha: Number(cantComercial_Mg.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosMg.toFixed(2)),
        criterio: ph && ph < 5.5 ? 'pH bajo - Dolomita recomendada' : 'pH adecuado - Sulfato de Mg',
      },
      Azufre: {
        producto: productoS,
        deficit_original: Number(deficitS.toFixed(2)),
        aportado_por_otros: Number((deficitS - deficitS_Neto).toFixed(2)),
        deficit_neto: Number(deficitS_Neto.toFixed(2)),
        dosis_pura_requerida: Number(deficitS_Neto.toFixed(2)), // Dosis pura (kg/ha de S)
        cantidad_kg_ha: Number(cantComercial_S.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosS.toFixed(2)),
      },
      // NUEVO: Resumen del acumulador (todos los nutrientes aportados)
      acumulador_total: {
        N_total_kg: Number(acumulado.N.toFixed(2)),
        P2O5_total_kg: Number(acumulado.P2O5.toFixed(2)),
        K2O_total_kg: Number(acumulado.K2O.toFixed(2)),
        CaO_total_kg: Number(acumulado.CaO.toFixed(2)),
        MgO_total_kg: Number(acumulado.MgO.toFixed(2)),
        S_total_kg: Number(acumulado.S.toFixed(2)),
        Zn_total_kg: Number(acumulado.Zn.toFixed(2)),
        B_total_kg: Number(acumulado.B.toFixed(2)),
        Cu_total_kg: Number(acumulado.Cu.toFixed(2)),
        Mn_total_kg: Number(acumulado.Mn.toFixed(2)),
        Fe_total_kg: Number(acumulado.Fe.toFixed(2)),
      },
    };
  }

  /**
   * MÉTODO ANTIGUO MANTENIDO PARA COMPATIBILIDAD
   * (Será reemplazado por calcularFertilizacionCascada en el futuro)
   */
  private async calcularFertilizacionComercial(
    deficitN: number,
    deficitP2O5: number,
    deficitK2O: number,
    idFuenteN?: number,
    idFuenteP?: number,
    idFuenteK?: number,
  ) {
    // ============================================
    // EFICIENCIAS (Constantes del Anexo 7)
    // ============================================
    const EFF_N = 0.6; // 60%
    const EFF_P = 0.25; // 25%
    const EFF_K = 0.7; // 70%

    // ============================================
    // BUSCAR FUENTES DE FERTILIZANTES (Defaults del Anexo 9)
    // ============================================
    
    // Default: Urea (ID = 1)
    let fuenteN = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteN || 1 },
    });
    if (!fuenteN) {
      fuenteN = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Urea' },
      });
    }

    // Default: Superfosfato Triple (ID = 2)
    let fuenteP = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteP || 2 },
    });
    if (!fuenteP) {
      fuenteP = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Superfosfato Triple (SFT)' },
      });
    }

    // Default: Cloruro de Potasio (ID = 4)
    let fuenteK = await this.fuenteFertilizanteRepository.findOne({
      where: { id: idFuenteK || 4 },
    });
    if (!fuenteK) {
      fuenteK = await this.fuenteFertilizanteRepository.findOne({
        where: { nombre: 'Cloruro de Potasio (KCl)' },
      });
    }

    if (!fuenteN || !fuenteP || !fuenteK) {
      throw new NotFoundException(
        'No se encontraron las fuentes de fertilizantes en la base de datos',
      );
    }

    // Convertir porcentajes de string a number
    const porcN_fuenteN = Number(fuenteN.porc_n);
    const porcN_fuenteP = Number(fuenteP.porc_n);
    const porcN_fuenteK = Number(fuenteK.porc_n);
    const porcP_fuenteP = Number(fuenteP.porc_p2o5);
    const porcK_fuenteP = Number(fuenteP.porc_k2o);
    const porcK_fuenteK = Number(fuenteK.porc_k2o);

    // ============================================
    // PASO 1: CALCULAR FERTILIZANTE DE FÓSFORO (P) PRIMERO
    // ============================================
    let dosisPuraP = deficitP2O5 > 0 ? deficitP2O5 / EFF_P : 0;
    let cantComercial_P = 0;

    if (dosisPuraP > 0) {
      if (porcP_fuenteP === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteP.nombre} no contiene Fósforo`,
        );
      }
      cantComercial_P = dosisPuraP / (porcP_fuenteP / 100);
    }

    // ============================================
    // PASO 2: CALCULAR APORTE CRUZADO DEL FERTILIZANTE DE P
    // ============================================
    const aporte_N_del_P = cantComercial_P * (porcN_fuenteP / 100);
    const aporte_K_del_P = cantComercial_P * (porcK_fuenteP / 100);

    // ============================================
    // PASO 3: CALCULAR FERTILIZANTE DE POTASIO (K)
    // ============================================
    // Descontar lo que ya aportó el fertilizante de P
    let nuevoDeficitK = deficitK2O - aporte_K_del_P;
    if (nuevoDeficitK < 0) nuevoDeficitK = 0;

    let dosisPuraK = nuevoDeficitK > 0 ? nuevoDeficitK / EFF_K : 0;
    let cantComercial_K = 0;

    if (dosisPuraK > 0) {
      if (porcK_fuenteK === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteK.nombre} no contiene Potasio`,
        );
      }
      cantComercial_K = dosisPuraK / (porcK_fuenteK / 100);
    }

    // ============================================
    // PASO 4: CALCULAR APORTE CRUZADO DEL FERTILIZANTE DE K
    // ============================================
    const aporte_N_del_K = cantComercial_K * (porcN_fuenteK / 100);

    // ============================================
    // PASO 5: CALCULAR FERTILIZANTE DE NITRÓGENO (N) AL FINAL
    // ============================================
    // CORRECCIÓN: Aplicar eficiencia PRIMERO, luego restar aportes
    
    // 5.1: Calcular dosis total necesaria considerando eficiencia
    const dosisTotalN = deficitN > 0 ? deficitN / EFF_N : 0;
    
    // 5.2: Restar los aportes cruzados de P y K a la dosis total
    let dosisPuraN_Final = dosisTotalN - aporte_N_del_P - aporte_N_del_K;
    if (dosisPuraN_Final < 0) dosisPuraN_Final = 0;

    // 5.3: Calcular fertilizante comercial con la dosis ajustada
    let cantComercial_N = 0;

    if (dosisPuraN_Final > 0) {
      if (porcN_fuenteN === 0) {
        throw new BadRequestException(
          `El fertilizante ${fuenteN.nombre} no contiene Nitrógeno`,
        );
      }
      cantComercial_N = dosisPuraN_Final / (porcN_fuenteN / 100);
    }
    
    // Calcular déficit ajustado (para mostrar en la respuesta)
    let nuevoDeficitN = deficitN - aporte_N_del_P - aporte_N_del_K;
    if (nuevoDeficitN < 0) nuevoDeficitN = 0;

    // ============================================
    // CALCULAR SACOS DE 50 KG
    // ============================================
    const sacosN = cantComercial_N / 50;
    const sacosP = cantComercial_P / 50;
    const sacosK = cantComercial_K / 50;

    // ============================================
    // ESTRUCTURAR JSON FINAL CON INFORMACIÓN DE APORTES CRUZADOS
    // ============================================
    return {
      Nitrogeno: {
        producto: fuenteN.nombre,
        dosis_pura_requerida: Number(dosisPuraN_Final.toFixed(2)),
        eficiencia_usada: `${EFF_N * 100}%`,
        cantidad_kg_ha: Number(cantComercial_N.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosN.toFixed(2)),
        aporte_de_otros_fertilizantes: Number((aporte_N_del_P + aporte_N_del_K).toFixed(2)),
        deficit_original: Number(deficitN.toFixed(2)),
        deficit_ajustado: Number(nuevoDeficitN.toFixed(2)),
      },
      Fosforo: {
        producto: fuenteP.nombre,
        dosis_pura_requerida: Number(dosisPuraP.toFixed(2)),
        eficiencia_usada: `${EFF_P * 100}%`,
        cantidad_kg_ha: Number(cantComercial_P.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosP.toFixed(2)),
        aporta_nitrogeno: Number(aporte_N_del_P.toFixed(2)),
        aporta_potasio: Number(aporte_K_del_P.toFixed(2)),
      },
      Potasio: {
        producto: fuenteK.nombre,
        dosis_pura_requerida: Number(dosisPuraK.toFixed(2)),
        eficiencia_usada: `${EFF_K * 100}%`,
        cantidad_kg_ha: Number(cantComercial_K.toFixed(2)),
        cantidad_sacos_50kg: Number(sacosK.toFixed(2)),
        aporta_nitrogeno: Number(aporte_N_del_K.toFixed(2)),
        deficit_original: Number(deficitK2O.toFixed(2)),
        deficit_ajustado: Number(nuevoDeficitK.toFixed(2)),
      },
    };
  }

  /**
   * HELPER: REGISTRAR APORTE DE NUTRIENTES AL ACUMULADOR
   * 
   * Método universal para rastrear TODOS los nutrientes aportados por un fertilizante
   * aplicado. Actualiza el objeto acumulado con los kg/ha de cada elemento.
   * 
   * @param acumulado - Objeto acumulador de nutrientes (modificado por referencia)
   * @param cantidad - Cantidad comercial del fertilizante aplicado (kg/ha)
   * @param fuente - Entidad FuenteFertilizante con todas las composiciones
   * 
   * ARQUITECTURA: Patrón "Cascada con Rastreo"
   * - Cada fertilizante aplicado suma sus aportes al acumulador
   * - Los fertilizantes posteriores en la cascada consultan el acumulado
   * - Permite descuentos automáticos de nutrientes ya cubiertos
   * 
   * LÓGICA ESPECIAL PARA CALCIO (CaO):
   * - Solo fertilizantes orgánicos/enmiendas suman al CaO de corrección
   * - Fertilizantes minerales aportan Ca pero no corrigen pH/acidez
   * - Ejemplo: Guano (orgánico) suma CaO, pero DAP (mineral) NO suma CaO
   */
  private registrarAporte(
    acumulado: any,
    cantidad: number,
    fuente: FuenteFertilizante,
  ): void {
    // Validación: No procesar si no hay fuente o cantidad
    if (!fuente || cantidad <= 0) return;

    // ============================================
    // MACRONUTRIENTES PRIMARIOS (NPK)
    // ============================================
    acumulado.N += cantidad * (Number(fuente.porc_n || 0) / 100);
    acumulado.P2O5 += cantidad * (Number(fuente.porc_p2o5 || 0) / 100);
    acumulado.K2O += cantidad * (Number(fuente.porc_k2o || 0) / 100);

    // ============================================
    // MACRONUTRIENTES SECUNDARIOS
    // ============================================
    
    // CALCIO (CaO): Lógica especial según clasificación
    // Solo orgánicos y enmiendas cálcicas corrigen acidez del suelo
    if (
      fuente.clasificacion === 'ORGANICO' ||
      fuente.clasificacion === 'ENMIENDA'
    ) {
      acumulado.CaO += cantidad * (Number(fuente.porc_cao || 0) / 100);
    }
    // Nota: Fertilizantes minerales (DAP, SFT) tienen Ca pero no corrigen pH

    // MAGNESIO (MgO)
    acumulado.MgO += cantidad * (Number(fuente.porc_mgo || 0) / 100);

    // AZUFRE (S)
    acumulado.S += cantidad * (Number(fuente.porc_s || 0) / 100);

    // ============================================
    // MICRONUTRIENTES
    // ============================================
    acumulado.Zn += cantidad * (Number(fuente.porc_zn || 0) / 100);
    acumulado.B += cantidad * (Number(fuente.porc_b || 0) / 100);
    acumulado.Cu += cantidad * (Number(fuente.porc_cu || 0) / 100);
    acumulado.Mn += cantidad * (Number(fuente.porc_mn || 0) / 100);
    acumulado.Fe += cantidad * (Number(fuente.porc_fe || 0) / 100);

    // ============================================
    // OTROS ELEMENTOS (Escalabilidad)
    // ============================================
    // Molibdeno (Mo) - Futuro (requiere agregar campo porc_mo a la entidad)
    // acumulado.Mo += cantidad * (Number(fuente.porc_mo || 0) / 100);

    // Cloro (Cl) - Presente en KCl (requiere agregar campo porc_cl a la entidad)
    // if (fuente.porc_cl) {
    //   acumulado.Cl += cantidad * (Number(fuente.porc_cl || 0) / 100);
    // }

    // Sodio (Na) - Presente en Nitrato de Sodio (requiere agregar campo porc_na a la entidad)
    // if (fuente.porc_na) {
    //   acumulado.Na += cantidad * (Number(fuente.porc_na || 0) / 100);
    // }

    // Nota: Este método es EXTENSIBLE - solo agregar nueva línea para nuevo nutriente
  }

  /**
   * D. GENERAR CRONOGRAMA DE APLICACIÓN (Pág 11 y 14 PDF - Tabla de Fraccionamiento)
   * 
   * LÓGICA UNIVERSAL DE DESCUENTO LOCALIZADO:
   * - Calcula aporte basal de N (fertilizantes P, K que se aplican 100% al inicio)
   * - Descuenta ese aporte SOLO de la Etapa 1
   * - Mantiene Etapas 2 y 3 con cuotas teóricas completas (1/3 de la demanda)
   * 
   * EJEMPLO (Página 14 PDF - Ejercicio 2 con Guano):
   * - Demanda teórica: 313 kg N / 0.45 = 696 kg Urea → 232 kg por etapa
   * - Guano aporta: 35.8 kg N → equivale a 79.5 kg Urea
   * - Resultado: Etapa 1 = 24 kg Urea, Etapa 2 = 102 kg, Etapa 3 = 102 kg
   */
  private generarCronograma(
    recomendacion: any,
    enmienda?: any,
  ): any[] {
    const etapas: any[] = [];

    // ============================================
    // 1. CALCULAR APORTE BASAL DE NITRÓGENO
    // ============================================
    // Sumamos el N que viene de productos que se aplican 100% al inicio: P, K, etc.
    let aporteN_Basal_Kg = 0;

    if (recomendacion.Fosforo && recomendacion.Fosforo.aporta_nitrogeno > 0) {
      aporteN_Basal_Kg += recomendacion.Fosforo.aporta_nitrogeno;
    }

    if (recomendacion.Potasio && recomendacion.Potasio.aporta_nitrogeno > 0) {
      aporteN_Basal_Kg += recomendacion.Potasio.aporta_nitrogeno;
    }

    // ============================================
    // 2. CALCULAR LAS CUOTAS DE UREA (Lógica de Descuento Localizado)
    // ============================================
    const datosN = recomendacion.Nitrogeno;
    let urea_Etapa1 = 0;
    let urea_Etapa2 = 0;
    let urea_Etapa3 = 0;

    if (datosN) {
      // A. Definir Riqueza de la Urea (Usamos 0.45 según BD)
      const riquezaUrea = 0.45;

      // B. Calcular la "Cuota Full" (Dosis teórica por etapa SI NO hubiera Guano)
      // Usamos el deficit TEÓRICO (lo que pide el suelo) para saber la demanda real
      const dosisTeoricaTotal_Kg = datosN.deficit_teorico_con_eficiencia / riquezaUrea;
      const cuotaFull = dosisTeoricaTotal_Kg / 3; // Ej: 313 / 3 = ~104.5 kg

      // C. Calcular cuánto Urea equivale el aporte del Guano
      const ahorroUrea_Kg = aporteN_Basal_Kg / riquezaUrea; // Ej: 35.8 / 0.45 = ~79.5 kg

      // D. Aplicar el descuento SOLO a la primera etapa
      urea_Etapa1 = Math.max(0, cuotaFull - ahorroUrea_Kg); // 104.5 - 79.5 = ~25 kg
      urea_Etapa2 = cuotaFull; // Se mantiene lleno (104.5 kg)
      urea_Etapa3 = cuotaFull; // Se mantiene lleno (104.5 kg)
    }

    // ============================================
    // 3. CONSTRUIR ARRAY DE RESPUESTA
    // ============================================

    // --- ETAPA 1: INICIO DE FLORACIÓN (Mes 1-2) ---
    const itemsEtapa1: any[] = [];

    // Urea (reducida por descuento)
    if (urea_Etapa1 > 0) {
      itemsEtapa1.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa1.toFixed(2)),
        sacos: Number((urea_Etapa1 / 50).toFixed(2)),
      });
    }

    // Fósforo (Todo al inicio)
    if (recomendacion.Fosforo && recomendacion.Fosforo.cantidad_kg_ha > 0) {
      itemsEtapa1.push({
        producto: recomendacion.Fosforo.producto,
        dosis_kg: Number(recomendacion.Fosforo.cantidad_kg_ha.toFixed(2)),
        sacos: Number(recomendacion.Fosforo.cantidad_sacos_50kg.toFixed(2)),
      });
    }

    // Potasio (Todo al inicio)
    if (recomendacion.Potasio && recomendacion.Potasio.cantidad_kg_ha > 0) {
      itemsEtapa1.push({
        producto: recomendacion.Potasio.producto,
        dosis_kg: Number(recomendacion.Potasio.cantidad_kg_ha.toFixed(2)),
        sacos: Number(recomendacion.Potasio.cantidad_sacos_50kg.toFixed(2)),
      });
    }

    // Magnesio (Dolomita / Sulfato de Magnesio - Todo al inicio)
    if (recomendacion.Magnesio && recomendacion.Magnesio.cantidad_kg_ha > 0) {
      itemsEtapa1.push({
        producto: recomendacion.Magnesio.producto,
        dosis_kg: Number(recomendacion.Magnesio.cantidad_kg_ha.toFixed(2)),
        sacos: Number(recomendacion.Magnesio.cantidad_sacos_50kg.toFixed(2)),
      });
    }

    // Azufre (Sulfatos - Todo al inicio)
    if (recomendacion.Azufre && recomendacion.Azufre.cantidad_kg_ha > 0) {
      itemsEtapa1.push({
        producto: recomendacion.Azufre.producto,
        dosis_kg: Number(recomendacion.Azufre.cantidad_kg_ha.toFixed(2)),
        sacos: Number(recomendacion.Azufre.cantidad_sacos_50kg.toFixed(2)),
      });
    }

    // Enmienda (Toda al inicio)
    if (enmienda && enmienda.requiere_enmienda && enmienda.kg_comercial_ha > 0) {
      itemsEtapa1.push({
        producto: enmienda.producto,
        dosis_kg: Number(enmienda.kg_comercial_ha.toFixed(2)),
        sacos: Number(enmienda.sacos_50kg.toFixed(2)),
      });
    }

    etapas.push({
      etapa: 'Inicio de Floración',
      momento: 'Mes 1-2',
      aplicaciones: itemsEtapa1,
    });

    // --- ETAPA 2: LLENADO DE GRANO (Mes 4-5) ---
    const itemsEtapa2: any[] = [];

    if (urea_Etapa2 > 0) {
      itemsEtapa2.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa2.toFixed(2)),
        sacos: Number((urea_Etapa2 / 50).toFixed(2)),
      });
    }

    etapas.push({
      etapa: 'Llenado de Grano',
      momento: 'Mes 4-5',
      aplicaciones: itemsEtapa2,
    });

    // --- ETAPA 3: MADURACIÓN (Mes 7-8) ---
    const itemsEtapa3: any[] = [];

    if (urea_Etapa3 > 0) {
      itemsEtapa3.push({
        producto: datosN.producto,
        dosis_kg: Number(urea_Etapa3.toFixed(2)),
        sacos: Number((urea_Etapa3 / 50).toFixed(2)),
      });
    }

    etapas.push({
      etapa: 'Inicio de Maduración',
      momento: 'Mes 7-8',
      aplicaciones: itemsEtapa3,
    });

    return etapas;
  }
}
