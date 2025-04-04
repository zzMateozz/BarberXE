import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn } from "typeorm";
import { Empleado } from "./empleado";
import { Corte } from "./corte";
import { Ingreso } from "./ingreso";
import { Egreso } from "./egreso";

@Entity()
export class ArqueoCaja {
    @PrimaryGeneratedColumn()
    idArqueo!: number;

    @Column("datetime")
    fechaInicio!: Date;

    @Column("datetime", { nullable: true })
    fechaCierre!: Date | null;

    // Relación con Empleado
    @ManyToOne(() => Empleado, (empleado) => empleado.arqueos)
    @JoinColumn({ name: 'empleadoId' })
    empleado!: Empleado;

    // Relación con Cortes (corregida)
    @OneToMany(() => Corte, (corte) => corte.arqueo)
    cortes!: Corte[];

    // Relación con Ingreso
    @OneToOne(() => Ingreso, (ingreso) => ingreso.arqueo, { 
        cascade: true,
        nullable: true 
    })
    @JoinColumn({ name: 'ingresoId' })
    ingreso?: Ingreso;

    // Relación con Egreso
    @OneToOne(() => Egreso, (egreso) => egreso.arqueo, { 
        cascade: true,
        nullable: true 
    })
    @JoinColumn({ name: 'egresoId' })
    egreso?: Egreso;
}