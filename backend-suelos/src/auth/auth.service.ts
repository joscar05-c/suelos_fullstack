import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Usuario } from './entities/usuario.entity';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Registrar un nuevo usuario
   */
  async register(registerDto: RegisterDto) {
    // Verificar si el email ya existe
    const existingUser = await this.usuarioRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('El email ya está registrado');
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    // Crear usuario
    const usuario = this.usuarioRepository.create({
      email: registerDto.email,
      password: hashedPassword,
      nombre: registerDto.nombre,
      telefono: registerDto.telefono,
    });

    await this.usuarioRepository.save(usuario);

    // Generar JWT
    const payload = { sub: usuario.id, email: usuario.email };
    const token = this.jwtService.sign(payload);

    // Retornar datos sin el password
    const { password, ...result } = usuario;
    return {
      token,
      user: result,
    };
  }

  /**
   * Login de usuario
   */
  async login(loginDto: LoginDto) {
    // Buscar usuario por email
    const usuario = await this.usuarioRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar contraseña
    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      usuario.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // Verificar si está activo
    if (!usuario.activo) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Generar JWT
    const payload = { sub: usuario.id, email: usuario.email };
    const token = this.jwtService.sign(payload);

    // Retornar datos sin el password
    const { password, ...result } = usuario;
    return {
      token:this.jwtService.sign(payload),
      user: result,
    };
  }

  /**
   * Obtener perfil del usuario autenticado
   */
  async getProfile(userId: number) {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId },
      relations: ['chacras'],
    });

    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const { password, ...result } = usuario;
    return result;
  }

  /**
   * Validar usuario por ID (usado por JWT Strategy)
   */
  async validateUser(userId: number): Promise<Usuario> {
    const usuario = await this.usuarioRepository.findOne({
      where: { id: userId, activo: true },
    });

    if (!usuario) {
      throw new UnauthorizedException('Usuario no encontrado o desactivado');
    }

    return usuario;
  }
}
