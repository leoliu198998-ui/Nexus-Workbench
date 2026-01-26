import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WizardControl } from './wizard-control';
import { OutageWizardProvider, useOutageWizard } from './outage-wizard-context';
import { GlobalTokenInput } from './global-token-input';

// Test wrapper that mimics the page structure
function TestWizardPage({ batch }: { batch: any }) {
  const { token } = useOutageWizard();
  return (
    <div>
      <GlobalTokenInput value={token} onChange={() => {}} />
      <WizardControl batch={batch} onUpdate={() => {}} onReset={() => {}} />
    </div>
  );
}

// Mock child components if needed, but here we want to see integration
describe('WizardControl Integration with Context', () => {
  const mockBatch: any = {
    id: 'batch-1',
    token: 'initial-token',
    remoteBatchId: 'remote-1',
    status: 'CREATED',
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
