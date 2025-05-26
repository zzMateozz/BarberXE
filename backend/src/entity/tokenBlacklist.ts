import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class TokenBlacklist {
    @PrimaryGeneratedColumn()
    id!: number;

    @Column({ unique: true })
    token!: string;

    @Column({ type: 'timestamp' })
    expiresAt!: Date;
}