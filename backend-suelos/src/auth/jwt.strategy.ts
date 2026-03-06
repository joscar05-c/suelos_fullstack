import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthService } from './auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'suelos-secret-key-2025',
    });
  }

  async validate(payload: any) {
    console.log('📦 Payload del token:', payload);
    const user = await this.authService.validateUser(payload.sub);
    console.log('👤 Usuario encontrado en DB:', user);
    if (!user) {
      console.log('❌ Validación fallida: No se encontró el usuario');
      throw new UnauthorizedException();
    }
    return { userId: payload.sub, email: payload.email };
  }
}
