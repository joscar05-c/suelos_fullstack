import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Chacra } from '../../chacras/entities/chacra.entity';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  @Index()
  firebaseUid: string;

  @Column({ nullable: true })
  email?: string;

  @Column({ nullable: true })
  nombre?: string;

  @Column({ nullable: true })
  telefono?: string;

  @Column({ default: true })
  activo: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Chacra, (chacra) => chacra.usuario, { cascade: true })
  chacras: Chacra[];
}
