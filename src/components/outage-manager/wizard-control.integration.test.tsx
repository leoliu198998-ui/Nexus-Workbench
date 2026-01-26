import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WizardControl } from './wizard-control';
import { OutageWizardProvider, useOutageWizard } from './outage-wizard-context';
import type { OutageBatch } from '@/types/outage';

// Test wrapper that mimics the page structure
function TestWizardPage({ batch }: { batch: OutageBatch }) {
  const { token } = useOutageWizard();
  return (
    <div>
      <WizardControl batch={batch} onUpdate={() => {}} onReset={() => {}} token={token} onTokenChange={() => {}} isSavingToken={false} />
    </div>
  );
}

// Mock child components if needed, but here we want to see integration
describe('WizardControl Integration with Context', () => {
  const mockBatch: OutageBatch = {
    id: 'batch-1',
    token: 'initial-token',
    remoteBatchId: 'remote-1',
    status: 'CREATED',
    envId: 'env-1',
    batchName: 'Test Batch',
    environment: { name: 'Test Env' }
  };

  it('renders GlobalTokenInput with token from context', () => {
    render(
      <OutageWizardProvider initialBatch={mockBatch}>
        <TestWizardPage batch={mockBatch} />
      </OutageWizardProvider>
    );

    expect(screen.getByDisplayValue('initial-token')).toBeInTheDocument();
  });
});
