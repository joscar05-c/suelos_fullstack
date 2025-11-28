import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';
import { SemillaService } from './semilla.service';
import { CalculoSueloService } from './calculo-suelo.service';
import { CalculoSueloController } from './calculo-suelo.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      TexturaSuelo,
      TasaMineralizacion,
      FactorNutriente,
    ]),
  ],
  controllers: [CalculoSueloController],
  providers: [SemillaService, CalculoSueloService],
})
export class CalculoSueloModule {}
