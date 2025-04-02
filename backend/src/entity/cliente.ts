import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm";
import { User } from "./user";
import { Cita } from "./cita";

@Entity()
export class Cliente {
    @PrimaryGeneratedColumn()
    idCliente!: number;

    @Column()
    nombre!: string;

    @Column()
    apellido!: string;

    @Column()
    telefono!: string;

    @OneToOne(() => User, (user) => user.cliente)
    user?: User;

    @OneToMany(() => Cita, (cita) => cita.cliente)
    citas!: Cita[];
}
