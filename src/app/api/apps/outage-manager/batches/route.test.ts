import { describe, it, expect, vi, beforeEach } from 'vitest';
import { POST } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    releaseEnvironment: {
      findUnique: vi.fn(),
    },
    outageBatch: {
      create: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('POST /api/apps/outage-manager/batches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const validBody = {
    envId: 'env-123',
    batchName: 'Test Batch',
    releaseDatetime: '2026-01-23T10:00:00Z',
    releaseTimeZone: 'Asia/Shanghai',
    duration: 60,
    token: 'token-abc',
  };

  it('should create a batch successfully', async () => {
    // 1. Mock Environment
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    // 2. Mock External API Success
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ batchId: 'remote-999' }),
    });

    // 3. Mock Prisma Create
    (prisma.outageBatch.create as any).mockResolvedValue({
      id: 'local-uuid',
      ...validBody,
      remoteBatchId: 'remote-999',
      status: 'CREATED',
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.remoteBatchId).toBe('remote-999');
    expect(prisma.outageBatch.create).toHaveBeenCalled();
    expect(global.fetch).toHaveBeenCalledWith('https://test-api.com/devops/release-batch', expect.any(Object));
  });

  it('should return 404 if environment not found', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Environment not found');
  });

  it('should return 502 if external API fails', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Bad Request' }),
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
  });
});
