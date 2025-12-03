import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelacionCationica } from './entities/relacion-cationica.entity';
import { NivelCriticoMicro } from './entities/nivel-critico-micro.entity';
import { RequerimientoCultivo } from './entities/requerimiento-cultivo.entity';

@Injectable()
export class InterpretacionAvanzadaSeederService implements OnModuleInit {
  private readonly logger = new Logger(
    InterpretacionAvanzadaSeederService.name,
  );

  constructor(
    @InjectRepository(RelacionCationica)
    private readonly relacionCationicaRepository: Repository<RelacionCationica>,
    @InjectRepository(NivelCriticoMicro)
    private readonly nivelCriticoMicroRepository: Repository<NivelCriticoMicro>,
    @InjectRepository(RequerimientoCultivo)
    private readonly requerimientoCultivoRepository: Repository<RequerimientoCultivo>,
  ) {}

  async onModuleInit() {
    await this.seed();
  }

  async seed() {
    await this.seedRelacionesCationicas();
    await this.seedNivelesCriticosMicro();
    await this.seedRequerimientosCultivo();
  }

  /**
   * Seed de Relaciones Catiónicas (Anexo 5)
   */
  private async seedRelacionesCationicas() {
    const count = await this.relacionCationicaRepository.count();
    if (count > 0) {
      this.logger.log('Las relaciones catiónicas ya están pobladas.');
      return;
    }

    this.logger.log('Poblando relaciones catiónicas (Anexo 5)...');

    const relaciones: Partial<RelacionCationica>[] = [
      { nombre: 'Ca/Mg', min: 5.0, max: 8.0 },
      { nombre: 'Ca/K', min: 14.0, max: 16.0 },
      { nombre: 'Mg/K', min: 1.8, max: 2.5 },
      { nombre: 'K/Mg', min: 0.2, max: 0.3 },
    ];

    for (const relacion of relaciones) {
      await this.relacionCationicaRepository.save(relacion);
    }

    this.logger.log(
      `✅ ${relaciones.length} relaciones catiónicas creadas exitosamente.`,
    );
  }

  /**
   * Seed de Niveles Críticos de Micronutrientes (Anexo 10)
   */
  private async seedNivelesCriticosMicro() {
    const count = await this.nivelCriticoMicroRepository.count();
    if (count > 0) {
      this.logger.log('Los niveles críticos de micronutrientes ya están poblados.');
      return;
    }

    this.logger.log('Poblando niveles críticos de micronutrientes (Anexo 10)...');

    const niveles: Partial<NivelCriticoMicro>[] = [
      // Boro (B)
      { elemento: 'B', nivel: 'Bajo', min: 0, max: 0.3 },
      { elemento: 'B', nivel: 'Medio', min: 0.3, max: 0.5 },
      { elemento: 'B', nivel: 'Alto', min: 0.5, max: undefined },

      // Cobre (Cu)
      { elemento: 'Cu', nivel: 'Bajo', min: 0, max: 0.4 },
      { elemento: 'Cu', nivel: 'Medio', min: 0.4, max: 0.8 },
      { elemento: 'Cu', nivel: 'Alto', min: 0.8, max: undefined },

      // Zinc (Zn)
      { elemento: 'Zn', nivel: 'Bajo', min: 0, max: 4.0 },
      { elemento: 'Zn', nivel: 'Medio', min: 4.0, max: 6.0 },
      { elemento: 'Zn', nivel: 'Alto', min: 6.0, max: undefined },

      // Manganeso (Mn)
      { elemento: 'Mn', nivel: 'Bajo', min: 0, max: 3.0 },
      { elemento: 'Mn', nivel: 'Medio', min: 3.0, max: 5.0 },
      { elemento: 'Mn', nivel: 'Alto', min: 5.0, max: undefined },

      // Hierro (Fe)
      { elemento: 'Fe', nivel: 'Bajo', min: 0, max: 30.0 },
      { elemento: 'Fe', nivel: 'Medio', min: 30.0, max: 50.0 },
      { elemento: 'Fe', nivel: 'Alto', min: 50.0, max: undefined },
    ];

    for (const nivel of niveles) {
      await this.nivelCriticoMicroRepository.save(nivel);
    }

    this.logger.log(
      `✅ ${niveles.length} niveles críticos de micronutrientes creados exitosamente.`,
    );
  }

  /**
   * Seed de Requerimientos del Cultivo de Café (Anexo 11)
   */
  private async seedRequerimientosCultivo() {
    const count = await this.requerimientoCultivoRepository.count();
    if (count > 0) {
      this.logger.log('Los requerimientos del cultivo ya están poblados.');
      return;
    }

    this.logger.log('Poblando requerimientos del cultivo de Café (Anexo 11)...');

    const requerimientos: Partial<RequerimientoCultivo>[] = [
      {
        cultivo: 'Cafe',
        metaQuintales: 10,
        n: 56,
        p2o5: 9,
        k2o: 63,
        cao: 18,
        mgo: 7.5,
        s: 4.5,
        b: 1,
        cu: 1,
        zn: 1,
        mn: 1,
        fe: 2,
      },
      {
        cultivo: 'Cafe',
        metaQuintales: 20,
        n: 112,
        p2o5: 18,
        k2o: 125,
        cao: 36,
        mgo: 15,
        s: 9,
        b: 2,
        cu: 1.5,
        zn: 1.5,
        mn: 1.5,
        fe: 3,
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
        b: 3,
        cu: 1.8,
        zn: 1.8,
        mn: 1.8,
        fe: 4,
      },
      {
        cultivo: 'Cafe',
        metaQuintales: 40,
        n: 224,
        p2o5: 36,
        k2o: 250,
        cao: 72,
        mgo: 30,
        s: 18,
        b: 4,
        cu: 2.1,
        zn: 2.1,
        mn: 2.1,
        fe: 5,
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
        b: 5,
        cu: 2.3,
        zn: 2.3,
        mn: 2.3,
        fe: 6,
      },
      {
        cultivo: 'Cafe',
        metaQuintales: 60,
        n: 336,
        p2o5: 54,
        k2o: 376,
        cao: 108,
        mgo: 45,
        s: 27,
        b: 6,
        cu: 2.4,
        zn: 2.4,
        mn: 2.4,
        fe: 7,
      },
    ];

    for (const requerimiento of requerimientos) {
      await this.requerimientoCultivoRepository.save(requerimiento);
    }

    this.logger.log(
      `✅ ${requerimientos.length} requerimientos del cultivo de Café creados exitosamente.`,
    );
  }
}
