import { Module } from '@nestjs/common'
import { ChainModule } from '../chain/chain.module'
import { NotificationModule } from '../notification/notification.module'
import { PersistenceModule } from '../persistence/persistence.module'
import { TrackerController } from './tracker.controller'
import { TrackerService } from './tracker.service'

@Module({
  imports: [PersistenceModule, ChainModule, NotificationModule],
  controllers: [TrackerController],
  providers: [TrackerService],
})
export class TrackerModule {}
