import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class FactorNutriente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  elemento: string; // 'N', 'P', 'K'

  @Column('decimal', { precision: 4, scale: 2 })
  disponibilidad: number;

  @Column('decimal', { precision: 6, scale: 4 })
  factorConversion: number;
}
