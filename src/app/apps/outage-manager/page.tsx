'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EnvironmentSelector } from '@/components/outage-manager/environment-selector';
import { BatchList } from '@/components/outage-manager/batch-list';
import { CreateBatchForm } from '@/components/outage-manager/create-batch-form';
import { WizardControl } from '@/components/outage-manager/wizard-control';
import { toast } from 'sonner';

export default function OutageManagerPage() {
  const [selectedEnv, setSelectedEnv] = useState<string>('');
  const [activeBatch, setActiveBatch] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Persistence check: find the most recent incomplete batch
  useEffect(() => {
    async function checkActiveBatch() {
      try {
        const res = await fetch('/api/apps/outage-manager/batches');
        if (res.ok) {
          const batches = await res.json();
          const incomplete = batches.find((b: any) => b.status !== 'COMPLETED');
          if (incomplete) {
            setActiveBatch(incomplete);
            setSelectedEnv(incomplete.envId);
            toast.info('发现进行中的发布批次，已为您恢复进度');
          }
        }
      } catch (error) {
        console.error('Failed to check active batch:', error);
      } finally {
        setLoading(false);
      }
    }

    checkActiveBatch();
  }, []);

  if (loading) {
    return <div className="container mx-auto py-10 text-center text-muted-foreground">加载中...</div>;
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">系统停机发布管理</h1>
      </div>

      {!activeBatch ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>环境选择</CardTitle>
              <CardDescription>请选择本次发布的目标环境</CardDescription>
            </CardHeader>
            <CardContent>
              <EnvironmentSelector value={selectedEnv} onChange={setSelectedEnv} />
            </CardContent>
          </Card>

          {selectedEnv && (
            <CreateBatchForm 
              envId={selectedEnv} 
              onSuccess={(batch) => setActiveBatch(batch)} 
            />
          )}
        </>
      ) : (
        <WizardControl 
          batch={activeBatch} 
          onUpdate={(updated) => setActiveBatch(updated)}
          onReset={() => {
            setActiveBatch(null);
            setSelectedEnv('');
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>最近发布记录</CardTitle>
        </CardHeader>
        <CardContent>
          <BatchList envId={activeBatch ? activeBatch.envId : selectedEnv} />
        </CardContent>
      </Card>
    </div>
  );
}