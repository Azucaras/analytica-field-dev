import { Component, useId, type CSSProperties, type ErrorInfo, type ReactNode } from 'react'
import { ChevronDown, X } from 'lucide-react'
import { useMapStore } from '@/lib/map-store'
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
    // A named region, like the team's panel host; a body with its own region of the same name gets a group.
    <div aria-labelledby={headingId} className="fs-panel" data-group={panel.group} data-panel={panel.id} data-state={state} role={panel.landmark === false ? 'group' : 'region'}>
      <div className="fs-panel-header">
        <h2 className="fs-panel-heading" id={headingId}>
          <button
            aria-controls={open ? bodyId : undefined}
            aria-expanded={open}
            aria-label={t(open ? 'shell.collapse_panel' : 'shell.expand_panel', { name: title })}
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
          onClick={() => {
            useShellStore.getState().setState(panel.id, 'closed')
            // Focus goes back to the panel's rail button, as the team's panel host does.
            document.querySelector<HTMLButtonElement>(`.fs-rail [data-tool="${panel.id}"]`)?.focus()
          }}
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

/**
 * Where an exclusive group has no panel open, its place holds one button per member, so the group
 * stays one press away without any of its panels opening by itself (the team's B4).
 */
function GroupPicker({ members, blocked }: { members: readonly PanelDefinition[]; blocked: ReadonlySet<string> }) {
  return (
    <div className="fs-group-picker" data-group-picker={members[0]?.group}>
      <p className="fs-muted">{t('shell.group_hint')}</p>
      <div className="fs-group-buttons">
        {members.map((panel) => {
          const Icon = panel.icon
          const title = t(panel.titleKey)
          return (
            <button
              aria-label={t('shell.open_panel', { name: blocked.has(panel.id) ? t('panel.needs_selection', { panel: title }) : title })}
              className="fs-button fs-group-button"
              disabled={blocked.has(panel.id)}
              key={panel.id}
              onClick={() => togglePanel(panel)}
              type="button"
            >
              <Icon aria-hidden="true" />
              <span>{title}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function Slot({ slot, panels, states, blocked }: {
  slot: PanelSlot
  panels: readonly PanelDefinition[]
  states: Record<string, PanelState>
  blocked: ReadonlySet<string>
}) {
  const inSlot = panels.filter((panel) => panel.slot === slot)
  const shown = inSlot.filter((panel) => panelStateOf(states, panel) !== 'closed')
  // Groups of this slot with no member on screen get a picker in place of the panel.
  const idleGroups = [...new Set(inSlot.map((panel) => panel.group).filter((group): group is string => Boolean(group)))]
    .filter((group) => !shown.some((panel) => panel.group === group))
  if (shown.length === 0 && idleGroups.length === 0) return null
  const Tag = slot === 'bottom' ? 'section' : 'aside'
  return (
    <Tag aria-label={t(`shell.slot_${slot}`)} className={`fs-slot fs-slot-${slot}`} data-slot-name={slot}>
      {shown.map((panel) => <PanelFrame key={panel.id} panel={panel} state={panelStateOf(states, panel)} />)}
      {idleGroups.map((group) => (
        <GroupPicker blocked={blocked} key={group} members={inSlot.filter((panel) => panel.group === group)} />
      ))}
    </Tag>
  )
}

function Toolbar({ panels, states, blocked }: { panels: readonly PanelDefinition[]; states: Record<string, PanelState>; blocked: ReadonlySet<string> }) {
  return (
    <nav aria-label={t('shell.toolbar')} className="fs-rail">
      {panels.map((panel) => {
        const Icon = panel.icon
        const title = t(panel.titleKey)
        return (
          <button
            aria-disabled={blocked.has(panel.id) ? true : undefined}
            aria-expanded={panelStateOf(states, panel) !== 'closed'}
            aria-label={blocked.has(panel.id) ? t('panel.needs_selection', { panel: title }) : undefined}
            disabled={blocked.has(panel.id)}
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
function PhoneSheet({ panels, blocked }: { panels: readonly PanelDefinition[]; blocked: ReadonlySet<string> }) {
  const chosen = useShellStore((state) => state.mobileActive)
  const active = chosen !== null && blocked.has(chosen) ? null : chosen
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
              aria-label={blocked.has(candidate.id) ? t('panel.needs_selection', { panel: t(candidate.titleKey) }) : undefined}
              aria-pressed={candidate.id === active}
              disabled={blocked.has(candidate.id)}
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
  // A panel that reads the selection is closed and its button disabled until there is a selection.
  const selectedPolygonId = useMapStore((state) => state.selectedPolygonId)
  const hasSelection = data.selectedFieldId !== null || selectedPolygonId !== null
  const blocked = new Set(available.filter((panel) => panel.needsSelection && !hasSelection).map((panel) => panel.id))
  const shownStates: Record<string, PanelState> = { ...states }
  for (const id of blocked) shownStates[id] = 'closed'
  const slotOpen = (slot: PanelSlot) => available.some((panel) => panel.slot === slot && panelStateOf(shownStates, panel) !== 'closed')
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
      {!phone && <Toolbar blocked={blocked} panels={available} states={shownStates} />}
      {!phone && <Slot blocked={blocked} panels={available} slot="left" states={shownStates} />}
      <main className="fs-map">
        {map}
        {notice ? <div className="fs-map-notice">{notice}</div> : null}
      </main>
      {!phone && <Slot blocked={blocked} panels={available} slot="right" states={shownStates} />}
      {!phone && <Slot blocked={blocked} panels={available} slot="bottom" states={shownStates} />}
      {phone && <PhoneSheet blocked={blocked} panels={available} />}
    </div>
  )
}
