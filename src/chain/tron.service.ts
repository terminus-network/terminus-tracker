import type { Transaction } from './chain.service'
import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'
import { ChainService } from './chain.service'

@Injectable()
export class TronService extends ChainService {
  private readonly logger = new Logger(TronService.name)
  private readonly baseUrl = process.env.TRON_RPC_URL || 'https://api.trongrid.io'

  constructor(private readonly httpService: HttpService) {
    super()
  }

  getChainName(): string {
    return 'TRON'
  }

  async getBlockNumber(): Promise<number> {
    try {
      const { data } = await firstValueFrom(
        this.httpService.get(`${this.baseUrl}/wallet/getnowblock`),
      )
      return data.block_header.raw_data.number
    }
    catch (error: any) {
      this.logger.error(`Error fetching TRON block number: ${error.message}`)
      return 0
    }
  }

  async getTransactions(
    address: string,

    startBlock?: number,
  ): Promise<Transaction[]> {
    try {
      // Limit to 20 for ephemeral scanning
      const url = `${this.baseUrl}/v1/accounts/${address}/transactions?limit=20`
      const { data } = await firstValueFrom(this.httpService.get(url))

      if (!data.data)
        return []

      return data.data.map((tx: any) => ({
        hash: tx.txID,
        from: tx.raw_data.contract[0].parameter.value.owner_address,
        to: tx.raw_data.contract[0].parameter.value.to_address,
        value: tx.raw_data.contract[0].parameter.value.amount?.toString() || '0',
        blockNumber: tx.blockNumber, // TronGrid might not return this directly in v1/transactions sometimes, need check
        timestamp: tx.block_timestamp,
        input: '', // Tron generic txs usually don't have input like EVM in this view
      }))
    }
    catch (error: any) {
      this.logger.error(`Error fetching TRON transactions: ${error.message}`)
      return []
    }
  }
}
