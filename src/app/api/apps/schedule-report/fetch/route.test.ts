import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Schedule Report Fetch API', () => {
  beforeEach(() => {
    vi.stubEnv('SCHEDULE_REPORT_API_URL', 'https://api.example.com/schedules');
    vi.stubGlobal('fetch', vi.fn());
    vi.clearAllMocks();
  });

  it('should return 400 if token is missing', async () => {
    const req = new NextRequest('http://localhost/api/apps/schedule-report/fetch', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should call external API with correct headers and body', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => [{ id: '1' }],
    });

    const req = new NextRequest('http://localhost/api/apps/schedule-report/fetch', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual([{ id: '1' }]);
    
    expect(global.fetch).toHaveBeenCalledWith(
      'https://api.example.com/schedules',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Authorization': 'Bearer test-token',
          'x-biz': 'SERVICE_ONLINE_SD',
          'content-type': 'application/json',
          'origin': 'https://global.butterglobe.com',
        }),
        body: JSON.stringify({
          q: '',
          size: 1500,
          page: 0,
          year: 2026,
          type: '',
        }),
      })
    );
  });

  it('should handle external API error', async () => {
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: false,
      status: 502,
    });

    const req = new NextRequest('http://localhost/api/apps/schedule-report/fetch', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(502);
    expect(data.error).toBe('External API error');
  });
});