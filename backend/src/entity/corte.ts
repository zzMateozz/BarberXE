import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from "typeorm";
import { Servicio } from "./servicio";

@Entity()
export class Corte {
    @PrimaryGeneratedColumn()
    idCorte!: number;

    @Column()
    estilo!: string;

    @ManyToMany(() => Servicio, (servicio) => servicio.cortes)
    servicios!: Servicio[];
}
