import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    outageBatch: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

describe('PATCH /api/apps/outage-manager/batches/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBatch = {
    id: 'local-123',
    remoteBatchId: '202601191310437440',
    token: 'test-token',
    logs: { steps: [] },
    environment: {
      baseUrl: 'https://test-api.com',
    },
  };

  it('should update batch status to NOTIFIED on publish action', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ success: true }),
    });
    (prisma.outageBatch.update as any).mockResolvedValue({
      ...mockBatch,
      status: 'NOTIFIED',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('NOTIFIED');
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.com/devops/release-batch/publish',
      expect.objectContaining({
        body: JSON.stringify({ batchId: 202601191310437440 }),
      })
    );
  });

  it('should return 400 for invalid action', async () => {
    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'invalid' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'local-123' }) });
    expect(response.status).toBe(400);
  });
});
