import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('niveles_criticos_micro')
export class NivelCriticoMicro {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 10 })
  elemento: string;

  @Column({ type: 'varchar', length: 20 })
  nivel: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  min: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  max: number;
}
