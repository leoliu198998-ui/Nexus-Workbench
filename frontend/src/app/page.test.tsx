import { render, screen } from '@testing-library/react';
import Home from './page';
import { describe, it, expect } from 'vitest';

describe('Home Page (Dashboard)', () => {
  it('renders dashboard heading', () => {
    render(<Home />);
    expect(screen.getByText('仪表盘')).toBeDefined();
    expect(screen.getByText(/欢迎使用 Nexus Workbench/)).toBeDefined();
  });

  it('renders tool cards', () => {
    render(<Home />);
    expect(screen.getByText('Excel 导出向导')).toBeDefined();
    expect(screen.getByText(/通过分步向导/)).toBeDefined();
  });
});
