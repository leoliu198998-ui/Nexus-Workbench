import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WizardControl } from './wizard-control';
import { OutageWizardProvider, useOutageWizard } from './outage-wizard-context';
import { GlobalTokenInput } from './global-token-input';
import { toast } from 'sonner';

global.fetch = vi.fn();

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Test wrapper that mimics the page structure
function TestWizardPage({ batch }: { batch: any }) {
  const { token, setToken } = useOutageWizard();
  
  const handleTokenChange = (t: string) => {
    setToken(t);
    // Mock the API call here if needed, or rely on the test mocking fetch
    if (t === 'new-valid-token') {
       // simulate success side effect
    }
  };

  return (
    <div>
      <GlobalTokenInput value={token} onChange={handleTokenChange} />
      <WizardControl 
        batch={batch} 
        onUpdate={() => {}} 
        onReset={() => {}} 
        token={token}
        onTokenChange={handleTokenChange}
        isSavingToken={false}
      />
    </div>
  );
}

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
        <TestWizardPage batch={mockBatch} />
      </OutageWizardProvider>
    );

    // Click next step (Publish)
    await user.click(screen.getByText(/立即执行/));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(expect.stringContaining('Unauthorized'));
    });

    // 2. User updates token
    const tokenInput = screen.getByLabelText(/当前鉴权 Token/);
    await user.clear(tokenInput);
    await user.type(tokenInput, 'new-valid-token');

    // Mock token sync success logic is handled by component, here we focus on the retry
    // In real app, PATCH is called. Here, we assume token in context is updated.

    // 3. Retry attempt succeeds
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({ ...mockBatch, status: 'NOTIFIED' }),
    });

    await user.click(screen.getByText(/立即执行/));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('状态更新成功');
    });
  });
});
