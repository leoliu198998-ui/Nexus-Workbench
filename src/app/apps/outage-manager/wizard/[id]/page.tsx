'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, Calendar } from 'lucide-react';
import { OutageWizardProvider, useOutageWizard } from '@/components/outage-manager/outage-wizard-context';
import { WizardControl } from '@/components/outage-manager/wizard-control';
import type { OutageBatch } from '@/types/outage';

// Inner component to consume context
function WizardContent({ onReset }: { onReset: () => void }) {
  const { batch, updateBatch, token, setToken } = useOutageWizard();
  const [isSavingToken, setIsSavingToken] = useState(false);

  if (!batch) return null;

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
      // Quietly succeed
    } catch (err) {
      console.error(err);
    } finally {
      setIsSavingToken(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-top-4 duration-500 h-[calc(100vh-100px)]">
      {/* Header / Nav Area */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onReset}
            className="gap-2 text-muted-foreground hover:text-foreground pl-0 hover:bg-transparent transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            返回列表
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold tracking-tight flex items-center gap-2">
            {batch.batchName}
            <Badge variant="outline" className="font-normal text-xs px-1.5 py-0 h-5">
              {batch.environment?.name}
            </Badge>
            <div className="flex items-center gap-1.5 ml-2 text-[10px] text-muted-foreground font-normal bg-muted/50 px-2 py-0.5 rounded-full border border-border/50">
              <Calendar className="w-3 h-3" />
              {batch.releaseDatetime ? new Date(batch.releaseDatetime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : 'N/A'}
            </div>
          </h1>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
           发布向导运行中
        </div>
      </div>

      <WizardControl 
        batch={batch} 
        onUpdate={updateBatch}
        onReset={onReset}
        token={token}
        onTokenChange={handleTokenChange}
        isSavingToken={isSavingToken}
      />
    </div>
  );
}

export default function OutageWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [batch, setBatch] = useState<OutageBatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchBatch() {
      try {
        const res = await fetch(`/api/apps/outage-manager/batches/${id}`);
        if (!res.ok) {
          if (res.status === 404) throw new Error('找不到该发布批次');
          throw new Error('获取批次信息失败');
        }
        const data = await res.json();
        setBatch(data);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '发生未知错误');
      } finally {
        setLoading(false);
      }
    }
    fetchBatch();
  }, [id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground">正在加载发布进度...</p>
      </div>
    );
  }

  if (error || !batch) {
    return (
      <div className="container mx-auto py-12 text-center space-y-4">
        <h2 className="text-2xl font-bold text-destructive">出错了</h2>
        <p className="text-muted-foreground">{error || '未找到批次信息'}</p>
        <Button onClick={() => router.push('/apps/outage-manager')} variant="outline">
          返回列表
        </Button>
      </div>
    );
  }

  return (
    <OutageWizardProvider initialBatch={batch}>
      <main className="min-h-screen bg-background bg-dot-pattern">
        <div className="container mx-auto py-6 sm:py-8 space-y-6">
          <WizardContent onReset={() => router.push('/apps/outage-manager')} />
        </div>
      </main>
    </OutageWizardProvider>
  );
}
