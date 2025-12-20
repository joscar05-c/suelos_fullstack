import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChacrasService } from './chacras.service';
import { ChacrasController } from './chacras.controller';
import { Chacra } from './entities/chacra.entity';
import { CalculoSuelo } from './entities/calculo-suelo.entity';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chacra, CalculoSuelo]),
    AuthModule, // Para acceso a JwtStrategy
  ],
  controllers: [ChacrasController],
  providers: [ChacrasService],
  exports: [ChacrasService], // Para usarlo en CalculoSueloModule
})
export class ChacrasModule {}
