import { useCallback, useEffect, useRef, useState, type FormEvent, type RefObject } from 'react'
import { runCommand } from '@/lib/commands'
import { t } from '@/strings'

export const COMMAND_FORM_ID = 'agent-command-form'

export type CommandDraft = {
  commandName: string
  argumentsText: string
}

const EMPTY_DRAFT: CommandDraft = {
  commandName: '',
  argumentsText: '{}',
}

export type CommandToggleState = {
  isOpen: boolean
  draft: CommandDraft
  buttonRef: RefObject<HTMLButtonElement | null>
  commandNameInputRef: RefObject<HTMLInputElement | null>
  toggle: () => void
  close: () => void
  updateDraft: (draft: CommandDraft) => void
}

/**
 * Owns the command toggle state so the draft survives the form unmounting (R-04),
 * and owns the focus policy: into the form on open, back to the button on close.
 * A programmatic close (the 360 exclusivity rule of R-40) does not pull focus
 * back to this button, because the press that closed it belongs to another control.
 */
export function useCommandToggle(): CommandToggleState {
  const [isOpen, setIsOpen] = useState(false)
  const [draft, setDraft] = useState<CommandDraft>(EMPTY_DRAFT)
  const buttonRef = useRef<HTMLButtonElement | null>(null)
  const commandNameInputRef = useRef<HTMLInputElement | null>(null)
  const wasOpenRef = useRef(false)
  const restoreFocusRef = useRef(true)

  useEffect(() => {
    if (isOpen) {
      commandNameInputRef.current?.focus()
    } else if (wasOpenRef.current && restoreFocusRef.current) {
      buttonRef.current?.focus()
    }
    restoreFocusRef.current = true
    wasOpenRef.current = isOpen
  }, [isOpen])

  const toggle = useCallback(() => {
    restoreFocusRef.current = true
    setIsOpen((open) => !open)
  }, [])
  const close = useCallback(() => {
    restoreFocusRef.current = false
    setIsOpen(false)
  }, [])

  return {
    isOpen,
    draft,
    buttonRef,
    commandNameInputRef,
    toggle,
    close,
    updateDraft: setDraft,
  }
}

type CommandToggleProps = {
  isOpen: boolean
  buttonRef: RefObject<HTMLButtonElement | null>
  onToggle: () => void
}

export function CommandToggle({ isOpen, buttonRef, onToggle }: CommandToggleProps) {
  return (
    <button
      ref={buttonRef}
      type="button"
      className="top-chip toggle-control command-toggle"
      aria-expanded={isOpen}
      aria-controls={isOpen ? COMMAND_FORM_ID : undefined}
      onClick={onToggle}
    >
      {t('agent.command')}
    </button>
  )
}

type AgentBarProps = {
  draft: CommandDraft
  commandNameInputRef: RefObject<HTMLInputElement | null>
  onDraftChange: (draft: CommandDraft) => void
}

export function AgentBar({ draft, commandNameInputRef, onDraftChange }: AgentBarProps) {
  const [message, setMessage] = useState<string | null>(null)
  const [succeeded, setSucceeded] = useState(false)

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setMessage(null)
    setSucceeded(false)
    try {
      const arguments_ = JSON.parse(draft.argumentsText) as unknown
      runCommand(draft.commandName.trim(), arguments_)
      setSucceeded(true)
      setMessage(t('agent.command_applied'))
    } catch (reason) {
      const detail = reason instanceof Error ? reason.message : t('agent.command_rejected')
      setMessage(detail)
    }
  }

  return (
    <form id={COMMAND_FORM_ID} className="agent-command" aria-label={t('agent.form_label')} onSubmit={submit}>
      <label>
        <span>{t('agent.command')}</span>
        <input
          ref={commandNameInputRef}
          aria-label={t('agent.command_name')}
          role="textbox"
          value={draft.commandName}
          onChange={(event) => onDraftChange({ ...draft, commandName: event.target.value })}
          placeholder={t('agent.command_placeholder')}
        />
      </label>
      <label>
        <span>{t('agent.json_arguments')}</span>
        <input
          aria-label={t('agent.json_arguments')}
          role="textbox"
          value={draft.argumentsText}
          onChange={(event) => onDraftChange({ ...draft, argumentsText: event.target.value })}
        />
      </label>
      <button type="submit">{t('agent.run_command')}</button>
      {message && <p role={succeeded ? 'status' : 'alert'}>{message}</p>}
    </form>
  )
}
