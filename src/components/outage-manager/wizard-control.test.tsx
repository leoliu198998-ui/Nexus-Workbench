/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WizardControl } from './wizard-control';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('WizardControl', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockBatch = {
    id: 'batch-1',
    envId: 'env-1',
    batchName: 'Test Batch',
    status: 'CREATED',
    logs: { steps: [] },
    environment: { name: 'Production' },
  };

  it('renders correctly and handles publish action', async () => {
    const mockOnUpdate = vi.fn();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ ...mockBatch, status: 'NOTIFIED' }),
    });

    render(<WizardControl batch={mockBatch} onUpdate={mockOnUpdate} onReset={vi.fn()} />);

    expect(screen.getByText('步骤 2：公布发布通知')).not.toBeDisabled();
    expect(screen.getByText('步骤 3：开始发布 (停机)')).toBeDisabled();

    fireEvent.click(screen.getByText('步骤 2：公布发布通知'));

    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.objectContaining({ status: 'NOTIFIED' }));
    });
  });
});
