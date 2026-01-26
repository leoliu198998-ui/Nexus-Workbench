import { render, screen, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { OutageWizardProvider, useOutageWizard } from './outage-wizard-context';
import React from 'react';
import type { OutageBatch } from '@/types/outage';

// Consumer component for testing
const TestConsumer = () => {
  const { batch, token, setToken } = useOutageWizard();
  return (
    <div>
      <span data-testid="batch-id">{batch?.id}</span>
      <span data-testid="token">{token}</span>
      <button onClick={() => setToken('new-token')}>Update Token</button>
    </div>
  );
};

describe('OutageWizardContext', () => {
  const mockBatch: OutageBatch = {
    id: 'batch-1',
    token: 'initial-token',
    remoteBatchId: 'remote-1',
    envId: 'env-1',
    status: 'CREATED',
    batchName: 'Test'
  };

  it('provides batch and token to consumers', () => {
    render(
      <OutageWizardProvider initialBatch={mockBatch}>
        <TestConsumer />
      </OutageWizardProvider>
    );

    expect(screen.getByTestId('batch-id').textContent).toBe('batch-1');
    expect(screen.getByTestId('token').textContent).toBe('initial-token');
  });

  it('updates token locally', async () => {
    render(
      <OutageWizardProvider initialBatch={mockBatch}>
        <TestConsumer />
      </OutageWizardProvider>
    );

    const button = screen.getByText('Update Token');
    await act(async () => {
      button.click();
    });

    expect(screen.getByTestId('token').textContent).toBe('new-token');
  });
});
