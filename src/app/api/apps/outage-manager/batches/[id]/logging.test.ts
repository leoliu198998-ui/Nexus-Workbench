import { describe, it, expect, vi } from 'vitest';
import { PATCH } from './route';
import { prisma } from '@/lib/prisma';
import { NextRequest } from 'next/server';

describe('Outage Manager Logging Integration', () => {
  it('should create a SystemLog in DB when an action is performed', async () => {
    // 1. Setup real data in DB
    const env = await prisma.releaseEnvironment.findFirst();
    if (!env) {
        console.warn("No environment found, skipping test");
        return;
    }

    const batch = await prisma.outageBatch.create({
      data: {
        envId: env.id,
        batchName: 'Integration Log Test',
        releaseDatetime: new Date(),
        releaseTimeZone: 'Asia/Shanghai',
        duration: 60,
        token: 'test-token',
        remoteBatchId: '123456789', // Mock remote ID
      }
    });

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => JSON.stringify({ success: true, errcode: '0' }),
    });

    try {
      // 2. Call PATCH API
      const req = new NextRequest(`http://localhost/api/batches/${batch.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'publish' }),
      });

      const response = await PATCH(req, { params: Promise.resolve({ id: batch.id }) });
      expect(response.status).toBe(200);

      // 3. Verify SystemLog exists in DB
      const logs = await prisma.systemLog.findMany({
        where: { outageBatchId: batch.id }
      });

      expect(logs.length).toBeGreaterThan(0);
      const publishLog = logs.find(l => l.action === 'OUTAGE_BATCH_PUBLISH_SUCCESS');
      expect(publishLog).toBeDefined();
      expect(publishLog?.details).toContain('成功执行操作: publish');

    } finally {
      // Cleanup
      global.fetch = originalFetch;
      await prisma.systemLog.deleteMany({ where: { outageBatchId: batch.id } });
      await prisma.outageBatch.delete({ where: { id: batch.id } });
    }
  });
});
