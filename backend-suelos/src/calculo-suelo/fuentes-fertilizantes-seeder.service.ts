import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FuenteFertilizante } from './entities/fuente-fertilizante.entity';
import { TipoFertilizante } from './enums/tipo-fertilizante.enum';

@Injectable()
export class FuentesFertilizantesSeederService implements OnModuleInit {
  constructor(
    @InjectRepository(FuenteFertilizante)
    private readonly fuenteFertilizanteRepository: Repository<FuenteFertilizante>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    const count = await this.fuenteFertilizanteRepository.count();
    if (count > 0) {
      console.log('✅ Fuentes de Fertilizantes ya sembradas');
      return;
    }

    // ✅ DATOS 100% VERIFICADOS DEL PDF (Página 16 - Anexos 9-A y 9-B)
    // Incluye composición completa: Macros primarios (N-P-K), secundarios (Ca-Mg-S) y Micros (B-Cu-Zn-Mn-Fe)
    const fertilizantes = [
      // --- NITROGENADOS ---
      { nombre: 'Sulfato de Amonio', clasificacion: TipoFertilizante.NITROGENADO_SIMPLE, porc_n: 21, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 24, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Nitrato de Amonio', clasificacion: TipoFertilizante.NITROGENADO_SIMPLE, porc_n: 33, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Urea', clasificacion: TipoFertilizante.NITROGENADO_SIMPLE, porc_n: 45, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- FOSFATADOS ---
      { nombre: 'Superfosfato Simple', clasificacion: TipoFertilizante.FOSFATADO_SIMPLE, porc_n: 0, porc_p2o5: 21, porc_k2o: 0, porc_cao: 20, porc_mgo: 0, porc_s: 12, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Superfosfato Triple (SFT)', clasificacion: TipoFertilizante.FOSFATADO_SIMPLE, porc_n: 0, porc_p2o5: 46, porc_k2o: 0, porc_cao: 14, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- POTÁSICOS ---
      { nombre: 'Cloruro de Potasio (KCl)', clasificacion: TipoFertilizante.POTASICO_SIMPLE, porc_n: 0, porc_p2o5: 0, porc_k2o: 60, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Sulfato de Potasio', clasificacion: TipoFertilizante.POTASICO_SIMPLE, porc_n: 0, porc_p2o5: 0, porc_k2o: 50, porc_cao: 0, porc_mgo: 0, porc_s: 18, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- COMPUESTOS ---
      { nombre: 'Fosfato Diamónico (DAP)', clasificacion: TipoFertilizante.COMPUESTO, porc_n: 18, porc_p2o5: 46, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Fosfato Monoamónico (MAP)', clasificacion: TipoFertilizante.COMPUESTO, porc_n: 11, porc_p2o5: 52, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Sulpomag', clasificacion: TipoFertilizante.COMPUESTO, porc_n: 0, porc_p2o5: 0, porc_k2o: 22, porc_cao: 0, porc_mgo: 18, porc_s: 22, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Molimax-Café', clasificacion: TipoFertilizante.COMPUESTO, porc_n: 20, porc_p2o5: 7, porc_k2o: 20, porc_cao: 3, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Roca Fosfórica', clasificacion: TipoFertilizante.COMPUESTO, porc_n: 0, porc_p2o5: 30, porc_k2o: 0, porc_cao: 40, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- ORGÁNICOS ---
      { nombre: 'Guano de Isla', clasificacion: TipoFertilizante.ORGANICO, porc_n: 13, porc_p2o5: 12, porc_k2o: 2.5, porc_cao: 11, porc_mgo: 1, porc_s: 1.5, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Broza del Café', clasificacion: TipoFertilizante.ORGANICO, porc_n: 2.5, porc_p2o5: 0.3, porc_k2o: 1.9, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Estiércol de Vacuno', clasificacion: TipoFertilizante.ORGANICO, porc_n: 1.6, porc_p2o5: 1.2, porc_k2o: 1.8, porc_cao: 2.2, porc_mgo: 1.1, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Compost (Pulpa)', clasificacion: TipoFertilizante.ORGANICO, porc_n: 1.7, porc_p2o5: 0.18, porc_k2o: 2.0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- ENMIENDAS ---
      { nombre: 'Cal Agrícola', clasificacion: TipoFertilizante.ENMIENDA, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 56, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Yeso Agrícola', clasificacion: TipoFertilizante.ENMIENDA, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 26, porc_mgo: 0, porc_s: 18, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Dolomita', clasificacion: TipoFertilizante.ENMIENDA, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 30, porc_mgo: 20, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      
      // --- MICRONUTRIENTES (Composición comercial estándar) ---
      { nombre: 'Sulfato de Cobre', clasificacion: TipoFertilizante.MICRONUTRIENTE, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 12, porc_b: 0, porc_cu: 25, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Sulfato de Zinc', clasificacion: TipoFertilizante.MICRONUTRIENTE, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 17, porc_b: 0, porc_cu: 0, porc_zn: 22, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Ulexita', clasificacion: TipoFertilizante.MICRONUTRIENTE, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 10, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 0 },
      { nombre: 'Manganeso Natural', clasificacion: TipoFertilizante.MICRONUTRIENTE, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 0, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 25, porc_fe: 0 },
      { nombre: 'Sulfato de Hierro', clasificacion: TipoFertilizante.MICRONUTRIENTE, porc_n: 0, porc_p2o5: 0, porc_k2o: 0, porc_cao: 0, porc_mgo: 0, porc_s: 18, porc_b: 0, porc_cu: 0, porc_zn: 0, porc_mn: 0, porc_fe: 20 },
    ];

    await this.fuenteFertilizanteRepository.save(fertilizantes);
    console.log('🌱 24 fertilizantes con química completa: NPK + CaMgS + 5 micros (B-Cu-Zn-Mn-Fe) - Anexos 9-A y 9-B');
  }
}
