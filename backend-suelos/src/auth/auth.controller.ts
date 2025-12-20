import {
  Controller,
  Get,
  Put,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { FirebaseAuthGuard } from './firebase-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * GET /auth/profile
   * Obtener perfil del usuario autenticado con Firebase
   */
  @Get('profile')
  @UseGuards(FirebaseAuthGuard)
  async getProfile(@Request() req) {
    // Obtener o crear el usuario en nuestra BD
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );

    return usuario;
  }

  /**
   * PUT /auth/profile
   * Actualizar perfil del usuario
   */
  @Put('profile')
  @UseGuards(FirebaseAuthGuard)
  async updateProfile(@Request() req, @Body() updateData: any) {
    return this.authService.updateProfile(req.user.uid, updateData);
  }
}
