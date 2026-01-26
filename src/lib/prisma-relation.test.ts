import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('SystemLog - OutageBatch Relation', () => {
  it('should allow linking a SystemLog to an OutageBatch', async () => {
    // 1. Get an existing environment
    const env = await prisma.releaseEnvironment.findFirst();
    if (!env) {
        console.warn("No environment found, skipping test");
        return;
    }

    // 2. Create a test OutageBatch
    const batch = await prisma.outageBatch.create({
      data: {
        envId: env.id,
        batchName: 'Test Batch for Log Relation',
        releaseDatetime: new Date(),
        releaseTimeZone: 'Asia/Shanghai',
        duration: 60,
        token: 'test-token',
      }
    });

    try {
        // 3. Create a SystemLog linked to it
        const log = await prisma.systemLog.create({
          data: {
            action: 'TEST_RELATION',
            details: 'Testing relation',
            outageBatchId: batch.id 
          }
        });
        
        // 4. Verify relation
        const logWithBatch = await prisma.systemLog.findUnique({
            where: { id: log.id },
            include: { outageBatch: true }
        });
        
        expect(logWithBatch).toBeDefined();
        expect(logWithBatch?.outageBatchId).toBe(batch.id);
        expect(logWithBatch?.outageBatch).toBeDefined();
        expect(logWithBatch?.outageBatch?.id).toBe(batch.id);

        // Cleanup Log
        await prisma.systemLog.delete({ where: { id: log.id } });
    } catch (error) {
        throw error;
    } finally {
        // Cleanup Batch
        await prisma.outageBatch.delete({ where: { id: batch.id } });
    }
  });
});