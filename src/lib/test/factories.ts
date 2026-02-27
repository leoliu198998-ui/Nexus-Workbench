import { prisma } from '../prisma';
import { Prisma } from '../../generated/client';

export async function createOutageBatch(
  overrides: Partial<Prisma.OutageBatchUncheckedCreateInput> = {}
) {
  // Ensure an environment exists
  let env = await prisma.releaseEnvironment.findFirst();
  if (!env) {
    env = await prisma.releaseEnvironment.create({
      data: {
        name: 'Test Environment',
        baseUrl: 'https://test-maintenance.bipocloud.com',
      },
    });
  }

  return prisma.outageBatch.create({
    data: {
      envId: env.id,
      batchName: 'Default Test Batch',
      releaseDatetime: new Date(),
      releaseTimeZone: 'Asia/Shanghai',
      duration: 60,
      token: 'default-test-token',
      ...overrides,
    },
  });
}
