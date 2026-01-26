/* eslint-disable @typescript-eslint/no-explicit-any */
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

  it('should create a batch successfully with valid response format', async () => {
    // 1. Mock Environment
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    // 2. Mock External API Success with correct format
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errcode: '0',
        errmsg: '',
        errParams: {},
        data: {
          batchId: 1234567890,
          batchName: 'Test Batch',
          originalDateTime: '2023-09-08T10:30',
          originalTimeZone: 'Asia/Shanghai',
          duration: 5,
          releaseDatetime: 1694140200000,
          releaseStatus: 'RELEASED',
          noticeStatus: 'STOPPED',
        },
      }),
    });

    // 3. Mock Prisma Create
    (prisma.outageBatch.create as any).mockResolvedValue({
      id: 'local-uuid',
      ...validBody,
      remoteBatchId: '1234567890',
      status: 'CREATED',
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.remoteBatchId).toBe('1234567890');
    expect(prisma.outageBatch.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        remoteBatchId: '1234567890',
      }),
    }));
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

  it('should return 502 if response errcode is not 0', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errcode: '500',
        errmsg: '服务器内部错误',
        errParams: {},
        data: [],
      }),
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
    expect(data.details).toContain('服务器内部错误');
  });

  it('should return 502 if response data is missing', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errcode: '0',
        errmsg: '',
        errParams: {},
      }),
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
    expect(data.details).toContain('缺少data对象');
  });

  it('should return 502 if required fields are missing in batch data', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errcode: '0',
        errmsg: '',
        errParams: {},
        data: {
          batchId: 1234567890,
          batchName: 'Test Batch',
          // Missing required fields
        },
      }),
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
    expect(data.details).toContain('缺少必需字段');
  });

  it('should return 502 if batchId is invalid', async () => {
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        errcode: '0',
        errmsg: '',
        errParams: {},
        data: {
          batchId: null,
          batchName: 'Test Batch',
          originalDateTime: '2023-09-08T10:30',
          originalTimeZone: 'Asia/Shanghai',
          duration: 5,
          releaseDatetime: 1694140200000,
          releaseStatus: 'RELEASED',
          noticeStatus: 'STOPPED',
        },
      }),
    });

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(502);
    expect(data.error).toBe('External API Error');
    expect(data.details).toContain('batchId无效');
  });
});
