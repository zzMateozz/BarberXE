import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn } from "typeorm";
import { Empleado } from "./empleado";
import { Cliente } from "./cliente";
@Entity()
export class User {
    @PrimaryGeneratedColumn()
    idUser!: number;

    @Column()
    usuario!: string;

    @Column()
    contraseña!: string;

    // Relación 1:1 con Empleado
    @OneToOne(() => Empleado, empleado => empleado.user, { cascade: true })
    @JoinColumn({ name: 'empleadoId' })
    empleado?: Empleado;

    // Relación 1:1 con Cliente
    @OneToOne(() => Cliente, cliente => cliente.user, { cascade: true })
    @JoinColumn({ name: 'clienteId' })
    cliente?: Cliente;
}
