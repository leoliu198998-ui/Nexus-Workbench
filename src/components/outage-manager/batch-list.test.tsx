/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchList } from './batch-list';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

describe('BatchList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {}));
    render(<BatchList />);
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('renders batches list', async () => {
    const mockBatches = [
      {
        id: '1',
        batchName: 'Test Batch',
        status: 'CREATED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBatches,
    });

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('Test Batch')).toBeInTheDocument();
      expect(screen.getByText('Test Env')).toBeInTheDocument();
      expect(screen.getByText('已创建')).toBeInTheDocument();
    });
  });

  it('renders action button for incomplete batch', async () => {
    const mockBatches = [
      {
        id: '1',
        batchName: 'Test Batch',
        status: 'CREATED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBatches,
    });

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('继续发布')).toBeInTheDocument();
    });
  });

  it('renders action button for completed batch', async () => {
    const mockBatches = [
      {
        id: '1',
        batchName: 'Test Batch',
        status: 'COMPLETED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBatches,
    });

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('查看详情')).toBeInTheDocument();
    });
  });

  it('calls onBatchClick when action button is clicked', async () => {
    const user = userEvent.setup();
    const mockBatches = [
      {
        id: '1',
        batchName: 'Test Batch',
        status: 'CREATED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];

    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => mockBatches,
    });

    const onBatchClick = vi.fn();
    render(<BatchList onBatchClick={onBatchClick} />);

    await waitFor(() => {
      expect(screen.getByText('继续发布')).toBeInTheDocument();
    });

    await user.click(screen.getByText('继续发布'));
    expect(onBatchClick).toHaveBeenCalledWith(mockBatches[0]);
  });
});
