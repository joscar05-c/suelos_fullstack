import { SoilCalculationEngine } from './soil-calculation.engine';
import { DatosEntradaCalculo } from '../models/agronomic.models';

describe('SoilCalculationEngine (Motor Agronómico Offline)', () => {
  // Datos comunes basados en Ejercicio 01 y 02 (DOC 1, Páginas 3-14)
  const datosEjercicioBase: DatosEntradaCalculo = {
    areaHa: 1,
    profundidadMetros: 0.15,
    idTextura: 4, // Franco Arcilloso (da = 1.35)
    materiaOrganica: 3.0,
    fosforoPpm: 10.5,
    potasioPpm: 210,
    idZona: 4, // Selva > 600 (3% mineralización)
    ph: 4.6,
    ce: 0.11,
    caIntercambiable: 7.17,
    mgIntercambiable: 1.90,
    kIntercambiable: 0.48,
    naIntercambiable: 0.36,
    acidezIntercambiable: 1.10,
    b_ppm: 0.7,
    cu_ppm: 8.0,
    zn_ppm: 3.2,
    mn_ppm: 47.8,
    fe_ppm: 136.9,
    metaRendimiento: 20, // 20 quintales de café / ha
    idFuenteN: 3, // Urea
    idFuenteP: 5, // Superfosfato Triple (SFT)
    idFuenteK: 6, // Cloruro de Potasio (KCl)
    idFuenteCa: 17, // Cal Agrícola
    densidadPlantasHa: 5000,
  };

  it('debe calcular correctamente el PCA (Peso de la Capa Arable)', () => {
    const res = SoilCalculationEngine.calcular(datosEjercicioBase);
    // PCA = 10,000 m2 * 1.35 * 0.15 = 2025 t
    expect(res.pcaToneladas).toBe(2025);
  });

  it('debe calcular con precisión los nutrientes disponibles del suelo (DOC 1, Págs 5-6)', () => {
    const res = SoilCalculationEngine.calcular(datosEjercicioBase);

    // Nitrógeno disponible: 27.36 kg
    expect(res.nitrogenoDisponibleKg).toBeCloseTo(27.36, 1);

    // Fósforo disponible: 9.738 kg
    expect(res.fosforoDisponibleKg).toBeCloseTo(9.74, 1);

    // Potasio disponible: 204.99 kg
    expect(res.potasioDisponibleKg).toBeCloseTo(204.99, 1);
  });

  it('debe calcular las propiedades químicas y equilibrio catiónico (DOC 1, Pág 4 y 7)', () => {
    const res = SoilCalculationEngine.calcular(datosEjercicioBase);

    // Suma de bases = 7.17 + 1.90 + 0.48 + 0.36 = 9.91 meq/100g
    expect(res.sumaBases).toBeCloseTo(9.91, 2);

    // CIC efectiva = 9.91 + 1.10 = 11.01 meq/100g
    expect(res.cicEfectiva).toBeCloseTo(11.01, 2);

    // % Saturación de bases = 9.91 / 11.01 * 100 = 90.0%
    expect(res.porcentajeSatBases).toBeCloseTo(90.0, 0);

    // Relación Ca/Mg = 7.17 / 1.90 = 3.77 (Bajo en Ca)
    expect(res.equilibrioCationico.ca_mg).toBeCloseTo(3.77, 2);
  });

  it('debe ejecutar el Algoritmo en Cascada con Guano de Isla deduciendo N, K y CaO (DOC 1, Ejercicio 2, Págs 12-14)', () => {
    // Caso con Guano de Isla como fuente de Fósforo (idFuenteP = 13)
    const datosConGuano: DatosEntradaCalculo = {
      ...datosEjercicioBase,
      idFuenteP: 13, // Guano de Isla (13% N, 12% P2O5, 2.5% K2O, 11% CaO)
    };

    const res = SoilCalculationEngine.calcular(datosConGuano);
    const recP = res.recomendacion_fertilizacion.Fosforo;
    const recN = res.recomendacion_fertilizacion.Nitrogeno;

    // Guano de Isla para cubrir 33.048 kg P2O5 = 275.4 kg
    expect(recP.cantidad_kg_ha).toBeCloseTo(275.4, 0);
    expect(recP.aporta_nitrogeno).toBeCloseTo(35.8, 0);

    // El Nitrógeno de Urea debe haberse reducido por el aporte del Guano (descuento en cascada)
    // Dosis original sin Guano ~306-313 kg Urea -> Con Guano ~228-233 kg Urea
    expect(recN.aportado_por_otros).toBeCloseTo(35.8, 0);
    expect(recN.cantidad_kg_ha).toBeLessThan(240);
  });

  it('debe calcular la dosis por planta en gramos para 5000 plantas/ha (DOC 2)', () => {
    const res = SoilCalculationEngine.calcular(datosEjercicioBase);
    const recP = res.recomendacion_fertilizacion.Fosforo;

    // SFT: ~71.84 kg/ha / 5000 plantas * 1000 = ~14.37 g/planta
    expect(recP.gramos_por_planta).toBeGreaterThan(0);
    expect(recP.gramos_por_planta).toBeCloseTo((recP.cantidad_kg_ha / 5000) * 1000, 1);
  });
});
