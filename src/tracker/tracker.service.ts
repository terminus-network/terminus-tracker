import { Injectable, Logger } from '@nestjs/common'
import { SchedulerRegistry } from '@nestjs/schedule'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { ChainFactory } from '../chain/chain.factory'
import { WebhookService } from '../notification/webhook.service'
import {
  TaskStatus,
  TrackingTask,
} from '../persistence/entities/tracking-task.entity'

@Injectable()
export class TrackerService {
  private readonly logger = new Logger(TrackerService.name)
  private readonly activePollers = new Map<string, NodeJS.Timeout>() // Key: Chain+Address

  constructor(
    @InjectRepository(TrackingTask)
    private readonly taskRepo: Repository<TrackingTask>,
    private readonly chainFactory: ChainFactory,
    private readonly schedulerRegistry: SchedulerRegistry,
    private readonly webhookService: WebhookService,
  ) {}

  /**
   * Load pending tasks on startup
   */
  async onModuleInit() {
    const pendingTasks = await this.taskRepo.find({
      where: { status: TaskStatus.PENDING },
    })
    this.logger.log(`Restoring ${pendingTasks.length} pending tasks...`)
    for (const task of pendingTasks) {
      this.startPolling(task)
    }
  }

  /**
   * Start tracking a new order
   */
  async trackOrder(
    chain: string,
    address: string,
    amount: string,
    currency: string,
    tag: string,
    callbackUrl: string,
    timeoutSeconds = 3600,
  ) {
    const task = this.taskRepo.create({
      chain,
      address,
      targetAmount: amount,
      targetCurrency: currency,
      tag,
      callbackUrl,
      timeoutAt: new Date(Date.now() + timeoutSeconds * 1000),
    })

    await this.taskRepo.save(task)
    this.logger.log(`Created new tracking task: ${task.id} for ${address}`)

    this.startPolling(task)
    return task
  }

  private getChainService(chain: string) {
    return this.chainFactory.getService(chain)
  }

  /**
   * Start or join a polling loop for a specific address
   */
  private startPolling(task: TrackingTask) {
    const pollerKey = `${task.chain}:${task.address}`

    // If a poller already exists for this address, we don't need to do anything.
    // The existing poller will pick up this new task automatically because it queries the DB.
    if (this.activePollers.has(pollerKey)) {
      this.logger.debug(
        `Poller already exists for ${pollerKey}, task ${task.id} joined.`,
      )
      return
    }

    this.logger.log(`Starting new Poller for ${pollerKey}`)

    const interval = setInterval(() => {
      this.pollAddress(task.chain, task.address)
    }, 10000) // Poll every 10 seconds

    this.activePollers.set(pollerKey, interval)
    this.schedulerRegistry.addInterval(pollerKey, interval)
  }

  /**
   * Core Polling Logic:
   * 1. Fetch active tasks for this address
   * 2. Fetch latest txs from Chain
   * 3. Match
   * 4. Callback & Cleanup
   */
  private async pollAddress(chain: string, address: string) {
    const pollerKey = `${chain}:${address}`

    // 1. Find all PENDING tasks for this address
    const tasks = await this.taskRepo.find({
      where: {
        chain,
        address,
        status: TaskStatus.PENDING,
      },
    })

    // If no tasks left, stop polling to save resources
    if (tasks.length === 0) {
      this.logger.log(`No pending tasks for ${pollerKey}, stopping poller.`)
      this.stopPolling(pollerKey)
      return
    }

    // 2. Check Timeouts
    const now = new Date()
    for (const task of tasks) {
      if (task.timeoutAt < now) {
        this.logger.warn(`Task ${task.id} timed out.`)
        task.status = TaskStatus.TIMEOUT
        await this.taskRepo.save(task)
        await this.webhookService.notify(task.callbackUrl, {
          id: task.id,
          status: TaskStatus.TIMEOUT,
          reason: 'Task timed out',
        })
      }
    }

    // Filter out just-timed-out tasks
    const activeTasks = tasks.filter(t => t.status === TaskStatus.PENDING)
    if (activeTasks.length === 0)
      return

    try {
      // 3. Fetch Transactions
      const chainService = this.getChainService(chain)
      const txs = await chainService.getTransactions(address)

      // 4. Match
      for (const tx of txs) {
        for (const task of activeTasks) {
          // Check Amount
          if (Number.parseFloat(tx.value) >= Number.parseFloat(task.targetAmount)) {
            // Check Tag/Memo (if required)
            if (task.tag && !tx.input?.includes(task.tag)) {
              continue
            }

            this.logger.log(
              `MATCH FOUND! Task ${task.id} matched with TX ${tx.hash}`,
            )

            // 5. Update Status & Callback
            task.status = TaskStatus.COMPLETED
            await this.taskRepo.save(task)

            await this.webhookService.notify(task.callbackUrl, {
              id: task.id,
              status: TaskStatus.COMPLETED,
              txHash: tx.hash,
              amount: tx.value,
              currency: task.targetCurrency,
              from: tx.from,
              to: tx.to,
            })
          }
        }
      }
    }
    catch (error) {
      this.logger.error(
        `Error polling ${pollerKey}: ${(error as Error).message}`,
      )
    }
  }

  private stopPolling(key: string) {
    if (this.activePollers.has(key)) {
      clearInterval(this.activePollers.get(key))
      this.activePollers.delete(key)
      try {
        this.schedulerRegistry.deleteInterval(key)
      }
      catch {
        // Ignore if already deleted
      }
    }
  }
}
