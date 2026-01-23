import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GET } from './route';
import { prisma } from '@/lib/prisma';

// Mock prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    releaseEnvironment: {
      findMany: vi.fn(),
    },
  },
}));

describe('GET /api/apps/outage-manager/environments', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return a list of environments', async () => {
    const mockEnvironments = [
      { id: '1', name: 'Test', baseUrl: 'http://test.com' },
      { id: '2', name: 'Prod', baseUrl: 'http://prod.com' },
    ];
    (prisma.releaseEnvironment.findMany as any).mockResolvedValue(mockEnvironments);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual(mockEnvironments);
    expect(prisma.releaseEnvironment.findMany).toHaveBeenCalledWith({
      orderBy: { name: 'asc' },
    });
  });

  it('should return 500 if prisma fails', async () => {
    (prisma.releaseEnvironment.findMany as any).mockRejectedValue(new Error('DB Error'));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data).toEqual({ error: 'Internal Server Error' });
  });
});
