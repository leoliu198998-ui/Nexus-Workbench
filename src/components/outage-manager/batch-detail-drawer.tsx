'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { WizardControl } from './wizard-control';

interface LogEntry {
  timestamp: string;
  step: string;
  status: number;
  response: unknown;
}

interface OutageBatch {
  id: string;
  envId: string;
  status: string;
  batchName: string;
  releaseDatetime: string;
  releaseTimeZone: string;
  duration: number;
  environment?: { name: string };
  logs?: { steps: LogEntry[] };
}

interface BatchDetailDrawerProps {
  batch: OutageBatch | null;
  open: boolean;
  onClose: () => void;
  onBatchUpdate: () => void;
}

export function BatchDetailDrawer({ batch, open, onClose, onBatchUpdate }: BatchDetailDrawerProps) {
  if (!batch) {
    return null;
  }

  const handleWizardUpdate = () => {
    onBatchUpdate();
  };

  const handleReset = () => {
    onClose();
    onBatchUpdate();
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:max-w-4xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle>批次详情</SheetTitle>
          <SheetDescription>
            管理和控制发布批次的流程
          </SheetDescription>
        </SheetHeader>
        
        <div className="mt-6">
          <WizardControl 
            batch={batch}
            onUpdate={handleWizardUpdate}
            onReset={handleReset}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
