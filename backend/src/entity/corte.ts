import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable, ManyToOne, JoinColumn } from "typeorm";
import { Servicio } from "./servicio";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Corte {
    @PrimaryGeneratedColumn()
    idCorte!: number;

    @Column()
    estilo!: string;

    @Column()
    imagenUrl!: string;

    // Añadimos relación con ArqueoCaja (que faltaba)
    @ManyToOne(() => ArqueoCaja, (arqueo) => arqueo.cortes)
    @JoinColumn({ name: 'arqueoId' })
    arqueo!: ArqueoCaja;
}