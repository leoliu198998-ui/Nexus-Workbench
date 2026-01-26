import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@/generated/client';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const envId = searchParams.get('envId');

    const where = envId ? { envId } : {};

    const batches = await prisma.outageBatch.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
      include: {
        environment: true,
      },
      take: 20,
    });

    return NextResponse.json(batches);
  } catch (error) {
    console.error('Failed to fetch batches:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { envId, batchName, releaseDatetime, releaseTimeZone, duration, token } = body;

    // 1. Fetch environment info
    const environment = await prisma.releaseEnvironment.findUnique({
      where: { id: envId },
    });

    if (!environment) {
      return NextResponse.json({ error: 'Environment not found' }, { status: 404 });
    }

    // 2. Call external API
    const externalUrl = `${environment.baseUrl}/devops/release-batch`;
    
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
      duration,
    };

    let remoteBatchId = null;
    const logs: { steps: Record<string, unknown>[] } = { steps: [] };

    // 准备请求头
    const requestHeaders = {
      'Content-Type': 'application/json',
      'x-dk-token': token,
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
      
      // 先从原始响应文本中提取 batchId（作为字符串），防止精度丢失
      // 匹配 "batchId": 2026... 或 "batchId":"2026..." 这种格式
      let extractedBatchId: string | null = null;
      const batchIdMatch = responseText.match(/"batchId"\s*:\s*"?(\d{15,})"?/);
      if (batchIdMatch && batchIdMatch[1]) {
        extractedBatchId = batchIdMatch[1];
      }
      
      // 使用正则将响应中的大整数 batchId 包装成字符串，防止 JSON.parse 丢失精度
      // 匹配 "batchId": 2026... 这种未加引号的数字
      const safeResponseText = responseText.replace(/"batchId"\s*:\s*(\d{15,})/g, '"batchId":"$1"');
      responseData = JSON.parse(safeResponseText) as Record<string, unknown>;
      
      // 记录完整的 API 调用信息，包括 curl 命令和响应
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

      if (!response.ok) {
        throw new Error((responseData.errmsg as string) || (responseData.message as string) || 'External API failed');
      }

      // 验证响应格式 - 统一支持字符串和数字类型的 errcode
      const errcode = String(responseData.errcode);
      if (errcode !== '0') {
        throw new Error((responseData.errmsg as string) || `接口返回错误码: ${errcode}`);
      }

      // 验证必需的响应字段 - API返回对象而非数组
      if (!responseData.data || typeof responseData.data !== 'object') {
        throw new Error('接口返回数据格式错误: 缺少data对象');
      }

      const batchData = responseData.data as Record<string, unknown>;
      
      // 验证批次数据的必需字段（检查是否存在，但不检查值）
      const requiredFields = ['batchId', 'batchName', 'originalDateTime', 'originalTimeZone', 'duration', 'releaseDatetime', 'releaseStatus', 'noticeStatus'];
      const missingFields = requiredFields.filter(field => !(field in batchData));
      
      if (missingFields.length > 0) {
        throw new Error(`接口返回数据格式错误: 缺少必需字段 [${missingFields.join(', ')}]`);
      }

      // 验证batchId的值是否有效
      if (!batchData.batchId || (typeof batchData.batchId !== 'number' && typeof batchData.batchId !== 'string')) {
        throw new Error('接口返回的batchId无效');
      }

      // 提取远程批次ID - 优先使用从原始响应文本中提取的值，避免精度丢失
      // 如果提取失败，则使用解析后的值（此时应该已经是字符串了）
      if (extractedBatchId) {
        remoteBatchId = extractedBatchId;
      } else {
        // 如果正则提取失败，使用解析后的值
        // 此时 batchId 应该是字符串（因为正则已经替换过了）
        remoteBatchId = typeof batchData.batchId === 'string' 
          ? batchData.batchId 
          : String(batchData.batchId);
      }
    } catch (apiError: unknown) {
      console.error('External API Error:', apiError);
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

    // 3. Create local record
    const batch = await prisma.outageBatch.create({
      data: {
        envId,
        batchName,
        releaseDatetime: new Date(releaseDatetime),
        releaseTimeZone,
        duration,
        token,
        remoteBatchId,
        status: 'CREATED',
        logs: logs as unknown as Prisma.InputJsonValue,
      },
    });

    // 返回成功响应，包含 curl 命令和完整的请求/响应信息
    return NextResponse.json({
      ...batch,
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
    console.error('Failed to create batch:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
