import { useCallback, useMemo, useRef, useState } from 'react'
import type { PrintBand, PrintElement, PrintTemplateDoc } from '@/types/firestore'
import { makeStyle } from '@/config/print-layouts'
import type { PrintFieldDef } from '@/config/print-fields'

/** Everything the designer can mutate about a template. Paper/margins/settings live here too so
 * a page-size change is undoable alongside an element move. */
export interface DesignerDraft {
  name: string
  paper: PrintTemplateDoc['paper']
  margins: PrintTemplateDoc['margins']
  settings: PrintTemplateDoc['settings']
  bandHeights: Record<PrintBand, number>
  elements: PrintElement[]
}

export function draftFromTemplate(t: PrintTemplateDoc): DesignerDraft {
  return {
    name: t.name,
    paper: { ...t.paper },
    margins: { ...t.margins },
    settings: { ...t.settings },
    bandHeights: { ...t.bandHeights },
    elements: t.elements.map((e) => ({ ...e, style: { ...e.style } })),
  }
}

const MAX_HISTORY = 60

/**
 * Draft + undo/redo for the canvas.
 *
 * History is a snapshot stack rather than a command log: a draft here is small (tens of elements
 * of plain data), and snapshots make undo correct by construction — a command log needs an
 * inverse for every operation, and the first one written wrong produces an undo that silently
 * corrupts the template. Capped so a long editing session can't grow without bound.
 *
 * `commit` is the only way to change the draft, so nothing mutates state without becoming
 * undoable. Continuous gestures (drag, resize) call `preview` while moving and `commit` once on
 * release — otherwise one drag would push a hundred history entries and undo would crawl back
 * pixel by pixel.
 */
export function useDesignerState(initial: DesignerDraft) {
  const [draft, setDraft] = useState<DesignerDraft>(initial)
  const [past, setPast] = useState<DesignerDraft[]>([])
  const [future, setFuture] = useState<DesignerDraft[]>([])
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  // State, not a ref: `isDirty` is read during render to drive the Save button, and reading
  // `ref.current` there is exactly what the React Compiler flags — a value the render depends
  // on but won't re-render for.
  const [savedDraft, setSavedDraft] = useState<DesignerDraft>(initial)
  /** The draft as it was when the current gesture started, so the whole gesture is one undo. */
  const gestureStart = useRef<DesignerDraft | null>(null)

  const commit = useCallback((next: DesignerDraft | ((prev: DesignerDraft) => DesignerDraft)) => {
    setDraft((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next
      if (resolved === prev) return prev
      setPast((p) => [...p, prev].slice(-MAX_HISTORY))
      setFuture([])
      return resolved
    })
  }, [])

  /** Mid-gesture update: changes the draft without touching history. */
  const preview = useCallback((next: (prev: DesignerDraft) => DesignerDraft) => {
    setDraft(next)
  }, [])

  const beginGesture = useCallback(() => {
    setDraft((d) => {
      gestureStart.current = d
      return d
    })
  }, [])

  /** Pushes the pre-gesture snapshot as the single undo step for the whole drag. */
  const endGesture = useCallback(() => {
    const start = gestureStart.current
    gestureStart.current = null
    if (!start) return
    setDraft((current) => {
      if (current !== start) {
        setPast((p) => [...p, start].slice(-MAX_HISTORY))
        setFuture([])
      }
      return current
    })
  }, [])

  const undo = useCallback(() => {
    setPast((p) => {
      if (p.length === 0) return p
      const previous = p[p.length - 1]
      setDraft((current) => {
        setFuture((f) => [current, ...f])
        return previous
      })
      return p.slice(0, -1)
    })
  }, [])

  const redo = useCallback(() => {
    setFuture((f) => {
      if (f.length === 0) return f
      const next = f[0]
      setDraft((current) => {
        setPast((p) => [...p, current].slice(-MAX_HISTORY))
        return next
      })
      return f.slice(1)
    })
  }, [])

  const selected = useMemo(
    () => draft.elements.filter((e) => selectedIds.includes(e.id)),
    [draft.elements, selectedIds]
  )

  const updateElements = useCallback(
    (ids: string[], patch: (el: PrintElement) => PrintElement, asPreview = false) => {
      const apply = (prev: DesignerDraft): DesignerDraft => ({
        ...prev,
        elements: prev.elements.map((e) => (ids.includes(e.id) ? patch(e) : e)),
      })
      if (asPreview) preview(apply)
      else commit(apply)
    },
    [commit, preview]
  )

  const addElement = useCallback(
    (el: Omit<PrintElement, 'id' | 'z'>) => {
      const id = `el-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`
      commit((prev) => ({
        ...prev,
        elements: [...prev.elements, { ...el, id, z: Math.max(0, ...prev.elements.map((e) => e.z)) + 1 }],
      }))
      setSelectedIds([id])
      return id
    },
    [commit]
  )

  const removeSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    commit((prev) => ({
      ...prev,
      // A locked element is skipped rather than deleted — locking exists precisely to stop a
      // stray Delete from removing something already positioned deliberately.
      elements: prev.elements.filter((e) => !selectedIds.includes(e.id) || e.locked),
    }))
    setSelectedIds([])
  }, [commit, selectedIds])

  const duplicateSelected = useCallback(() => {
    if (selectedIds.length === 0) return
    const newIds: string[] = []
    commit((prev) => {
      const copies = prev.elements
        .filter((e) => selectedIds.includes(e.id))
        .map((e, i) => {
          const id = `el-${Date.now().toString(36)}-${i}-${Math.random().toString(36).slice(2, 6)}`
          newIds.push(id)
          // Offset so the copy is visibly a second object, not hidden exactly behind the original.
          return { ...e, id, x: e.x + 2, y: e.y + 2, z: e.z + 1, style: { ...e.style } }
        })
      return { ...prev, elements: [...prev.elements, ...copies] }
    })
    setSelectedIds(newIds)
  }, [commit, selectedIds])

  return {
    draft,
    setName: (name: string) => commit((p) => ({ ...p, name })),
    commit,
    preview,
    beginGesture,
    endGesture,
    undo,
    redo,
    canUndo: past.length > 0,
    canRedo: future.length > 0,
    selectedIds,
    setSelectedIds,
    selected,
    updateElements,
    addElement,
    removeSelected,
    duplicateSelected,
    isDirty: draft !== savedDraft,
    markSaved: () => setSavedDraft(draft),
  }
}

