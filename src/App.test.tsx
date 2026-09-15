import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('Formleaf builder', () => {
  beforeEach(() => {
    localStorage.clear()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('adds, edits, duplicates, reorders, and deletes fields', async () => {
    const user = userEvent.setup()
    render(<App />)
    const typeSelect = screen.getByLabelText('Field type')
    await user.selectOptions(typeSelect, 'email')
    await user.click(screen.getByRole('button', { name: /add field/i }))
    expect(screen.getAllByText('Email field')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /edit email field/i }))
    const labelInput = screen.getByLabelText('Label')
    await user.clear(labelInput)
    await user.type(labelInput, 'Work email')
    expect(screen.getAllByText('Work email')).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: /duplicate/i }))
    expect(screen.getAllByText('Work email')).toHaveLength(4)
    await user.click(screen.getAllByRole('button', { name: /delete/i })[0])
    expect(screen.getAllByText('Work email')).toHaveLength(2)
  })

  it('shows preview-only submit feedback and can load the example', async () => {
    const user = userEvent.setup()
    render(<App />)
    await user.click(screen.getByRole('button', { name: /load example/i }))
    expect(screen.getByRole('heading', { name: 'Contact Form' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Send message' }))
    expect(screen.getByRole('status')).toHaveTextContent('Preview only')
  })
})
