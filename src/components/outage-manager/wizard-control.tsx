'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { 
  CheckCircle2, 
  Circle, 
  Play, 
  Megaphone, 
  Check, 
  Terminal, 
  ChevronDown, 
  ChevronUp, 
  AlertTriangle,
  Loader2,
  Clock,
  Calendar,
  MoreHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalTokenInput } from './global-token-input';

// ... (Existing Interfaces) ...
interface LogEntry {
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
  } | unknown;
}

interface OutageBatch {
  id: string;
  envId: string;
  batchName: string;
  status: string;
  token: string;
  environment?: { name: string };
  logs?: { steps: LogEntry[] };
}

interface WizardControlProps {
  batch: OutageBatch;
  onUpdate: (updatedBatch: OutageBatch) => void;
  onReset: () => void;
  // Pass token props through
  token: string;
  onTokenChange: (token: string) => void;
  isSavingToken: boolean;
}

const STEPS = [
  { id: 'CREATED', label: '已创建', icon: Circle, action: null },
  { id: 'NOTIFIED', label: '发布通知', icon: Megaphone, action: 'publish' },
  { id: 'STARTED', label: '停机发布', icon: Play, action: 'release' },
  { id: 'COMPLETED', label: '完成发布', icon: Check, action: 'finish' },
] as const;

