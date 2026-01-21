import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status?: 'active' | 'beta' | 'coming_soon';
}

const statusMap = {
  active: { label: 'Active', variant: 'default' as const },
  beta: { label: 'Beta', variant: 'secondary' as const },
  coming_soon: { label: 'Coming Soon', variant: 'outline' as const },
};

export function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  status = 'active',
}: ToolCardProps) {
  const { label, variant } = statusMap[status];
  const isComingSoon = status === 'coming_soon';

  return (
    <Card className="h-full flex flex-col hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex justify-between items-start mb-2">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          <Badge variant={variant}>{label}</Badge>
        </div>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardFooter className="mt-auto">
        {isComingSoon ? (
          <Button className="w-full" disabled variant="outline">
            即将推出
          </Button>
        ) : (
          <Button asChild className="w-full">
            <Link href={href}>进入工具</Link>
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
