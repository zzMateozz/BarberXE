import { Entity, PrimaryGeneratedColumn, Column, ManyToMany, JoinTable } from "typeorm";
import { Cita } from "./cita";
import { Corte } from "./corte";

@Entity()
export class Servicio {
    @PrimaryGeneratedColumn()
    idServicio!: number;

    @Column()
    nombre!: string;

    @Column()
    precio!: number;

    @Column()
    imagenUrl!: string; 

    @Column()
    duracion!: string; 

    @Column({
        type: 'enum',
        enum: ['activo', 'inactivo'],
        default: 'activo'
    })
    estado!: 'activo' | 'inactivo';

    @ManyToMany(() => Cita, (cita) => cita.servicios, {
    })
    citas!: Cita[];

    @ManyToMany(() => Corte, {
        cascade: true,
        onDelete: 'CASCADE' 
    })
    @JoinTable()
    cortes!: Corte[];
}
