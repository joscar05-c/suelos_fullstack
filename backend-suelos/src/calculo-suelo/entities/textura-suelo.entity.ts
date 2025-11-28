import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TexturaSuelo {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string;

  @Column('decimal', { precision: 4, scale: 2 })
  densidadAparente: number;
}
