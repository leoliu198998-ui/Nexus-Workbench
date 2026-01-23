'use client';

import { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Batch {
  id: string;
  batchName: string;
  status: string;
  releaseDatetime: string;
  environment: {
    name: string;
  };
}

interface BatchListProps {
  envId?: string;
}

export function BatchList({ envId }: BatchListProps) {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchBatches() {
      setLoading(true);
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
      }
    }

    fetchBatches();
  }, [envId]);

  if (loading) return <div>加载中...</div>;
  if (batches.length === 0) return <div>暂无记录</div>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>批次名称</TableHead>
          <TableHead>环境</TableHead>
          <TableHead>状态</TableHead>
          <TableHead>发布时间</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {batches.map((batch) => (
          <TableRow key={batch.id}>
            <TableCell className="font-medium">{batch.batchName}</TableCell>
            <TableCell>{batch.environment.name}</TableCell>
            <TableCell>
              <Badge variant={
                batch.status === 'COMPLETED' ? 'default' : 
                batch.status === 'STARTED' ? 'destructive' : 'secondary'
              }>
                {batch.status}
              </Badge>
            </TableCell>
            <TableCell>{format(new Date(batch.releaseDatetime), 'yyyy-MM-dd HH:mm')}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
