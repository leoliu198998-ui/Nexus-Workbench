import { Controller, Post, Body, StreamableFile, Res } from '@nestjs/common';
import { ProxyService } from './proxy.service';
import { FetchDataDto } from './dto/fetch-data.dto';
import { ExcelService } from '../excel/excel.service';
import type { Response } from 'express';

@Controller('proxy')
export class ProxyController {
  constructor(
    private readonly proxyService: ProxyService,
    private readonly excelService: ExcelService,
  ) {}

  @Post('fetch')
  async fetchData(@Body() fetchDataDto: FetchDataDto): Promise<unknown> {
    return this.proxyService.fetchData(fetchDataDto.token);
  }

  @Post('download')
  async downloadExcel(
    @Body() fetchDataDto: FetchDataDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const data: unknown = await this.proxyService.fetchData(fetchDataDto.token);
    // Ensure data is an array
    const dataArray = Array.isArray(data) ? data : [data];
    const buffer = await this.excelService.generateExcel(dataArray);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="data.xlsx"',
    });

    return new StreamableFile(buffer);
  }
}
