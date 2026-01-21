import { Test, TestingModule } from '@nestjs/testing';
import { ProxyController } from './proxy.controller';
import { ProxyService } from './proxy.service';
import { ExcelService } from '../excel/excel.service';
import { StreamableFile } from '@nestjs/common';
import { Response } from 'express';

describe('ProxyController', () => {
  let controller: ProxyController;
  let service: ProxyService;
  let excelService: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProxyController],
      providers: [
        {
          provide: ProxyService,
          useValue: {
            fetchData: jest.fn(),
          },
        },
        {
          provide: ExcelService,
          useValue: {
            generateExcel: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ProxyController>(ProxyController);
    service = module.get<ProxyService>(ProxyService);
    excelService = module.get<ExcelService>(ExcelService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call service.fetchData with correct token', async () => {
    const dto = { token: 'test-token' };
    const result = { data: 'some data' };
    jest.spyOn(service, 'fetchData').mockResolvedValue(result);

    expect(await controller.fetchData(dto)).toBe(result);
    expect(service.fetchData).toHaveBeenCalledWith(dto.token); // eslint-disable-line @typescript-eslint/unbound-method
  });

  it('should generate and download excel file', async () => {
    const dto = { token: 'test-token' };
    const mockData = [{ id: 1, name: 'Test' }];
    const mockBuffer = Buffer.from('excel-data');
    const mockRes = {
      set: jest.fn(),
    } as unknown as Response;

    jest.spyOn(service, 'fetchData').mockResolvedValue(mockData);
    jest.spyOn(excelService, 'generateExcel').mockResolvedValue(mockBuffer);

    const result = await controller.downloadExcel(dto, mockRes);

    expect(service.fetchData).toHaveBeenCalledWith(dto.token); // eslint-disable-line @typescript-eslint/unbound-method
    expect(excelService.generateExcel).toHaveBeenCalledWith(mockData); // eslint-disable-line @typescript-eslint/unbound-method
    // eslint-disable-next-line @typescript-eslint/unbound-method
    expect(mockRes.set).toHaveBeenCalledWith(
      expect.objectContaining({
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }),
    );
    expect(result).toBeInstanceOf(StreamableFile);
  });
});
