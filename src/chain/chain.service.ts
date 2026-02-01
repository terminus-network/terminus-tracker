export interface Transaction {
  hash: string
  from: string
  to: string
  value: string // BigNumber string
  blockNumber: number
  timestamp?: number
  input?: string // For Memo/Tag check
}

export abstract class ChainService {
  abstract getChainName(): string

  /**
   * Fetch latest transactions for a specific address.
   * This is used for polling-based tracking.
   */
  abstract getTransactions(
    address: string,
    startBlock?: number,
  ): Promise<Transaction[]>

  /**
   * Get current block height
   */
  abstract getBlockNumber(): Promise<number>
}
