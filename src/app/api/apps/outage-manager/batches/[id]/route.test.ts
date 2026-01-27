/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PATCH, GET, PUT } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';
import { logOutageAction } from '@/lib/services/logger';

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
// ... existing GET tests
});

describe('PUT /api/apps/outage-manager/batches/[id]', () => {
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
      baseUrl: 'https://test-api.com',
    },
    logs: { steps: [] },
  };

  const updatePayload = {
    batchName: 'Updated Batch Name',
    releaseDatetime: '2026-02-01T10:00:00Z',
    releaseTimeZone: 'Asia/Shanghai',
    duration: 60,
  };

  it('should update batch and reset status to CREATED when in CREATED state', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
    
    // Mock successful external API call
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, errcode: '0' }),
      json: async () => ({ success: true, errcode: '0' }),
    });

    (prisma.outageBatch.update as any).mockResolvedValue({
      ...mockBatch,
      ...updatePayload,
      status: 'CREATED',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const response = await PUT(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('CREATED');
    expect(data.batchName).toBe(updatePayload.batchName);
    
    // Verify external API call
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.com/devops/release-batch/update/202601191310437440',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify(updatePayload),
      })
    );

    // Verify local DB update
    expect(prisma.outageBatch.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'local-123' },
        data: expect.objectContaining({
          status: 'CREATED', // Critical requirement
          batchName: updatePayload.batchName,
        }),
      })
    );

    // Verify logging
    expect(logOutageAction).toHaveBeenCalledWith(
      'local-123',
      'OUTAGE_BATCH_UPDATE_SUCCESS',
      expect.stringContaining('成功更新批次信息')
    );
  });

  it('should allow update when status is NOTIFIED', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue({
      ...mockBatch,
      status: 'NOTIFIED',
    });
    
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, errcode: '0' }),
      json: async () => ({ success: true, errcode: '0' }),
    });

    (prisma.outageBatch.update as any).mockResolvedValue({
      ...mockBatch,
      ...updatePayload,
      status: 'CREATED',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    await PUT(req, { params: Promise.resolve({ id: 'local-123' }) });
    
    // Should proceed and update
    expect(global.fetch).toHaveBeenCalled();
    expect(prisma.outageBatch.update).toHaveBeenCalled();
  });

  it('should return 403 when status is STARTED', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue({
      ...mockBatch,
      status: 'STARTED',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const response = await PUT(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toContain('Only CREATED or NOTIFIED batches can be updated');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('should return 502 if external API fails', async () => {
    (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
    
    (global.fetch as any).mockResolvedValue({
      ok: false,
      status: 500,
      text: async () => 'Internal Server Error',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PUT',
      body: JSON.stringify(updatePayload),
    });

    const response = await PUT(req, { params: Promise.resolve({ id: 'local-123' }) });
    
    expect(response.status).toBe(502);
    // Should NOT update DB
    const updateCalls = (prisma.outageBatch.update as any).mock.calls;
    // Check that we didn't update the status or fields (other than logs maybe)
    const hasFieldUpdate = updateCalls.some((call: any) => call[0].data.batchName === updatePayload.batchName);
    expect(hasFieldUpdate).toBe(false);
  });
});
