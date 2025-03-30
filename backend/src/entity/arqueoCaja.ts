import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne } from "typeorm";
import { Empleado } from "./empleado";
import { Corte } from "./corte";
import { Ingreso } from "./ingreso";
import { Egreso } from "./egreso";

@Entity()
export class ArqueoCaja {
    @PrimaryGeneratedColumn()
    idArqueo!: number;

    @Column()
    fechaInicio!: Date;

    @Column()
    fechaCierre!: Date;

    @ManyToOne(() => Empleado, (empleado) => empleado.arqueos)
    empleado!: Empleado;

    @OneToMany(() => Corte, (corte) => corte)
    cortes!: Corte[];

    @OneToOne(() => Ingreso, (ingreso) => ingreso.arqueo)
    ingreso!: Ingreso;

    @OneToOne(() => Egreso, (egreso) => egreso.arqueo)
    egreso!: Egreso;
}
