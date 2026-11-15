import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FieldsPanel } from './FieldsPanel'
import type { FieldSummary } from '@/lib/map-store'
import { UNMAPPED_CLASS_COLOUR } from '@/lib/polygon-style'
import { FIELDS_CHIP_ROW_ID } from './FieldsPanel'

const field: FieldSummary = {
  id: 'mt-santa-carmem-01',
  name: 'Santa Carmem North',
  location: 'Santa Carmem, Mato Grosso',
  coverage: 86,
  center: [-55.27, -11.91],
  boundary: { type: 'Polygon', coordinates: [[[-55.285, -11.9], [-55.26, -11.9], [-55.26, -11.92], [-55.285, -11.92], [-55.285, -11.9]]] },
}

const baseProps = {
  fields: [field],
  selectedFieldId: null as string | null,
  isLoading: false,
  error: null,
  canRetry: false,
  onSelectField: vi.fn(),
  onRetry: vi.fn(),
}

afterEach(() => {
  cleanup()
})

describe('the fields header chip for a polygon (R-28, AC-24, AM-04)', () => {
  it('renders the class name, its colour dot and no percentage', () => {
    render(<FieldsPanel {...baseProps} selectedPolygon={{ fieldId: 'trazo:12345', name: 'Soybean', hex: '#f5b3c8' }} />)
    const chip = screen.getByRole('button', { name: 'Soybean' })
    expect(chip.getAttribute('aria-pressed')).toBe('true')
    expect(chip.textContent).toBe('Soybean')
    expect(chip.textContent).not.toContain('%')
    const dot = chip.querySelector('[data-class-hex]')
    expect(dot?.getAttribute('data-class-hex')).toBe('#f5b3c8')
    expect((dot as HTMLElement).style.background).toContain('rgb(245, 179, 200)')
  })

  it('keeps the chip mounted in both panel states', async () => {
    const user = userEvent.setup()
    render(<FieldsPanel {...baseProps} selectedPolygon={{ fieldId: 'csb:381825001868504', name: 'Soybeans', hex: '#267000' }} />)
    expect(screen.getByRole('button', { name: 'Soybeans' })).toBeTruthy()
    await user.click(screen.getByRole('button', { name: 'Fields' }))
    const row = document.getElementById(FIELDS_CHIP_ROW_ID) as HTMLElement
    expect(within(row).getAllByRole('button')).toHaveLength(1)
    // The chip is beside the trigger and survives the open state (R-28).
    expect(screen.getByRole('button', { name: 'Soybeans' })).toBeTruthy()
  })

  it('prints class not mapped with the unmapped colour when the class is not in the table', () => {
    render(<FieldsPanel {...baseProps} selectedPolygon={{ fieldId: 'trazo:999', name: null, hex: UNMAPPED_CLASS_COLOUR }} />)
    const chip = screen.getByRole('button', { name: 'class not mapped' })
    expect(chip.textContent).toBe('class not mapped')
    expect(chip.querySelector('[data-class-hex]')?.getAttribute('data-class-hex')).toBe(UNMAPPED_CLASS_COLOUR)
  })

  it('shows the fixture chip instead while no polygon is selected, and never both', () => {
    const { rerender } = render(<FieldsPanel {...baseProps} selectedFieldId="mt-santa-carmem-01" />)
    expect(screen.getByRole('button', { name: 'Santa Carmem North' })).toBeTruthy()
    rerender(
      <FieldsPanel
        {...baseProps}
        selectedFieldId={null}
        selectedPolygon={{ fieldId: 'trazo:12345', name: 'Soybean', hex: '#f5b3c8' }}
      />,
    )
    expect(screen.queryByRole('button', { name: 'Santa Carmem North' })).toBeNull()
    expect(screen.getByRole('button', { name: 'Soybean' })).toBeTruthy()
  })

  it('re-selects the polygon through the same onSelectField the command uses', async () => {
    const user = userEvent.setup()
    const onSelectField = vi.fn()
    render(
      <FieldsPanel
        {...baseProps}
        onSelectField={onSelectField}
        selectedPolygon={{ fieldId: 'trazo:12345', name: 'Soybean', hex: '#f5b3c8' }}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Soybean' }))
    expect(onSelectField).toHaveBeenCalledWith('trazo:12345')
  })
})
