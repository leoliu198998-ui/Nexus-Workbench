'use client';

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { CreateBatchForm } from './create-batch-form';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

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

    render(<CreateBatchForm envId="env-1" onSuccess={mockOnSuccess} />);

    fireEvent.change(screen.getByLabelText(/批次名称/), { target: { value: 'Test Batch' } });
    fireEvent.change(screen.getByLabelText(/发布时间/), { target: { value: '2026-01-23T12:00' } });
    fireEvent.change(screen.getByLabelText(/操作 Token/), { target: { value: 'secret-token' } });

    fireEvent.click(screen.getByText('创建并进入下一步'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalledWith(expect.objectContaining({ id: 'new-batch' }));
    });
  });
});
