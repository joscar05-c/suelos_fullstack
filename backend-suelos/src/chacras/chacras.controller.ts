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
import { UpdateCalculoDto } from './dto/update-calculo.dto';
import { FirebaseAuthGuard } from '../auth/firebase-auth.guard';
import { AuthService } from '../auth/auth.service';
import { CalcularYGuardarDto } from './dto/calcular-y-guardar.dto';
import { CalculoSueloService } from '../calculo-suelo/calculo-suelo.service';

@Controller('chacras')
@UseGuards(FirebaseAuthGuard)
export class ChacrasController {
  constructor(
    private readonly chacrasService: ChacrasService,
    private readonly authService: AuthService,
    private readonly calculoSueloService: CalculoSueloService,
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
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    return this.chacrasService.findOne(id, usuario.id);
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
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    return this.chacrasService.update(id, usuario.id, updateChacraDto);
  }

  /**
   * DELETE /chacras/:id
   * Eliminar una chacra (cascade elimina cálculos)
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    return this.chacrasService.remove(id, usuario.id);
  }

  /**
   * GET /chacras/:id/calculos
   * Listar todos los cálculos de una chacra
   */
  @Get(':id/calculos')
  async findCalculos(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    return this.chacrasService.findCalculos(id, usuario.id);
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
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );
    return this.chacrasService.findCalculo(id, calculoId, usuario.id);
  }

  /**
   * POST /chacras/:id/calculos
   * Crear un nuevo cálculo para una chacra (calcular y guardar)
   */
  @Post(':id/calculos')
  @HttpCode(HttpStatus.CREATED)
  async createCalculo(
    @Request() req,
    @Param('id', ParseIntPipe) chacraId: number,
    @Body() dto: CalcularYGuardarDto,
  ) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );

    // Verificar que la chacra pertenece al usuario
    const chacra = await this.chacrasService.findOne(chacraId, usuario.id);

    // Ejecutar el cálculo
    const resultado = await this.calculoSueloService.calcularNutrientes(dto.datos);

    // Guardar el cálculo en la base de datos
    const calculoGuardado = await this.chacrasService.saveCalculo(
      chacraId,
      usuario.id,
      dto.nombreMuestra,
      dto.datos,
      resultado,
    );

    return {
      calculoId: calculoGuardado.calculoId,
      chacraNombre: chacra.nombre,
      resultado,
    };
  }

  /**
   * PUT /chacras/:id/calculos/:calculoId
   * Actualizar un cálculo existente (solo el nombre de muestra por ahora)
   */
  @Put(':id/calculos/:calculoId')
  async updateCalculo(
    @Request() req,
    @Param('id', ParseIntPipe) chacraId: number,
    @Param('calculoId', ParseIntPipe) calculoId: number,
    @Body() updateCalculoDto: UpdateCalculoDto,
  ) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );

    return this.chacrasService.updateCalculo(
      chacraId,
      calculoId,
      usuario.id,
      updateCalculoDto.nombreMuestra,
    );
  }

  /**
   * DELETE /chacras/:id/calculos/:calculoId
   * Eliminar un cálculo
   */
  @Delete(':id/calculos/:calculoId')
  @HttpCode(HttpStatus.OK)
  async deleteCalculo(
    @Request() req,
    @Param('id', ParseIntPipe) chacraId: number,
    @Param('calculoId', ParseIntPipe) calculoId: number,
  ) {
    const usuario = await this.authService.findOrCreateByFirebaseUid(
      req.user.uid,
      req.user.phoneNumber,
      req.user.email
    );

    return this.chacrasService.deleteCalculo(chacraId, calculoId, usuario.id);
  }
}
