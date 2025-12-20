import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Chacra } from './chacra.entity';

@Entity('calculo_suelo')
export class CalculoSuelo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  fecha: Date;

  @Column({ nullable: true, name: 'nombre_muestra' })
  nombreMuestra: string; // "Análisis Enero 2025", "Post-Cosecha", etc.

  @Column({ name: 'chacra_id' })
  chacraId: number;

  @ManyToOne(() => Chacra, (chacra) => chacra.calculos, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'chacra_id' })
  chacra: Chacra;

  // ============================================
  // DATOS DE ENTRADA (JSONB para flexibilidad)
  // ============================================
  @Column({ type: 'jsonb', name: 'datos_entrada' })
  datosEntrada: {
    areaHa: number;
    profundidadMetros: number;
    idTextura: number;
    materiaOrganica: number;
    fosforoPpm: number;
    potasioPpm: number;
    idZona: number;
    ph: number;
    ce: number;
    caIntercambiable: number;
    mgIntercambiable: number;
    kIntercambiable: number;
    naIntercambiable: number;
    acidezIntercambiable: number;
    b_ppm?: number;
    cu_ppm?: number;
    zn_ppm?: number;
    mn_ppm?: number;
    fe_ppm?: number;
    s_ppm?: number;
    metaRendimiento: number;
    idFuenteN?: number;
    idFuenteP?: number;
    idFuenteK?: number;
    idFuenteCa?: number;
  };

  // ============================================
  // RESULTADOS COMPLETOS (JSONB)
  // ============================================
  @Column({ type: 'jsonb' })
  resultados: {
    balanceNutricional: any;
    recomendacionFertilizacion: any;
    enmiendaCalcio: any;
    cronograma: any;
    interpretacionQuimica: any;
    equilibrioCationico: any;
    micronutrientes: any;
    alertas: any[];
    // Datos adicionales para el frontend
    nitrogenoDisponibleKg?: number;
    fosforoDisponibleKg?: number;
    potasioDisponibleKg?: number;
    magnesioDisponibleKg?: number;
    azufreDisponibleKg?: number;
  };

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
