import { render, screen } from '@testing-library/react'
import Page from './page'
import { describe, it, expect } from 'vitest'

describe('Schedule Report Exporter Page', () => {
  it('renders authentication step by default', () => {
    render(<Page />)
    expect(screen.getByText(/X-DK-Token Required/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Access Token \(x-dk-token\)/i)).toBeInTheDocument()
  })

  it('contains back to dashboard link', () => {
    render(<Page />)
    const link = screen.getByRole('link', { name: /Back to Dashboard/i })
    expect(link).toHaveAttribute('href', '/')
  })
})