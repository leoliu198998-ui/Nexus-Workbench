'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import type { OutageBatch } from '@/types/outage';
import { format } from 'date-fns';

interface UpdateBatchDialogProps {
  open: boolean;
  onClose: () => void;
  batch: OutageBatch;
  onSuccess: (updatedBatch: OutageBatch) => void;
}

export function UpdateBatchDialog({ open, onClose, batch, onSuccess }: UpdateBatchDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    batchName: '',
    releaseDatetime: '',
    releaseTimeZone: '',
    duration: 0,
  });

  // Initialize form data when batch changes or dialog opens
  useEffect(() => {
    if (batch && open) {
      // Format datetime for input[type="datetime-local"] which expects "YYYY-MM-DDThh:mm"
      let formattedDate = '';
      if (batch.releaseDatetime) {
        try {
            const date = new Date(batch.releaseDatetime);
            // Adjust to local timezone for input or keep as is? 
            // The input type="datetime-local" is tricky with timezones. 
            // For simplicity, we'll format it as local ISO string without 'Z'
            // But we must be careful not to shift time unintentionally.
            // Let's rely on date-fns format if possible, or simple ISO slice.
            const offset = date.getTimezoneOffset() * 60000;
            formattedDate = new Date(date.getTime() - offset).toISOString().slice(0, 16);
        } catch (e) {
            console.error('Date parsing error', e);
        }
      }

      setFormData({
        batchName: batch.batchName,
        releaseDatetime: formattedDate,
        releaseTimeZone: batch.releaseTimeZone || 'Asia/Shanghai',
        duration: batch.duration || 60,
      });
    }
  }, [batch, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.details || data.error || '更新失败');

      toast.success('批次信息更新成功，状态已重置为 CREATED');
      onSuccess(data);
      onClose();
    } catch (error: unknown) {
      console.error(error);
      toast.error(`更新失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>更新发布批次</DialogTitle>
          <DialogDescription>
            修改批次信息。注意：更新成功后，批次状态将被重置为 <strong>CREATED</strong>。
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="batchName">批次名称</Label>
            <Input
              id="batchName"
              value={formData.batchName}
              onChange={(e) => setFormData({ ...formData, batchName: e.target.value })}
              required
            />
          </div>

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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="duration">时长 (分钟)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                required
              />
            </div>
            <div className="space-y-2">
               <Label htmlFor="timezone">时区</Label>
               <Input 
                 id="timezone"
                 value={formData.releaseTimeZone}
                 disabled
                 className="bg-muted"
               />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                '确认更新'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
