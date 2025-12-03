import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EficienciaNutriente } from './entities/eficiencia-nutriente.entity';

@Injectable()
export class EficienciasSeederService {
  constructor(
    @InjectRepository(EficienciaNutriente)
    private readonly eficienciaRepo: Repository<EficienciaNutriente>,
  ) {}

  async seed() {
    const count = await this.eficienciaRepo.count();
    if (count > 0) {
      console.log('⏭️  Eficiencias ya cargadas, omitiendo seeder...');
      return;
    }

    const eficiencias = [
      { elemento: 'N', valor: 0.60 },
      { elemento: 'P', valor: 0.25 },
      { elemento: 'K', valor: 0.70 },
      { elemento: 'Ca_Enmienda', valor: 0.70 },
    ];

    await this.eficienciaRepo.save(eficiencias);
    console.log('✅ Eficiencias de nutrientes cargadas correctamente (Anexo 7)');
  }
}
