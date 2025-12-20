import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { CalculoSueloService } from './calculo-suelo.service';
import { DatosEntradaDto } from './dto/datos-entrada.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CalcularYGuardarDto } from '../chacras/dto/calcular-y-guardar.dto';
import { ChacrasService } from '../chacras/chacras.service';

@Controller('calculo-suelo')
export class CalculoSueloController {
  constructor(
    private readonly calculoSueloService: CalculoSueloService,
    private readonly chacrasService: ChacrasService,
  ) {}

  /**
   * POST /calculo-suelo/calcular-nutrientes
   * Endpoint público para calcular sin guardar (modo invitado)
   */
  @Post('calcular-nutrientes')
  async calcularNutrientes(
    @Body() datosEntrada: DatosEntradaDto,
  ): Promise<ResultadoCalculoDto> {
    return this.calculoSueloService.calcularNutrientes(datosEntrada);
  }

  /**
   * POST /calculo-suelo/calcular-y-guardar
   * Endpoint protegido para calcular y guardar en una chacra específica
   */
  @Post('calcular-y-guardar')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.CREATED)
  async calcularYGuardar(
    @Request() req,
    @Body() dto: CalcularYGuardarDto,
  ): Promise<{
    calculoId: number;
    chacraNombre: string;
    resultado: ResultadoCalculoDto;
  }> {
    // 1. Verificar que la chacra pertenece al usuario
    const chacra = await this.chacrasService.findOne(
      dto.chacraId,
      req.user.userId,
    );

    // 2. Ejecutar el cálculo
    const resultado =
      await this.calculoSueloService.calcularNutrientes(dto.datos);

    // 3. Guardar el cálculo en la base de datos
    const calculoGuardado = await this.chacrasService.saveCalculo(
      dto.chacraId,
      req.user.userId,
      dto.nombreMuestra,
      dto.datos,
      resultado,
    );

    // 4. Retornar respuesta con metadatos
    return {
      calculoId: calculoGuardado.calculoId,
      chacraNombre: calculoGuardado.chacraNombre,
      resultado,
    };
  }
}
