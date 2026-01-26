'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Key, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GlobalTokenInputProps {
  value: string;
  onChange: (value: string) => void;
  isSaving?: boolean;
  className?: string;
}

export function GlobalTokenInput({ value, onChange, isSaving, className }: GlobalTokenInputProps) {
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <Label htmlFor="global-token" className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
          <Key className="h-3 w-3" />
          当前鉴权 Token (DevOps)
        </Label>
        {isSaving && (
          <div className="flex items-center gap-1.5 text-[10px] text-primary animate-pulse font-medium">
            <Loader2 className="h-2.5 w-2.5 animate-spin" />
            正在同步...
          </div>
        )}
        {!isSaving && value && (
          <div className="flex items-center gap-1.5 text-[10px] text-green-600 font-medium">
            <CheckCircle2 className="h-2.5 w-2.5" />
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
          className="font-mono text-sm h-10 pr-10 border-primary/20 focus-visible:ring-primary/30 transition-all bg-background/50 backdrop-blur-sm"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 group-focus-within:text-primary/40 transition-colors">
          <Key className="h-4 w-4" />
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground opacity-70">
        提示：如果接口提示 401 或 Token 过期，请在此处直接修改。Token 将明文显示。
      </p>
    </div>
  );
}
