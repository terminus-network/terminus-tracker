import { Injectable } from '@nestjs/common'
import { ChainService } from './chain.service'
import { EvmService } from './evm.service'
import { TronService } from './tron.service'

@Injectable()
export class ChainFactory {
  constructor(
    private readonly evmService: EvmService,
    private readonly tronService: TronService,
  ) {}

  getService(chain: string): ChainService {
    switch (chain) {
      case 'ETH':
        return this.evmService
      case 'TRON':
        return this.tronService
      default:
        throw new Error(`Unsupported chain: ${chain}`)
    }
  }
}
