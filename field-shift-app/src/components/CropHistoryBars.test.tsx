/// <reference types="node" />
import { afterEach, describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { cleanup, render } from '@testing-library/react'
import { CropHistoryBars } from './CropHistoryBars'

const stylesheet = readFileSync(resolve(process.cwd(), 'src/index.css'), 'utf8')

function declarationsFor(selector: string): string {
  const rule = stylesheet.match(new RegExp(`${selector}\\s*\\{([^}]*)\\}`))
  expect(rule).toBeTruthy()
  return rule?.[1] ?? ''
}

afterEach(() => {
  cleanup()
})

function renderBars(props: Parameters<typeof CropHistoryBars>[0]) {
  const { container } = render(<CropHistoryBars {...props} />)
  const group = container.querySelector('[role="group"]') as HTMLElement
  const bars = [...container.querySelectorAll('.crop-bar-fill')] as HTMLElement[]
  return { container, group, bars }
}

describe('CropHistoryBars', () => {
  it('renders one equal length bar per crop in array order with the row basis and date', () => {
    const { group, bars } = renderBars({ crops: ['Soybean', 'Corn'], basis: 'entered', asOf: '2025-06-30' })

    expect(bars).toHaveLength(2)
    expect(new Set(bars.map((bar) => bar.style.width)).size).toBe(1)
    expect(group.textContent).toContain('Soybean')
    expect(group.textContent).toContain('Corn')
    expect(group.textContent).toContain('entered')
    expect(group.textContent).toContain('2025-06-30')
  })

  it('gives every track the same grid column so both bars render equal', () => {
    // jsdom has no layout, so it cannot measure a rendered track width. This test pins the
    // CSS mechanism that makes the two tracks equal: a fixed label column, never an `auto`
    // column sized by the crop name. The 1 px equality itself is measured in the browser.
    const bar = declarationsFor('.crop-bar')
    expect(bar).toContain('grid-template-columns')
    expect(bar).not.toMatch(/grid-template-columns:[^;]*\bauto\b/)
    expect(bar).toMatch(/grid-template-columns:\s*minmax\(0,\s*1fr\)\s+\d+px(?:;|\s|$)/)

    const label = declarationsFor('.crop-bar-label')
    expect(label).toMatch(/white-space:\s*nowrap/)
    expect(label).toMatch(/overflow:\s*hidden/)
  })

  it('keeps the array order instead of sorting the crops', () => {
    const { container } = renderBars({ crops: ['Cotton', 'Soybean'], basis: 'entered', asOf: '2025-06-30' })
    const labels = [...container.querySelectorAll('.crop-bar-label')].map((label) => label.textContent)

    expect(labels).toEqual(['Cotton', 'Soybean'])
  })

  it('names the group with the row and the sequence (accessible names)', () => {
    const { group } = renderBars({ crops: ['Soybean', 'Corn'], basis: 'entered', asOf: '2025-06-30' })

    expect(group.getAttribute('aria-label')).toBe('Crop history, Soybean then Corn, entered')
  })

  it('prints no numeric bar label and lets the date be the only numeric text', () => {
    const { container, group } = renderBars({ crops: ['Soybean', 'Corn'], basis: 'entered', asOf: '2025-06-30' })
    const numericText = group.textContent?.match(/\d+/g) ?? []

    expect(numericText).toEqual(['2025', '06', '30'])
    for (const label of container.querySelectorAll('.crop-bar-label')) {
      expect(label.textContent).not.toMatch(/\d/)
    }
  })

  it('renders the bars with no basis and no date when the scenario has no Crop history row', () => {
    for (const crops of [['Soybean', 'Corn'], ['Soybean', 'Cotton']]) {
      const { group, bars } = renderBars({ crops })

      expect(bars).toHaveLength(2)
      expect(group.textContent).not.toMatch(/\d/)
      expect(group.textContent).not.toContain('entered')
      expect(group.getAttribute('aria-label')).toBe(`Crop history, ${crops[0]} then ${crops[1]}`)
      cleanup()
    }
  })
})
