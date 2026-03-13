import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const prismaClientMock = vi.fn();
const poolMock = vi.fn();
const prismaPgMock = vi.fn();

vi.mock('../generated/client', () => ({
  PrismaClient: prismaClientMock,
}));

vi.mock('pg', () => ({
  Pool: poolMock,
}));

vi.mock('@prisma/adapter-pg', () => ({
  PrismaPg: prismaPgMock,
}));

describe('prisma SSL config', () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    delete (globalThis as { prisma?: unknown }).prisma;

    poolMock.mockImplementation(function Pool(options: unknown) {
      return { options };
    });
    prismaPgMock.mockImplementation(function PrismaPg(pool: unknown) {
      return { pool };
    });
    prismaClientMock.mockImplementation(function PrismaClient() {
      return { mocked: true };
    });
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    delete (globalThis as { prisma?: unknown }).prisma;
  });

  it('uses rejectUnauthorized false for hosted databases in production', async () => {
    vi.stubEnv(
      'DATABASE_URL',
      'postgresql://postgres:secret@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
    );
    vi.stubEnv('NODE_ENV', 'production');

    await import('./prisma');

    expect(poolMock).toHaveBeenCalledWith({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
    });
  });

  it('skips ssl config when DATABASE_URL is missing', async () => {
    vi.stubEnv('DATABASE_URL', '');
    vi.stubEnv('NODE_ENV', 'development');

    await import('./prisma');

    expect(poolMock).toHaveBeenCalledWith({
      connectionString: '',
      ssl: undefined,
    });
  });
});
