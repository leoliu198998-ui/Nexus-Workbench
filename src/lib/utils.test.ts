import { describe, it, expect } from 'vitest';
import { safeJsonParse } from './utils';

describe('safeJsonParse', () => {
  it('should parse standard JSON correctly', () => {
    const json = '{"name": "test", "age": 30}';
    const result = safeJsonParse(json);
    expect(result).toEqual({ name: 'test', age: 30 });
  });

  it('should handle large integers by converting them to strings', () => {
    const largeInt = '9007199254740995'; // Number.MAX_SAFE_INTEGER + 4
    const json = `{"id": ${largeInt}}`;
    
    const result = safeJsonParse<{ id: string }>(json);
    expect(result.id).toBe(largeInt);
    expect(typeof result.id).toBe('string');
  });

  it('should handle nested large integers', () => {
    const largeInt = '1234567890123456789';
    const json = `{"data": {"id": ${largeInt}}}`;
    
    const result = safeJsonParse<{ data: { id: string } }>(json);
    expect(result.data.id).toBe(largeInt);
  });

  it('should throw error for invalid JSON', () => {
    const json = '{invalid}';
    expect(() => safeJsonParse(json)).toThrow();
  });
});
