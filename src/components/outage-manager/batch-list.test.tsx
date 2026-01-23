'use client';

import { render, screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders batches list', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        {
          id: '1',
          batchName: 'Test Batch',
          status: 'CREATED',
          releaseDatetime: '2026-01-01',
          environment: { name: 'Test Env' },
        },
      ],
    });

    render(<BatchList />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('Test Batch')).toBeInTheDocument();
    expect(screen.getByText('Test Env')).toBeInTheDocument();
    expect(screen.getByText('CREATED')).toBeInTheDocument();
  });
});
