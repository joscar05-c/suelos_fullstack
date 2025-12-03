import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';
import { RangoIdeal } from './entities/rango-ideal.entity';
import { RelacionCationica } from './entities/relacion-cationica.entity';
import { NivelCriticoMicro } from './entities/nivel-critico-micro.entity';
import { RequerimientoCultivo } from './entities/requerimiento-cultivo.entity';
import { FuenteFertilizante } from './entities/fuente-fertilizante.entity';
import { EficienciaNutriente } from './entities/eficiencia-nutriente.entity';
import { SemillaService } from './semilla.service';
import { RangosIdealesSeederService } from './rangos-ideales-seeder.service';
import { InterpretacionAvanzadaSeederService } from './interpretacion-avanzada-seeder.service';
import { FuentesFertilizantesSeederService } from './fuentes-fertilizantes-seeder.service';
import { EficienciasSeederService } from './eficiencias-seeder.service';
import { CalculoSueloService } from './calculo-suelo.service';
import { CalculoSueloController } from './calculo-suelo.controller';
import { CatalogoController } from './controllers/catalogo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TexturaSuelo,
      TasaMineralizacion,
      FactorNutriente,
      RangoIdeal,
      RelacionCationica,
      NivelCriticoMicro,
      RequerimientoCultivo,
      FuenteFertilizante,
      EficienciaNutriente,
    ]),
  ],
  controllers: [CalculoSueloController, CatalogoController],
  providers: [
    SemillaService,
    RangosIdealesSeederService,
    InterpretacionAvanzadaSeederService,
    FuentesFertilizantesSeederService,
    EficienciasSeederService,
    CalculoSueloService,
  ],
})
export class CalculoSueloModule {}
