import { Card, CardContent } from '@/components/ui/card';
import type { OutageBatch } from '@/types/outage';
import { Calendar, Clock, Hash, History } from 'lucide-react';

interface BatchInfoCardProps {
  batch: OutageBatch;
}

export function BatchInfoCard({ batch }: BatchInfoCardProps) {
  const formatDate = (dateStr?: string | Date) => {
    if (!dateStr) return 'N/A';
    try {
      const date = new Date(dateStr);
      return date.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
    } catch {
      return 'Invalid Date';
    }
  };

  return (
    <Card className="bg-muted/10 border-dashed overflow-hidden">
      <CardContent className="py-5 space-y-4 text-sm">
        {/* Release Time Section - Highlighted */}
        <div className="space-y-1.5 pb-2 border-b border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Calendar className="w-3.5 h-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">计划发布时间</span>
          </div>
          <p className="text-base font-semibold tabular-nums text-foreground">
            {formatDate(batch.releaseDatetime)}
          </p>
          {batch.releaseTimeZone && (
            <p className="text-[10px] text-muted-foreground uppercase tracking-tight">
              时区: {batch.releaseTimeZone}
            </p>
          )}
        </div>

        {/* Other Details */}
        <div className="grid grid-cols-1 gap-3 pt-1">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>停机时长</span>
            </div>
            <span className="font-medium">{batch.duration} 分钟</span>
          </div>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Hash className="w-3.5 h-3.5" />
              <span>本地批次 ID</span>
            </div>
            <span className="font-mono text-[10px] bg-muted px-1.5 py-0.5 rounded uppercase">{batch.id.slice(-8)}</span>
          </div>

          {batch.remoteBatchId && (
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Hash className="w-3.5 h-3.5 text-primary/60" />
                <span>远程批次 ID</span>
              </div>
              <span className="font-mono text-[10px] text-primary/80 font-medium">{batch.remoteBatchId}</span>
            </div>
          )}

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-muted-foreground">
              <History className="w-3.5 h-3.5" />
              <span>创建时间</span>
            </div>
            <span className="text-xs tabular-nums">
              {formatDate(batch.createdAt)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
