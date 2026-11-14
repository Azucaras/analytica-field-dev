import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SeasonSelect } from './SeasonSelect'

const seasons = ['2023/24', '2024/25', '2025/26']

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockReturnValue({
    x: 0, y: 0, top: 0, left: 0, right: 100, bottom: 40, width: 100, height: 40,
    toJSON: () => ({}),
  })
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

describe('SeasonSelect', () => {
  it('lists the seasons supplied by the fields fixture', async () => {
    const user = userEvent.setup()
    render(<SeasonSelect seasons={seasons} onChange={vi.fn()} />)

    await user.click(screen.getByRole('combobox', { name: 'Season' }))
    const options = Array.from(document.querySelectorAll('[role="option"]'))
    expect(options.map((option) => option.textContent)).toEqual(seasons)
  })

  it('defaults to the 2025/26 season', () => {
    render(<SeasonSelect seasons={seasons} onChange={vi.fn()} />)

    expect(screen.getByRole('combobox', { name: 'Season' }).textContent).toContain('2025/26')
  })

  it('calls onChange with the selected season', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SeasonSelect seasons={seasons} onChange={onChange} />)

    await user.click(screen.getByRole('combobox', { name: 'Season' }))
    const option = Array.from(document.querySelectorAll('[role="option"]')).find(
      (candidate) => candidate.textContent === '2024/25',
    )
    expect(option).not.toBeNull()
    fireEvent.pointerDown(option as HTMLElement, { pointerType: 'mouse' })
    fireEvent.click(option as HTMLElement)

    expect(onChange).toHaveBeenCalledWith('2024/25')
  })
})
