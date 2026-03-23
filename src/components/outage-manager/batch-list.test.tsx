/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BatchList } from './batch-list';
import { vi, describe, it, expect, beforeEach } from 'vitest';

global.fetch = vi.fn();

const createPaginatedResponse = (items: Array<Record<string, unknown>>, page = 1, total = items.length) => ({
  ok: true,
  json: async () => ({
    items,
    page,
    pageSize: 10,
    total,
    totalPages: Math.max(1, Math.ceil(total / 10)),
  }),
});

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

    (global.fetch as any).mockResolvedValue(createPaginatedResponse(mockBatches));

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('Test Batch')).toBeInTheDocument();
      expect(screen.getByText(/Test Env/)).toBeInTheDocument();
      expect(screen.getByText('已创建')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenCalledWith('/api/apps/outage-manager/batches?page=1');
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

    (global.fetch as any).mockResolvedValue(createPaginatedResponse(mockBatches));

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('继续')).toBeInTheDocument();
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

    (global.fetch as any).mockResolvedValue(createPaginatedResponse(mockBatches));

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('查看')).toBeInTheDocument();
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

    (global.fetch as any).mockResolvedValue(createPaginatedResponse(mockBatches));

    const onBatchClick = vi.fn();
    render(<BatchList onBatchClick={onBatchClick} />);

    await waitFor(() => {
      expect(screen.getByText('继续')).toBeInTheDocument();
    });

    await user.click(screen.getByText('继续'));
    expect(onBatchClick).toHaveBeenCalledWith(mockBatches[0]);
  });

  it('requests the next page and shows pagination summary', async () => {
    const user = userEvent.setup();
    const firstPageBatches = [
      {
        id: '1',
        batchName: 'Batch Page 1',
        status: 'CREATED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];
    const secondPageBatches = [
      {
        id: '2',
        batchName: 'Batch Page 2',
        status: 'NOTIFIED',
        releaseDatetime: '2026-01-02T08:00:00Z',
        duration: 20,
        environment: { name: 'Prod Env' },
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce(createPaginatedResponse(firstPageBatches, 1, 11))
      .mockResolvedValueOnce(createPaginatedResponse(secondPageBatches, 2, 11));

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('Batch Page 1')).toBeInTheDocument();
      expect(screen.getByText('第 1 / 2 页')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '下一页' }));

    await waitFor(() => {
      expect(screen.getByText('Batch Page 2')).toBeInTheDocument();
      expect(screen.getByText('第 2 / 2 页')).toBeInTheDocument();
    });

    expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/apps/outage-manager/batches?page=1');
    expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/apps/outage-manager/batches?page=2');
  });

  it('refreshes the current page instead of jumping back to page 1', async () => {
    const user = userEvent.setup();
    const firstPageBatches = [
      {
        id: '1',
        batchName: 'Batch Page 1',
        status: 'CREATED',
        releaseDatetime: '2026-01-01T08:00:00Z',
        duration: 10,
        environment: { name: 'Test Env' },
      },
    ];
    const secondPageBatches = [
      {
        id: '2',
        batchName: 'Batch Page 2',
        status: 'NOTIFIED',
        releaseDatetime: '2026-01-02T08:00:00Z',
        duration: 20,
        environment: { name: 'Prod Env' },
      },
    ];

    (global.fetch as any)
      .mockResolvedValueOnce(createPaginatedResponse(firstPageBatches, 1, 11))
      .mockResolvedValueOnce(createPaginatedResponse(secondPageBatches, 2, 11))
      .mockResolvedValueOnce(createPaginatedResponse(secondPageBatches, 2, 11));

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.getByText('Batch Page 1')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: '下一页' }));

    await waitFor(() => {
      expect(screen.getByText('Batch Page 2')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /刷新列表/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenNthCalledWith(3, '/api/apps/outage-manager/batches?page=2');
    });
  });
});
