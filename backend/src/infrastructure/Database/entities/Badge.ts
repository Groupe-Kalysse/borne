import { BaseEntity, Column, Entity, PrimaryGeneratedColumn } from "typeorm";

export enum Role {
  STAFF = "STAFF",
  CLIENT = "CLIENT",
}

@Entity()
export class Badge extends BaseEntity {
  @PrimaryGeneratedColumn()
  readonly id!: number;

  @Column({ length: 64 })
  name!: string;

  @Column({ length: 64 })
  trace!: string;

  @Column({
    type: "enum",
    enum: Role,
    default: Role.CLIENT,
  })
  role!: Role;
}
