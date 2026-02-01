import { HttpService } from '@nestjs/axios'
import { Injectable, Logger } from '@nestjs/common'
import { firstValueFrom } from 'rxjs'

@Injectable()
export class WebhookService {
  private readonly logger = new Logger(WebhookService.name)

  constructor(private readonly httpService: HttpService) {}

  async notify(url: string, payload: any): Promise<boolean> {
    try {
      this.logger.log(`Sending webhook to ${url}...`)
      await firstValueFrom(this.httpService.post(url, payload))
      this.logger.log(`Webhook sent successfully to ${url}`)
      return true
    }
    catch (error: any) {
      this.logger.error(`Failed to send webhook to ${url}: ${error.message}`)
      return false
    }
  }
}
