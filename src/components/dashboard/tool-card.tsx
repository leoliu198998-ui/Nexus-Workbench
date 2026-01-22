import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { LucideIcon, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ToolCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  status?: 'active' | 'beta' | 'coming_soon';
}

const statusMap = {
  active: { label: 'Active', className: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 hover:bg-emerald-500/20' },
  beta: { label: 'Beta', className: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 hover:bg-amber-500/20' },
  coming_soon: { label: 'Soon', className: 'bg-muted text-muted-foreground' },
};

export function ToolCard({
  title,
  description,
  icon: Icon,
  href,
  status = 'active',
}: ToolCardProps) {
  const { label, className: badgeClass } = statusMap[status];
  const isComingSoon = status === 'coming_soon';

  return (
    <Link 
      href={isComingSoon ? '#' : href} 
      className={cn(
        "group block h-full", 
        isComingSoon && "cursor-not-allowed opacity-60"
      )}
    >
      <Card className="h-full border-border/60 bg-card/50 backdrop-blur-sm transition-all duration-300 hover:border-primary/20 hover:bg-card hover:shadow-lg hover:shadow-primary/5">
        <CardHeader className="relative pb-2">
          <div className="flex justify-between items-start">
            <div className="p-2.5 rounded-xl bg-primary/5 text-primary ring-1 ring-inset ring-primary/10 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
              <Icon className="w-6 h-6" />
            </div>
            <Badge variant="secondary" className={cn("font-mono text-xs font-medium border-0", badgeClass)}>
              {label}
            </Badge>
          </div>
          <div className="mt-4 space-y-1">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
              {title}
              {!isComingSoon && (
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-muted-foreground/80 line-clamp-2 text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}