'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
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
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useOutageWizard } from './outage-wizard-context';
import { GlobalTokenInput } from './global-token-input';

interface LogEntry {
  timestamp: string;
  step: string;
  status: number;
  response: unknown;
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
}

const STEPS = [
  { id: 'CREATED', label: '已创建', icon: Circle, action: null },
  { id: 'NOTIFIED', label: '发布通知', icon: Megaphone, action: 'publish' },
  { id: 'STARTED', label: '停机发布', icon: Play, action: 'release' },
  { id: 'COMPLETED', label: '完成发布', icon: Check, action: 'finish' },
] as const;

export function WizardControl({ batch: initialBatch, onUpdate, onReset }: WizardControlProps) {
  const { token, setToken, updateBatch } = useOutageWizard();
  const [loading, setLoading] = useState(false);
  const [isSavingToken, setIsSavingToken] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'publish' | 'release' | 'finish' | null>(null);
  
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Sync initial batch to context if needed (handled by provider usually)
  // But here we use context values for token
  const batch = initialBatch;

  // Auto-scroll logs
  useEffect(() => {
    if (logsOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [batch.logs, logsOpen]);

  const handleTokenChange = async (newToken: string) => {
    setToken(newToken);
    setIsSavingToken(true);
    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken }),
      });
      if (!res.ok) throw new Error('Token 同步失败');
      const updated = await res.json();
      onUpdate(updated);
    } catch (err) {
      console.error(err);
      // No toast here to avoid noise, but indicator shows state
    } finally {
      setIsSavingToken(false);
    }
  };

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
    setConfirmOpen(false); // Ensure dialog is closed

    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || '操作失败');

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
    <div className="space-y-6">
      {/* Token Management Card */}
      <Card className="border-l-4 border-l-amber-500 shadow-md">
        <CardContent className="py-4">
          <GlobalTokenInput 
            value={token} 
            onChange={handleTokenChange} 
            isSaving={isSavingToken}
          />
        </CardContent>
      </Card>

      {/* Header & Status */}
      <Card className="border-t-4 border-t-primary shadow-sm overflow-hidden">
        <CardHeader className="bg-muted/10 pb-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <CardTitle className="text-2xl tracking-tight">{batch.batchName}</CardTitle>
              <CardDescription className="flex items-center gap-3">
                <span className="font-mono bg-muted px-2 py-0.5 rounded text-xs text-foreground/70 border">
                  ID: {batch.id.slice(-8)}
                </span>
                <span className="text-muted-foreground">•</span>
                <span className="font-medium text-foreground/80">
                  环境: {batch.environment?.name || '未知'}
                </span>
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(
              "px-3 py-1 text-sm font-medium shadow-sm",
              batch.status === 'STARTED' ? "bg-red-50 text-red-700 border-red-200" :
              batch.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" :
              "bg-blue-50 text-blue-700 border-blue-200"
            )}>
              {batch.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-10">
          {/* Stepper */}
          <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto">
            {/* Connecting Line Background */}
            <div className="absolute top-1/2 left-0 w-full h-1 bg-muted -z-20 -translate-y-1/2 rounded-full" />
            
            {/* Active Progress Line */}
            <div 
              className="absolute top-1/2 left-0 h-1 bg-primary -z-10 -translate-y-1/2 rounded-full transition-all duration-500 ease-in-out" 
              style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
            />
            
            {STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = isCompleted ? CheckCircle2 : step.icon;

              return (
                <div key={step.id} className="relative flex flex-col items-center group">
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center border-4 transition-all duration-300 z-10",
                    isCompleted 
                      ? "border-primary bg-primary text-primary-foreground shadow-md scale-110" 
                      : "border-muted bg-background text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 ring-offset-2"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "absolute -bottom-8 text-xs font-bold uppercase tracking-wider transition-colors duration-300 whitespace-nowrap",
                    isCurrent ? "text-primary" : "text-muted-foreground/60"
                  )}>
                    {step.label}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Main Action Area */}
      <Card className="shadow-lg border-2 border-muted/20 bg-gradient-to-b from-background to-muted/5">
        <CardContent className="flex flex-col items-center justify-center py-12 space-y-6">
          {batch.status === 'COMPLETED' ? (
            <div className="text-center space-y-6 animate-in fade-in zoom-in duration-500">
              <div className="inline-flex items-center justify-center p-6 bg-green-100 text-green-600 rounded-full shadow-inner">
                <Check className="w-12 h-12" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-semibold tracking-tight">发布流程已完成</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  所有步骤已执行完毕。系统已恢复正常运行。
                </p>
              </div>
              <Button onClick={onReset} variant="outline" size="lg" className="mt-4 gap-2">
                <RefreshCwIcon className="w-4 h-4" />
                创建新批次
              </Button>
            </div>
          ) : nextStep ? (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground uppercase tracking-widest text-xs">下一步操作 / Next Step</h3>
                <p className="text-3xl font-bold flex items-center gap-3 justify-center text-foreground">
                  <nextStep.icon className={cn(
                    "w-8 h-8",
                    nextStep.action === 'release' ? "text-destructive" : "text-primary"
                  )} />
                  {nextStep.label}
                </p>
              </div>
              
              <div className="w-full max-w-md pt-4 space-y-4">
                {nextStep.action === 'release' && (
                  <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg text-destructive flex gap-3 items-start shadow-sm">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 animate-pulse" />
                    <div className="space-y-1">
                      <p className="font-semibold">警告：即将进行系统停机</p>
                      <p className="text-sm opacity-90">此操作将阻断用户访问，请确保已通过公告或其他方式通知相关人员。</p>
                    </div>
                  </div>
                )}
                
                <Button 
                  size="lg" 
                  variant={nextStep.action === 'release' ? "destructive" : nextStep.action === 'finish' ? "default" : "secondary"}
                  className={cn(
                    "w-full text-lg h-16 shadow-lg transition-all hover:scale-[1.01] active:scale-[0.99]",
                    nextStep.action === 'finish' && "bg-green-600 hover:bg-green-700 text-white"
                  )}
                  onClick={() => nextStep.action && initiateAction(nextStep.action)}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-5 w-5 fill-current" />
                      开始执行: {nextStep.label}
                    </>
                  )}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Logs Terminal */}
      <Card className="bg-slate-950 border-slate-800 text-slate-200 overflow-hidden shadow-xl rounded-xl">
        <CardHeader 
          className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors select-none"
          onClick={() => setLogsOpen(!logsOpen)}
        >
          <div className="flex items-center gap-3">
            <Terminal className="w-4 h-4 text-slate-400" />
            <CardTitle className="text-sm font-mono tracking-wider text-slate-300">SYSTEM_LOGS</CardTitle>
            <Badge variant="outline" className="bg-slate-900 text-slate-400 border-slate-700 h-5 px-1.5 text-[10px]">
              {batch.logs?.steps?.length || 0} EVENTS
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-800 text-slate-400">
            {logsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>
        
        {logsOpen && (
          <CardContent className="p-0 border-t border-slate-800 font-mono text-xs">
            <div className="max-h-[400px] overflow-auto p-4 space-y-4 bg-slate-950/50">
              {(!batch.logs?.steps || batch.logs.steps.length === 0) && (
                <div className="text-slate-600 italic px-2">No logs recorded yet.</div>
              )}
              
              {batch.logs?.steps?.map((log, i) => (
                <div key={i} className="flex flex-col gap-1 group animate-in slide-in-from-left-2 duration-300">
                  <div className="flex items-center gap-3 text-slate-400">
                    <span className="text-blue-400/80 w-[80px] shrink-0">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <Badge variant="outline" className={cn(
                      "font-bold border-0 px-1.5 py-0 rounded text-[10px]",
                      log.status >= 200 && log.status < 300 
                        ? "text-green-400 bg-green-950/30" 
                        : "text-red-400 bg-red-950/30"
                    )}>
                      {log.step}
                    </Badge>
                    <span className={cn(
                      "text-[10px]",
                      log.status >= 200 && log.status < 300 ? "text-slate-500" : "text-red-500"
                    )}>
                      HTTP {log.status}
                    </span>
                  </div>
                  <div className="pl-[80px]">
                     <div className="pl-3 border-l-2 border-slate-800 group-hover:border-slate-700 transition-colors py-1">
                      <pre className="text-slate-300 whitespace-pre-wrap break-all overflow-hidden opacity-80 group-hover:opacity-100 transition-opacity">
                        {JSON.stringify(log.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        )}
      </Card>

      {/* Confirmation Dialog */}
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {pendingAction === 'release' && <AlertTriangle className="w-5 h-5 text-destructive" />}
              {pendingAction === 'release' ? '确认开始发布/停机？' : '确认完成发布？'}
            </DialogTitle>
            <DialogDescription>
              {pendingAction === 'release' 
                ? '此操作将调用停机接口，系统将暂停对外服务。请确认已做好准备。'
                : '此操作将调用完成接口，解除系统停机状态，恢复对外服务。'
              }
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>取消</Button>
            <Button 
              variant={pendingAction === 'release' ? "destructive" : "default"}
              onClick={() => pendingAction && executeAction(pendingAction)}
              className={pendingAction === 'finish' ? "bg-green-600 hover:bg-green-700" : ""}
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