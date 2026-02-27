'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { OutageBatch } from '@/types/outage';

interface OutageWizardContextType {
  batch: OutageBatch | null;
  token: string;
  setToken: (token: string) => void;
  updateBatch: (updates: Partial<OutageBatch>) => void;
  refreshBatch: () => Promise<void>;
}

const OutageWizardContext = createContext<OutageWizardContextType | undefined>(undefined);

export function OutageWizardProvider({ 
  children, 
  initialBatch 
}: { 
  children: React.ReactNode; 
  initialBatch: OutageBatch;
}) {
  const [batch, setBatch] = useState<OutageBatch>(initialBatch);
  const [token, setTokenState] = useState(initialBatch.token);

  const updateBatch = useCallback((updates: Partial<OutageBatch>) => {
    setBatch(prev => ({ ...prev, ...updates }));
    if (updates.token) {
      setTokenState(updates.token);
    }
  }, []);

  const setToken = useCallback((newToken: string) => {
    setTokenState(newToken);
    // Note: We don't auto-save to DB here to avoid excessive API calls
    // The actual update will happen when user explicitly triggers or debounced
  }, []);

  const refreshBatch = useCallback(async () => {
    try {
      const res = await fetch(`/api/apps/outage-manager/batches/${batch.id}`);
      if (res.ok) {
        const data = await res.json();
        updateBatch(data);
      }
    } catch (error) {
      console.error('Failed to refresh batch:', error);
    }
  }, [batch.id, updateBatch]);

  return (
    <OutageWizardContext.Provider value={{ 
      batch, 
      token, 
      setToken, 
      updateBatch,
      refreshBatch
    }}>
      {children}
    </OutageWizardContext.Provider>
  );
}

export function useOutageWizard() {
  const context = useContext(OutageWizardContext);
  if (context === undefined) {
    throw new Error('useOutageWizard must be used within an OutageWizardProvider');
  }
  return context;
}
