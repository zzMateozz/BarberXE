import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm";
import { User } from "./user";
import { Cita } from "./cita";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Empleado {
    @PrimaryGeneratedColumn()
    idEmpleado!: number;

    @Column()
    nombre!: string;

    @Column()
    apellido!: string;

    @Column()
    telefono!: string;

    @OneToOne(() => User, (user) => user.empleado)
    user?: User;

    @OneToMany(() => Cita, (cita) => cita.empleado)
    citas!: Cita[];

    @OneToMany(() => ArqueoCaja, (arqueo) => arqueo.empleado)
    arqueos!: ArqueoCaja[];
}
