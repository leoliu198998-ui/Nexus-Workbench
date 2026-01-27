import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { OutageStatus, Prisma } from '@/generated/client';
import { logOutageAction } from '@/lib/services/logger';

/**
 * 生成 curl 命令字符串，用于调试和记录 API 调用
 */
function generateCurlCommand(
  url: string,
  method: string,
  headers: Record<string, string>,
  body?: unknown
): string {
  const headersStr = Object.entries(headers)
    .map(([key, value]) => `-H '${key}: ${value}'`)
    .join(' \\\n  ');
  
  const bodyStr = body ? `-d '${JSON.stringify(body)}'` : '';
  
  return `curl -X ${method} '${url}' \\\n  ${headersStr}${bodyStr ? ` \\\n  ${bodyStr}` : ''}`;
}

const ACTION_MAP: Record<string, { path: string; nextStatus: OutageStatus }> = {
  publish: { path: '/publish', nextStatus: OutageStatus.NOTIFIED },
  release: { path: '/release', nextStatus: OutageStatus.STARTED },
  finish: { path: '/finish', nextStatus: OutageStatus.COMPLETED },
  cancel: { path: '/cancel', nextStatus: OutageStatus.CANCELLED },
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    return NextResponse.json(batch);
  } catch (error) {
    console.error('Failed to fetch batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { action, token } = body;

    // 1. 如果没有 action，但提供了 token，则执行单纯的 Token 更新
    if (!action && token) {
      const updatedBatch = await prisma.outageBatch.update({
        where: { id },
        data: { token },
      });
      // 记录日志
      try {
        await logOutageAction(id, 'OUTAGE_BATCH_TOKEN_UPDATE', '更新了鉴权 Token');
      } catch (e) {
        console.error('[LOGGING] Failed to log token update:', e);
      }
      return NextResponse.json(updatedBatch);
    }

    // 1.5. 如果 action 是 'fix-batch-id'，则从 logs 中提取正确的 batchId 并更新
    if (action === 'fix-batch-id') {
      const batch = await prisma.outageBatch.findUnique({
        where: { id },
        include: { environment: true },
      });

      if (!batch) {
        return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
      }

      type StepLog = { step: string; response?: { raw?: string } };
      type LogsData = { steps: StepLog[] } | null;
      const logs = batch.logs as LogsData;
      const createStep = logs?.steps?.find((s: StepLog) => s.step === 'CREATE_BATCH');

      if (!createStep || !createStep.response) {
        return NextResponse.json({ error: '无法找到创建批次的日志' }, { status: 400 });
      }

      // 从原始响应文本中提取 batchId
      const responseRaw = (createStep.response as { raw?: string }).raw;
      if (!responseRaw) {
        return NextResponse.json({ error: '日志中缺少原始响应文本' }, { status: 400 });
      }

      // 从原始响应文本中提取 batchId（作为字符串），防止精度丢失
      const batchIdMatch = responseRaw.match(/"batchId"\s*:\s*"?(\d{15,})"?/);
      if (!batchIdMatch || !batchIdMatch[1]) {
        return NextResponse.json({ error: '无法从日志中提取 batchId' }, { status: 400 });
      }

      const correctBatchId = batchIdMatch[1];
      
      // 更新 remoteBatchId
      const updatedBatch = await prisma.outageBatch.update({
        where: { id },
        data: { remoteBatchId: correctBatchId },
      });

      // 记录日志
      try {
        await logOutageAction(id, 'OUTAGE_BATCH_FIX_ID', `修复了批次 ID: ${batch.remoteBatchId} -> ${correctBatchId}`);
      } catch (e) {
        console.error('[LOGGING] Failed to log fix-batch-id:', e);
      }

      return NextResponse.json({
        ...updatedBatch,
        message: `已修复 batchId: ${batch.remoteBatchId} -> ${correctBatchId}`,
      });
    }

    const config = ACTION_MAP[action];
    if (!config) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    // 1. Fetch batch info with environment
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    if (!batch.remoteBatchId) {
      return NextResponse.json({ error: 'Remote batch ID is missing' }, { status: 400 });
    }

    // 2. Call external API
    const externalUrl = `${batch.environment.baseUrl}/devops/release-batch${config.path}`;
    
    // 使用 BigInt 将 batchId 转换为数字（防止精度丢失），然后序列化为 JSON 时外部 API 通常能处理
    // 注意：JSON.stringify 会把 BigInt 转换为普通数字（如果直接传 BigInt 会报错，所以我们通常传字符串或者确保外部 API 接受字符串）
    // 如果外部 API 严格要求数字且不支持科学计数法，我们需要特殊的处理。
    // 这里我们先尝试直接传字符串，如果外部 API 不支持，我们再考虑其他方案。
    // 大多数现代 Java/Node 后端都能处理 JSON 中的 "batchId": "..." 映射到 Long 类型的字段。
    
    const externalPayload = {
      batchId: batch.remoteBatchId, // 直接传字符串，避免 Number() 转换导致的精度丢失
    };

    const logs = (batch.logs as { steps: Record<string, unknown>[] }) || { steps: [] };

    // 准备请求头
    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-dk-token': batch.token,
    };

    // 生成 curl 命令
    const curlCommand = generateCurlCommand(
      externalUrl,
      'POST',
      requestHeaders,
      externalPayload
    );

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
      
      // 使用正则将响应中的大整数 batchId 包装成字符串，防止 JSON.parse 丢失精度
      const safeResponseText = responseText.replace(/"batchId"\s*:\s*(\d{15,})/g, '"batchId":"$1"');
      responseData = JSON.parse(safeResponseText) as Record<string, unknown>;

      // 记录完整的 API 调用信息，包括 curl 命令和响应
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

      if (!response.ok) {
        const errorMsg = (responseData.errmsg as string) || (responseData.message as string) || `External API failed for ${action}`;
        // 记录失败日志
        try {
          await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_FAILED`, `外部 API 调用失败: ${errorMsg}`);
        } catch (e) {
          console.error('[LOGGING] Failed to log action failure (HTTP):', e);
        }
        throw new Error(errorMsg);
      }

      // 验证逻辑错误码 (errcode)
      if (responseData.errcode !== undefined && String(responseData.errcode) !== '0') {
        const errmsg = responseData.errcode !== undefined ? (responseData.errmsg as string) : '';
        // 记录失败日志
        try {
          await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_FAILED`, `接口返回错误码: ${responseData.errcode}, 错误信息: ${errmsg}`);
        } catch (e) {
          console.error('[LOGGING] Failed to log action failure (Logic):', e);
        }
        
        // 检查是否是 EntityNotFoundException
        if (errmsg && errmsg.includes('EntityNotFoundException') && errmsg.includes('Unable to find')) {
          throw new Error(`外部系统中找不到对应的批次记录 (ID: ${batch.remoteBatchId})。这可能是因为：1) 创建批次时外部系统未成功保存记录；2) 外部系统中的记录已被删除；3) 批次 ID 不匹配。请检查外部系统或重新创建批次。原始错误: ${errmsg}`);
        }
        throw new Error(errmsg || `接口返回错误码: ${responseData.errcode}`);
      }
    } catch (apiError: unknown) {
      console.error(`External API Error (${action}):`, apiError);
      
      // Update logs even on failure
      await prisma.outageBatch.update({
        where: { id },
        data: { logs: logs as unknown as Prisma.InputJsonValue },
      });

      // 返回错误响应，包含 curl 命令和完整的请求/响应信息
      return NextResponse.json({ 
        error: 'External API Error', 
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        apiCall: {
          url: externalUrl,
          method: 'POST',
          headers: requestHeaders,
          body: externalPayload,
          curl: curlCommand,
          ...(response && responseData ? {
            response: {
              status: response.status,
              raw: responseText,
              parsed: responseData,
            },
          } : {}),
        },
        logs 
      }, { status: 502 });
    }

    // 3. Update local record
    const updatedBatch = await prisma.outageBatch.update({
      where: { id },
      data: {
        status: config.nextStatus,
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    // 记录成功日志
    try {
      await logOutageAction(id, `OUTAGE_BATCH_${action.toUpperCase()}_SUCCESS`, `成功执行操作: ${action}`);
    } catch (e) {
      console.error('[LOGGING] Failed to log action success:', e);
    }

    // 返回成功响应，包含 curl 命令和完整的请求/响应信息
    return NextResponse.json({
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
    });
  } catch (error) {
    console.error('Failed to update batch status:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { batchName, releaseDatetime, releaseTimeZone, duration } = body;

    // 1. Fetch current batch
    const batch = await prisma.outageBatch.findUnique({
      where: { id },
      include: { environment: true },
    });

    if (!batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // 2. Validate status
    if (batch.status !== OutageStatus.CREATED && batch.status !== OutageStatus.NOTIFIED) {
      return NextResponse.json({ error: 'Only CREATED or NOTIFIED batches can be updated' }, { status: 403 });
    }

    if (!batch.remoteBatchId) {
      return NextResponse.json({ error: 'Remote batch ID is missing' }, { status: 400 });
    }

    // 3. Call external API
    const externalUrl = `${batch.environment.baseUrl}/devops/release-batch/update/${batch.remoteBatchId}`;
    
    // Format datetime for external API
    // datetime-local input returns YYYY-MM-DDTHH:mm
    // External API expects YYYY-MM-DD HH:mm (space separator, no seconds)
    let formattedReleaseDatetime = releaseDatetime;
    
    if (releaseDatetime && releaseDatetime.length === 16 && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(releaseDatetime)) {
      // Replace T with space to get YYYY-MM-DD HH:mm format
      formattedReleaseDatetime = releaseDatetime.replace('T', ' ');
    }

    const externalPayload = {
      batchName,
      releaseDatetime: formattedReleaseDatetime,
      releaseTimeZone,
      duration
    };

    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-dk-token': batch.token,
    };

    const curlCommand = generateCurlCommand(externalUrl, 'PUT', requestHeaders, externalPayload);

    let response: Response | null = null;
    let responseText = '';
    let responseData: Record<string, unknown> | null = null;

    const logs = (batch.logs as { steps: Record<string, unknown>[] }) || { steps: [] };

    try {
      response = await fetch(externalUrl, {
        method: 'PUT',
        headers: requestHeaders,
        body: JSON.stringify(externalPayload),
      });

      responseText = await response.text();
      const safeResponseText = responseText.replace(/"batchId"\s*:\s*(\d{15,})/g, '"batchId":"$1"');
      responseData = JSON.parse(safeResponseText) as Record<string, unknown>;

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

      if (!response.ok) {
        throw new Error((responseData.errmsg as string) || (responseData.message as string) || 'External API failed');
      }

      if (responseData.errcode !== undefined && String(responseData.errcode) !== '0') {
        throw new Error((responseData.errmsg as string) || `接口返回错误码: ${responseData.errcode}`);
      }
    } catch (apiError: unknown) {
      console.error('External API Update Error:', apiError);
      
      // Update logs even on failure
      await prisma.outageBatch.update({
        where: { id },
        data: { logs: logs as unknown as Prisma.InputJsonValue },
      });

      return NextResponse.json({ 
        error: 'External API Error', 
        details: apiError instanceof Error ? apiError.message : 'Unknown error',
        logs 
      }, { status: 502 });
    }

    // 4. Update local record AND RESET STATUS TO CREATED
    const updatedBatch = await prisma.outageBatch.update({
      where: { id },
      data: {
        batchName,
        releaseDatetime: new Date(releaseDatetime), // Assuming ISO string or compatible
        releaseTimeZone,
        duration,
        status: OutageStatus.CREATED, // Force reset to CREATED
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    // 5. Log action
    try {
      await logOutageAction(id, 'OUTAGE_BATCH_UPDATE_SUCCESS', `成功更新批次信息并重置状态为 CREATED`);
    } catch (e) {
      console.error('[LOGGING] Failed to log update success:', e);
    }

    return NextResponse.json(updatedBatch);

  } catch (error) {
    console.error('Failed to update batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
