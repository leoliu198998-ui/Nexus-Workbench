/**
 * Shared types for Outage Manager
 */

export interface LogEntry {
  timestamp: string;
  step: string;
  status: number;
  url?: string;
  method?: string;
  request?: {
    headers?: Record<string, string>;
    body?: unknown;
    curl?: string;
  };
  response?: {
    raw?: string;
    parsed?: unknown;
  };
}

export interface OutageBatch {
  id: string;
  envId: string;
  batchName: string;
  status: string;
  token: string;
  remoteBatchId?: string | null;
  releaseTimeZone?: string;
  releaseDatetime?: string;
  duration?: number;
  createdAt?: Date;
  environment?: { name: string };
  logs?: { steps: LogEntry[] };
}
