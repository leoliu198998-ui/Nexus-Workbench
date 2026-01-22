import { describe, it, expect } from 'vitest';
import { prisma } from './prisma';

describe('Prisma Singleton', () => {
  it('should export a prisma instance', () => {
    expect(prisma).toBeDefined();
  });
});
