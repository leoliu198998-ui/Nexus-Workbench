'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface CreateBatchFormProps {
  envId: string;
  onSuccess: (batch: any) => void;
}

export function CreateBatchForm({ envId, onSuccess }: CreateBatchFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    batchName: '',
    releaseDatetime: '',
    releaseTimeZone: 'Asia/Shanghai',
    duration: 10,
    token: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!envId) {
      toast.error('请先选择环境');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/apps/outage-manager/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, envId }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || '创建失败');

      toast.success('发布批次创建成功');
      onSuccess(data);
    } catch (error: any) {
      console.error(error);
      toast.error(`创建失败: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>第一步：创建发布批次</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">批次名称</Label>
            <Input
              id="batchName"
              placeholder="例如: Wise Iteration hotfix"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="releaseDatetime">发布时间</Label>
              <Input
                id="releaseDatetime"
                type="datetime-local"
                value={formData.releaseDatetime}
                onChange={(e) => setFormData({ ...formData, releaseDatetime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">预计时长 (分钟)</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="token">操作 Token (x-dk-token)</Label>
            <Input
              id="token"
              type="password"
              placeholder="请输入有效的 Token"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading || !envId}>
            {loading ? '正在创建...' : '创建并进入下一步'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
