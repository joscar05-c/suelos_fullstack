import { Controller, Get } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThan, In } from 'typeorm'; // <--- IMPORTANTE: Importar operadores
import { TexturaSuelo } from '../entities/textura-suelo.entity';
import { TasaMineralizacion } from '../entities/tasa-mineralizacion.entity';
import { FuenteFertilizante } from '../entities/fuente-fertilizante.entity';
import { TipoFertilizante } from '../enums/tipo-fertilizante.enum';

@Controller('catalogo')
export class CatalogoController {
  constructor(
    @InjectRepository(TexturaSuelo)
    private readonly texturaSueloRepository: Repository<TexturaSuelo>,
    
    @InjectRepository(TasaMineralizacion)
    private readonly tasaMineralizacionRepository: Repository<TasaMineralizacion>,
    
    @InjectRepository(FuenteFertilizante)
    private readonly fuenteFertilizanteRepository: Repository<FuenteFertilizante>,
  ) {}

  @Get('texturas')
  async getTexturas() {
    return await this.texturaSueloRepository.find({
      select: ['id', 'nombre'],
      order: { id: 'ASC' }
    });
  }

  @Get('zonas')
  async getZonas() {
    return await this.tasaMineralizacionRepository.find({
      select: ['id', 'zona'],
      order: { id: 'ASC' }
    });
  }

  // ============================================
  // ENDPOINTS FILTRADOS CON INTELIGENCIA AGRONÓMICA
  // ============================================
  // Estos endpoints aplican umbrales mínimos de riqueza para evitar
  // que el usuario elija fertilizantes inadecuados (ej: Guano para Potasio)

  // 1. Solo fuentes ricas en Nitrógeno (N > 9%)
  // Resultado: Urea (46%), Guano (10-14%), Nitrato de Amonio, DAP (18%), etc.
  @Get('fertilizantes/nitrogeno')
  async getFertilizantesN() {
    return await this.fuenteFertilizanteRepository.find({
      where: { porc_n: MoreThan(9) }, 
      order: { porc_n: 'DESC' } // Ordenar por mayor riqueza
    });
  }

  // 2. Solo fuentes ricas en Fósforo (P2O5 > 5%)
  // Resultado: Roca Fosfórica (30%), Superfosfato Triple (46%), DAP (46%), Guano (10-14%), etc.
  @Get('fertilizantes/fosforo')
  async getFertilizantesP() {
    return await this.fuenteFertilizanteRepository.find({
      where: { porc_p2o5: MoreThan(5) },
      order: { porc_p2o5: 'DESC' }
    });
  }

  // 3. Solo fuentes ricas en Potasio (K2O > 15%)
  // ¡AQUÍ ESTÁ EL FILTRO CLAVE!
  // Al pedir más de 15%, ELIMINAMOS AL GUANO (que tiene 2%) y otros aportes mínimos.
  // Resultado: KCl (60%), Sulfato de Potasio (50%), Sulpomag (22%), etc.
  @Get('fertilizantes/potasio')
  async getFertilizantesK() {
    return await this.fuenteFertilizanteRepository.find({
      where: { porc_k2o: MoreThan(15) },
      order: { porc_k2o: 'DESC' }
    });
  }

  // 4. Solo Enmiendas y Fuentes de Calcio (Clasificación ENMIENDA o CaO > 20%)
  // Resultado: Cal Agrícola (40-50% CaO), Dolomita (21-30% CaO), Roca Fosfórica (28% CaO)
  // El Guano (11% CaO) queda fuera porque no alcanza el umbral
  @Get('fertilizantes/enmienda')
  async getFertilizantesCa() {
    return await this.fuenteFertilizanteRepository.find({
      where: [
        { clasificacion: TipoFertilizante.ENMIENDA }, // Enmiendas clasificadas
        { porc_cao: MoreThan(20) }                    // O fuentes ricas en Calcio
      ],
      order: { porc_cao: 'DESC' }
    });
  }
  
  // 5. Endpoint original sin filtros (por compatibilidad o uso administrativo)
  @Get('fertilizantes')
  async getFertilizantesTodos() {
    return await this.fuenteFertilizanteRepository.find({
      order: { id: 'ASC' }
    });
  }
}
