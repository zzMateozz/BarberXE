import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from "typeorm";
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

    @OneToOne(() => Empleado, (empleado) => empleado.user)
    empleado!: Empleado;

    @OneToOne(() => Cliente, (cliente) => cliente.user)
    cliente!: Cliente;
}
