import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WizardControl } from './wizard-control';
import { OutageWizardProvider } from './outage-wizard-context';
import { toast } from 'sonner';

global.fetch = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('WizardControl - Token Expiration Flow', () => {
  const mockBatch: any = {
    id: 'batch-1',
    token: 'expired-token',
    remoteBatchId: 'remote-1',
    status: 'CREATED',
    batchName: 'Test Batch',
    environment: { name: 'Test Env' }
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows updating token and retrying after a failure', async () => {
    const user = userEvent.setup();
    
    // 1. First attempt fails with 502/Unauthorized
    (global.fetch as any).mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: async () => ({ error: 'External API Error', details: 'Unauthorized' }),
    });

    render(
      <OutageWizardProvider initialBatch={mockBatch}>
        <WizardControl 
          batch={mockBatch} 
          onUpdate={() => {}} 
          onReset={() => {}} 
        />
      </OutageWizardProvider>
    );

    // Click next step (Publish)
    await user.click(screen.getByText(/开始执行: 发布通知/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'));
    });

    // 2. User updates token
    const tokenInput = screen.getByLabelText(/当前鉴权 Token/);
    await user.clear(tokenInput);
    await user.type(tokenInput, 'new-valid-token');

    // Mock token sync success
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...mockBatch, token: 'new-valid-token' }),
    });

    // 3. Retry attempt succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...mockBatch, status: 'NOTIFIED' }),
    });

    await user.click(screen.getByText(/开始执行: 发布通知/));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('状态更新成功');
    });
  });
});
