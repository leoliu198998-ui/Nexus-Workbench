import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { NextRequest } from 'next/server';

describe('Fetch API Proxy Route', () => {
  beforeEach(() => {
    vi.stubEnv('EXTERNAL_API_URL', 'https://api.example.com/data');
    vi.stubGlobal('fetch', vi.fn());
  });

  it('should return 400 if token is missing', async () => {
    const req = new NextRequest('http://localhost/api/proxy/fetch', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(400);
    expect(data.error).toBe('Token is required');
  });

  it('should return 500 if EXTERNAL_API_URL is missing', async () => {
    vi.stubEnv('EXTERNAL_API_URL', '');
    const req = new NextRequest('http://localhost/api/proxy/fetch', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(500);
    expect(data.error).toBe('Server configuration error');
  });

  it('should fetch data from external API and return it', async () => {
    const mockData = { items: [1, 2, 3] };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockData,
    });

    const req = new NextRequest('http://localhost/api/proxy/fetch', {
      method: 'POST',
      body: JSON.stringify({ token: 'test-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toEqual(mockData);
    expect(global.fetch).toHaveBeenCalledWith('https://api.example.com/data', expect.objectContaining({
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token',
      }),
    }));
  });

  it('should handle external API errors', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ message: 'Unauthorized' }),
    });

    const req = new NextRequest('http://localhost/api/proxy/fetch', {
      method: 'POST',
      body: JSON.stringify({ token: 'invalid-token' }),
    });

    const res = await POST(req);
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.error).toBe('External API error');
  });
});
