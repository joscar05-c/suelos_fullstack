import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';

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
  ) {}

  async onModuleInit() {
    this.logger.log('Iniciando proceso de semilla de datos...');
    await this.poblarTexturasSuelo();
    await this.poblarTasasMineralizacion();
    await this.poblarFactoresNutrientes();
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
    ];

    await this.factorNutrienteRepository.save(factores);
    this.logger.log(`${factores.length} factores de nutrientes insertados`);
  }
}
