import React, { useRef, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Terminal, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { LogEntry } from '@/types/outage';

interface WizardLogsProps {
  logs?: { steps: LogEntry[] };
  isOpen: boolean;
  onToggle: () => void;
}

function CurlCommand({ request }: { request?: { headers?: Record<string, string>; body?: unknown; curl?: string } }) {
  if (!request || !request.curl) return null;
  
  return (
    <div className="relative mt-1">
      <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
        <Terminal className="w-3 h-3" />
        <span>Curl 命令:</span>
      </div>
      <pre className="font-mono text-[10px] leading-relaxed text-emerald-300 bg-slate-950/80 p-3 rounded-md border border-emerald-500/20 overflow-x-auto select-text cursor-text selection:bg-indigo-500/30 selection:text-white">
        {request.curl}
      </pre>
    </div>
  );
}

export function WizardLogs({ logs, isOpen, onToggle }: WizardLogsProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastLogsLength = useRef(logs?.steps?.length || 0);

  // Auto-scroll logs only when new logs are added
  useEffect(() => {
    const currentLength = logs?.steps?.length || 0;
    if (isOpen && logsEndRef.current && currentLength > lastLogsLength.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    lastLogsLength.current = currentLength;
  }, [logs?.steps?.length, isOpen]);

  return (
    <Card className="flex flex-col overflow-hidden bg-slate-950 border-slate-800 shadow-xl rounded-xl">
      <div 
        className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center gap-2 text-slate-400">
          <Terminal className="w-4 h-4" />
          <span className="text-xs font-mono font-medium tracking-wide">EXECUTION_LOGS</span>
        </div>
        <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", isOpen && "rotate-180")} />
      </div>
      
      {isOpen && (
        <div className="p-4 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto space-y-4 bg-slate-950/50">
          {(!logs?.steps || logs.steps.length === 0) && (
            <div className="text-slate-600 italic px-2">等待操作开始...</div>
          )}
          {logs?.steps?.map((log, i) => (
            <div key={i} className="flex flex-col gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-800/50 hover:border-slate-700/80 transition-all group selection:bg-indigo-500/30 selection:text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-slate-500 text-[10px] font-medium font-mono bg-slate-950/50 px-1.5 py-0.5 rounded">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>
                  <span className={cn(
                    "font-bold text-[10px] tracking-wider px-2 py-0.5 rounded-full border",
                    log.status >= 200 && log.status < 300 
                      ? "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" 
                      : "text-red-400 bg-red-500/10 border-red-500/20"
                  )}>
                    {log.step}
                  </span>
                </div>
                <span className={cn(
                  "text-[10px] font-bold",
                  log.status >= 200 && log.status < 300 ? "text-emerald-500/50" : "text-red-500/50"
                )}>
                  HTTP {log.status}
                </span>
              </div>
              
              {/* API 调用信息 - URL 和方法 */}
              {(log.url || log.method) && (
                <div className="text-xs text-slate-400 space-y-1">
                  {log.url && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[40px]">URL:</span>
                      <span className="font-mono text-slate-300 break-all">{log.url}</span>
                    </div>
                  )}
                  {log.method && (
                    <div className="flex items-start gap-2">
                      <span className="text-slate-500 min-w-[40px]">Method:</span>
                      <span className="font-mono text-slate-300">{log.method}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Curl 命令 */}
              {log.request ? <CurlCommand request={log.request} /> : null}

              {/* 请求信息 */}
              {log.request && (
                <div className="space-y-2">
                  {log.request.headers && typeof log.request.headers === 'object' && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">请求头:</div>
                      <pre className="font-mono text-[10px] leading-relaxed text-slate-300 bg-slate-950/80 p-2 rounded-md border border-slate-800 overflow-x-auto">
                        {JSON.stringify(log.request.headers, null, 2)}
                      </pre>
                    </div>
                  )}
                  {log.request.body !== undefined && log.request.body !== null && (
                    <div>
                      <div className="text-xs text-slate-500 mb-1">请求体:</div>
                      <pre className="font-mono text-[10px] leading-relaxed text-slate-300 bg-slate-950/80 p-2 rounded-md border border-slate-800 overflow-x-auto">
                        {JSON.stringify(log.request.body, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* 响应信息 */}
              {log.response && (
                <div className="relative mt-1">
                  <div className="text-xs text-slate-500 mb-1">响应:</div>
                  {typeof log.response === 'object' && log.response !== null && 'raw' in log.response && 'parsed' in log.response ? (
                    <div className="space-y-2">
                      {('raw' in log.response && log.response.raw && typeof log.response.raw === 'string') ? (
                        <div>
                          <div className="text-xs text-slate-500 mb-1">原始响应:</div>
                          <pre className="font-mono text-[10px] leading-relaxed text-slate-300 bg-slate-950/80 p-2 rounded-md border border-slate-800 overflow-x-auto select-text cursor-text">
                            {log.response.raw}
                          </pre>
                        </div>
                      ) : null}
                      {('parsed' in log.response && log.response.parsed) ? (
                        <div>
                          <div className="text-xs text-slate-500 mb-1">解析后响应:</div>
                          <pre className="font-mono text-[10px] leading-relaxed text-slate-300 bg-slate-950/80 p-2 rounded-md border border-slate-800 overflow-x-auto select-text cursor-text">
                            {JSON.stringify(log.response.parsed, null, 2)}
                          </pre>
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <pre className="font-mono text-[11px] leading-relaxed text-slate-300 bg-slate-950/80 p-3 rounded-md border border-slate-800 overflow-x-auto select-text cursor-text selection:bg-indigo-500/30 selection:text-white">
                      {(() => {
                        try {
                          const content = typeof log.response === 'string' ? JSON.parse(log.response) : log.response;
                          return JSON.stringify(content, null, 2);
                        } catch {
                          return String(log.response);
                        }
                      })()}
                    </pre>
                  )}
                </div>
              )}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      )}
    </Card>
  );
}
