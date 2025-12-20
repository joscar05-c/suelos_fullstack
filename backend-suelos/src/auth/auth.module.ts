import { Module, OnModuleInit } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Usuario } from './entities/usuario.entity';
import * as admin from 'firebase-admin';

@Module({
  imports: [
    TypeOrmModule.forFeature([Usuario]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
  onModuleInit() {
    // Inicializar Firebase Admin SDK
    if (!admin.apps.length) {
      const serviceAccount = require('../../firebase-service-account.json');
      
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });

      console.log('🔥 Firebase Admin SDK inicializado');
    }
  }
}
