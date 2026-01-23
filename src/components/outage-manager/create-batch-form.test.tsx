/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateBatchForm } from './create-batch-form';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

// Mock EnvironmentSelector
vi.mock('./environment-selector', () => ({
  EnvironmentSelector: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="env-selector">
      <button onClick={() => onChange('env-1')}>Select Env</button>
      <span>Selected: {value}</span>
    </div>
  ),
}));

describe('CreateBatchForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submits form data and calls onSuccess', async () => {
    const mockOnSuccess = vi.fn();
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ id: 'new-batch', status: 'CREATED' }),
    });

    render(<CreateBatchForm onSuccess={mockOnSuccess} />);

    // Select environment
    fireEvent.click(screen.getByText('Select Env'));

    fireEvent.change(screen.getByLabelText(/批次名称/), { target: { value: 'Test Batch' } });
    fireEvent.change(screen.getByLabelText(/计划发布时间/), { target: { value: '2026-01-23T12:00' } });
    fireEvent.change(screen.getByLabelText(/鉴权 Token/), { target: { value: 'secret-token' } });

    fireEvent.click(screen.getByText('创建并进入向导'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-batch' }));
    });
  });
});
