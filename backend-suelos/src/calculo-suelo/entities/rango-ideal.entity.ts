import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('rangos_ideales')
export class RangoIdeal {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  parametro: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorMin: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  valorMax: number;

  @Column({ type: 'varchar', length: 20 })
  unidad: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  descripcion: string;
}
