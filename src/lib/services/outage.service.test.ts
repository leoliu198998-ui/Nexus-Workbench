import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest';
import { outageService } from './outage.service';
import { prisma } from '@/lib/prisma';
import { logOutageAction } from './logger';

// Mock dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: {
    outageBatch: {
      findUnique: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    releaseEnvironment: {
      findUnique: vi.fn(),
    },
  },
}));

vi.mock('./logger', () => ({
  logOutageAction: vi.fn(),
}));

global.fetch = vi.fn();

const createSuccessResponse = () => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({
    errcode: '0',
    data: {
      batchId: '12345',
      batchName: 'Test Batch',
      originalDateTime: '2026-01-01 10:00',
      originalTimeZone: 'UTC',
      duration: 60,
      releaseDatetime: '2026-01-01 10:00',
      releaseStatus: 'UNPUBLISHED',
      noticeStatus: 'UNSENT',
    },
  }),
});

const actionSuccessResponse = () => ({
  ok: true,
  status: 200,
  text: async () => JSON.stringify({ errcode: '0', data: {} }),
});

describe('OutageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBatch', () => {
    it('should return batch if found', async () => {
      const mockBatch = { id: '1', batchName: 'test' };
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue(mockBatch);

      const result = await outageService.getBatch('1');
      expect(result).toEqual(mockBatch);
      expect(prisma.outageBatch.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { environment: true },
      });
    });

    it('should throw error if batch not found', async () => {
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue(null);
      await expect(outageService.getBatch('1')).rejects.toThrow('Batch not found');
    });
  });

  describe('createBatch', () => {
    const mockEnv = { id: 'env-1', baseUrl: 'https://api.example.com' };
    const createDto = {
      envId: 'env-1',
      batchName: 'Test Batch',
      releaseDatetime: '2026-01-01 10:00',
      releaseTimeZone: 'UTC',
      duration: 60,
      token: 'test-token',
    };

    it('should create batch successfully', async () => {
      (prisma.releaseEnvironment.findUnique as Mock).mockResolvedValue(mockEnv);
      (global.fetch as Mock).mockResolvedValue(createSuccessResponse());
      (prisma.outageBatch.create as Mock).mockResolvedValue({ id: 'new-batch-id', ...createDto });

      const result = await outageService.createBatch(createDto);
      expect(result).toBeDefined();
      expect(prisma.outageBatch.create).toHaveBeenCalled();
      expect(logOutageAction).toHaveBeenCalled();

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/devops/release-batch',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect((global.fetch as Mock).mock.calls[0]?.[1]?.headers).not.toHaveProperty('x-dk-token');

      expect(prisma.outageBatch.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          token: 'test-token',
          logs: expect.objectContaining({
            steps: [
              expect.objectContaining({
                request: expect.objectContaining({
                  headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                  }),
                  curl: expect.stringContaining("Authorization: Bearer test-token"),
                }),
              }),
            ],
          }),
        }),
      }));
    });

    it('should throw error if environment not found', async () => {
      (prisma.releaseEnvironment.findUnique as Mock).mockResolvedValue(null);
      await expect(outageService.createBatch(createDto)).rejects.toThrow('Environment not found');
    });
  });

  describe('updateBatch', () => {
    const mockBatch = {
      id: 'batch-1',
      remoteBatchId: 'remote-1',
      token: 'test-token',
      status: 'CREATED',
      environment: { baseUrl: 'https://api.example.com' },
      logs: { steps: [] },
    };
    const updateDto = {
      batchName: 'Updated Batch',
      releaseDatetime: '2026-01-02 10:00',
      releaseTimeZone: 'UTC',
      duration: 120,
    };

    it('should update batch successfully and reset status', async () => {
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue(mockBatch);
      (global.fetch as Mock).mockResolvedValue(actionSuccessResponse());
      (prisma.outageBatch.update as Mock).mockResolvedValue({ ...mockBatch, ...updateDto });

      await outageService.updateBatch('batch-1', updateDto);

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/devops/release-batch/update/remote-1',
        expect.objectContaining({
          method: 'PUT',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect((global.fetch as Mock).mock.calls[0]?.[1]?.headers).not.toHaveProperty('x-dk-token');
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'CREATED',
          logs: expect.objectContaining({
            steps: [
              expect.objectContaining({
                request: expect.objectContaining({
                  headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                  }),
                  curl: expect.stringContaining("Authorization: Bearer test-token"),
                }),
              }),
            ],
          }),
        }),
      }));
    });

    it('should throw error if batch not editable', async () => {
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue({ ...mockBatch, status: 'STARTED' });
      await expect(outageService.updateBatch('batch-1', updateDto)).rejects.toThrow('Only CREATED or NOTIFIED batches can be updated');
    });
  });

  describe('executeAction', () => {
    const mockBatch = {
      id: 'batch-1',
      remoteBatchId: 'remote-1',
      token: 'test-token',
      status: 'CREATED',
      environment: { baseUrl: 'https://api.example.com' },
      logs: { steps: [] },
    };

    it('should execute publish action successfully', async () => {
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue(mockBatch);
      (global.fetch as Mock).mockResolvedValue(actionSuccessResponse());
      (prisma.outageBatch.update as Mock).mockResolvedValue({ ...mockBatch, status: 'NOTIFIED' });

      const result = await outageService.executeAction('batch-1', 'publish');

      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.example.com/devops/release-batch/publish',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
            'Content-Type': 'application/json',
          }),
        }),
      );
      expect((global.fetch as Mock).mock.calls[0]?.[1]?.headers).not.toHaveProperty('x-dk-token');
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          status: 'NOTIFIED',
          logs: expect.objectContaining({
            steps: [
              expect.objectContaining({
                request: expect.objectContaining({
                  headers: expect.objectContaining({
                    Authorization: 'Bearer test-token',
                  }),
                  curl: expect.stringContaining("Authorization: Bearer test-token"),
                }),
              }),
            ],
          }),
        }),
      }));
      expect(result.apiCall.request.headers).toEqual(expect.objectContaining({
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      }));
      expect(result.apiCall.request.headers).not.toHaveProperty('x-dk-token');
      expect(result.apiCall.request.curl).toContain("Authorization: Bearer test-token");
    });

    it('should handle token update action', async () => {
      (prisma.outageBatch.update as Mock).mockResolvedValue({ ...mockBatch, token: 'new-token' });
      await outageService.executeAction('batch-1', '', 'new-token');
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { token: 'new-token' }
      }));
    });

    it('should keep token-only update flow unchanged and use stored token for later bearer requests', async () => {
      (prisma.outageBatch.update as Mock)
        .mockResolvedValueOnce({ ...mockBatch, token: 'stored-token' })
        .mockResolvedValueOnce({ ...mockBatch, token: 'stored-token', status: 'NOTIFIED' });
      await outageService.executeAction('batch-1', '', 'stored-token');

      (prisma.outageBatch.findUnique as Mock).mockResolvedValue({
        ...mockBatch,
        token: 'stored-token',
      });
      (global.fetch as Mock).mockResolvedValue(actionSuccessResponse());

      await outageService.executeAction('batch-1', 'publish');

      expect(prisma.outageBatch.update).toHaveBeenNthCalledWith(1, expect.objectContaining({
        where: { id: 'batch-1' },
        data: { token: 'stored-token' },
      }));
      expect((global.fetch as Mock).mock.calls[0]?.[1]?.headers).toEqual(expect.objectContaining({
        Authorization: 'Bearer stored-token',
        'Content-Type': 'application/json',
      }));
      expect((global.fetch as Mock).mock.calls[0]?.[1]?.headers).not.toHaveProperty('x-dk-token');
    });

    it('should handle fix-batch-id action', async () => {
      const batchWithLogs = {
        ...mockBatch,
        logs: { steps: [{ step: 'CREATE_BATCH', response: { raw: '{"data":{"batchId":9999999999999999}}' } }] }
      };
      (prisma.outageBatch.findUnique as Mock).mockResolvedValue(batchWithLogs);

      await outageService.executeAction('batch-1', 'fix-batch-id');

      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { remoteBatchId: '9999999999999999' }
      }));
    });
  });
});
