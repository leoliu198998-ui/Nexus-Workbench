import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import OutageManagerPage from './page';

// Mock useRouter
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

// Mock child components to simplify integration testing
vi.mock('@/components/outage-manager/batch-list', () => ({
  BatchList: ({ onBatchClick }: { onBatchClick?: (batch: unknown) => void }) => (
    <div data-testid="batch-list">
      Batch List
      {onBatchClick && (
        <button onClick={() => onBatchClick({ id: 'batch-1', batchName: 'Test' })}>
          View Batch
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/outage-manager/create-batch-dialog', () => ({
  CreateBatchDialog: ({ open }: { open: boolean }) => (
    open ? <div data-testid="create-batch-dialog">Create Dialog</div> : null
  ),
}));

vi.mock('@/components/outage-manager/batch-detail-drawer', () => ({
  BatchDetailDrawer: ({ open, batch }: { open: boolean; batch: { id: string } | null }) => (
    open && batch ? <div data-testid="batch-detail-drawer">Drawer for {batch.id}</div> : null
  ),
}));

describe('OutageManagerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders page title and main components', () => {
    render(<OutageManagerPage />);

    expect(screen.getByText('Outage Manager')).toBeInTheDocument();
    expect(screen.getByText('Release Batches')).toBeInTheDocument();
    expect(screen.getByTestId('batch-list')).toBeInTheDocument();
  });

  it('renders create button that is always enabled', () => {
    render(<OutageManagerPage />);

    const createButton = screen.getByRole('button', { name: /Create New Batch/i });
    expect(createButton).not.toBeDisabled();
  });

  it('opens create dialog when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<OutageManagerPage />);

    await user.click(screen.getByRole('button', { name: /Create New Batch/i }));

    expect(screen.getByTestId('create-batch-dialog')).toBeInTheDocument();
  });

  it('navigates to wizard page when batch is clicked', async () => {
    const user = userEvent.setup();
    render(<OutageManagerPage />);

    await user.click(screen.getByText('View Batch'));

    expect(mockPush).toHaveBeenCalledWith('/apps/outage-manager/wizard/batch-1');
  });
});
