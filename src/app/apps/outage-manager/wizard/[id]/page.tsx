'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft } from 'lucide-react';
import { OutageWizardProvider } from '@/components/outage-manager/outage-wizard-context';
import { WizardControl } from '@/components/outage-manager/wizard-control';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

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
            </BreadcrumbList>
          </Breadcrumb>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => router.push('/apps/outage-manager')}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <h1 className="text-3xl font-bold">发布执行向导</h1>
            </div>
          </div>
        </div>

        <WizardControl 
          batch={batch} 
          onUpdate={(updated) => setBatch(updated)}
          onReset={() => router.push('/apps/outage-manager')}
        />
      </div>
    </OutageWizardProvider>
  );
}
