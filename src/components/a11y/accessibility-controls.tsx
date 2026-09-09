import { AArrowUp, AArrowDown, RotateCcw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { useAccessibility } from '@/hooks/use-accessibility'
import { MAX_FONT_SCALE, MIN_FONT_SCALE } from '@/lib/accessibility'

/**
 * The same reading preferences as the public site's floating toolbar, laid out for a settings
 * surface: real labels, switches, and a sentence explaining what each one does.
 *
 * Two presentations of one `useAccessibility()` hook rather than two implementations — the
 * failure mode otherwise is the toolbar reading 120% while this reads 100%, which is precisely
 * the kind of thing nobody notices until a user reports it.
 *
 * Lives in the My Profile drawer, deliberately, and not under Settings. Settings menu items are
 * gated by role: `menusForSections(['service'])` is the whole of a Technician's access, so a
 * Settings > Preferences page would be invisible to exactly the staff most likely to need larger
 * text. An accessibility control that a permission can hide is not an accessibility control. The
 * profile drawer is reachable by every signed-in account regardless of role.
 */
export function AccessibilityControls() {
  const { t } = useTranslation()
  const { prefs, update, increaseFont, decreaseFont, reset, isModified } = useAccessibility()
  const percent = Math.round(prefs.fontScale * 100)

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">{t('a11y.settingsDescription')}</p>

      <div>
        <Label className="text-sm font-medium">{t('a11y.fontSize')}</Label>
        <div className="mt-2 flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={decreaseFont}
            disabled={prefs.fontScale <= MIN_FONT_SCALE}
            aria-label={t('a11y.decrease')}
          >
            <AArrowDown className="size-4" />
          </Button>
          {/* `tabular-nums` so the number does not shift the buttons as it changes width. */}
          <span
            aria-live="polite"
            className="min-w-20 text-center text-sm font-medium tabular-nums"
          >
            {t('a11y.currentSize', { percent })}
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={increaseFont}
            disabled={prefs.fontScale >= MAX_FONT_SCALE}
            aria-label={t('a11y.increase')}
          >
            <AArrowUp className="size-4" />
          </Button>
        </div>
      </div>

      <ToggleRow
        id="a11y-contrast"
        label={t('a11y.highContrast')}
        hint={t('a11y.highContrastHint')}
        checked={prefs.highContrast}
        onChange={(highContrast) => update({ highContrast })}
      />

      <ToggleRow
        id="a11y-dyslexia"
        label={t('a11y.dyslexiaFont')}
        hint={t('a11y.dyslexiaFontHint')}
        checked={prefs.dyslexiaFont}
        onChange={(dyslexiaFont) => update({ dyslexiaFont })}
      />

      <Button
        type="button"
        variant="outline"
        onClick={reset}
        disabled={!isModified}
        className="gap-2"
      >
        <RotateCcw className="size-4" />
        {t('a11y.resetAll')}
      </Button>
    </div>
  )
}

function ToggleRow({
  id,
  label,
  hint,
  checked,
  onChange,
}: {
  id: string
  label: string
  hint: string
  checked: boolean
  onChange: (value: boolean) => void
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <Label htmlFor={id} className="text-sm font-medium">
          {label}
        </Label>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      </div>
      <Switch id={id} checked={checked} onCheckedChange={onChange} className="mt-0.5 shrink-0" />
    </div>
  )
}
