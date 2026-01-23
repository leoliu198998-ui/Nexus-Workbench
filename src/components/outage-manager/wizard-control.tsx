'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface WizardControlProps {
  batch: any;
  onUpdate: (updatedBatch: any) => void;
  onReset: () => void;
}

export function WizardControl({ batch, onUpdate, onReset }: WizardControlProps) {
  const [loading, setLoading] = useState(false);

  const handleAction = async (action: 'publish' | 'release' | 'finish') => {
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
    } catch (error: any) {
      console.error(error);
      toast.error(`操作失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentStep = 
    batch.status === 'CREATED' ? 2 :
    batch.status === 'NOTIFIED' ? 3 :
    batch.status === 'STARTED' ? 4 : 5;

  return (
    <Card className="border-primary">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>发布流程控制: {batch.batchName}</CardTitle>
          <CardDescription>当前环境: {batch.environment?.name || '未知'}</CardDescription>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-1">
          {batch.status}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-3 gap-4">
          <Button
            variant={batch.status === 'CREATED' ? 'default' : 'outline'}
            disabled={batch.status !== 'CREATED' || loading}
            onClick={() => handleAction('publish')}
          >
            步骤 2：公布发布通知
          </Button>
          <Button
            variant={batch.status === 'NOTIFIED' ? 'default' : 'outline'}
            disabled={batch.status !== 'NOTIFIED' || loading}
            onClick={() => handleAction('release')}
          >
            步骤 3：开始发布 (停机)
          </Button>
          <Button
            variant={batch.status === 'STARTED' ? 'default' : 'outline'}
            disabled={batch.status !== 'STARTED' || loading}
            onClick={() => handleAction('finish')}
          >
            步骤 4：完成发布 (解除)
          </Button>
        </div>

        {batch.status === 'COMPLETED' && (
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200 flex justify-between items-center">
            <span>🎉 发布流程已全部完成！</span>
            <Button variant="outline" size="sm" onClick={onReset}>创建新批次</Button>
          </div>
        )}

        <div className="mt-8 space-y-2">
          <h3 className="font-semibold text-sm">执行日志 (最近):</h3>
          <div className="bg-slate-950 text-slate-50 p-4 rounded-md font-mono text-xs max-h-40 overflow-auto">
            {batch.logs?.steps?.slice().reverse().map((log: any, i: number) => (
              <div key={i} className="mb-2 border-b border-slate-800 pb-2">
                <span className="text-blue-400">[{log.timestamp}]</span>{' '}
                <span className="text-green-400">{log.step}</span>: {log.status}
                <pre className="mt-1 text-slate-400 whitespace-pre-wrap">
                  {JSON.stringify(log.response, null, 2)}
                </pre>
              </div>
            )) || '暂无日志'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
