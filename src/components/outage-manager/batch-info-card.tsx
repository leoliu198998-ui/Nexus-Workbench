import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface OutageBatch {
  id: string;
  environment?: { name: string };
}

interface BatchInfoCardProps {
  batch: OutageBatch;
}

export function BatchInfoCard({ batch }: BatchInfoCardProps) {
  return (
    <Card className="bg-muted/10 border-dashed">
      <CardContent className="py-4 space-y-3 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">发布环境</span>
          <Badge variant="outline">{batch.environment?.name}</Badge>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">批次 ID</span>
          <span className="font-mono text-xs">{batch.id.slice(-8)}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-muted-foreground">创建时间</span>
          <span className="text-xs tabular-nums text-muted-foreground">
            {new Date().toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
