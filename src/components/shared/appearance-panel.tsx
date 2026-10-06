import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Check, Monitor, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { applyTheme, getPreferredTheme, type Theme } from '@/lib/theme'
import {
  ACCENTS,
  LOOKS,
  CARD_STYLES,
  DEFAULT_APPEARANCE,
  FONTS,
  applyAppearance,
  readAppearance,
  type Accent,
  type Appearance,
  type CardStyle,
  type Font,
  type Look,
} from '@/lib/appearance'

/**
 * The one place a person changes how the app looks.
 *
 * Every control writes through to `<html>` the instant it is pressed, so the panel is its own
 * preview — the page behind it changes while the sheet is open. A panel with a Save button
 * would mean choosing a colour blind, which is the opposite of what it is for.
 */

/** The swatch colour for each accent, matched to the `--primary` it sets in `index.css`. */
const ACCENT_SWATCH: Record<Accent, string> = {
  teal: 'oklch(0.52 0.11 184.704)',
  navy: 'oklch(0.45 0.13 264)',
  forest: 'oklch(0.52 0.12 149)',
  indigo: 'oklch(0.51 0.16 285)',
  orchid: 'oklch(0.55 0.17 310)',
  rosewood: 'oklch(0.52 0.14 15)',
  amber: 'oklch(0.52 0.12 75)',
  slate: 'oklch(0.44 0.03 250)',
}

const ACCENT_LABEL: Record<Accent, string> = {
  teal: 'accentTeal',
  navy: 'accentNavy',
  forest: 'accentForest',
  indigo: 'accentIndigo',
  orchid: 'accentOrchid',
  rosewood: 'accentRosewood',
  amber: 'accentAmber',
  slate: 'accentSlate',
}

const LOOK_LABEL: Record<Look, string> = {
  studio: 'lookStudio',
  classic: 'lookClassic',
}

const CARD_LABEL: Record<CardStyle, string> = {
  white: 'cardWhite',
  tinted: 'cardTinted',
  filled: 'cardFilled',
}

const FONT_LABEL: Record<Font, string> = {
  geist: 'fontGeist',
  system: 'fontSystem',
  serif: 'fontSerif',
  mono: 'fontMono',
}

/**
 * The selection control, used by every choice in this panel.
 *
 * One selection language throughout: the chosen option is a filled pill, in the accent, with
 * the same shape and the same transition wherever it appears. Three different "selected" looks
 * on one panel is how a settings screen stops reading as one thing.
 */
function SegmentedChoice<T extends string>({
  label,
  options,
  value,
  onChange,
  render,
}: {
  label: string
  options: readonly T[]
  value: T
  onChange: (next: T) => void
  render: (option: T) => React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
        {label}
      </p>
      <div role="radiogroup" aria-label={label} className="flex gap-1 rounded-xl bg-muted/60 p-1">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            role="radio"
            aria-checked={value === option}
            onClick={() => onChange(option)}
            className={cn(
              'flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
              'focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none',
              value === option
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:bg-background/70 hover:text-foreground'
            )}
          >
            {render(option)}
          </button>
        ))}
      </div>
    </div>
  )
}

export function AppearancePanel() {
  const { t } = useTranslation()
  const [theme, setTheme] = useState<Theme>(() => getPreferredTheme())
  const [appearance, setAppearance] = useState<Appearance>(() => readAppearance())

  /** Writes to `<html>` and to storage at once — the page behind the panel is the preview. */
  function update(patch: Partial<Appearance>) {
    const next = { ...appearance, ...patch }
    setAppearance(next)
    applyAppearance(next)
  }

  function chooseTheme(next: Theme) {
    setTheme(next)
    applyTheme(next)
  }

  const isDefault =
    theme === 'light' &&
    appearance.look === DEFAULT_APPEARANCE.look &&
    appearance.accent === DEFAULT_APPEARANCE.accent &&
    appearance.cards === DEFAULT_APPEARANCE.cards &&
    appearance.chrome === DEFAULT_APPEARANCE.chrome &&
    appearance.font === DEFAULT_APPEARANCE.font

  return (
    <div className="w-[320px] max-w-[calc(100vw-2rem)] space-y-5 p-4">
      {/* First, because it is the one setting that changes everything else's meaning. */}
      <SegmentedChoice
        label={t('components.appearance.look')}
        options={LOOKS}
        value={appearance.look}
        onChange={(look) => update({ look })}
        render={(option) => t(`components.appearance.${LOOK_LABEL[option]}`)}
      />

      <SegmentedChoice
        label={t('components.appearance.theme')}
        options={['light', 'dark'] as const}
        value={theme}
        onChange={chooseTheme}
        render={(option) => (
          <span className="flex items-center justify-center gap-1.5">
            {option === 'light' ? <Sun className="size-3.5" /> : <Moon className="size-3.5" />}
            {option === 'light' ? t('shell.themeLight') : t('shell.themeDark')}
          </span>
        )}
      />

      <div className="space-y-2">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {t('components.appearance.colour')}
        </p>
        <div
          role="radiogroup"
          aria-label={t('components.appearance.colour')}
          className="flex flex-wrap gap-2"
        >
          {ACCENTS.map((accent) => {
            const selected = appearance.accent === accent
            return (
              <button
                key={accent}
                type="button"
                role="radio"
                aria-checked={selected}
                // The colour alone is never the only signal: the chosen swatch carries a tick
                // and a ring, so it is identifiable without colour vision.
                aria-label={t(`components.appearance.${ACCENT_LABEL[accent]}`)}
                title={t(`components.appearance.${ACCENT_LABEL[accent]}`)}
                onClick={() => update({ accent })}
                className={cn(
                  'flex size-8 items-center justify-center rounded-full transition-transform',
                  'focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none',
                  selected
                    ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background'
                    : 'hover:scale-110'
                )}
                style={{ backgroundColor: ACCENT_SWATCH[accent] }}
              >
                {selected && <Check className="size-4 text-white" aria-hidden />}
              </button>
            )
          })}
        </div>
      </div>

      <SegmentedChoice
        label={t('components.appearance.cards')}
        options={CARD_STYLES}
        value={appearance.cards}
        onChange={(cards) => update({ cards })}
        render={(option) => t(`components.appearance.${CARD_LABEL[option]}`)}
      />

      <SegmentedChoice
        label={t('components.appearance.typeface')}
        options={FONTS}
        value={appearance.font}
        onChange={(font) => update({ font })}
        render={(option) => t(`components.appearance.${FONT_LABEL[option]}`)}
      />

      <div className="space-y-2 border-t pt-4">
        <p className="text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
          {t('components.appearance.tryNewLook')}
        </p>
        <label className="flex cursor-pointer items-center justify-between gap-3 text-sm">
          <span className="flex items-center gap-2">
            <Monitor className="size-4 text-muted-foreground" />
            {t('components.appearance.floatingChrome')}
          </span>
          <Switch
            checked={appearance.chrome === 'floating'}
            onCheckedChange={(on) => update({ chrome: on ? 'floating' : 'docked' })}
          />
        </label>
      </div>

      <div className="flex items-center justify-between gap-2 border-t pt-3">
        <p className="text-xs text-muted-foreground">
          {t('components.appearance.savedOnThisDevice')}
        </p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          disabled={isDefault}
          onClick={() => {
            chooseTheme('light')
            setAppearance(DEFAULT_APPEARANCE)
            applyAppearance(DEFAULT_APPEARANCE)
          }}
        >
          {t('components.appearance.reset')}
        </Button>
      </div>
    </div>
  )
}
