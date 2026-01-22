import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock transformation and excel utils
vi.mock('@/lib/schedule-transformer', () => ({
  transformScheduleData: vi.fn().mockReturnValue([{ transformed: true }]),
}));

vi.mock('@/lib/excel-utils', () => ({
  generateExcel: vi.fn().mockResolvedValue(Buffer.from('mock-excel')),
}));

describe('Schedule Report Download API', () => {
  beforeEach(() => {
    vi.stubEnv('SCHEDULE_REPORT_API_URL', 'https://api.example.com/schedules');
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should fetch, transform and return excel stream', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [{ raw: true }],
    });

    const req = new NextRequest('http://localhost/api/apps/schedule-report/download', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const blob = await res.blob();
    const text = await blob.text();

    expect(res.status).toBe(200);
    expect(text).toBe('mock-excel');
    expect(res.headers.get('Content-Type')).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(res.headers.get('Content-Disposition')).toContain('attachment; filename="schedules_2026.xlsx"');
  });

  it('should handle fetch errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
    });

    const req = new NextRequest('http://localhost/api/apps/schedule-report/download', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('Failed to fetch data from external API');
  });
});
