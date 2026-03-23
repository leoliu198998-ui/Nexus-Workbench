/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET, POST } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    releaseEnvironment: {
      findUnique: vi.fn(),
    },
    outageBatch: {
      findMany: vi.fn(),
      count: vi.fn(),
      create: vi.fn(),
    },
  },
}));

// Mock fetch
global.fetch = vi.fn();

// Mock logger service
vi.mock('@/lib/services/logger', () => ({
  logOutageAction: vi.fn().mockResolvedValue({ id: 'log-123' }),
}));

describe('GET /api/apps/outage-manager/batches', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return first page with 10 items by default', async () => {
    const mockBatches = [
      {
        id: 'batch-1',
        batchName: 'Batch 1',
        status: 'CREATED',
        environment: { name: 'Test Env' },
      },
      {
        id: 'batch-2',
        batchName: 'Batch 2',
        status: 'NOTIFIED',
        environment: { name: 'Test Env' },
      },
    ];

    (prisma.outageBatch.count as any).mockResolvedValue(12);
    (prisma.outageBatch.findMany as any).mockResolvedValue(mockBatches);

    const req = new NextRequest('http://localhost/api/apps/outage-manager/batches');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.outageBatch.count).toHaveBeenCalledWith({ where: {} });
    expect(prisma.outageBatch.findMany).toHaveBeenCalledWith({
      where: {},
      orderBy: { createdAt: 'desc' },
      include: { environment: true },
      skip: 0,
      take: 10,
    });
    expect(data).toEqual({
      items: mockBatches,
      page: 1,
      pageSize: 10,
      total: 12,
      totalPages: 2,
    });
  });

  it('should return requested page with correct offset and env filter', async () => {
    (prisma.outageBatch.count as any).mockResolvedValue(25);
    (prisma.outageBatch.findMany as any).mockResolvedValue([]);

    const req = new NextRequest('http://localhost/api/apps/outage-manager/batches?page=2&envId=env-1');
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(prisma.outageBatch.count).toHaveBeenCalledWith({ where: { envId: 'env-1' } });
    expect(prisma.outageBatch.findMany).toHaveBeenCalledWith({
      where: { envId: 'env-1' },
      orderBy: { createdAt: 'desc' },
      include: { environment: true },
      skip: 10,
      take: 10,
    });
    expect(data).toEqual({
      items: [],
      page: 2,
      pageSize: 10,
      total: 25,
      totalPages: 3,
    });
  });
});

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

    const successResponse = {
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
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(successResponse),
      json: async () => successResponse,
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
      text: async () => JSON.stringify({ message: 'Bad Request' }),
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

    const errResponse = {
      errcode: '500',
      errmsg: '服务器内部错误',
      errParams: {},
      data: [],
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(errResponse),
      json: async () => errResponse,
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

    const missingDataResponse = {
      errcode: '0',
      errmsg: '',
      errParams: {},
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(missingDataResponse),
      json: async () => missingDataResponse,
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

    const missingFieldsResponse = {
      errcode: '0',
      errmsg: '',
      errParams: {},
      data: {
        batchId: 1234567890,
        batchName: 'Test Batch',
        // Missing required fields
      },
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(missingFieldsResponse),
      json: async () => missingFieldsResponse,
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

    const invalidIdResponse = {
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
    };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify(invalidIdResponse),
      json: async () => invalidIdResponse,
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

  it('should handle large batchId without precision loss', async () => {
    const largeId = '202601261025401181';
    
    (prisma.releaseEnvironment.findUnique as any).mockResolvedValue({
      id: 'env-123',
      baseUrl: 'https://test-api.com',
    });

    // Use a raw string for text() to simulate external API response without JS stringify corruption
    const rawResponse = `{
      "errcode": "0",
      "errmsg": "",
      "errParams": {},
      "data": {
        "batchId": 202601261025401181,
        "batchName": "Test Batch",
        "originalDateTime": "2023-09-08T10:30",
        "originalTimeZone": "Asia/Shanghai",
        "duration": 5,
        "releaseDatetime": 1694140200000,
        "releaseStatus": "RELEASED",
        "noticeStatus": "STOPPED"
      }
    }`;

    (global.fetch as any).mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => rawResponse,
    });

    (prisma.outageBatch.create as any).mockImplementation(({ data }: any) => Promise.resolve({
      id: 'local-uuid',
      ...data
    }));

    const req = new NextRequest('http://localhost/api/batches', {
      method: 'POST',
      body: JSON.stringify(validBody),
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.remoteBatchId).toBe(largeId); // Should be exactly '...181'
  });
});
