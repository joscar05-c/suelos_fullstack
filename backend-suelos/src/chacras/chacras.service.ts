import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chacra } from './entities/chacra.entity';
import { CalculoSuelo } from './entities/calculo-suelo.entity';
import { CreateChacraDto } from './dto/create-chacra.dto';
import { UpdateChacraDto } from './dto/update-chacra.dto';

@Injectable()
export class ChacrasService {
  constructor(
    @InjectRepository(Chacra)
    private readonly chacraRepository: Repository<Chacra>,
    @InjectRepository(CalculoSuelo)
    private readonly calculoRepository: Repository<CalculoSuelo>,
  ) {}

  /**
   * Listar chacras del usuario autenticado
   */
  async findAll(userId: number) {
    const chacras = await this.chacraRepository
      .createQueryBuilder('chacra')
      .leftJoinAndSelect('chacra.calculos', 'calculo')
      .where('chacra.usuarioId = :userId', { userId })
      .orderBy('chacra.createdAt', 'DESC')
      .getMany();

    // Agregar metadata de cada chacra
    return chacras.map((chacra) => ({
      id: chacra.id,
      nombre: chacra.nombre,
      areaHa: chacra.areaHa,
      ubicacion: chacra.ubicacion,
      descripcion: chacra.descripcion,
      createdAt: chacra.createdAt,
      updatedAt: chacra.updatedAt,
      totalCalculos: chacra.calculos?.length || 0,
      ultimoCalculo: chacra.calculos?.[0]?.fecha || null,
    }));
  }

  /**
   * Crear nueva chacra
   */
  async create(userId: number, createChacraDto: CreateChacraDto) {
    const chacra = this.chacraRepository.create({
      ...createChacraDto,
      usuarioId: userId,
    });

    return await this.chacraRepository.save(chacra);
  }

  /**
   * Obtener una chacra específica con sus cálculos
   */
  async findOne(chacraId: number, userId: number) {
    const chacra = await this.chacraRepository.findOne({
      where: { id: chacraId },
      relations: ['calculos'],
    });

    if (!chacra) {
      throw new NotFoundException(`Chacra con ID ${chacraId} no encontrada`);
    }

    // Verificar que pertenece al usuario
    if (chacra.usuarioId !== userId) {
      throw new ForbiddenException('No tienes permiso para acceder a esta chacra');
    }

    return chacra;
  }

  /**
   * Actualizar chacra
   */
  async update(chacraId: number, userId: number, updateChacraDto: UpdateChacraDto) {
    const chacra = await this.findOne(chacraId, userId);

    Object.assign(chacra, updateChacraDto);
    return await this.chacraRepository.save(chacra);
  }

  /**
   * Eliminar chacra (cascade elimina cálculos)
   */
  async remove(chacraId: number, userId: number) {
    const chacra = await this.findOne(chacraId, userId);
    await this.chacraRepository.remove(chacra);
    return { message: 'Chacra eliminada correctamente' };
  }

  /**
   * Listar cálculos de una chacra
   */
  async findCalculos(chacraId: number, userId: number) {
    // Verificar que la chacra pertenece al usuario
    await this.findOne(chacraId, userId);

    const calculos = await this.calculoRepository.find({
      where: { chacraId },
      order: { fecha: 'DESC' },
    });

    // Retornar metadata de cada cálculo
    return calculos.map((calculo) => ({
      id: calculo.id,
      fecha: calculo.fecha,
      nombreMuestra: calculo.nombreMuestra,
      metaRendimiento: calculo.datosEntrada.metaRendimiento,
      ph: calculo.datosEntrada.ph,
      materiaOrganica: calculo.datosEntrada.materiaOrganica,
      alertasCount: calculo.resultados.alertas?.length || 0,
      createdAt: calculo.createdAt,
    }));
  }

  /**
   * Obtener un cálculo específico
   */
  async findCalculo(chacraId: number, calculoId: number, userId: number) {
    // Verificar que la chacra pertenece al usuario
    await this.findOne(chacraId, userId);

    const calculo = await this.calculoRepository.findOne({
      where: { id: calculoId, chacraId },
    });

    if (!calculo) {
      throw new NotFoundException(`Cálculo con ID ${calculoId} no encontrado`);
    }

    return calculo;
  }

  /**
   * Guardar un nuevo cálculo asociado a una chacra
   */
  async saveCalculo(
    chacraId: number,
    userId: number,
    nombreMuestra: string | undefined,
    datosEntrada: any,
    resultados: any,
  ) {
    // Verificar que la chacra pertenece al usuario
    const chacra = await this.findOne(chacraId, userId);

    const calculo = this.calculoRepository.create({
      chacraId,
      nombreMuestra: nombreMuestra || `Análisis ${new Date().toLocaleDateString('es-ES')}`,
      datosEntrada,
      resultados,
    });

    const savedCalculo = await this.calculoRepository.save(calculo);

    return {
      calculoId: savedCalculo.id,
      chacraNombre: chacra.nombre,
      message: 'Cálculo guardado correctamente',
    };
  }
}
