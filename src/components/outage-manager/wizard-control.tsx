'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Play, Megaphone, Check, Terminal, ChevronDown, ChevronUp, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

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

export function WizardControl({ batch, onUpdate, onReset }: WizardControlProps) {
  const [loading, setLoading] = useState(false);
  const [logsOpen, setLogsOpen] = useState(false);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [batch.logs, logsOpen]);

  const handleAction = async (action: 'publish' | 'release' | 'finish') => {
    if (action === 'release' || action === 'finish') {
      if (!window.confirm(`确定要执行 "${action === 'release' ? '开始发布/停机' : '完成发布/解除停机'}" 操作吗？此操作将直接影响目标环境。`)) {
        return;
      }
    }

    setLoading(true);
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
    }
  };

  const currentStepIndex = STEPS.findIndex(s => s.id === batch.status);
  const nextStep = STEPS[currentStepIndex + 1];

  return (
    <div className="space-y-6">
      {/* Header & Status */}
      <Card className="border-t-4 border-t-primary shadow-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-2xl">{batch.batchName}</CardTitle>
              <CardDescription className="mt-1 flex items-center gap-2">
                <span className="font-mono bg-muted px-1.5 py-0.5 rounded text-xs text-foreground">ID: {batch.id.slice(-8)}</span>
                <span>•</span>
                <span>环境: {batch.environment?.name || '未知'}</span>
              </CardDescription>
            </div>
            <Badge variant="outline" className={cn(
              "px-3 py-1 text-sm font-medium",
              batch.status === 'STARTED' ? "bg-red-50 text-red-700 border-red-200" :
              batch.status === 'COMPLETED' ? "bg-green-50 text-green-700 border-green-200" :
              "bg-blue-50 text-blue-700 border-blue-200"
            )}>
              {batch.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stepper */}
          <div className="relative flex justify-between items-center w-full max-w-3xl mx-auto py-4">
            {/* Connecting Line */}
            <div className="absolute top-1/2 left-0 w-full h-0.5 bg-muted -z-10 -translate-y-1/2" />
            
            {STEPS.map((step, index) => {
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const Icon = isCompleted ? CheckCircle2 : step.icon;

              return (
                <div key={step.id} className="flex flex-col items-center bg-background px-2">
                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors",
                    isCompleted ? "border-primary bg-primary text-primary-foreground" : "border-muted-foreground/30 text-muted-foreground bg-background",
                    isCurrent && "ring-4 ring-primary/20"
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={cn(
                    "mt-2 text-xs font-medium uppercase tracking-wider",
                    isCurrent ? "text-primary" : "text-muted-foreground"
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
      <Card className="shadow-lg border-2 border-primary/10">
        <CardContent className="flex flex-col items-center justify-center py-10 space-y-4">
          {batch.status === 'COMPLETED' ? (
            <div className="text-center space-y-4">
              <div className="inline-flex items-center justify-center p-4 bg-green-100 text-green-600 rounded-full">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-semibold">发布流程已全部完成</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                所有步骤已执行完毕。您可以创建新的发布批次或查看历史记录。
              </p>
              <Button onClick={onReset} variant="outline" className="mt-4">
                创建新批次
              </Button>
            </div>
          ) : nextStep ? (
            <>
              <div className="text-center space-y-2">
                <h3 className="text-lg font-medium text-muted-foreground">下一步操作</h3>
                <p className="text-2xl font-bold flex items-center gap-2 justify-center">
                  <nextStep.icon className="w-6 h-6 text-primary" />
                  {nextStep.label}
                </p>
              </div>
              
              <div className="w-full max-w-sm pt-4">
                {nextStep.action === 'release' && (
                  <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-sm flex gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>警告：此操作将触发系统停机，请确保已通知相关人员。</span>
                  </div>
                )}
                
                <Button 
                  size="lg" 
                  className={cn("w-full text-lg h-14 shadow-md transition-all hover:scale-[1.02]", 
                    nextStep.action === 'release' ? "bg-red-600 hover:bg-red-700" :
                    nextStep.action === 'finish' ? "bg-green-600 hover:bg-green-700" : ""
                  )}
                  onClick={() => nextStep.action && handleAction(nextStep.action as 'publish' | 'release' | 'finish')}
                  disabled={loading}
                >
                  {loading ? '执行中...' : `执行: ${nextStep.label}`}
                </Button>
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      {/* Logs Terminal */}
      <Card className="bg-slate-950 border-slate-800 text-slate-200 overflow-hidden">
        <CardHeader 
          className="py-3 px-4 flex flex-row items-center justify-between cursor-pointer hover:bg-slate-900 transition-colors"
          onClick={() => setLogsOpen(!logsOpen)}
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4" />
            <CardTitle className="text-sm font-mono">System Logs</CardTitle>
            <Badge variant="secondary" className="bg-slate-800 text-slate-300 border-none h-5 px-1.5 text-[10px]">
              {batch.logs?.steps?.length || 0} events
            </Badge>
          </div>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 hover:bg-slate-800 text-slate-400">
            {logsOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </Button>
        </CardHeader>
        
        {logsOpen && (
          <CardContent className="p-0 border-t border-slate-800 font-mono text-xs">
            <div className="max-h-[300px] overflow-auto p-4 space-y-4">
              {(!batch.logs?.steps || batch.logs.steps.length === 0) && (
                <div className="text-slate-500 italic">No logs available.</div>
              )}
              
              {batch.logs?.steps?.map((log, i) => (
                <div key={i} className="flex flex-col gap-1 group">
                  <div className="flex items-center gap-2 text-slate-400">
                    <span className="text-blue-400">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                    <span className={cn(
                      "font-bold px-1 rounded",
                      log.status >= 200 && log.status < 300 ? "text-green-400 bg-green-950/30" : "text-red-400 bg-red-950/30"
                    )}>
                      {log.step}
                    </span>
                    <span>status: {log.status}</span>
                  </div>
                  <div className="pl-4 border-l-2 border-slate-800 ml-1 group-hover:border-slate-700 transition-colors">
                    <pre className="text-slate-300 whitespace-pre-wrap break-all overflow-hidden">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                </div>
              ))}
              <div ref={logsEndRef} />
            </div>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
