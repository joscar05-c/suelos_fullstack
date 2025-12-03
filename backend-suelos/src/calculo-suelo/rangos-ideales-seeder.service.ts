import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RangoIdeal } from './entities/rango-ideal.entity';

@Injectable()
export class RangosIdealesSeederService {
  private readonly logger = new Logger(RangosIdealesSeederService.name);

  constructor(
    @InjectRepository(RangoIdeal)
    private readonly rangoIdealRepository: Repository<RangoIdeal>,
  ) {}

  async seed() {
    this.logger.log('Verificando rangos ideales (Anexo 1 - Cultivo de Café)...');

    const rangosIdeales: Partial<RangoIdeal>[] = [
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
        valorMax: undefined,
        unidad: '%',
        descripcion: 'Materia orgánica ideal > 4%',
      },
      {
        parametro: 'SAT_ACIDEZ',
        valorMin: undefined,
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
        valorMin: undefined,
        valorMax: 1.0,
        unidad: 'dS/m',
        descripcion: 'Conductividad eléctrica < 1 dS/m',
      },
      {
        parametro: 'CIC_EFECTIVA',
        valorMin: 12.0,
        valorMax: undefined,
        unidad: 'meq/100g',
        descripcion: 'Capacidad de Intercambio Catiónico > 12 meq/100g',
      },
      {
        parametro: 'P_PPM', // Fósforo (No es intercambiable, es "Disponible" en ppm)
        valorMin: 14.0,
        valorMax: undefined,
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
        valorMax: 1.0, // Tolerancia máxima
        unidad: 'meq/100g',
        descripcion: 'Aluminio intercambiable < 1 meq/100g',
      }
    ];

    let insertados = 0;
    let actualizados = 0;

    for (const rango of rangosIdeales) {
      const existe = await this.rangoIdealRepository.findOne({
        where: { parametro: rango.parametro },
      });

      if (existe) {
        // Actualizar registro existente
        await this.rangoIdealRepository.update(
          { parametro: rango.parametro },
          rango,
        );
        actualizados++;
      } else {
        // Insertar nuevo registro
        await this.rangoIdealRepository.save(rango);
        insertados++;
      }
    }

    this.logger.log(
      `✅ Rangos ideales procesados: ${insertados} insertados, ${actualizados} actualizados.`,
    );
  }
}
