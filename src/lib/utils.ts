import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import JSONBig from 'json-bigint'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function safeJsonParse<T = unknown>(text: string): T {
  try {
    // Parse using json-bigint with string output for large numbers
    const parse = JSONBig({ storeAsString: true }).parse;
    return parse(text) as T;
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * 生成 curl 命令字符串，用于调试和记录 API 调用
 */
export function generateCurlCommand(
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
