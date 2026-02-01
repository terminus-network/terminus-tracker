import { Body, Controller, Post } from '@nestjs/common'
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator'
import { TrackerService } from './tracker.service'

class CreateTrackDto {
  @IsNotEmpty()
  @IsString()
  chain: string

  @IsNotEmpty()
  @IsString()
  address: string

  @IsNotEmpty()
  @IsString()
  amount: string

  @IsNotEmpty()
  @IsString()
  currency: string

  @IsOptional()
  @IsString()
  tag: string

  @IsNotEmpty()
  @IsString()
  callbackUrl: string

  @IsOptional()
  @IsNumber()
  timeoutSeconds: number
}

@Controller('tracker')
export class TrackerController {
  constructor(private readonly trackerService: TrackerService) {}

  @Post()
  async track(@Body() dto: CreateTrackDto) {
    return await this.trackerService.trackOrder(
      dto.chain,
      dto.address,
      dto.amount,
      dto.currency,
      dto.tag,
      dto.callbackUrl,
      dto.timeoutSeconds,
    )
  }
}
