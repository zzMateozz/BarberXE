import { Entity, PrimaryGeneratedColumn, Column, OneToOne, OneToMany } from "typeorm";
import { User } from "./user";
import { Cita } from "./cita";
import { ArqueoCaja } from "./arqueoCaja";

@Entity()
export class Empleado {
    @PrimaryGeneratedColumn()
    idEmpleado!: number;

    @Column()
    nombre!: string;

    @Column()
    apellido!: string;

    @Column()
    telefono!: string;

    @Column({ nullable: true })
    imagenPerfil?: string;

    @Column({
        type: 'enum',
        enum: ['activo', 'inactivo'],
        default: 'activo'
    })
    estado!: 'activo' | 'inactivo';

    @Column({
        type: 'enum',
        enum: ['Barbero', 'Cajero'],
        default: 'Barbero'
    })
    cargo!: 'Barbero' | 'Cajero';

    @OneToOne(() => User, (user) => user.empleado)
    user?: User;

    @OneToMany(() => Cita, (cita) => cita.empleado)
    citas!: Cita[];

    @OneToMany(() => ArqueoCaja, (arqueo) => arqueo.empleado, {
        cascade: true, // Esto permite operaciones en cascada
        onDelete: 'CASCADE' // Esto configura la eliminación en cascada a nivel de BD
    })
    arqueos!: ArqueoCaja[];
}
