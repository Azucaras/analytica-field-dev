import { Component, useId, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { PHONE_QUERY, useMediaMatch } from '@/lib/viewport'
import { t } from '@/strings'
import { useAppData } from './app-data'
import type { PanelDefinition, PanelSlot, PanelState } from './registry'
import { panelStateOf, toggleCollapsed, togglePanel, useShellStore } from './shell-store'

type ShellProps = {
  panels: readonly PanelDefinition[]
  /** The map. It fills the middle cell and is never covered by a panel. */
  map: ReactNode
  /** Brand and status chips at the start of the top bar. */
  start: ReactNode
  /** Actions at the end of the top bar (analysis, language). */
  end: ReactNode
  /** A short message pinned to the top of the map, such as a backend error. */
  notice?: ReactNode
}

/** One failing panel shows its own message; the map and the other panels keep working. */
class PanelBoundary extends Component<{ children: ReactNode }, { failed: string | null }> {
  state = { failed: null as string | null }

  static getDerivedStateFromError(error: unknown) {
    return { failed: error instanceof Error ? error.message : String(error) }
  }

  componentDidCatch(error: unknown, info: ErrorInfo) {
    console.error('Panel failed', error, info.componentStack)
  }

  render() {
    if (this.state.failed === null) return this.props.children
    return (
      <div className="fs-panel-failed" role="alert">
        <p>{t('shell.panel_failed')}</p>
        <button className="fs-link" onClick={() => this.setState({ failed: null })} type="button">{t('common.retry')}</button>
      </div>
    )
  }
}

function PanelFrame({ panel, state }: { panel: PanelDefinition; state: PanelState }) {
  const headingId = useId()
  const bodyId = `fs-panel-body-${panel.id}`
  const title = t(panel.titleKey)
  const Icon = panel.icon
  const Body = panel.Component
  const open = state === 'open'

  return (
    // A group, not a region: several features already render their own named region inside.
    <div aria-labelledby={headingId} className="fs-panel" data-panel={panel.id} data-state={state} role="group">
      <div className="fs-panel-header">
        <h2 className="fs-panel-heading" id={headingId}>
          <button
            aria-controls={open ? bodyId : undefined}
            aria-expanded={open}
            className="fs-panel-toggle"
            onClick={() => toggleCollapsed(panel)}
            type="button"
          >
            <Icon aria-hidden="true" className="fs-panel-icon" />
            <span>{title}</span>
            <ChevronDown aria-hidden="true" className="fs-panel-chevron" />
          </button>
        </h2>
        <button
          aria-label={t('shell.close_panel', { name: title })}
          className="fs-icon-button"
          onClick={() => useShellStore.getState().setState(panel.id, 'closed')}
          type="button"
        >
          <X aria-hidden="true" />
        </button>
      </div>
      {open && (
        <div className="fs-panel-body" id={bodyId}>
          <PanelBoundary><Body /></PanelBoundary>
        </div>
      )}
    </div>
  )
}

function Slot({ slot, panels, states }: { slot: PanelSlot; panels: readonly PanelDefinition[]; states: Record<string, PanelState> }) {
  const shown = panels.filter((panel) => panel.slot === slot && panelStateOf(states, panel) !== 'closed')
  if (shown.length === 0) return null
  const Tag = slot === 'bottom' ? 'section' : 'aside'
  return (
    <Tag aria-label={t(`shell.slot_${slot}`)} className={`fs-slot fs-slot-${slot}`} data-slot-name={slot}>
      {shown.map((panel) => <PanelFrame key={panel.id} panel={panel} state={panelStateOf(states, panel)} />)}
    </Tag>
  )
}

function Toolbar({ panels, states }: { panels: readonly PanelDefinition[]; states: Record<string, PanelState> }) {
  return (
    <nav aria-label={t('shell.toolbar')} className="fs-rail">
      {panels.map((panel) => {
        const Icon = panel.icon
        const title = t(panel.titleKey)
        return (
          <button
            aria-pressed={panelStateOf(states, panel) !== 'closed'}
            className="fs-tool"
            data-tool={panel.id}
            key={panel.id}
            onClick={() => togglePanel(panel)}
            title={title}
            type="button"
          >
            <Icon aria-hidden="true" />
            <span className="fs-tool-label">{title}</span>
          </button>
        )
      })}
    </nav>
  )
}

/** On a phone the map takes the screen, one panel opens in a sheet under it, and the tabs pick which. */
function PhoneSheet({ panels }: { panels: readonly PanelDefinition[] }) {
  const active = useShellStore((state) => state.mobileActive)
  const setActive = useShellStore((state) => state.setMobileActive)
  const panel = panels.find((candidate) => candidate.id === active) ?? null
  const Body = panel?.Component
  return (
    <>
      {panel && Body && (
        <section aria-label={t(panel.titleKey)} className="fs-sheet" data-panel={panel.id}>
          <div className="fs-panel-header">
            <h2 className="fs-panel-heading"><span className="fs-panel-toggle">{t(panel.titleKey)}</span></h2>
            <button
              aria-label={t('shell.close_panel', { name: t(panel.titleKey) })}
              className="fs-icon-button"
              onClick={() => setActive(null)}
              type="button"
            >
              <X aria-hidden="true" />
            </button>
          </div>
          <div className="fs-panel-body"><PanelBoundary><Body /></PanelBoundary></div>
        </section>
      )}
      <nav aria-label={t('shell.toolbar')} className="fs-tabbar">
        {panels.map((candidate) => {
          const Icon = candidate.icon
          return (
            <button
              aria-pressed={candidate.id === active}
              className="fs-tab"
              data-tool={candidate.id}
              key={candidate.id}
              onClick={() => setActive(candidate.id === active ? null : candidate.id)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{t(candidate.titleKey)}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}

export function Shell({ panels, map, start, end, notice }: ShellProps) {
  const data = useAppData()
  const states = useShellStore((state) => state.states)
  const phone = useMediaMatch(PHONE_QUERY)
  const available = [...panels]
    .filter((panel) => panel.available?.(data) ?? true)
    .sort((a, b) => a.order - b.order)
  const slotOpen = (slot: PanelSlot) => available.some((panel) => panel.slot === slot && panelStateOf(states, panel) !== 'closed')
  const style = {
    '--fs-left': slotOpen('left') ? 'var(--fs-left-width)' : '0px',
    '--fs-right': slotOpen('right') ? 'var(--fs-right-width)' : '0px',
  } as CSSProperties

  return (
    <div className="fs-shell" data-layout={phone ? 'phone' : 'wide'} style={style}>
      <header className="fs-topbar">
        <div className="fs-topbar-start">{start}</div>
        <div className="fs-topbar-end">{end}</div>
      </header>
      {!phone && <Toolbar panels={available} states={states} />}
      {!phone && <Slot panels={available} slot="left" states={states} />}
      <main className="fs-map">
        {map}
        {notice ? <div className="fs-map-notice">{notice}</div> : null}
      </main>
      {!phone && <Slot panels={available} slot="right" states={states} />}
      {!phone && <Slot panels={available} slot="bottom" states={states} />}
      {phone && <PhoneSheet panels={available} />}
    </div>
  )
}
