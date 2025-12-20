import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No se proporcionó token de autenticación');
    }

    const token = authHeader.substring(7);

    try {
      // Verificar el token con Firebase
      const decodedToken = await admin.auth().verifyIdToken(token);
      
      // Adjuntar información del usuario a la request
      request.user = {
        uid: decodedToken.uid,
        phoneNumber: decodedToken.phone_number,
        email: decodedToken.email,
        firebase: decodedToken
      };

      return true;
    } catch (error) {
      throw new UnauthorizedException('Token de Firebase inválido o expirado');
    }
  }
}
