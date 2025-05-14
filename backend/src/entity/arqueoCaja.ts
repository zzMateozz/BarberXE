
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { Empleado } from "./empleado";
import { Corte } from "./corte";
import { Ingreso } from "./ingreso";
import { Egreso } from "./egreso";

@Entity()
export class ArqueoCaja {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    idArqueo!: number;

    @Column({ type: 'datetime', precision: 6 })
    fechaInicio!: Date;

    @Column({ type: 'datetime', precision: 6, nullable: true })
    fechaCierre!: Date | null;

    @Column({ type: 'decimal', precision: 12, scale: 2, default: 0.00 })
    saldoInicial!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
    saldoFinal!: number | null;

    @Column({ type: 'text', nullable: true, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
    observaciones!: string | null;

    @ManyToOne(() => Empleado, (empleado) => empleado.arqueos)
    @JoinColumn({ name: 'empleadoId' })
    empleado!: Empleado;

    @OneToMany(() => Corte, (corte) => corte.arqueo)
    cortes!: Corte[];

    @OneToMany(() => Ingreso, (ingreso) => ingreso.arqueo)
    ingresos!: Ingreso[];

    @OneToMany(() => Egreso, (egreso) => egreso.arqueo)
    egresos!: Egreso[];
}