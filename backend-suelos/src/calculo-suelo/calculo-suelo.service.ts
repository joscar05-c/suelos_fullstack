import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TexturaSuelo } from './entities/textura-suelo.entity';
import { TasaMineralizacion } from './entities/tasa-mineralizacion.entity';
import { FactorNutriente } from './entities/factor-nutriente.entity';
import { DatosEntradaDto } from './dto/datos-entrada.dto';
import { ResultadoCalculoDto } from './dto/resultado-calculo.dto';

@Injectable()
export class CalculoSueloService {
  constructor(
    @InjectRepository(TexturaSuelo)
    private readonly texturaSueloRepository: Repository<TexturaSuelo>,
    @InjectRepository(TasaMineralizacion)
    private readonly tasaMineralizacionRepository: Repository<TasaMineralizacion>,
    @InjectRepository(FactorNutriente)
    private readonly factorNutrienteRepository: Repository<FactorNutriente>,
  ) {}

  async calcularNutrientes(
    datos: DatosEntradaDto,
  ): Promise<ResultadoCalculoDto> {
    // Paso Crítico: Buscar densidad aparente según idTextura
    const textura = await this.texturaSueloRepository.findOne({
      where: { id: datos.idTextura },
    });

    if (!textura) {
      throw new NotFoundException(
        `Textura de suelo con ID ${datos.idTextura} no encontrada`,
      );
    }

    // Buscar tasa de mineralización según idZona
    const tasa = await this.tasaMineralizacionRepository.findOne({
      where: { id: datos.idZona },
    });

    if (!tasa) {
      throw new NotFoundException(
        `Tasa de mineralización con ID ${datos.idZona} no encontrada`,
      );
    }

    // Buscar factores de nutrientes (N, P, K)
    const factorN = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'N' },
    });
    const factorP = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'P' },
    });
    const factorK = await this.factorNutrienteRepository.findOne({
      where: { elemento: 'K' },
    });

    if (!factorN || !factorP || !factorK) {
      throw new BadRequestException(
        'Factores de nutrientes no encontrados en la base de datos',
      );
    }

    // PASO A: constantes
    const densidad = Number(textura.densidadAparente);
    const porcentajeMineralizacion = Number(tasa.porcentaje);
    const factorDisponibilidadN = Number(factorN.disponibilidad);
    const factorDisponibilidadP = Number(factorP.disponibilidad);
    const factorDisponibilidadK = Number(factorK.disponibilidad);
    const factorConversionP = Number(factorP.factorConversion);
    const factorConversionK = Number(factorK.factorConversion);

    // calculo PCA
    const areaM2 = datos.areaHa * 10000;
    const pcaToneladas = areaM2 * densidad * datos.profundidadMetros;

    //calculo de N
    const moTotal = pcaToneladas * (datos.materiaOrganica / 100);
    const nOrganico = moTotal * 0.05;
    const nMineralizado = nOrganico * (porcentajeMineralizacion / 100);
    const nMineralizadoKg = nMineralizado * 1000; // convertir toneladas a kg
    const nDisponible = nMineralizadoKg * factorDisponibilidadN;

    // calculo P
    const pElementalKg = (datos.fosforoPpm * pcaToneladas) / 1000;
    const p2o5Total = pElementalKg * factorConversionP;
    const pDisponible = p2o5Total * factorDisponibilidadP;

    // calculo K
    const kElementalKg = (datos.potasioPpm * pcaToneladas) / 1000;
    const k2oTotal = kElementalKg * factorConversionK;
    const kDisponible = k2oTotal * factorDisponibilidadK;

    // Retornar resultado con 3 decimales
    return {
      pcaToneladas: Number(pcaToneladas.toFixed(3)),
      nitrogenoDisponibleKg: Number(nDisponible.toFixed(3)),
      fosforoDisponibleKg: Number(pDisponible.toFixed(3)),
      potasioDisponibleKg: Number(kDisponible.toFixed(3)),
    };
  }
}
