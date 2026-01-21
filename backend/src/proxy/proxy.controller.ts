import { Controller, Post, Body } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { FetchDataDto } from './dto/fetch-data.dto';

@Controller('proxy')
export class ProxyController {
  constructor(private readonly proxyService: ProxyService) {}

  @Post('fetch')
  async fetchData(@Body() fetchDataDto: FetchDataDto) {
    return this.proxyService.fetchData(fetchDataDto.token);
  }
}
