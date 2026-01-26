'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, ArrowLeft } from 'lucide-react';
import { OutageWizardProvider, useOutageWizard } from '@/components/outage-manager/outage-wizard-context';
import { WizardControl } from '@/components/outage-manager/wizard-control';
import { GlobalTokenInput } from '@/components/outage-manager/global-token-input';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
    <>
      <div className="space-y-4">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/apps/outage-manager">停机管理</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>发布向导</BreadcrumbPage>
            </BreadcrumbItem>
          </Breadcrumb>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={onReset}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">发布执行向导</h1>
            </div>
          </div>
        </div>

        {/* Global Token Input - Prominently placed */}
        <Card className="border-l-4 border-l-amber-500 shadow-md bg-amber-50/10">
          <CardContent className="py-4">
            <GlobalTokenInput 
              value={token} 
              onChange={handleTokenChange} 
              isSaving={isSavingToken}
            />
          </CardContent>
        </Card>

        <WizardControl 
          batch={batch} 
          onUpdate={updateBatch}
          onReset={onReset}
        />
      </>
  );
}

export default function OutageWizardPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [batch, setBatch] = useState<any>(null);
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
      } catch (err: any) {
        setError(err.message);
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
      <div className="container mx-auto py-6 space-y-6">
        <WizardContent onReset={() => router.push('/apps/outage-manager')} />
      </div>
    </OutageWizardProvider>
  );
}