export function WizardControl({ batch, onUpdate, onReset, token, onTokenChange, isSavingToken }: WizardControlProps) {
  const [loading, setLoading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(true); // Default open in new layout
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'release' | 'finish' | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);
  const lastLogsLength = useRef(batch.logs?.steps?.length || 0);

  // Auto-scroll logs only when new logs are added
  useEffect(() => {
    const currentLength = batch.logs?.steps?.length || 0;
    if (logsOpen && logsEndRef.current && currentLength > lastLogsLength.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
    lastLogsLength.current = currentLength;
  }, [batch.logs?.steps?.length, logsOpen]);

  const initiateAction = (action: 'publish' | 'release' | 'finish') => {
    if (action === 'release' || action === 'finish') {
      setPendingAction(action);
      setConfirmOpen(true);
    } else {
      executeAction(action);
    }
  };

  const executeAction = async (action: 'publish' | 'release' | 'finish') => {
    setLoading(true);
    setConfirmOpen(false);

    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) {
        // 如果有 apiCall 信息，在控制台输出完整的 API 调用信息
        if (data.apiCall) {
          console.group('🔴 API 调用失败 - 完整信息');
          console.log('URL:', data.apiCall.url);
          console.log('Method:', data.apiCall.method);
          console.log('Headers:', data.apiCall.headers);
          console.log('Body:', data.apiCall.body);
          console.log('Curl 命令:');
          console.log(data.apiCall.curl);
          if (data.apiCall.response) {
            console.log('Response Status:', data.apiCall.response.status);
            console.log('Response Raw:', data.apiCall.response.raw);
            console.log('Response Parsed:', data.apiCall.response.parsed);
          }
          console.groupEnd();
        }
        throw new Error(data.details || data.error || '操作失败');
      }

      // 成功时也输出 apiCall 信息
      if (data.apiCall) {
        console.group('✅ API 调用成功 - 完整信息');
        console.log('URL:', data.apiCall.url);
        console.log('Method:', data.apiCall.method);
        console.log('Request:', data.apiCall.request);
        console.log('Curl 命令:');
        console.log(data.apiCall.request?.curl);
        console.log('Response:', data.apiCall.response);
        console.groupEnd();
      }

      toast.success('状态更新成功');
      onUpdate(data);
    } catch (error: unknown) {
      console.error(error);
      toast.error(`操作失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === batch.status);
  const nextStep = STEPS[currentStepIndex + 1];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* LEFT COLUMN: Main Action & Logs (8/12) */}
      <div className="lg:col-span-8 space-y-6">
        
        {/* Main Action Card */}
        <Card className="relative overflow-hidden border-0 shadow-2xl bg-gradient-to-br from-background via-background to-muted/20 min-h-[300px] flex flex-col justify-center">
          <div className="absolute inset-0 bg-grid-white/5 [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black,transparent)]" />
          
          <CardContent className="relative py-12 px-8 flex flex-col items-center text-center space-y-8">
             {batch.status === 'COMPLETED' ? (
              <div className="space-y-6 animate-in fade-in zoom-in duration-700">
                <div className="relative inline-flex items-center justify-center">
                   <div className="absolute inset-0 bg-green-500/20 rounded-full blur-2xl animate-pulse" />
                   <div className="relative p-8 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 text-green-600 dark:text-green-400 rounded-full shadow-xl">
                     <Check className="w-16 h-16" strokeWidth={3} />
                   </div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-3xl font-bold tracking-tight text-foreground">发布已完成</h2>
                  <p className="text-muted-foreground">系统已恢复服务，所有流程执行完毕。</p>
                </div>
                 <Button onClick={onReset} variant="outline" className="mt-4">
                  返回列表
                </Button>
              </div>
             ) : nextStep ? (
               <>
                 <div className="space-y-4">
                   <Badge variant="secondary" className="px-3 py-1 text-xs tracking-widest uppercase bg-muted/50 text-muted-foreground">
                     Next Action
                   </Badge>
                   <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-foreground flex items-center justify-center gap-4">
                      {nextStep.label}
                   </h2>
                   {nextStep.action === 'release' && (
                     <p className="text-red-500 font-medium animate-pulse flex items-center justify-center gap-2">
                       <AlertTriangle className="w-4 h-4" />
                       警告：执行此步骤将导致系统停机
                     </p>
                   )}
                 </div>

                 <Button 
                    size="lg" 
                    className={cn(
                      "h-16 px-12 text-lg font-bold rounded-full shadow-2xl hover:scale-105 active:scale-95 transition-all",
                      nextStep.action === 'release' ? "bg-red-600 hover:bg-red-700 text-white shadow-red-500/30" :
                      nextStep.action === 'finish' ? "bg-green-600 hover:bg-green-700 text-white shadow-green-500/30" :
                      "bg-primary hover:bg-primary/90 text-primary-foreground shadow-primary/30"
                    )}
                    onClick={() => nextStep.action && initiateAction(nextStep.action)}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                        执行中...
                      </>
                    ) : (
                      <>
                        <Play className="mr-3 h-6 w-6 fill-current" />
                        立即执行
                      </>
                    )}
                  </Button>
               </>
             ) : null}
          </CardContent>
        </Card>

        {/* Terminal Logs */}
        <Card className="flex flex-col overflow-hidden bg-slate-950 border-slate-800 shadow-xl rounded-xl">
           <div 
             className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/50 cursor-pointer hover:bg-slate-900 transition-colors"
             onClick={() => setLogsOpen(!logsOpen)}
           >
             <div className="flex items-center gap-2 text-slate-400">
               <Terminal className="w-4 h-4" />
               <span className="text-xs font-mono font-medium tracking-wide">EXECUTION_LOGS</span>
             </div>
             <ChevronDown className={cn("w-4 h-4 text-slate-500 transition-transform", logsOpen && "rotate-180")} />
           </div>
           
           {logsOpen && (
             <div className="p-4 font-mono text-xs text-slate-300 max-h-[500px] overflow-y-auto space-y-4 bg-slate-950/50">
                {(!batch.logs?.steps || batch.logs.steps.length === 0) && (
                  <div className="text-slate-600 italic px-2">等待操作开始...</div>
                )}
                {batch.logs?.steps?.map((log, i) => (
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
                    {log.request && 'curl' in log.request && typeof log.request.curl === 'string' && log.request.curl ? (
                      <div className="relative mt-1">
                        <div className="text-xs text-slate-500 mb-1 flex items-center gap-2">
                          <Terminal className="w-3 h-3" />
                          <span>Curl 命令:</span>
                        </div>
                        <pre className="font-mono text-[10px] leading-relaxed text-emerald-300 bg-slate-950/80 p-3 rounded-md border border-emerald-500/20 overflow-x-auto select-text cursor-text selection:bg-indigo-500/30 selection:text-white">
                          {log.request.curl}
                        </pre>
                      </div>
                    ) : null}

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
      </div>

      {/* RIGHT COLUMN: Sidebar (4/12) */}
      <div className="lg:col-span-4 space-y-6">
        
        {/* Token Configuration */}
        <Card className="border-l-4 border-l-amber-500 bg-gradient-to-br from-amber-50/50 to-background dark:from-amber-950/10">
          <CardContent className="pt-6">
            <GlobalTokenInput 
              value={token} 
              onChange={onTokenChange} 
              isSaving={isSavingToken}
              className="space-y-4"
            />
          </CardContent>
        </Card>

        {/* Vertical Timeline */}
        <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-4 border-b bg-muted/20">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="w-4 h-4 text-muted-foreground" />
              发布进度
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 px-6">
            <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-gradient-to-b before:from-border before:via-border before:to-transparent before:z-0">
              {STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;
                const isUpcoming = index > currentStepIndex;
                
                return (
                  <div key={step.id} className="relative flex items-start gap-4 z-10 group">
                    <div className={cn(
                      "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                      isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                      isCurrent ? "bg-background border-primary ring-4 ring-primary/10 animate-pulse" : 
                      "bg-muted border-transparent text-muted-foreground"
                    )}>
                      {isCompleted ? <Check className="w-5 h-5" /> : <step.icon className="w-5 h-5" />}
                    </div>
                    <div className="flex flex-col pt-1.5 space-y-1">
                      <span className={cn(
                        "text-sm font-bold leading-none transition-colors",
                        isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                      )}>
                        {step.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {isCompleted ? '已完成' : isCurrent ? '进行中' : '等待中'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Batch Info */}
        <Card className="bg-muted/10 border-dashed">
          <CardContent className="py-4 space-y-3 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">发布环境</span>
              <Badge variant="outline">{batch.environment?.name}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">批次 ID</span>
              <span className="font-mono text-xs">{batch.id.slice(-8)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">创建时间</span>
              <span className="text-xs tabular-nums text-muted-foreground">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              {pendingAction === 'release' ? (
                <>
                   <div className="p-2 bg-red-100 rounded-full text-red-600">
                     <AlertTriangle className="w-5 h-5" />
                   </div>
                   确认开始停机发布？
                </>
              ) : (
                <>
                  <div className="p-2 bg-green-100 rounded-full text-green-600">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  确认完成发布？
                </>
              )}
            </DialogTitle>
            <DialogDescription className="pt-2 text-base">
              {pendingAction === 'release' 
                ? '此操作将调用停机接口，系统将暂停对外服务。请确保相关人员已就位。'
                : '此操作将调用完成接口，解除系统停机状态，恢复对外服务。'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button 
              variant={pendingAction === 'release' ? "destructive" : "default"}
              onClick={() => pendingAction && executeAction(pendingAction)}
              className={cn(
                "w-full sm:w-auto",
                pendingAction === 'finish' && "bg-green-600 hover:bg-green-700"
              )}
            >
              确认{pendingAction === 'release' ? '停机' : '完成'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function RefreshCwIcon({ className }: { className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width="24" 
      height="24" 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
      <path d="M21 3v5h-5" />
      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
      <path d="M3 21v-5h5" />
    </svg>
  );
}