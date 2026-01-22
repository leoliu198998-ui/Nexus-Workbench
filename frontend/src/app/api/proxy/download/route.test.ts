import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock generateExcel
vi.mock('@/lib/excel-utils', () => ({
  generateExcel: vi.fn().mockResolvedValue(Buffer.from('mock-excel-content')),
}));

describe('Download API Proxy Route', () => {
  beforeEach(() => {
    vi.stubEnv('EXTERNAL_API_URL', 'https://api.example.com/data');
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    const req = new NextRequest('http://localhost/api/proxy/download', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should fetch data and return excel buffer', async () => {
    const mockApiData = [{ id: 1, name: 'Test' }];
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockApiData,
    });

    const req = new NextRequest('http://localhost/api/proxy/download', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const blob = await res.blob();
    const text = await blob.text();

    expect(res.status).toBe(200);
    expect(text).toBe('mock-excel-content');
    expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="data.xlsx"');
  });

  it('should handle external API errors during download', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 502,
    });

    const req = new NextRequest('http://localhost/api/proxy/download', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBe('Failed to fetch data from external API');
  });
});
