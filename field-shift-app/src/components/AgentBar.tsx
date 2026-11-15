import { useState, type FormEvent, type RefObject } from 'react'
import { runCommand } from '@/lib/commands'
import { t } from '@/strings'

export const COMMAND_FORM_ID = 'agent-command-form'

export type CommandDraft = {
  commandName: string
  argumentsText: string
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
