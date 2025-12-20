import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Usuario } from '../../auth/entities/usuario.entity';
import { CalculoSuelo } from './calculo-suelo.entity';

@Entity('chacra')
export class Chacra {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  nombre: string; // "Chacra 1", "Lote San Juan", etc.

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  areaHa: number;

  @Column({ nullable: true })
  ubicacion: string; // GPS, descripción textual, etc.

  @Column({ type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'usuario_id' })
  usuarioId: number;

  @ManyToOne(() => Usuario, (usuario) => usuario.chacras, {
    onDelete: 'CASCADE',
    eager: false,
  })
  @JoinColumn({ name: 'usuario_id' })
  usuario: Usuario;

  @OneToMany(() => CalculoSuelo, (calculo) => calculo.chacra, {
    cascade: true,
  })
  calculos: CalculoSuelo[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
