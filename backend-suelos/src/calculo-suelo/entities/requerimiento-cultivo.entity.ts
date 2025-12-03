import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('requerimientos_cultivo')
export class RequerimientoCultivo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, default: 'Cafe' })
  cultivo: string;

  @Column({ type: 'int' })
  metaQuintales: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  n: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  p2o5: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  k2o: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  cao: number;

  @Column({ type: 'decimal', precision: 6, scale: 2 })
  mgo: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  s: number; // Azufre (SO4)

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  b: number; // Boro

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cu: number; // Cobre

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  zn: number; // Zinc

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  mn: number; // Manganeso

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  fe: number; // Hierro
}
