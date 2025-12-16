import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Badge extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id!: number;

  @Column({ length: 64 })
  name!: string;

  @Column({ length: 64 })
  trace!: string;
}
