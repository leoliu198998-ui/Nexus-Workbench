import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import userEvent from '@testing-library/user-event';
import OutageManagerPage from './page';

// Mock child components to simplify integration testing
vi.mock('@/components/outage-manager/environment-selector', () => ({
  EnvironmentSelector: ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
    <div data-testid="env-selector">
      <button onClick={() => onChange('env-1')}>Select Env 1</button>
      <span>Current: {value}</span>
    </div>
  ),
}));

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
  CreateBatchDialog: ({ open, envId }: { open: boolean; envId: string }) => (
    open ? <div data-testid="create-batch-dialog">Dialog for {envId}</div> : null
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

    expect(screen.getByText('系统停机发布管理')).toBeInTheDocument();
    expect(screen.getByText('发布批次管理')).toBeInTheDocument();
    expect(screen.getByTestId('env-selector')).toBeInTheDocument();
    expect(screen.getByTestId('batch-list')).toBeInTheDocument();
  });

  it('disables create button when no environment is selected', () => {
    render(<OutageManagerPage />);

    const createButton = screen.getByText('创建新批次');
    expect(createButton).toBeDisabled();
  });

  it('enables create button after selecting environment', () => {
    render(<OutageManagerPage />);

    fireEvent.click(screen.getByText('Select Env 1'));

    const createButton = screen.getByText('创建新批次');
    expect(createButton).not.toBeDisabled();
  });

  it('opens create dialog when create button is clicked', async () => {
    const user = userEvent.setup();
    render(<OutageManagerPage />);

    fireEvent.click(screen.getByText('Select Env 1'));
    await user.click(screen.getByText('创建新批次'));

    expect(screen.getByTestId('create-batch-dialog')).toBeInTheDocument();
  });

  it('opens batch detail drawer when batch is clicked', async () => {
    const user = userEvent.setup();
    render(<OutageManagerPage />);

    await user.click(screen.getByText('View Batch'));

    expect(screen.getByTestId('batch-detail-drawer')).toBeInTheDocument();
    expect(screen.getByText('Drawer for batch-1')).toBeInTheDocument();
  });
});
