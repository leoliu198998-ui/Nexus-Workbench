'use client';

import { render, screen, waitFor } from '@testing-library/react';
import { EnvironmentSelector } from './environment-selector';
import { vi, describe, it, expect, beforeEach } from 'vitest';

// Mock fetch
global.fetch = vi.fn();

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
  },
}));

describe('EnvironmentSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state initially', () => {
    (global.fetch as any).mockReturnValue(new Promise(() => {})); // Never resolves
    render(<EnvironmentSelector onChange={vi.fn()} />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders environments after fetch', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [
        { id: '1', name: 'Test Env', baseUrl: 'http://test' },
      ],
    });

    render(<EnvironmentSelector onChange={vi.fn()} />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });
    
    // Select trigger should show placeholder
    expect(screen.getByText('选择环境')).toBeInTheDocument();
  });
});
