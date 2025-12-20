import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ChacrasService } from './chacras.service';
import { CreateChacraDto } from './dto/create-chacra.dto';
import { UpdateChacraDto } from './dto/update-chacra.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthService } from '../auth/auth.service';

@Controller('chacras')
@UseGuards(FirebaseAuthGuard)
export class ChacrasController {
  constructor(
    private readonly chacrasService: ChacrasService,
    private readonly authService: AuthService,
  ) {}

  /**
   * GET /chacras
   * Listar todas las chacras del usuario autenticado
   */
  @Get()
  async findAll(@Request() req) {
    // Obtener o crear usuario en BD
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    
    return this.chacrasService.findAll(usuario.id);
  }

  /**
   * POST /chacras
   * Crear una nueva chacra
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Request() req, @Body() createChacraDto: CreateChacraDto) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    
    return this.chacrasService.create(usuario.id, createChacraDto);
  }

  /**
   * GET /chacras/:id
   * Obtener detalles de una chacra específica
   */
  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chacrasService.findOne(id, req.user.userId);
  }

  /**
   * PUT /chacras/:id
   * Actualizar una chacra
   */
  @Put(':id')
  async update(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateChacraDto: UpdateChacraDto,
  ) {
    return this.chacrasService.update(id, req.user.userId, updateChacraDto);
  }

  /**
   * DELETE /chacras/:id
   * Eliminar una chacra (cascade elimina cálculos)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chacrasService.remove(id, req.user.userId);
  }

  /**
   * GET /chacras/:id/calculos
   * Listar todos los cálculos de una chacra
   */
  @Get(':id/calculos')
  async findCalculos(@Request() req, @Param('id', ParseIntPipe) id: number) {
    return this.chacrasService.findCalculos(id, req.user.userId);
  }

  /**
   * GET /chacras/:id/calculos/:calculoId
   * Obtener un cálculo específico
   */
  @Get(':id/calculos/:calculoId')
  async findCalculo(
    @Request() req,
    @Param('id', ParseIntPipe) id: number,
    @Param('calculoId', ParseIntPipe) calculoId: number,
  ) {
    return this.chacrasService.findCalculo(id, calculoId, req.user.userId);
  }
}
