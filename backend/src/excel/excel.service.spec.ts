import { Test, TestingModule } from '@nestjs/testing';
import { ExcelService } from './excel.service';
import * as ExcelJS from 'exceljs';
import { Readable } from 'stream';

describe('ExcelService', () => {
  let service: ExcelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExcelService],
    }).compile();

    service = module.get<ExcelService>(ExcelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate an excel file buffer from data', async () => {
    const mockData = [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' },
    ];

    const buffer = await service.generateExcel(mockData);
    
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);

    // Verify content (basic check)
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.getWorksheet(1);
    
    // Check headers (hardcoded mapping assumption: keys become headers or specific mapping)
    // For MVP, assuming we map specific fields.
    // Let's assume the service maps 'id' to 'ID', 'name' to 'Full Name'.
    
    // Note: The implementation is empty now, so this test will fail on assertions or timeouts if I don't implement *something*.
    // But since I'm doing TDD, I expect it to fail first.
    // Actually, `Buffer.from('')` will fail `buffer.length > 0` or `workbook.xlsx.load`.
  });
});
