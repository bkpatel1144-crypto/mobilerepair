import { Asterisk, Eye, EyeOff, Lock, Smartphone } from 'lucide-react'
import { cn } from '@/lib/utils'
import { FieldPreviewInput } from './field-preview-input'
import type { FormFieldConfig } from '@/types/firestore'

function IconToggle({
  active,
  activeClassName,
  icon: Icon,
  onClick,
  disabled,
  label,
}: {
  active: boolean
  activeClassName: string
  icon: typeof Eye
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'flex size-6 items-center justify-center rounded-full border transition-colors disabled:pointer-events-none disabled:opacity-50',
        active ? activeClassName : 'border-transparent text-muted-foreground/50 hover:bg-muted'
      )}
    >
      <Icon className="size-3.5" />
    </button>
  )
}

interface FieldControlRowProps {
  label: string
  structurallyLocked?: boolean
  config?: FormFieldConfig
  onChange?: (patch: Partial<FormFieldConfig>) => void
  disabled?: boolean
  helperText?: string
  previewType: string
  placeholder?: string
  quickAmounts?: number[]
  quickDates?: string[]
  options?: string[]
}

/** One field's full row in the builder: label (+ required "*" / "(Optional)" / "— hidden"),
 * the four icon toggles (visible / required / locked / device-only) for a configurable field —
 * or a static amber "Locked" badge in their place for a `structurallyLocked` one — and the
 * live-preview input underneath. Matches `preview (9)`/`(10)` field rows exactly. */
export function FieldControlRow({
  label,
  structurallyLocked,
  config,
  onChange,
  disabled,
  helperText,
  previewType,
  placeholder,
  quickAmounts,
  quickDates,
  options,
}: FieldControlRowProps) {
  const visible = structurallyLocked || config?.visible !== false
  const required = structurallyLocked || config?.required === true

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium">
          {visible ? (
            <>
              {label}
              {required ? (
                <span className="ml-0.5 text-red-600">*</span>
              ) : (
                <span className="ml-1 font-normal text-muted-foreground">(Optional)</span>
              )}
            </>
          ) : (
            <span className="text-muted-foreground italic">{label} — hidden</span>
          )}
        </span>

        {structurallyLocked ? (
          <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-400">
            <Lock className="size-2.5" />
            Locked
          </span>
        ) : (
          config &&
          onChange && (
            <div className="flex items-center gap-0.5">
              <IconToggle
                active={config.visible}
                activeClassName="border-transparent bg-teal-100 text-teal-700 dark:bg-teal-500/15 dark:text-teal-400"
                icon={config.visible ? Eye : EyeOff}
                label={config.visible ? 'Visible — click to hide' : 'Hidden — click to show'}
                onClick={() => onChange({ visible: !config.visible })}
                disabled={disabled}
              />
              <IconToggle
                active={config.required}
                activeClassName="border-transparent bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"
                icon={Asterisk}
                label={config.required ? 'Required — click to make optional' : 'Optional — click to require'}
                onClick={() => onChange({ required: !config.required })}
                disabled={disabled}
              />
              <IconToggle
                active={config.locked}
                activeClassName="border-transparent bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300"
                icon={Lock}
                label={config.locked ? 'Locked after first save — click to unlock' : 'Click to lock after first save'}
                onClick={() => onChange({ locked: !config.locked })}
                disabled={disabled}
              />
              <IconToggle
                active={config.deviceOnly}
                activeClassName="border-transparent bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-400"
                icon={Smartphone}
                label={config.deviceOnly ? 'Mobile-app only — click to show everywhere' : 'Click to restrict to the mobile app'}
                onClick={() => onChange({ deviceOnly: !config.deviceOnly })}
                disabled={disabled}
              />
            </div>
          )
        )}
      </div>

      {helperText && visible && <p className="text-xs text-muted-foreground">{helperText}</p>}

      <div className={cn(!visible && 'pointer-events-none opacity-40')}>
        <FieldPreviewInput
          type={previewType}
          placeholder={placeholder}
          quickAmounts={quickAmounts}
          quickDates={quickDates}
          options={options}
          disabled={!visible}
        />
      </div>
    </div>
  )
}
