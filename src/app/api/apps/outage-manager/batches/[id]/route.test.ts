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
        body: JSON.stringify({ batchId: '202601191310437440' }),
      })
    );
    // Verify logging
    expect(logOutageAction).toHaveBeenCalledWith(
      'local-123',
      'OUTAGE_BATCH_PUBLISH_SUCCESS',
      expect.stringContaining('成功执行操作: publish')
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
    // Verify logging
    expect(logOutageAction).toHaveBeenCalledWith(
      'local-123',
      'OUTAGE_BATCH_TOKEN_UPDATE',
      '更新了鉴权 Token'
    );
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
    
    // Verify failure logging
    expect(logOutageAction).toHaveBeenCalledWith(
      'local-123',
      'OUTAGE_BATCH_PUBLISH_FAILED',
      expect.stringContaining('接口返回错误码: 1')
    );

    // Should NOT have updated status to NOTIFIED
    const updateCalls = (prisma.outageBatch.update as any).mock.calls;
    const hasStatusUpdate = updateCalls.some((call: any) => call[0].data.status === 'NOTIFIED');
    expect(hasStatusUpdate).toBe(false);
  });

  it('should cancel batch and set status to CANCELLED on cancel action', async () => {
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
      status: 'CANCELLED',
    });

    const req = new NextRequest('http://localhost/api/batches/local-123', {
      method: 'PATCH',
      body: JSON.stringify({ action: 'cancel' }),
    });

    const response = await PATCH(req, { params: Promise.resolve({ id: 'local-123' }) });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('CANCELLED');
    
    // Verify external API call
    expect(global.fetch).toHaveBeenCalledWith(
      'https://test-api.com/devops/release-batch/cancel',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({ batchId: '202601191310437440' }),
      })
    );

    // Verify logging
    expect(logOutageAction).toHaveBeenCalledWith(
      'local-123',
      'OUTAGE_BATCH_CANCEL_SUCCESS',
      expect.stringContaining('成功执行操作: cancel')
    );
  });
});