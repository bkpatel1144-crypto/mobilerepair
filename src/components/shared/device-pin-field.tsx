import { Input } from '@/components/ui/input'
import {
  PatternLockPicker,
  PatternLockPreview,
  PatternReplayPopover,
} from '@/components/shared/pattern-lock'
import { isPatternValue } from '@/components/shared/pattern-value'
import { useTranslation } from 'react-i18next'

/**
 * The device unlock field: type a numeric PIN, or tap Draw and draw a pattern.
 *
 * Shared because the two forms that collect it had drifted apart, and one of them was broken.
 * Buy Mobile's field offered *only* the pattern grid — its label said "Device PIN / Pattern" but
 * there was nowhere to type 1234, so a shopkeeper buying a phone with a PIN had no way to record
 * it. Create Job Card had the full control. One component now serves both, so the two screens
 * cannot disagree again, and a fix lands in both at once.
 *
 * Whether the stored value is a pattern is derived from the value itself (`isPatternValue`) rather
 * than tracked in a sibling boolean — see that function for why a flag was the wrong shape.
 */
export function DevicePinPatternField({
  value,
  onChange,
  disabled,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  placeholder?: string
}) {
  const { t } = useTranslation()
  const drawn = isPatternValue(value)

  return (
    <div className="flex gap-2">
      {drawn ? (
        // A drawn pattern is not editable as text, so the input is replaced by a summary that
        // replays it on click. Same height as the Input it stands in for, so the row does not
        // jump as the value changes shape.
        <div className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-lg border bg-muted/30 px-2.5 text-sm">
          <PatternReplayPopover value={value}>
            <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline">
              <PatternLockPreview value={value} />
              {t('pages.service.createJobCard.patternDrawn')}
            </span>
          </PatternReplayPopover>
          <button
            type="button"
            className="ml-auto font-medium text-red-600 hover:underline dark:text-red-400"
            onClick={() => onChange('')}
            disabled={disabled}
          >
            {t('shared.clear')}
          </button>
        </div>
      ) : (
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder ?? t('components.shared.devicePinField.eG1234OrTapDraw')}
          disabled={disabled}
          className="min-w-0 flex-1"
        />
      )}
      {/* Passes '' while a PIN is typed, so opening the dialog does not try to parse "1234" as
       * dot indices and show a half-drawn pattern. */}
      <PatternLockPicker value={drawn ? value : ''} onChange={onChange} disabled={disabled} />
    </div>
  )
}

/** Read-only counterpart for detail screens: the dot graphic plus a click-to-replay for a drawn
 *  pattern, the digits themselves for a typed PIN. The Job Card detail page used to print the raw
 *  `"1-2-5-8"` string, which is the encoding, not the information. */
export function DevicePinPatternValue({ value }: { value: string }) {
  const { t } = useTranslation()
  if (!isPatternValue(value)) return <span className="tabular-nums">{value}</span>

  return (
    <PatternReplayPopover value={value}>
      <span className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:underline">
        <PatternLockPreview value={value} />
        {t('pages.service.createJobCard.patternDrawn')}
      </span>
    </PatternReplayPopover>
  )
}
