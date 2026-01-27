import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, Check, LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  icon: LucideIcon;
  action: string | null;
}

interface WizardTimelineProps {
  steps: readonly Step[];
  currentStatus: string;
}

export function WizardTimeline({ steps, currentStatus }: WizardTimelineProps) {
  const currentStepIndex = steps.findIndex(s => s.id === currentStatus);

  return (
    <Card className="overflow-hidden border-0 shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4 border-b bg-muted/20">
        <CardTitle className="text-base font-semibold flex items-center gap-2">
          <Clock className="w-4 h-4 text-muted-foreground" />
          发布进度
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 px-6">
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:h-full before:w-0.5 before:-translate-x-1/2 before:bg-linear-to-b before:from-border before:via-border before:to-transparent before:z-0">
          {steps.map((step, index) => {
            const isCompleted = index <= currentStepIndex;
            const isCurrent = index === currentStepIndex;
            const StepIcon = step.icon;
            
            return (
              <div key={step.id} className="relative flex items-start gap-4 z-10 group">
                <div className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition-all duration-300 shadow-sm",
                  isCompleted ? "bg-primary border-primary text-primary-foreground" : 
                  isCurrent ? "bg-background border-primary ring-4 ring-primary/10 animate-pulse" : 
                  "bg-muted border-transparent text-muted-foreground"
                )}>
                  {isCompleted ? <Check className="w-5 h-5" /> : <StepIcon className="w-5 h-5" />}
                </div>
                <div className="flex flex-col pt-1.5 space-y-1">
                  <span className={cn(
                    "text-sm font-bold leading-none transition-colors",
                    isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                  )}>
                    {step.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {isCompleted ? '已完成' : isCurrent ? '进行中' : '等待中'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
