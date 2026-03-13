import { prisma } from '@/lib/prisma';
import { OutageStatus, Prisma } from '@/generated/client';
import { logOutageAction } from '@/lib/services/logger';
import { generateCurlCommand, safeJsonParse } from '@/lib/utils';

interface CreateBatchDto {
  envId: string;
  batchName: string;
  releaseDatetime: string;
  releaseTimeZone: string;
  duration: number;
  token: string;
}

interface UpdateBatchDto {
  batchName: string;
  releaseDatetime: string;
  releaseTimeZone: string;
  duration: number;
}

const ACTION_MAP: Record<string, { path: string; nextStatus: OutageStatus }> = {
  publish: { path: '/publish', nextStatus: OutageStatus.NOTIFIED },
  release: { path: '/release', nextStatus: OutageStatus.STARTED },
  finish: { path: '/finish', nextStatus: OutageStatus.COMPLETED },
  cancel: { path: '/cancel', nextStatus: OutageStatus.CANCELLED },
};

interface ExtendedError extends Error {
  details?: string;
  apiCall?: Record<string, unknown>;
  logs?: { steps: Record<string, unknown>[] };
  status?: number;
}

export class OutageService {
  private static instance: OutageService;

  private constructor() { }

  public static getInstance(): OutageService {
    if (!OutageService.instance) {
      OutageService.instance = new OutageService();
    }
    return OutageService.instance;
  }

  // --- Private Helpers ---

  private formatDateTimeForApi(dateStr: string): string {
    // Expected format: "YYYY-MM-DD HH:mm"
    if (dateStr && dateStr.length === 16 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(dateStr)) {
      return dateStr.replace('T', ' ');
    }
    return dateStr;
  }

