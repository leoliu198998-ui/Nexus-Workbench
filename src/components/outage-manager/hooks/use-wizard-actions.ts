import { useState } from 'react';
import { toast } from 'sonner';
import type { OutageBatch } from '@/types/outage';

type ActionType = 'publish' | 'release' | 'finish';

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

      const data = await res.json();
      if (!res.ok) {
        // 如果有 apiCall 信息，在控制台输出完整的 API 调用信息
        if (data.apiCall) {
          console.group('🔴 API 调用失败 - 完整信息');
          console.log('URL:', data.apiCall.url);
          console.log('Method:', data.apiCall.method);
          console.log('Headers:', data.apiCall.headers);
          console.log('Body:', data.apiCall.body);
          console.log('Curl 命令:');
          console.log(data.apiCall.curl);
          if (data.apiCall.response) {
            console.log('Response Status:', data.apiCall.response.status);
            console.log('Response Raw:', data.apiCall.response.raw);
            console.log('Response Parsed:', data.apiCall.response.parsed);
          }
          console.groupEnd();
        }
        throw new Error(data.details || data.error || '操作失败');
      }

      // 成功时也输出 apiCall 信息
      if (data.apiCall) {
        console.group('✅ API 调用成功 - 完整信息');
        console.log('URL:', data.apiCall.url);
        console.log('Method:', data.apiCall.method);
        console.log('Request:', data.apiCall.request);
        console.log('Curl 命令:');
        console.log(data.apiCall.request?.curl);
        console.log('Response:', data.apiCall.response);
        console.groupEnd();
      }

      toast.success('状态更新成功');
      onUpdate(data);
    } catch (error: unknown) {
      console.error(error);
      toast.error(`操作失败: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
      setPendingAction(null);
    }
  };

  const initiateAction = (action: ActionType) => {
    if (action === 'release' || action === 'finish') {
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
