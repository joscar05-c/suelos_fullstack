import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';
import { RangosIdealesSeederService } from './rangos-ideales-seeder.service';
import { InterpretacionAvanzadaSeederService } from './interpretacion-avanzada-seeder.service';
import { FuentesFertilizantesSeederService } from './fuentes-fertilizantes-seeder.service';
import { EficienciasSeederService } from './eficiencias-seeder.service';

@Injectable()
export class SemillaService implements OnModuleInit {
  private readonly logger = new Logger(SemillaService.name);

  constructor(
    @InjectRepository(TexturaSuelo)
    private readonly texturaSueloRepository: Repository<TexturaSuelo>,
    @InjectRepository(TasaMineralizacion)
    private readonly tasaMineralizacionRepository: Repository<TasaMineralizacion>,
    @InjectRepository(FactorNutriente)
    private readonly factorNutrienteRepository: Repository<FactorNutriente>,
    private readonly rangosIdealesSeeder: RangosIdealesSeederService,
    private readonly interpretacionSeeder: InterpretacionAvanzadaSeederService,
    private readonly fertilizantesSeeder: FuentesFertilizantesSeederService,
    private readonly eficienciasSeeder: EficienciasSeederService,
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando proceso de semilla de datos...');
    await this.poblarTexturasSuelo();
    await this.poblarTasasMineralizacion();
    await this.poblarFactoresNutrientes();
    await this.rangosIdealesSeeder.seed();
    await this.interpretacionSeeder.seed();
    await this.fertilizantesSeeder.seed();
    await this.eficienciasSeeder.seed();
    this.logger.log('Proceso de semilla de datos completado');
  }

  private async poblarTexturasSuelo() {
    const count = await this.texturaSueloRepository.count();
    if (count > 0) {
      this.logger.log('TexturaSuelo ya contiene datos, omitiendo semilla');
      return;
    }

    const texturas = [
      { nombre: 'Arenoso', densidadAparente: 1.70 },
      { nombre: 'Franco Arenoso', densidadAparente: 1.60 },
      { nombre: 'Franco', densidadAparente: 1.50 },
      { nombre: 'Franco Arcilloso', densidadAparente: 1.35 },
      { nombre: 'Arcilloso', densidadAparente: 1.20 },
    ];

    await this.texturaSueloRepository.save(texturas);
    this.logger.log(`${texturas.length} texturas de suelo insertadas`);
  }

  private async poblarTasasMineralizacion() {
    const count = await this.tasaMineralizacionRepository.count();
    if (count > 0) {
      this.logger.log('TasaMineralizacion ya contiene datos, omitiendo semilla');
      return;
    }

    const tasas = [
      { zona: 'Costa', porcentaje: 2.00 },
      { zona: 'Sierra > 4000', porcentaje: 0.90 },
      { zona: 'Sierra < 4000', porcentaje: 1.50 },
      { zona: 'Selva > 600', porcentaje: 3.00 },
      { zona: 'Selva < 600', porcentaje: 3.50 },
    ];

    await this.tasaMineralizacionRepository.save(tasas);
    this.logger.log(`${tasas.length} tasas de mineralización insertadas`);
  }

  private async poblarFactoresNutrientes() {
    const count = await this.factorNutrienteRepository.count();
    if (count > 0) {
      this.logger.log('FactorNutriente ya contiene datos, omitiendo semilla');
      return;
    }

    const factores = [
      { elemento: 'N', disponibilidad: 0.30, factorConversion: 1.0 },
      { elemento: 'P', disponibilidad: 0.20, factorConversion: 2.29 },
      { elemento: 'K', disponibilidad: 0.40, factorConversion: 1.205 },
      { elemento: 'Ca', disponibilidad: 0.70, factorConversion: 1.399 },
      { elemento: 'Mg', disponibilidad: 0.60, factorConversion: 1.658 },
      { elemento: 'S', disponibilidad: 1.0, factorConversion: 3.0 },
    ];

    await this.factorNutrienteRepository.save(factores);
    this.logger.log(`${factores.length} factores de nutrientes insertados`);
  }
}
