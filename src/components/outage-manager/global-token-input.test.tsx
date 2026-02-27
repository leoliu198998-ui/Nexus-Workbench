import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { GlobalTokenInput } from './global-token-input';

describe('GlobalTokenInput', () => {
  it('renders with current token value', () => {
    render(<GlobalTokenInput value="test-token" onChange={() => {}} />);
    const input = screen.getByDisplayValue('test-token');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'text'); // Ensure it's not password
  });

  it('calls onChange when edited', () => {
    const onChange = vi.fn();
    render(<GlobalTokenInput value="old" onChange={onChange} />);
    
    const input = screen.getByDisplayValue('old');
    fireEvent.change(input, { target: { value: 'new' } });
    
    expect(onChange).toHaveBeenCalledWith('new');
  });

  it('shows saving status if provided', () => {
    render(<GlobalTokenInput value="v" onChange={() => {}} isSaving={true} />);
    expect(screen.getByText('正在同步...')).toBeInTheDocument();
  });
});
