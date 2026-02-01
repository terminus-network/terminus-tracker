import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from 'typeorm'

export enum TaskStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  TIMEOUT = 'TIMEOUT',
  FAILED = 'FAILED',
}

@Entity()
export class TrackingTask {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  @Index()
  chain: string

  @Column()
  @Index()
  address: string

  @Column({ nullable: true })
  tag: string // Memo or Tag

  @Column()
  targetAmount: string // Store as string for precision

  @Column()
  targetCurrency: string // e.g., 'ETH', 'USDT'

  @Column({ nullable: true })
  contractAddress: string // If it's a token

  @Column({
    type: 'simple-enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  @Index()
  status: TaskStatus

  @Column()
  callbackUrl: string

  @CreateDateColumn()
  createdAt: Date

  @Column()
  timeoutAt: Date
}
