import { Module } from '@nestjs/common'
import { ScheduleModule } from '@nestjs/schedule'
import { TypeOrmModule } from '@nestjs/typeorm'
import { TrackingTask } from './persistence/entities/tracking-task.entity'
import { PersistenceModule } from './persistence/persistence.module'
import { TrackerModule } from './tracker/tracker.module'

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: 'tracker.db',
      entities: [TrackingTask],
      synchronize: true, // Auto-create tables (Dev only, but fine for this MVP)
    }),
    PersistenceModule,
    TrackerModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