  private parseAndValidateDate(dateStr: string): Date {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`Invalid date provided: ${dateStr}`);
    }
    return date;
  }

  private buildExternalAuthHeaders(token: string): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    };
  }

  private validateResponse(responseData: Record<string, unknown>, requiredDataFields: string[] = []) {
    if (String(responseData.errcode) !== '0') {
      throw new Error((responseData.errmsg as string) || `接口返回错误码: ${responseData.errcode}`);
    }

    if (requiredDataFields.length > 0) {
      if (!responseData.data || typeof responseData.data !== 'object') {
        throw new Error('接口返回数据格式错误: 缺少data对象');
      }

      const data = responseData.data as Record<string, unknown>;
      const missingFields = requiredDataFields.filter(field => !(field in data));

      if (missingFields.length > 0) {
        throw new Error(`接口返回数据格式错误: 缺少必需字段 [${missingFields.join(', ')}]`);
      }
    }
  }

  private wrapExtendedError(apiError: unknown, context: {
    url: string;
    method: string;
    headers: Record<string, string>;
    payload: unknown;
    curl: string;
    response?: {
      status: number;
      raw: string;
      parsed: Record<string, unknown> | null;
    };
    logs?: { steps: Record<string, unknown>[] };
  }): ExtendedError {
    const error = new Error(apiError instanceof Error ? apiError.message : 'Unknown error') as ExtendedError;
    error.details = error.message;
    error.apiCall = {
      url: context.url,
      method: context.method,
      headers: context.headers,
      body: context.payload,
      curl: context.curl,
      ...(context.response ? { response: context.response } : {}),
    };
    if (context.logs) error.logs = context.logs;
    error.status = 502;
    return error;
  }

  // --- Public Methods ---

  async getBatch(id: string) {
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    return batch;
  }

  async createBatch(data: CreateBatchDto) {
    const { envId, batchName, releaseDatetime, releaseTimeZone, duration, token } = data;

    const environment = await prisma.releaseEnvironment.findUnique({
      where: { id: envId },
    });

    if (!environment) {
      throw new Error('Environment not found');
    }

    const externalUrl = `${environment.baseUrl}/devops/release-batch`;
    const formattedReleaseDatetime = this.formatDateTimeForApi(releaseDatetime);

    const externalPayload = {
      batchName,
      releaseDatetime: formattedReleaseDatetime,
      releaseTimeZone,
      duration,
    };

    const requestHeaders = this.buildExternalAuthHeaders(token);

    const curlCommand = generateCurlCommand(externalUrl, 'POST', requestHeaders, externalPayload);
    const logs: { steps: Record<string, unknown>[] } = { steps: [] };
    let remoteBatchId: string | null = null;
    let response: Response | null = null;
    let responseText = '';
    let responseData: Record<string, unknown> | null = null;

    try {
      response = await fetch(externalUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(externalPayload),
      });

      responseText = await response.text();

      // 检查响应状态和内容
      if (!response.ok) {
        // 尝试解析错误响应
        try {
          responseData = safeJsonParse<Record<string, unknown>>(responseText);
        } catch {
          responseData = null;
        }

        logs.steps.push({
          step: 'CREATE_BATCH',
          url: externalUrl,
          method: 'POST',
          request: {
            headers: requestHeaders,
            body: externalPayload,
            curl: curlCommand,
          },
          status: response.status,
          response: {
            raw: responseText,
            parsed: responseData,
          },
          timestamp: new Date().toISOString(),
        });

        const errorMsg = responseData?.errmsg as string || responseData?.message as string || `External API returned ${response.status}: ${responseText || 'Empty response'}`;
        throw new Error(errorMsg);
      }

      // 解析成功的响应
      if (!responseText) {
        throw new Error('External API returned empty response');
      }

      responseData = safeJsonParse<Record<string, unknown>>(responseText);

      logs.steps.push({
        step: 'CREATE_BATCH',
        url: externalUrl,
        method: 'POST',
        request: {
          headers: requestHeaders,
          body: externalPayload,
          curl: curlCommand,
        },
        status: response.status,
        response: {
          raw: responseText,
          parsed: responseData,
        },
        timestamp: new Date().toISOString(),
      });

      this.validateResponse(responseData, ['batchId', 'batchName', 'originalDateTime', 'originalTimeZone', 'duration', 'releaseDatetime', 'releaseStatus', 'noticeStatus']);

      const batchData = responseData.data as Record<string, unknown>;
      if (!batchData.batchId || (typeof batchData.batchId !== 'number' && typeof batchData.batchId !== 'string')) {
        throw new Error('接口返回的batchId无效');
      }

      remoteBatchId = String(batchData.batchId);

    } catch (apiError: unknown) {
      console.error('External API Error:', apiError);
      throw this.wrapExtendedError(apiError, {
        url: externalUrl,
        method: 'POST',
        headers: requestHeaders,
        payload: externalPayload,
        curl: curlCommand,
        response: response ? {
          status: response.status,
          raw: responseText,
          parsed: responseData,
        } : undefined,
        logs
      });
    }

    const batch = await prisma.outageBatch.create({
      data: {
        envId,
        batchName,
        releaseDatetime: this.parseAndValidateDate(releaseDatetime),
        releaseTimeZone,
        duration,
        token,
        remoteBatchId,
        status: 'CREATED',
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      await logOutageAction(batch.id, 'OUTAGE_BATCH_CREATE', `成功创建停机批次: ${batchName}`);
    } catch (logError) {
      console.error('[LOGGING] Failed to record system log:', logError);
    }

    return batch;
  }

  async updateBatch(id: string, data: UpdateBatchDto) {
    const { batchName, releaseDatetime, releaseTimeZone, duration } = data;

    // 1. Fetch current batch
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    // 2. Validate status
    if (batch.status !== OutageStatus.CREATED && batch.status !== OutageStatus.NOTIFIED) {
      throw new Error('Only CREATED or NOTIFIED batches can be updated');
    }

    if (!batch.remoteBatchId) {
      throw new Error('Remote batch ID is missing');
    }

    // 3. Call external API
    const externalUrl = `${batch.environment.baseUrl}/devops/release-batch/update/${batch.remoteBatchId}`;

    // Format datetime
    const formattedReleaseDatetime = this.formatDateTimeForApi(releaseDatetime);

    const externalPayload = {
      batchName,
      releaseDatetime: formattedReleaseDatetime,
      releaseTimeZone,
      duration
    };

    const requestHeaders = this.buildExternalAuthHeaders(batch.token);

    const curlCommand = generateCurlCommand(externalUrl, 'PUT', requestHeaders, externalPayload);
    const logs = (batch.logs as { steps: Record<string, unknown>[] }) || { steps: [] };
    let response: Response | null = null;
    let responseText = '';
    let responseData: Record<string, unknown> | null = null;

    try {
      response = await fetch(externalUrl, {
        method: 'PUT',
        headers: requestHeaders,
        body: JSON.stringify(externalPayload),
      });

      responseText = await response.text();

      // 检查响应状态和内容
      if (!response.ok) {
        // 尝试解析错误响应
        try {
          responseData = safeJsonParse<Record<string, unknown>>(responseText);
        } catch {
          responseData = null;
        }

        logs.steps.push({
          step: 'UPDATE_BATCH',
          url: externalUrl,
          method: 'PUT',
          request: {
            headers: requestHeaders,
            body: externalPayload,
            curl: curlCommand,
          },
          status: response.status,
          response: {
            raw: responseText,
            parsed: responseData,
          },
          timestamp: new Date().toISOString(),
        });

        const errorMsg = responseData?.errmsg as string || responseData?.message as string || `External API returned ${response.status}: ${responseText || 'Empty response'}`;
        throw new Error(errorMsg);
      }

      // 解析成功的响应
      if (!responseText) {
        throw new Error('External API returned empty response');
      }

      responseData = safeJsonParse<Record<string, unknown>>(responseText);

      logs.steps.push({
        step: 'UPDATE_BATCH',
        url: externalUrl,
        method: 'PUT',
        request: {
          headers: requestHeaders,
          body: externalPayload,
          curl: curlCommand,
        },
        status: response.status,
        response: {
          raw: responseText,
          parsed: responseData,
        },
        timestamp: new Date().toISOString(),
      });

      this.validateResponse(responseData);
    } catch (apiError: unknown) {
      console.error('External API Update Error:', apiError);
      // Update logs even on failure
      await prisma.outageBatch.update({
        where: { id },
        data: { logs: logs as unknown as Prisma.InputJsonValue },
      });
      throw this.wrapExtendedError(apiError, {
        url: externalUrl,
        method: 'PUT',
        headers: requestHeaders,
        payload: externalPayload,
        curl: curlCommand,
        response: response ? {
          status: response.status,
          raw: responseText,
          parsed: responseData,
        } : undefined,
        logs
      });
    }

    // 4. Update local record AND RESET STATUS TO CREATED
    const updatedBatch = await prisma.outageBatch.update({
      where: { id },
      data: {
        batchName,
        releaseDatetime: this.parseAndValidateDate(releaseDatetime),
        releaseTimeZone,
        duration,
        status: OutageStatus.CREATED,
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      await logOutageAction(id, 'OUTAGE_BATCH_UPDATE_SUCCESS', `成功更新批次信息并重置状态为 CREATED`);
    } catch (e) {
      console.error('[LOGGING] Failed to log update success:', e);
    }

    return updatedBatch;
  }

  async executeAction(id: string, action: string, token?: string) {
    // 1. Handle token update only
    if (!action && token) {
      const updatedBatch = await prisma.outageBatch.update({
        where: { id },
        data: { token },
      });
      try {
        await logOutageAction(id, 'OUTAGE_BATCH_TOKEN_UPDATE', '更新了鉴权 Token');
      } catch (e) {
        console.error('[LOGGING] Failed to log token update:', e);
      }
      return updatedBatch;
    }

    // 2. Handle fix-batch-id
    if (action === 'fix-batch-id') {
      const batch = await prisma.outageBatch.findUnique({
        where: { id },
        include: { environment: true },
      });

      if (!batch) {
        throw new Error('Batch not found');
      }

      type StepLog = { step: string; response?: { raw?: string } };
      type LogsData = { steps: StepLog[] } | null;
      const logs = batch.logs as LogsData;
      const createStep = logs?.steps?.find((s: StepLog) => s.step === 'CREATE_BATCH');

      if (!createStep || !createStep.response) {
        throw new Error('无法找到创建批次的日志');
      }

      const responseRaw = (createStep.response as { raw?: string }).raw;
      if (!responseRaw) {
        throw new Error('日志中缺少原始响应文本');
      }

      const batchIdMatch = responseRaw.match(/"batchId"\s*:\s*"?(\d{15,})"?/);
      if (!batchIdMatch || !batchIdMatch[1]) {
        throw new Error('无法从日志中提取 batchId');
      }

      const correctBatchId = batchIdMatch[1];

      const updatedBatch = await prisma.outageBatch.update({
        where: { id },
        data: { remoteBatchId: correctBatchId },
      });

      try {
        await logOutageAction(id, 'OUTAGE_BATCH_FIX_ID', `修复了批次 ID: ${batch.remoteBatchId} -> ${correctBatchId}`);
      } catch (e) {
        console.error('[LOGGING] Failed to log fix-batch-id:', e);
      }

      return {
        ...updatedBatch,
        message: `已修复 batchId: ${batch.remoteBatchId} -> ${correctBatchId}`,
      };
    }

    const config = ACTION_MAP[action];
    if (!config) {
      throw new Error('Invalid action');
    }

    // 3. Normal actions
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      throw new Error('Batch not found');
    }

    if (!batch.remoteBatchId) {
      throw new Error('Remote batch ID is missing');
    }

    const externalUrl = `${batch.environment.baseUrl}/devops/release-batch${config.path}`;
    const externalPayload = {
      batchId: batch.remoteBatchId,
    };

    const logs = (batch.logs as { steps: Record<string, unknown>[] }) || { steps: [] };
    const requestHeaders = this.buildExternalAuthHeaders(batch.token);

    const curlCommand = generateCurlCommand(externalUrl, 'POST', requestHeaders, externalPayload);

    let response: Response | null = null;
    let responseText = '';
    let responseData: Record<string, unknown> | null = null;

    try {
      response = await fetch(externalUrl, {
        method: 'POST',
        headers: requestHeaders,
        body: JSON.stringify(externalPayload),
      });

      responseText = await response.text();

      // 检查响应状态和内容
      if (!response.ok) {
        // 尝试解析错误响应
        try {
          responseData = safeJsonParse<Record<string, unknown>>(responseText);
        } catch {
          responseData = null;
        }

        logs.steps.push({
          step: action.toUpperCase(),
          url: externalUrl,
          method: 'POST',
          request: {
            headers: requestHeaders,
            body: externalPayload,
            curl: curlCommand,
          },
          status: response.status,
          response: {
            raw: responseText,
            parsed: responseData,
          },
          timestamp: new Date().toISOString(),
        });

        const errorMsg = responseData?.errmsg as string || responseData?.message as string || `External API returned ${response.status}: ${responseText || 'Empty response'}`;
        try {
          await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_FAILED`, `外部 API 调用失败: ${errorMsg}`);
        } catch (e) {
          console.error('[LOGGING] Failed to log action failure (HTTP):', e);
        }
        throw new Error(errorMsg);
      }

      // 解析成功的响应
      if (!responseText) {
        throw new Error('External API returned empty response');
      }

      responseData = safeJsonParse<Record<string, unknown>>(responseText);

      logs.steps.push({
        step: action.toUpperCase(),
        url: externalUrl,
        method: 'POST',
        request: {
          headers: requestHeaders,
          body: externalPayload,
          curl: curlCommand,
        },
        status: response.status,
        response: {
          raw: responseText,
          parsed: responseData,
        },
        timestamp: new Date().toISOString(),
      });

      if (responseData.errcode !== undefined && String(responseData.errcode) !== '0') {
        const errmsg = responseData.errmsg as string;
        try {
          await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_FAILED`, `接口返回错误码: ${responseData.errcode}, 错误信息: ${errmsg}`);
        } catch (e) {
          console.error('[LOGGING] Failed to log action failure (Logic):', e);
        }

        if (errmsg && errmsg.includes('EntityNotFoundException') && errmsg.includes('Unable to find')) {
          throw new Error(`外部系统中找不到对应的批次记录 (ID: ${batch.remoteBatchId})。请检查外部系统或重新创建批次。`);
        }
        throw new Error(errmsg || `接口返回错误码: ${responseData.errcode}`);
      }
    } catch (apiError: unknown) {
      console.error(`External API Error (${action}):`, apiError);

      await prisma.outageBatch.update({
        where: { id },
        data: { logs: logs as unknown as Prisma.InputJsonValue },
      });

      throw this.wrapExtendedError(apiError, {
        url: externalUrl,
        method: 'POST',
        headers: requestHeaders,
        payload: externalPayload,
        curl: curlCommand,
        response: response ? {
          status: response.status,
          raw: responseText,
          parsed: responseData,
        } : undefined,
        logs
      });
    }

    const updatedBatch = await prisma.outageBatch.update({
      where: { id },
      data: {
        status: config.nextStatus,
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    try {
      await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_SUCCESS`, `成功执行操作: ${action}`);
    } catch (e) {
      console.error('[LOGGING] Failed to log action success:', e);
    }

    return {
      ...updatedBatch,
      apiCall: {
        url: externalUrl,
        method: 'POST',
        request: {
          headers: requestHeaders,
          body: externalPayload,
          curl: curlCommand,
        },
        response: {
          status: response!.status,
          raw: responseText,
          parsed: responseData!,
        },
      },
    };
  }
}

export const outageService = OutageService.getInstance();
