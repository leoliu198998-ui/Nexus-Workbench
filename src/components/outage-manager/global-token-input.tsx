'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Loader2, CheckCircle2, ShieldCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalTokenInputProps {
  value: string;
  onChange: (value: string) => void;
  isSaving?: boolean;
  className?: string;
}

export function GlobalTokenInput({ value, onChange, isSaving, className }: GlobalTokenInputProps) {
  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between">
        <Label 
          htmlFor="global-token" 
          className="text-sm font-bold tracking-wide text-foreground flex items-center gap-2.5"
        >
          <div className="p-1.5 bg-amber-500/10 rounded-md">
            <ShieldCheck className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          </div>
          当前鉴权 Token
          <span className="text-xs font-normal text-muted-foreground">(DevOps)</span>
        </Label>
        {isSaving && (
          <div className="flex items-center gap-2 text-xs text-primary font-semibold px-2.5 py-1 bg-primary/10 rounded-full">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            正在同步...
          </div>
        )}
        {!isSaving && value && (
          <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-semibold px-2.5 py-1 bg-green-500/10 rounded-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            已就绪
          </div>
        )}
      </div>
      <div className="relative group">
        <Input
          id="global-token"
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="请输入 DevOps Token..."
          className="font-mono text-sm h-10 pl-10 pr-10 border-2 border-amber-200/50 dark:border-amber-800/50 focus-visible:border-amber-400 focus-visible:ring-amber-400/20 transition-all bg-background/80 backdrop-blur-sm shadow-sm hover:shadow-md"
        />
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/60 group-focus-within:text-amber-500 transition-colors">
          <Key className="h-4 w-4" />
        </div>
        <div className={cn(
          "absolute right-3 top-1/2 -translate-y-1/2 transition-all",
          value ? "text-green-500 opacity-100" : "text-muted-foreground/20 opacity-50"
        )}>
          <CheckCircle2 className="h-4 w-4" />
        </div>
      </div>
      <div className="flex items-start gap-2 p-2.5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/50 dark:border-amber-800/30 rounded-md">
        <div className="p-0.5 bg-amber-100 dark:bg-amber-900/50 rounded mt-0.5">
          <Key className="h-3 w-3 text-amber-600 dark:text-amber-400" />
        </div>
        <p className="text-[11px] text-amber-800 dark:text-amber-200/90 leading-relaxed">
          <span className="font-semibold">提示：</span> 如果接口提示 401 或 Token 过期，请在此处直接修改。Token 将明文显示。
        </p>
      </div>
    </div>
  );
}
