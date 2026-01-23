import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { CreateBatchDialog } from './create-batch-dialog';

// Mock CreateBatchForm
vi.mock('./create-batch-form', () => ({
  CreateBatchForm: ({ envId }: { envId: string }) => (
    <div data-testid="create-batch-form">Form for env: {envId}</div>
  ),
}));

describe('CreateBatchDialog', () => {
  const mockProps = {
    envId: 'env-123',
    open: true,
    onClose: vi.fn(),
    onSuccess: vi.fn(),
  };

  it('should render when open is true', () => {
    render(<CreateBatchDialog {...mockProps} />);
    
    expect(screen.getByText('创建发布批次')).toBeInTheDocument();
    expect(screen.getByText('配置新发布的基本信息。创建后将自动通知目标环境。')).toBeInTheDocument();
    expect(screen.getByTestId('create-batch-form')).toBeInTheDocument();
  });

  it('should not render when open is false', () => {
    render(<CreateBatchDialog {...mockProps} open={false} />);
    
    // Dialog is in DOM but not visible
    const title = screen.queryByText('创建发布批次');
    if (title) {
      expect(title.closest('[data-state]')).toHaveAttribute('data-state', 'closed');
    }
  });

  it('should pass correct envId to CreateBatchForm', () => {
    render(<CreateBatchDialog {...mockProps} />);
    
    expect(screen.getByText('Form for env: env-123')).toBeInTheDocument();
  });
});
