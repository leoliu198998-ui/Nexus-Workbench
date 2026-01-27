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
