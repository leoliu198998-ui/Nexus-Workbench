import { describe, it, expect } from 'vitest';
import { logOutageAction } from './logger';
import { prisma } from '../prisma';

describe('Logger Service', () => {
  it('should create a SystemLog entry linked to an OutageBatch', async () => {
    // 1. Setup test data
    const env = await prisma.releaseEnvironment.findFirst();
    if (!env) {
        console.warn("No environment found, skipping test");
        return;
    }

    const batch = await prisma.outageBatch.create({
      data: {
        envId: env.id,
        batchName: 'Logger Service Test Batch',
        releaseDatetime: new Date(),
        releaseTimeZone: 'Asia/Shanghai',
        duration: 60,
        token: 'test-token',
      }
    });

    try {
      // 2. Call the service function
      const action = 'TEST_LOG_SERVICE';
      const details = 'Testing logger service function';
      
      const log = await logOutageAction(batch.id, action, details);

      // 3. Verify
      expect(log).toBeDefined();
      expect(log.action).toBe(action);
      expect(log.details).toBe(details);
      expect(log.outageBatchId).toBe(batch.id);

      // Verify in DB
      const dbLog = await prisma.systemLog.findUnique({
        where: { id: log.id }
      });
      expect(dbLog?.outageBatchId).toBe(batch.id);

      // Cleanup Log
      await prisma.systemLog.delete({ where: { id: log.id } });
    } finally {
      // Cleanup Batch
      await prisma.outageBatch.delete({ where: { id: batch.id } });
    }
  });
});
