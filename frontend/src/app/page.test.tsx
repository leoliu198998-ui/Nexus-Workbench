import { render, screen } from '@testing-library/react'
import Page from './page'
import { describe, it, expect } from 'vitest'

describe('Page', () => {
  it('renders a heading', () => {
    render(<Page />)
    const main = screen.getByRole('main')
    expect(main).toBeInTheDocument()
  })
})
