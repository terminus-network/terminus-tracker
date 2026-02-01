import { HttpModule } from '@nestjs/axios'
import { Module } from '@nestjs/common'
import { ChainFactory } from './chain.factory'
import { EvmService } from './evm.service'
import { TronService } from './tron.service'

@Module({
  imports: [HttpModule],
  providers: [EvmService, TronService, ChainFactory],
  exports: [ChainFactory],
})
export class ChainModule {}
