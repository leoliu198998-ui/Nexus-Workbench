import { describe, it, expect } from 'vitest';
import { prisma } from '../prisma';
import { createOutageBatch } from './factories';

describe('Test Factories', () => {
  it('createOutageBatch creates a batch with defaults and overrides', async () => {
    const remoteBatchId = 'test-remote-id-123';
    const token = 'test-token-abc';
    
    // This calls the factory function we are about to implement
    const batch = await createOutageBatch({
      remoteBatchId,
      token,
      batchName: 'Test Batch Factory'
    });

    expect(batch).toBeDefined();
    expect(batch.remoteBatchId).toBe(remoteBatchId);
    expect(batch.token).toBe(token);
    expect(batch.id).toBeDefined();

    // Verify in DB
    const dbBatch = await prisma.outageBatch.findUnique({
      where: { id: batch.id },
    });
    expect(dbBatch).toBeDefined();
    expect(dbBatch?.remoteBatchId).toBe(remoteBatchId);

    // Cleanup
    await prisma.outageBatch.delete({ where: { id: batch.id } });
  });
});
