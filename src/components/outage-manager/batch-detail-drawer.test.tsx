import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BatchDetailDrawer } from './batch-detail-drawer';

// Mock WizardControl
vi.mock('./wizard-control', () => ({
  WizardControl: ({ batch }: { batch: { batchName: string } }) => (
    <div data-testid="wizard-control">Wizard for {batch.batchName}</div>
  ),
}));

describe('BatchDetailDrawer', () => {
  const mockBatch = {
    id: 'batch-123',
    envId: 'env-456',
    status: 'CREATED',
    batchName: 'Test Batch',
    token: 'test-token',
    releaseDatetime: '2026-01-23T10:00:00Z',
    releaseTimeZone: 'Asia/Shanghai',
    duration: 60,
    environment: { name: 'Production' },
    logs: { steps: [] },
  };

  const mockProps = {
    batch: mockBatch,
    open: true,
    onClose: vi.fn(),
    onBatchUpdate: vi.fn(),
  };

  it('should render when open is true and batch is provided', () => {
    render(<BatchDetailDrawer {...mockProps} />);
    
    expect(screen.getByText('批次详情')).toBeInTheDocument();
    expect(screen.getByText('管理和控制发布批次的流程')).toBeInTheDocument();
    expect(screen.getByTestId('wizard-control')).toBeInTheDocument();
  });

  it('should not render when batch is null', () => {
    render(<BatchDetailDrawer {...mockProps} batch={null} />);
    
    expect(screen.queryByText('批次详情')).not.toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<BatchDetailDrawer {...mockProps} open={false} />);
    
    // Sheet is in DOM but not visible
    const title = screen.queryByText('批次详情');
    if (title) {
      expect(title.closest('[data-state]')).toHaveAttribute('data-state', 'closed');
    }
  });
});
