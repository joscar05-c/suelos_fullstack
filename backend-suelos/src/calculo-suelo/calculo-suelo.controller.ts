import { Controller, Post, Body } from '@nestjs/common';
import { CalculoSueloService } from './calculo-suelo.service';
import { DatosEntradaDto } from './dto/datos-entrada.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';

@Controller('calculo-suelo')
export class CalculoSueloController {
  constructor(private readonly calculoSueloService: CalculoSueloService) {}

  @Post('calcular-nutrientes')
  async calcularNutrientes(
    @Body() datosEntrada: DatosEntradaDto,
  ): Promise<ResultadoCalculoDto> {
    return this.calculoSueloService.calcularNutrientes(datosEntrada);
  }
}
