import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
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
    await user.selectOptions(typeSelect, 'text')
    await user.click(screen.getByRole('button', { name: /add field/i }))

    const cardsBeforeMove = screen.getAllByRole('article')
    expect(cardsBeforeMove[0]).toHaveTextContent('Email field')
    expect(cardsBeforeMove[1]).toHaveTextContent('Text field')
    await user.click(screen.getAllByRole('button', { name: 'Move field up' })[1])
    expect(screen.getAllByRole('article')[0]).toHaveTextContent('Text field')

    await user.click(within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'Edit' }))
    const labelInput = screen.getByLabelText('Label')
    await user.clear(labelInput)
    await user.type(labelInput, 'Work email')
    expect(screen.getAllByText('Work email')).toHaveLength(2)

    await user.click(within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'Duplicate' }))
    expect(screen.getAllByText('Work email')).toHaveLength(4)
    await user.click(within(screen.getAllByRole('article')[0]).getByRole('button', { name: 'Delete' }))
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

  it('moves select and radio options up and down', async () => {
    const user = userEvent.setup()
    render(<App />)
    const typeSelect = screen.getByLabelText('Field type')

    await user.selectOptions(typeSelect, 'select')
    await user.click(screen.getByRole('button', { name: /add field/i }))
    let optionInputs = screen.getAllByRole('textbox', { name: /^Option [12]$/ })
    await user.clear(optionInputs[0])
    await user.type(optionInputs[0], 'Support')
    await user.click(screen.getByRole('button', { name: 'Move option 1 down' }))
    optionInputs = screen.getAllByRole('textbox', { name: /^Option [12]$/ })
    expect(optionInputs[0]).toHaveValue('Option 2')
    expect(optionInputs[1]).toHaveValue('Support')

    await user.selectOptions(typeSelect, 'radio')
    await user.click(screen.getByRole('button', { name: /add field/i }))
    await user.click(screen.getByRole('button', { name: 'Move option 2 up' }))
    optionInputs = screen.getAllByRole('textbox', { name: /^Option [12]$/ })
    expect(optionInputs[0]).toHaveValue('Option 2')
    expect(optionInputs[1]).toHaveValue('Option 1')
  })
})
