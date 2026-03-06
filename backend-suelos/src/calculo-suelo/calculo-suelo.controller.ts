import {
  Controller,
  Post,
  Body,
} from '@nestjs/common';
import { CalculoSueloService } from './calculo-suelo.service';
import { DatosEntradaDto } from './dto/datos-entrada.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';

@Controller('calculo-suelo')
export class CalculoSueloController {
  constructor(
    private readonly calculoSueloService: CalculoSueloService,
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
   * ⚠️ ENDPOINT DEPRECADO - Usar POST /chacras/:id/calculos en su lugar
   * 
   * El endpoint /calculo-suelo/calcular-y-guardar ha sido deprecado.
   * Ahora usa el enfoque REST: POST /chacras/:id/calculos
   * 
   * Ventajas del nuevo endpoint:
   * - Más REST-ful (recurso anidado)
   * - chacraId en la URL (más claro)
   * - Consistente con CRUD de chacras
   */
}
