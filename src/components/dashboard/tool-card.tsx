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
  active: { label: 'Active', className: 'bg-emerald-500/15 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-500/20' },
  beta: { label: 'Beta', className: 'bg-amber-500/15 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-amber-500/20' },
  coming_soon: { label: 'Soon', className: 'bg-muted text-muted-foreground border-border' },
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
        "group block h-full cursor-pointer",
        isComingSoon && "cursor-not-allowed opacity-50"
      )}
    >
      <Card className="h-full border-border/50 bg-card/80 backdrop-blur-sm transition-all duration-300 hover:border-primary/30 hover:bg-card hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1">
        <CardHeader className="relative pb-3">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-primary/10 text-primary ring-1 ring-inset ring-primary/20 group-hover:bg-primary/15 group-hover:ring-primary/30 group-hover:scale-105 transition-all duration-300">
              <Icon className="w-6 h-6" />
            </div>
            <Badge variant="secondary" className={cn("font-medium text-xs border", badgeClass)}>
              {label}
            </Badge>
          </div>
          <div className="mt-5 space-y-1.5">
            <CardTitle className="text-lg font-semibold tracking-tight text-foreground group-hover:text-primary transition-colors duration-200 flex items-center gap-2">
              {title}
              {!isComingSoon && (
                <ArrowRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
              )}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {description}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  );
}