import { Injectable, Logger } from '@nestjs/common'
import { formatUnits, JsonRpcProvider } from 'ethers'
import { ChainService, Transaction } from './chain.service'

@Injectable()
export class EvmService extends ChainService {
  private readonly logger = new Logger(EvmService.name)
  private provider: JsonRpcProvider
  private readonly rpcUrl = process.env.ETH_RPC_URL

  constructor() {
    super()
    this.provider = new JsonRpcProvider(this.rpcUrl)
  }

  getChainName(): string {
    return 'ETH'
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber()
  }

  async getTransactions(
    address: string,
    startBlock?: number,
  ): Promise<Transaction[]> {
    // Note: Standard JSON-RPC does not support "getTransactionsByAddress".
    // In a real production environment, we usually rely on:
    // 1. External Indexer API (Etherscan, Alchemy, etc.) -> Simplest for "Pull" model
    // 2. Scan every block and filter locally -> Heavy resource usage
    // 3. getLogs (for Tokens) -> Efficient for ERC20

    // For this MVP and "Ephemeral Scanner" architecture, we will use `getLogs` for ERC20
    // and `getBlock` loop for native ETH (simplified).

    // HOWEVER, since the requirement is "On-chain Transaction Tracking",
    // and we want to support native ETH transfer detection without an Indexer,
    // the most reliable way without external API is to scan blocks.

    // But since this is a "Dynamic Task" looking for a specific address,
    // we can optimize:
    // If it's a "Native ETH" check, we might need to rely on `provider.getBalance` change
    // or scan the latest few blocks.

    // To make this MVP workable without an API Key (like Etherscan),
    // I will implement a "Recent Block Scanner" for the demo.
    // It fetches the latest block and filters txs.

    if (startBlock) {
      this.logger.debug(`Fetching from block ${startBlock} (Simulated)`)
    }

    const currentBlock = await this.provider.getBlock('latest', true) // true = prefetch txs
    if (!currentBlock)
      return []

    const transactions: Transaction[] = []

    for (const tx of currentBlock.prefetchedTransactions) {
      if (
        tx.to?.toLowerCase() === address.toLowerCase()
        || tx.from?.toLowerCase() === address.toLowerCase()
      ) {
        transactions.push({
          hash: tx.hash,
          from: tx.from,
          to: tx.to || '',
          value: formatUnits(tx.value, 18), // Assume 18 decimals for ETH
          blockNumber: currentBlock.number,
          timestamp: currentBlock.timestamp,
          input: tx.data,
        })
      }
    }

    return transactions
  }
}
