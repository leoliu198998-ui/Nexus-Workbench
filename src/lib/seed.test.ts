import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('Database Seeding', () => {
  it('should have all 5 required environments', async () => {
    const requiredEnvs = [
      { url: 'https://test-maintenance.bipocloud.com' },
      { url: 'https://uat-maintenance.butterglobe.com' },
      { url: 'https://maintenance.butterglobe.com' },
      { url: 'https://maintenance.butterglobe.cn' },
      { url: 'http://wise-maintenance.bipocloud.com' },
    ];

    const dbEnvs = await prisma.releaseEnvironment.findMany();

    for (const req of requiredEnvs) {
      const found = dbEnvs.find(e => e.baseUrl === req.url);
      expect(found, `Environment with URL ${req.url} not found`).toBeDefined();
    }
  });
});
