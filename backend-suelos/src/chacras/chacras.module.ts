import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChacrasService } from './chacras.service';
import { ChacrasController } from './chacras.controller';
import { Chacra } from './entities/chacra.entity';
import { CalculoSuelo } from './entities/calculo-suelo.entity';
import { AuthModule } from '../auth/auth.module';
import { CalculoSueloModule } from '../calculo-suelo/calculo-suelo.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chacra, CalculoSuelo]),
    AuthModule,
    CalculoSueloModule, // Importar para usar CalculoSueloService
  ],
  controllers: [ChacrasController],
  providers: [ChacrasService],
  exports: [ChacrasService],
})
export class ChacrasModule {}
