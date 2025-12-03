import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';
import { TipoFertilizante } from '../enums/tipo-fertilizante.enum';

@Entity('fuentes_fertilizantes')
export class FuenteFertilizante {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 100 })
  nombre: string;

  @Column({
    type: 'text',
    default: TipoFertilizante.COMPUESTO
  })
  clasificacion: TipoFertilizante;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porc_n: number; // % Nitrógeno

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porc_p2o5: number; // % Fósforo (P2O5)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  porc_k2o: number; // % Potasio (K2O)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_cao: number; // % Calcio (CaO)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_mgo: number; // % Magnesio (MgO)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_s: number; // % Azufre (S)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_b: number; // % Boro (B)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_cu: number; // % Cobre (Cu)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_zn: number; // % Zinc (Zn)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_mn: number; // % Manganeso (Mn)

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0, nullable: true })
  porc_fe: number; // % Hierro (Fe)
}
