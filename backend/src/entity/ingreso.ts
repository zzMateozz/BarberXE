import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Ingreso {
    @PrimaryGeneratedColumn()
    idIngreso!: number;

    @Column()
    monto!: number;

    @OneToOne(() => ArqueoCaja, (arqueo) => arqueo.ingreso)
    arqueo!: ArqueoCaja;
}
