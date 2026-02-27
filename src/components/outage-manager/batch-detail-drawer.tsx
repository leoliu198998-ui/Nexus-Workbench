'use client';

import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { WizardControl } from './wizard-control';
import type { OutageBatch } from '@/types/outage';

interface BatchDetailDrawerProps {
  batch: OutageBatch | null;
  open: boolean;
  onClose: () => void;
  onBatchUpdate: () => void;
}

export function BatchDetailDrawer({ batch, open, onClose, onBatchUpdate }: BatchDetailDrawerProps) {
  const [isSavingToken, setIsSavingToken] = useState(false);
  
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

  const handleTokenChange = async (newToken: string) => {
    setIsSavingToken(true);
    try {
      await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: newToken }),
      });
      onBatchUpdate();
    } finally {
      setIsSavingToken(false);
    }
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
            token={batch.token}
            onTokenChange={handleTokenChange}
            isSavingToken={isSavingToken}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
