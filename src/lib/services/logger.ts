import { prisma } from '../prisma';

/**
 * 记录与停机批次关联的系统日志
 * @param outageBatchId 停机批次 UUID
 * @param action 操作类型 (例如: 'OUTAGE_BATCH_PUBLISH')
 * @param details 操作详情
 */
export async function logOutageAction(
  outageBatchId: string,
  action: string,
  details: string
) {
  return await prisma.systemLog.create({
    data: {
      action,
      details,
      outageBatchId,
    },
  });
}
