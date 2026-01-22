import { describe, it, expect } from 'vitest';
import { generateExcel } from './excel-utils';

describe('Excel Utils', () => {
  it('should generate an excel buffer from data with default columns', async () => {
    const testData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const buffer = await generateExcel(testData);
    
    expect(buffer).toBeDefined();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });

  it('should generate an excel buffer with custom columns', async () => {
    const testData = [
      { field1: 'Value 1', field2: 'Value 2' },
    ];
    const columns = [
      { header: 'Custom Header 1', key: 'field1', width: 20 },
      { header: 'Custom Header 2', key: 'field2', width: 20 },
    ];

    const buffer = await generateExcel(testData, columns);

    expect(buffer).toBeDefined();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});