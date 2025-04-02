import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, ManyToMany, JoinTable } from "typeorm";
import { Cliente } from "./cliente";
import { Empleado } from "./empleado";
import { Servicio } from "./servicio";

@Entity()
export class Cita {
    @PrimaryGeneratedColumn()
    idCita!: number;

    @Column()
    fecha!: Date;

    @ManyToOne(() => Cliente, (cliente) => cliente.citas)
    cliente!: Cliente;

    @ManyToOne(() => Empleado, (empleado) => empleado.citas)
    empleado!: Empleado;

    @ManyToMany(() => Servicio)
    @JoinTable()
    servicios!: Servicio[];
    corte: import("c:/Users/Lopex/Documents/Trabajos_U/Software 2/BarberXE/backend/src/entity/corte").Corte;
    duracionTotal: number;
    precioTotal: number;
}
