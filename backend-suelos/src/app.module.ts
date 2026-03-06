import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalculoSueloModule } from './calculo-suelo/calculo-suelo.module';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { ChacrasModule } from './chacras/chacras.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT),
      username: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_DATABASE,
      autoLoadEntities: true,
      synchronize: process.env.NODE_ENV !== 'production', // Solo en desarrollo
      // dropSchema eliminado - ya NO borra la BD al iniciar
      logging: process.env.NODE_ENV === 'development',
    }),
    AuthModule,
    ChacrasModule,
    CalculoSueloModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
