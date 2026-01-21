import { render, screen } from '@testing-library/react';
import { ToolCard } from './tool-card';
import { FileSpreadsheet } from 'lucide-react';
import { describe, it, expect } from 'vitest';

describe('ToolCard', () => {
  const defaultProps = {
    title: 'Excel Export',
    description: 'Export data to Excel',
    icon: FileSpreadsheet,
    href: '/apps/excel-export',
  };

  it('renders title and description', () => {
    render(<ToolCard {...defaultProps} />);
    expect(screen.getByText('Excel Export')).toBeDefined();
    expect(screen.getByText('Export data to Excel')).toBeDefined();
  });

  it('renders status badge', () => {
    render(<ToolCard {...defaultProps} status="beta" />);
    expect(screen.getByText('Beta')).toBeDefined();
  });

  it('disables link when status is coming_soon', () => {
    render(<ToolCard {...defaultProps} status="coming_soon" />);
    const button = screen.getByText('即将推出').closest('button');
    expect(button).toBeDefined();
    expect(button).toBeDisabled();
  });

  it('renders link when status is active', () => {
    render(<ToolCard {...defaultProps} status="active" />);
    const link = screen.getByRole('link', { name: '进入工具' });
    expect(link).toHaveAttribute('href', '/apps/excel-export');
  });
});
