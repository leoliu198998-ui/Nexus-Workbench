/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, GET } from './route';
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

// Mock logger service
vi.mock('@/lib/services/logger', () => ({
  logOutageAction: vi.fn().mockResolvedValue({ id: 'log-123' }),
}));

describe('GET /api/apps/outage-manager/batches/[id]', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBatch = {
    id: 'local-123',
    remoteBatchId: '202601191310437440',
    token: 'test-token',
    status: 'CREATED',
    batchName: 'Test Batch',
    environment: {
      id: 'env-1',
      name: 'Test Env',
    },
  };

  it('should return batch details with remoteBatchId and token', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);

    const req = new NextRequest('http://localhost/api/batches/local-123');
    const response = await GET(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.id).toBe('local-123');
    expect(data.remoteBatchId).toBe('202601191310437440');
    expect(data.token).toBe('test-token');
    expect(prisma.outageBatch.findUnique).toHaveBeenCalledWith({
      where: { id: 'local-123' },
      include: { environment: true },
    });
  });

  it('should return 404 if batch not found', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(null);

    const req = new NextRequest('http://localhost/api/batches/missing-id');
    const response = await GET(req, { params: Promise.resolve({ id: 'missing-id' }) });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Batch not found');
  });
});

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
      text: async () => JSON.stringify({ success: true, errcode: '0' }),
      json: async () => ({ success: true, errcode: '0' }),
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

  it('should update only the token when provided without an action', async () => {
    (prisma.outageBatch.update as any).mockResolvedValue({
      ...mockBatch,
      token: 'new-token-123',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PATCH',
      body: JSON.stringify({ token: 'new-token-123' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.token).toBe('new-token-123');
    expect(prisma.outageBatch.update).toHaveBeenCalledWith({
      where: { id: 'local-123' },
      data: { token: 'new-token-123' },
    });
  });

  it('should return 502 and NOT update status if API returns errcode 1', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
    const errorResponse = {
      errcode: '1',
      errmsg: 'Unable to find MysqlReleaseBatch with id 202601261025401180',
      data: null
    };
    (global.fetch as any).mockResolvedValue({
      ok: true, // HTTP 200
      status: 200,
      text: async () => JSON.stringify(errorResponse),
      json: async () => errorResponse,
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'publish' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
    expect(data.details).toContain('Unable to find MysqlReleaseBatch');
    
    // Should NOT have updated status to NOTIFIED
    const updateCalls = (prisma.outageBatch.update as any).mock.calls;
    const hasStatusUpdate = updateCalls.some((call: any) => call[0].data.status === 'NOTIFIED');
    expect(hasStatusUpdate).toBe(false);
  });
});
