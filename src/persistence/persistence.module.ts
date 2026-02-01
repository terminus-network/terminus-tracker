import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TrackingTask } from './entities/tracking-task.entity'

@Module({
  imports: [TypeOrmModule.forFeature([TrackingTask])],
  exports: [TypeOrmModule],
})
export class PersistenceModule {}
