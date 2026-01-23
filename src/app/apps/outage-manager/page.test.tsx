import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import OutageManagerPage from './page';

// Mock child components to simplify integration testing
vi.mock('@/components/outage-manager/environment-selector', () => ({
  EnvironmentSelector: ({ value, onChange }: any) => (
    <div data-testid="env-selector">
      <button onClick={() => onChange('env-1')}>Select Env 1</button>
      <span>Current: {value}</span>
    </div>
  ),
}));

vi.mock('@/components/outage-manager/batch-list', () => ({
  BatchList: () => <div data-testid="batch-list">Batch List</div>,
}));

vi.mock('@/components/outage-manager/create-batch-form', () => ({
  CreateBatchForm: ({ envId, onSuccess }: any) => (
    <div data-testid="create-batch-form">
      Form for {envId}
      <button onClick={() => onSuccess({ id: 'batch-new', envId, status: 'CREATED' })}>
        Create Batch
      </button>
    </div>
  ),
}));

vi.mock('@/components/outage-manager/wizard-control', () => ({
  WizardControl: ({ batch, onReset }: any) => (
    <div data-testid="wizard-control">
      Wizard for {batch.id}
      <button onClick={onReset}>Reset</button>
    </div>
  ),
}));

// Mock toast
vi.mock('sonner', () => ({
  toast: {
    info: vi.fn(),
  },
}));

describe('OutageManagerPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();
  });

  it('renders loading initially', () => {
    (global.fetch as any).mockImplementation(() => new Promise(() => {})); // Never resolves
    render(<OutageManagerPage />);
    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('renders environment selector when no active batch exists', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [], // No batches
    });

    render(<OutageManagerPage />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByText('系统停机发布管理')).toBeInTheDocument();
    expect(screen.getByTestId('env-selector')).toBeInTheDocument();
    expect(screen.queryByTestId('wizard-control')).not.toBeInTheDocument();
  });

  it('restores active batch if one exists', async () => {
    const activeBatch = { id: 'batch-123', envId: 'env-1', status: 'STARTED' };
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [activeBatch],
    });

    render(<OutageManagerPage />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    expect(screen.getByTestId('wizard-control')).toBeInTheDocument();
    expect(screen.getByText('Wizard for batch-123')).toBeInTheDocument();
  });

  it('shows create form after selecting environment', async () => {
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => [],
    });

    render(<OutageManagerPage />);

    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Select Env 1'));

    expect(screen.getByTestId('create-batch-form')).toBeInTheDocument();
    expect(screen.getByText('Form for env-1')).toBeInTheDocument();
  });
});
