import { describe, it, expect, vi, beforeEach } from 'vitest';
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

describe('OutageService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getBatch', () => {
    it('should return batch if found', async () => {
      const mockBatch = { id: '1', batchName: 'test' };
      (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);

      const result = await outageService.getBatch('1');
      expect(result).toEqual(mockBatch);
      expect(prisma.outageBatch.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
        include: { environment: true },
      });
    });

    it('should throw error if batch not found', async () => {
      (prisma.outageBatch.findUnique as any).mockResolvedValue(null);
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
      (prisma.releaseEnvironment.findUnique as any).mockResolvedValue(mockEnv);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ errcode: '0', data: { batchId: '12345' } }),
      });
      (prisma.outageBatch.create as any).mockResolvedValue({ id: 'new-batch-id', ...createDto });

      const result = await outageService.createBatch(createDto);
      expect(result).toBeDefined();
      expect(prisma.outageBatch.create).toHaveBeenCalled();
      expect(logOutageAction).toHaveBeenCalled();
    });

    it('should throw error if environment not found', async () => {
      (prisma.releaseEnvironment.findUnique as any).mockResolvedValue(null);
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
      (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ errcode: '0', data: {} }),
      });
      (prisma.outageBatch.update as any).mockResolvedValue({ ...mockBatch, ...updateDto });

      await outageService.updateBatch('batch-1', updateDto);
      
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'CREATED' })
      }));
    });

    it('should throw error if batch not editable', async () => {
      (prisma.outageBatch.findUnique as any).mockResolvedValue({ ...mockBatch, status: 'STARTED' });
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
      (prisma.outageBatch.findUnique as any).mockResolvedValue(mockBatch);
      (global.fetch as any).mockResolvedValue({
        ok: true,
        text: async () => JSON.stringify({ errcode: '0', data: {} }),
      });
      (prisma.outageBatch.update as any).mockResolvedValue({ ...mockBatch, status: 'NOTIFIED' });

      await outageService.executeAction('batch-1', 'publish');
      
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ status: 'NOTIFIED' })
      }));
    });

    it('should handle token update action', async () => {
      (prisma.outageBatch.update as any).mockResolvedValue({ ...mockBatch, token: 'new-token' });
      await outageService.executeAction('batch-1', '', 'new-token');
      expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
        data: { token: 'new-token' }
      }));
    });

    it('should handle fix-batch-id action', async () => {
        const batchWithLogs = {
            ...mockBatch,
            logs: { steps: [{ step: 'CREATE_BATCH', response: { raw: '{"data":{"batchId":9999999999999999}}' } }] }
        };
        (prisma.outageBatch.findUnique as any).mockResolvedValue(batchWithLogs);
        
        await outageService.executeAction('batch-1', 'fix-batch-id');
        
        expect(prisma.outageBatch.update).toHaveBeenCalledWith(expect.objectContaining({
            data: { remoteBatchId: '9999999999999999' }
        }));
    });
  });
});
