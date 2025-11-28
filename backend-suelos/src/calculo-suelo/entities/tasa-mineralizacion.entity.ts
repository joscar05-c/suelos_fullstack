import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TasaMineralizacion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  zona: string;

  @Column('decimal', { precision: 4, scale: 2 })
  porcentaje: number;
}
