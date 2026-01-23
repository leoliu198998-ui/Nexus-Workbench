import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('Prisma Singleton', () => {
  it('should export a prisma instance', () => {
    expect(prisma).toBeDefined();
  });
});

describe('Prisma Database Connection', () => {
  it('should be able to write and read from SystemLog', async () => {
    const testAction = 'TEST_CONNECTION_' + Date.now();
    
    // Create
    const log = await prisma.systemLog.create({
      data: {
        action: testAction,
        details: 'Automated test connection',
      },
    });
    expect(log.id).toBeDefined();
    expect(log.action).toBe(testAction);

    // Read
    const found = await prisma.systemLog.findUnique({
      where: { id: log.id },
    });
    expect(found).toBeDefined();
    expect(found?.action).toBe(testAction);

    // Cleanup
    await prisma.systemLog.delete({
      where: { id: log.id },
    });
  });
});