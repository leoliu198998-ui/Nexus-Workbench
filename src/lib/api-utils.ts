import { NextResponse } from 'next/server';

interface ExtendedError extends Error {
    details?: string;
    apiCall?: Record<string, unknown>;
    logs?: { steps: Record<string, unknown>[] };
    status?: number;
}

/**
 * 统一处理 API 路由中的错误
 * 根据错误类型返回标准的 JSON 格式和 HTTP 状态码
 */
export function handleApiError(error: unknown, defaultMessage = 'Internal Server Error'): NextResponse {
    // 1. 处理已知业务错误
    if (error instanceof Error) {
        if (error.message === 'Batch not found' || error.message === 'Environment not found') {
            return NextResponse.json({ error: error.message }, { status: 404 });
        }
        if (error.message === 'Invalid action') {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        if (error.message.includes('Only CREATED or NOTIFIED')) {
            return NextResponse.json({ error: error.message }, { status: 403 });
        }
    }

    // 2. 处理服务层抛出的扩展错误 (通常是外部 API 调用失败)
    if (error && typeof error === 'object') {
        const extError = error as ExtendedError;

        // 检查是否有 apiCall 属性，这标志着它是我们封装的外部服务错误
        if ('apiCall' in extError || 'status' in extError) {
            const status = extError.status && typeof extError.status === 'number' ? extError.status : 502;
            return NextResponse.json({
                error: 'External API Error',
                details: extError.message || 'Unknown external error',
                apiCall: extError.apiCall,
                logs: extError.logs,
            }, { status });
        }
    }

    // 3. 处理其他外部 API 错误特征（为了兼容旧的抛出方式）
    if (error instanceof Error) {
        const isExternalError =
            error.message.includes('接口返回数据格式错误') ||
            error.message.includes('接口返回的batchId无效') ||
            error.message.includes('接口返回错误码') ||
            error.message.includes('Failed to parse JSON') ||
            error.message === 'External API failed';

        if (isExternalError) {
            console.error(`[API Error] External API failure: ${error.message}`);
            return NextResponse.json({
                error: 'External API Error',
                details: error.message
            }, { status: 502 });
        }
    }

    // 4. 兜底处理：500 内部服务器错误
    console.error(`[API Error] ${defaultMessage}:`, error);
    return NextResponse.json({
        error: defaultMessage,
        details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
}
