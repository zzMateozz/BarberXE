
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from "typeorm";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Ingreso {
    @PrimaryGeneratedColumn({ type: 'int', unsigned: true })
    idIngreso!: number;

    @Column({ type: 'decimal', precision: 12, scale: 2 })
    monto!: number;

    @Column({ type: 'varchar', length: 255, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
    descripcion!: string;

    @Column({ type: 'datetime', precision: 6 })
    fecha!: Date;

    @Column({ type: 'varchar', length: 50, nullable: true, charset: 'utf8mb4', collation: 'utf8mb4_unicode_ci' })
    tipo!: string | null;

    @ManyToOne(() => ArqueoCaja, (arqueo) => arqueo.ingresos)
    @JoinColumn({ name: 'arqueoId' })
    arqueo!: ArqueoCaja;
}