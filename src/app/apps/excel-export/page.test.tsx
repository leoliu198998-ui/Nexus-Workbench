import { render, screen } from '@testing-library/react'
import Page from './page'
import { describe, it, expect } from 'vitest'

describe('Schedule Report Exporter Page', () => {
  it('renders authentication step by default', () => {
    render(<Page />)
    expect(screen.getByText(/Authorization Token Required/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Access Token \(Authorization\)/i)).toBeInTheDocument()
  })

  it('contains back to dashboard link', () => {
    render(<Page />)
    const link = screen.getByRole('link', { name: /Back to Dashboard/i })
    expect(link).toHaveAttribute('href', '/')
  })
})