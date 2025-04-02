import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Cita } from "./cita";
import { Corte } from "./corte";

@Entity()
export class Servicio {
    @PrimaryGeneratedColumn()
    idServicio!: number;

    @Column()
    nombre!: string;

    @Column()
    precio!: number;

    @ManyToMany(() => Cita, (cita) => cita.servicios)
    citas!: Cita[];

    @ManyToMany(() => Corte)
    @JoinTable()
    cortes!: Corte[];
    duracion: number;
}