/** A new element of `type`, sized sensibly for the band it lands in. */
export function newElement(
  type: PrintElement['type'],
  band: PrintBand,
  contentWidth: number,
  field?: PrintFieldDef
): Omit<PrintElement, 'id' | 'z'> {
  const common = {
    band,
    x: 0,
    y: 2,
    w: contentWidth,
    h: 4.2,
    fieldKey: null as string | null,
    text: null as string | null,
    showLabel: false,
    symbology: null as string | null,
    rotation: 0,
    visibleWhen: null,
    style: makeStyle(),
    locked: false,
    hidden: false,
  }

  if (field) {
    // An image-typed field becomes an image element, not a text one — dropping "Company Logo"
    // should place a logo, not print a URL.
    if (field.type === 'image') {
      return { ...common, type: 'logo', h: 14, w: Math.min(contentWidth, 24), fieldKey: field.key }
    }
    if (field.type === 'barcode') {
      return { ...common, type: 'barcode', h: 10, fieldKey: field.key, text: field.label }
    }
    return { ...common, type: 'field', fieldKey: field.key, text: field.label, showLabel: true }
  }

  switch (type) {
    case 'line':
      return { ...common, type, h: 0.3, style: makeStyle({ strokeWidth: 0.2 }) }
    case 'shape':
      return { ...common, type, h: 12, w: Math.min(contentWidth, 20), style: makeStyle({ strokeWidth: 0.2 }) }
    case 'logo':
    case 'image':
      return { ...common, type, h: 14, w: Math.min(contentWidth, 24) }
    case 'barcode':
      return { ...common, type, h: 10, text: '1234567890' }
    case 'qrcode':
      return { ...common, type, h: 18, w: 18, text: 'https://' }
    case 'text':
    default:
      return { ...common, type: 'text', text: 'Text' }
  }
}
