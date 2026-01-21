import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ProxyService } from './proxy.service';
import { ProxyController } from './proxy.controller';
import { ExcelModule } from '../excel/excel.module';

@Module({
  imports: [HttpModule, ExcelModule],
  controllers: [ProxyController],
  providers: [ProxyService],
})
export class ProxyModule {}
