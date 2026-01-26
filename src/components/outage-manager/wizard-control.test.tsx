/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardControl } from './wizard-control';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import type { OutageBatch } from '@/types/outage';

global.fetch = vi.fn();

describe('WizardControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBatch: OutageBatch = {
    id: 'batch-1',
    envId: 'env-1',
    batchName: 'Test Batch',
    status: 'CREATED',
    token: 'test-token',
    logs: { steps: [] },
    environment: { name: 'Production' },
  };

  it('renders correctly and handles publish action', async () => {
    const mockOnUpdate = vi.fn();
    const mockFetch = global.fetch as unknown as ReturnType<typeof vi.fn>;
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockBatch, status: 'NOTIFIED' }),
    });

    render(
      <WizardControl 
        batch={mockBatch} 
        onUpdate={mockOnUpdate} 
        onReset={vi.fn()} 
        token="test-token"
        onTokenChange={vi.fn()}
        isSavingToken={false}
      />
    );

    expect(screen.getByText('发布进度')).toBeInTheDocument();
    
    // Check for the new button
    const actionButton = screen.getByRole('button', { name: /立即执行/ });
    expect(actionButton).toBeInTheDocument();
    expect(actionButton).not.toBeDisabled();

    fireEvent.click(actionButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/apps/outage-manager/batches/batch-1',
        expect.objectContaining({
          method: 'PATCH',
          body: JSON.stringify({ action: 'publish' }),
        })
      );
    });
    
    expect(mockOnUpdate).toHaveBeenCalled();
  });
});
