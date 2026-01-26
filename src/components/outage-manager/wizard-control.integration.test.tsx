import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { WizardControl } from './wizard-control';
import { OutageWizardProvider } from './outage-wizard-context';

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
        <WizardControl 
          batch={mockBatch} 
          onUpdate={() => {}} 
          onReset={() => {}} 
        />
      </OutageWizardProvider>
    );

    expect(screen.getByDisplayValue('initial-token')).toBeInTheDocument();
  });
});
