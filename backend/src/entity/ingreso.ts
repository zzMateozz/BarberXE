import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Ingreso {
    @PrimaryGeneratedColumn()
    idIngreso!: number;

    @Column("decimal", { precision: 10, scale: 2 })
    monto!: number;

    @OneToOne(() => ArqueoCaja, (arqueo) => arqueo.ingreso)
    arqueo?: ArqueoCaja; // Hacer opcional
}