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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { RefreshCw, RotateCw, Eye, Play, ArrowRight, Clock, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { OutageBatch } from '@/types/outage';

interface BatchListProps {
  onBatchClick?: (batch: OutageBatch) => void;
}

export function BatchList({ onBatchClick }: BatchListProps) {
  const [batches, setBatches] = useState<OutageBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const fetchBatches = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    else setIsRefreshing(true);
    
    try {
      const res = await fetch('/api/apps/outage-manager/batches');
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
  }, []);

  useEffect(() => {
    fetchBatches();
  }, [fetchBatches]);

  const filteredBatches = statusFilter === 'all' 
    ? batches 
    : batches.filter(batch => batch.status === statusFilter);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-3" data-testid="loading-spinner">
      <RotateCw className="h-8 w-8 animate-spin text-primary/50" />
      <span className="text-sm">正在加载发布记录...</span>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="CREATED">已创建</SelectItem>
              <SelectItem value="NOTIFIED">已通知</SelectItem>
              <SelectItem value="STARTED">进行中</SelectItem>
              <SelectItem value="COMPLETED">已完成</SelectItem>
              <SelectItem value="CANCELLED">已取消</SelectItem>
            </SelectContent>
          </Select>
          {statusFilter !== 'all' && (
            <Badge variant="secondary" className="gap-1">
              {filteredBatches.length} 条记录
            </Badge>
          )}
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => fetchBatches(false)}
          disabled={isRefreshing}
          className="hover:bg-muted"
        >
          <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
          刷新列表
        </Button>
      </div>
      
      {filteredBatches.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border rounded-lg border-dashed bg-muted/5">
          <Clock className="w-10 h-10 mb-3 opacity-20" />
          <p>{statusFilter === 'all' ? '暂无发布记录' : '没有符合条件的记录'}</p>
          <p className="text-xs opacity-60 mt-1">
            {statusFilter === 'all' ? '点击右上角创建新批次' : '尝试选择其他状态筛选'}
          </p>
        </div>
      ) : (
        <div className="rounded-lg border shadow-sm overflow-hidden bg-card">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="w-[250px]">批次名称</TableHead>
                <TableHead>环境</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>预计时长</TableHead>
                <TableHead>发布时间</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBatches.map((batch) => (
                <TableRow 
                  key={batch.id} 
                  className="cursor-pointer hover:bg-muted/30 transition-colors"
                  onClick={() => onBatchClick?.(batch)}
                >
                  <TableCell className="font-medium">
                    <div className="flex flex-col">
                      <span>{batch.batchName}</span>
                      <span className="text-xs text-muted-foreground font-mono opacity-60">ID: {batch.id.slice(-6)}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-normal bg-background/50">
                      {batch.environment?.name || 'Unknown'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={batch.status} />
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {batch.duration || 0} 分钟
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {batch.releaseDatetime ? format(new Date(batch.releaseDatetime), 'MM-dd HH:mm') : '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant={(batch.status === 'COMPLETED' || batch.status === 'CANCELLED') ? "ghost" : "default"}
                      size="sm"
                      className={cn(
                        "gap-1.5 h-8",
                        (batch.status !== 'COMPLETED' && batch.status !== 'CANCELLED') && "shadow-sm bg-primary/90 hover:bg-primary"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onBatchClick?.(batch);
                      }}
                    >
                      {batch.status === 'COMPLETED' || batch.status === 'CANCELLED' ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          查看
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" />
                          继续
                          <ArrowRight className="h-3 w-3 opacity-50" />
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

  const config: Record<string, { label: string; color: string; pulse?: boolean }> = {

    COMPLETED: { label: '已完成', color: 'bg-green-500' },

    STARTED: { label: '进行中', color: 'bg-red-500', pulse: true },

    NOTIFIED: { label: '已通知', color: 'bg-blue-500' },

    CREATED: { label: '已创建', color: 'bg-slate-400' },

    CANCELLED: { label: '已取消', color: 'bg-gray-400' },

  };



  const { label, color, pulse } = config[status] || { label: status, color: 'bg-gray-400' };



  return (

    <div className="flex items-center gap-2">

      <div className="relative flex h-2.5 w-2.5">

        {pulse && (

          <span className={cn("animate-ping absolute inline-flex h-full w-full rounded-full opacity-75", color)}></span>

        )}

        <span className={cn("relative inline-flex rounded-full h-2.5 w-2.5", color)}></span>

      </div>

      <span className={cn("text-sm font-medium", 

        status === 'STARTED' ? "text-red-600" : 

        status === 'COMPLETED' ? "text-green-600" : 

        status === 'CANCELLED' ? "text-muted-foreground/70 line-through" :

        "text-muted-foreground"

      )}>

        {label}

      </span>

    </div>

  );

}
