import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Usuario } from './entities/usuario.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
  ) {}

  /**
   * Obtener o crear usuario por UID de Firebase
   */
  async findOrCreateByFirebaseUid(firebaseUid: string, phoneNumber?: string, email?: string) {
    try {
      let usuario = await this.usuarioRepository.findOne({
        where: { firebaseUid },
      });

      if (!usuario) {
        // Crear nuevo usuario
        usuario = this.usuarioRepository.create({
          firebaseUid,
          telefono: phoneNumber,
          email: email,
          nombre: phoneNumber || 'Usuario', // Nombre por defecto
          activo: true,
        });

        try {
          await this.usuarioRepository.save(usuario);
        } catch (error: any) {
          // Si falla por duplicado, intentar buscar de nuevo (race condition)
          if (error.code === '23505') {
            usuario = await this.usuarioRepository.findOne({
              where: { firebaseUid },
            });
            if (!usuario) {
              throw error; // Si aún no existe, lanzar el error original
            }
          } else {
            throw error;
          }
        }
      }

      return usuario;
    } catch (error) {
      console.error('Error en findOrCreateByFirebaseUid:', error);
      throw error;
    }
  }

  /**
   * Obtener perfil del usuario por UID de Firebase
   */
  async getProfile(firebaseUid: string) {
    const usuario = await this.usuarioRepository.findOne({
      where: { firebaseUid },
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return usuario;
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(firebaseUid: string, updateData: Partial<Usuario>) {
    const usuario = await this.getProfile(firebaseUid);

    Object.assign(usuario, updateData);

    return this.usuarioRepository.save(usuario);
  }
}
