'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Circle, 
  Play, 
  Megaphone, 
  Check, 
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { GlobalTokenInput } from './global-token-input';
import { BatchInfoCard } from './batch-info-card';
import { ActionConfirmationDialog } from './action-confirmation-dialog';
import { WizardTimeline } from './wizard-timeline';
import { WizardLogs } from './wizard-logs';
import { useWizardActions } from './hooks/use-wizard-actions';
import type { OutageBatch } from '@/types/outage';

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
  const [logsOpen, setLogsOpen] = useState(true); // Default open in new layout
  
  const { 
    loading, 
    confirmOpen, 
    pendingAction, 
    initiateAction, 
    executeAction, 
    setConfirmOpen 
  } = useWizardActions({ batch, onUpdate });

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
        <WizardLogs 
          logs={batch.logs}
          isOpen={logsOpen}
          onToggle={() => setLogsOpen(!logsOpen)}
        />
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
        <WizardTimeline steps={STEPS} currentStatus={batch.status} />

        {/* Batch Info */}
        <BatchInfoCard batch={batch} />

      </div>

      {/* Confirmation Dialog */}
      <ActionConfirmationDialog 
        open={confirmOpen}
        action={pendingAction}
        onConfirm={() => pendingAction && executeAction(pendingAction)}
        onCancel={() => setConfirmOpen(false)}
      />
    </div>
  );
}