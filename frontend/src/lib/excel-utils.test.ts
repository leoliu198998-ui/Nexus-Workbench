import { describe, it, expect } from 'vitest';
import { generateExcel } from './excel-utils';

describe('Excel Utils', () => {
  it('should generate an excel buffer from data', async () => {
    const testData = [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    ];

    const buffer = await generateExcel(testData);
    
    expect(buffer).toBeDefined();
    expect(Buffer.isBuffer(buffer)).toBe(true);
    expect(buffer.length).toBeGreaterThan(0);
  });
});
