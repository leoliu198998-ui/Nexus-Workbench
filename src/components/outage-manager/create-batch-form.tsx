'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EnvironmentSelector } from '@/components/outage-manager/environment-selector';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

interface CreateBatchFormProps {
  onSuccess: (batch: { id: string; status: string; envId: string; batchName: string }) => void;
}

export function CreateBatchForm({ onSuccess }: CreateBatchFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    envId: '',
    batchName: '',
    releaseDatetime: '',
    releaseTimeZone: 'Asia/Shanghai',
    duration: 10,
    token: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.envId) {
      toast.error('请先选择目标环境');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/apps/outage-manager/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || '创建失败');

      toast.success('发布批次创建成功');
      router.push(`/apps/outage-manager/wizard/${data.id}`);
      onSuccess(data);
    } catch (error: unknown) {
      console.error(error);
      toast.error(`创建失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2">
        <EnvironmentSelector 
          value={formData.envId} 
          onChange={(envId) => setFormData({ ...formData, envId })} 
        />
        <p className="text-xs text-muted-foreground">选择本次发布的目标环境。</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="batchName">批次名称</Label>
        <Input
          id="batchName"
          placeholder="例如: Wise Iteration v2.5.0 hotfix"
          value={formData.batchName}
          onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
          required
          className="max-w-md"
        />
        <p className="text-xs text-muted-foreground">用于标识本次发布的简短描述。</p>
      </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="releaseDatetime">计划发布时间</Label>
              <Input
                id="releaseDatetime"
                type="datetime-local"
                value={formData.releaseDatetime}
                onChange={(e) => setFormData({ ...formData, releaseDatetime: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="duration">预计停机时长 (分钟)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="480"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
              />
            </div>
          </div>

          <div className="space-y-2 pt-2 border-t">
            <Label htmlFor="token">鉴权 Token (x-dk-token)</Label>
            <Input
              id="token"
              type="password"
              placeholder="请输入有效的 DevOps Token"
              value={formData.token}
              onChange={(e) => setFormData({ ...formData, token: e.target.value })}
              required
              className="font-mono"
            />
            <p className="text-xs text-muted-foreground">该 Token 将用于验证您对目标环境的操作权限。</p>
          </div>

          <Button type="submit" className="w-full md:w-auto min-w-[200px]" disabled={loading || !formData.envId}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                正在创建...
              </>
            ) : (
              '创建并进入向导'
            )}
          </Button>
        </form>
  );
}
