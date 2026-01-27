import { useState } from 'react';
import { toast } from 'sonner';
import type { OutageBatch } from '@/types/outage';

type ActionType = 'publish' | 'release' | 'finish' | 'cancel';

interface UseWizardActionsProps {
  batch: OutageBatch;
  onUpdate: (updatedBatch: Partial<OutageBatch>) => void;
}

export function useWizardActions({ batch, onUpdate }: UseWizardActionsProps) {
  const [loading, setLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<ActionType | null>(null);

  const executeAction = async (action: ActionType) => {
    setLoading(true);
    setConfirmOpen(false);

    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      });
// ... (rest of the function)
// ...
  const initiateAction = (action: ActionType) => {
    if (action === 'release' || action === 'finish' || action === 'cancel') {
      setPendingAction(action);
      setConfirmOpen(true);
    } else {
      executeAction(action);
    }
  };

  return {
    loading,
    confirmOpen,
    pendingAction,
    initiateAction,
    executeAction,
    setConfirmOpen,
  };
}
