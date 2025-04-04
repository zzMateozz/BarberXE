import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Egreso {
    @PrimaryGeneratedColumn()
    idEgreso!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    monto!: number;

    @OneToOne(() => ArqueoCaja, (arqueo) => arqueo.egreso)
    arqueo?: ArqueoCaja; // Hacer opcional
}