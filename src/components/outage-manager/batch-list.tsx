'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { RefreshCw, RotateCw, Eye, Play } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Batch {
  id: string;
  batchName: string;
  status: string;
  releaseDatetime: string;
  duration: number;
  environment: {
    name: string;
  };
}

interface BatchListProps {
  envId?: string;
  onBatchClick?: (batch: Batch) => void;
}

export function BatchList({ envId, onBatchClick }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchBatches = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const url = envId 
        ? `/api/apps/outage-manager/batches?envId=${envId}`
        : '/api/apps/outage-manager/batches';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setBatches(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [envId]);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  if (loading) return (
    <div className="flex justify-center p-8 text-muted-foreground" data-testid="loading-spinner">
      <RotateCw className="h-6 w-6 animate-spin" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => fetchBatches(false)}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          刷新列表
        </Button>
      </div>
      
      {batches.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-md border-dashed">
          暂无发布记录
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>批次名称</TableHead>
                <TableHead>环境</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>时长 (分钟)</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {batches.map((batch) => (
                <TableRow key={batch.id}>
                  <TableCell className="font-medium">{batch.batchName}</TableCell>
                  <TableCell>{batch.environment.name}</TableCell>
                  <TableCell>
                    <StatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell>{batch.duration}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {format(new Date(batch.releaseDatetime), 'yyyy-MM-dd HH:mm')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onBatchClick?.(batch)}
                      className="gap-2"
                    >
                      {batch.status === 'COMPLETED' ? (
                        <>
                          <Eye className="h-4 w-4" />
                          查看详情
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4" />
                          继续发布
                        </>
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    COMPLETED: 'default', // Using default (black/primary) for completed
    STARTED: 'destructive',
    NOTIFIED: 'secondary',
    CREATED: 'outline',
  };

  const labels: Record<string, string> = {
    COMPLETED: '已完成',
    STARTED: '进行中',
    NOTIFIED: '已通知',
    CREATED: '已创建',
  };

  return (
    <Badge variant={variants[status] || 'secondary'}>
      {labels[status] || status}
    </Badge>
  );
}
