import { render, screen } from '@testing-library/react';
import { Navbar } from './navbar';
import { describe, it, expect } from 'vitest';

describe('Navbar', () => {
  it('renders project name', () => {
    render(<Navbar />);
    expect(screen.getByText('Nexus Workbench')).toBeDefined();
  });

  it('contains link to dashboard', () => {
    render(<Navbar />);
    const links = screen.getAllByRole('link');
    const hasDashboardLink = links.some(link => link.getAttribute('href') === '/');
    expect(hasDashboardLink).toBe(true);
  });
});
