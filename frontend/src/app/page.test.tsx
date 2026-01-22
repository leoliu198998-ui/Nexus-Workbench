import { render, screen } from '@testing-library/react';
import Home from './page';
import { describe, it, expect } from 'vitest';

describe('Home Page (Dashboard)', () => {
  it('renders dashboard heading', () => {
    render(<Home />);
    expect(screen.getByText('Available Tools')).toBeDefined();
    expect(screen.getByText(/Nexus Workbench v1.0/)).toBeDefined();
  });

  it('renders tool cards', () => {
    render(<Home />);
    expect(screen.getByText('Excel Export Wizard')).toBeDefined();
    expect(screen.getByText(/Transform API data into Excel reports/)).toBeDefined();
  });
});
