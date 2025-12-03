import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('eficiencias_nutrientes')
export class EficienciaNutriente {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  elemento: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  valor: number;
}
