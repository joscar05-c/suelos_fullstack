import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('relaciones_cationicas')
export class RelacionCationica {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 20 })
  nombre: string;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  min: number;

  @Column({ type: 'decimal', precision: 4, scale: 2 })
  max: number;
}
