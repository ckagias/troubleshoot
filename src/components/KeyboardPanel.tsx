import { useState, useEffect, useCallback, useRef } from 'react'

interface KeyDef {
  code: string
  label: string
  col: number
  row: number
  colSpan?: number
  rowSpan?: number
}

const UNIT = 36
const GAP = 4

const MAIN_KEYS: KeyDef[] = [
  { code: 'Escape', label: 'Esc', col: 1, row: 0 },
  { code: 'F1', label: 'F1', col: 3, row: 0 },
  { code: 'F2', label: 'F2', col: 4, row: 0 },
  { code: 'F3', label: 'F3', col: 5, row: 0 },
  { code: 'F4', label: 'F4', col: 6, row: 0 },
  { code: 'F5', label: 'F5', col: 7.5, row: 0 },
  { code: 'F6', label: 'F6', col: 8.5, row: 0 },
  { code: 'F7', label: 'F7', col: 9.5, row: 0 },
  { code: 'F8', label: 'F8', col: 10.5, row: 0 },
  { code: 'F9', label: 'F9', col: 12, row: 0 },
  { code: 'F10', label: 'F10', col: 13, row: 0 },
  { code: 'F11', label: 'F11', col: 14, row: 0 },
  { code: 'F12', label: 'F12', col: 15, row: 0 },
  { code: 'PrintScreen', label: 'PrtSc', col: 16.5, row: 0 },
  { code: 'ScrollLock', label: 'ScrLk', col: 17.5, row: 0 },
  { code: 'Pause', label: 'Pause', col: 18.5, row: 0 },
  { code: 'Backquote', label: '`', col: 1, row: 1 },
  { code: 'Digit1', label: '1', col: 2, row: 1 },
  { code: 'Digit2', label: '2', col: 3, row: 1 },
  { code: 'Digit3', label: '3', col: 4, row: 1 },
  { code: 'Digit4', label: '4', col: 5, row: 1 },
  { code: 'Digit5', label: '5', col: 6, row: 1 },
  { code: 'Digit6', label: '6', col: 7, row: 1 },
  { code: 'Digit7', label: '7', col: 8, row: 1 },
  { code: 'Digit8', label: '8', col: 9, row: 1 },
  { code: 'Digit9', label: '9', col: 10, row: 1 },
  { code: 'Digit0', label: '0', col: 11, row: 1 },
  { code: 'Minus', label: '-', col: 12, row: 1 },
  { code: 'Equal', label: '=', col: 13, row: 1 },
  { code: 'Backspace', label: 'Backspace', col: 14, row: 1, colSpan: 2 },
  { code: 'Insert', label: 'Ins', col: 16.5, row: 1 },
  { code: 'Home', label: 'Home', col: 17.5, row: 1 },
  { code: 'PageUp', label: 'PgUp', col: 18.5, row: 1 },
  { code: 'Tab', label: 'Tab', col: 1, row: 2, colSpan: 1.5 },
  { code: 'KeyQ', label: 'Q', col: 2.5, row: 2 },
  { code: 'KeyW', label: 'W', col: 3.5, row: 2 },
  { code: 'KeyE', label: 'E', col: 4.5, row: 2 },
  { code: 'KeyR', label: 'R', col: 5.5, row: 2 },
  { code: 'KeyT', label: 'T', col: 6.5, row: 2 },
  { code: 'KeyY', label: 'Y', col: 7.5, row: 2 },
  { code: 'KeyU', label: 'U', col: 8.5, row: 2 },
  { code: 'KeyI', label: 'I', col: 9.5, row: 2 },
  { code: 'KeyO', label: 'O', col: 10.5, row: 2 },
  { code: 'KeyP', label: 'P', col: 11.5, row: 2 },
  { code: 'BracketLeft', label: '[', col: 12.5, row: 2 },
  { code: 'BracketRight', label: ']', col: 13.5, row: 2 },
  { code: 'Backslash', label: '\\', col: 14.5, row: 2, colSpan: 1.5 },
  { code: 'Delete', label: 'Del', col: 16.5, row: 2 },
  { code: 'End', label: 'End', col: 17.5, row: 2 },
  { code: 'PageDown', label: 'PgDn', col: 18.5, row: 2 },
  { code: 'CapsLock', label: 'Caps', col: 1, row: 3, colSpan: 1.75 },
  { code: 'KeyA', label: 'A', col: 2.75, row: 3 },
  { code: 'KeyS', label: 'S', col: 3.75, row: 3 },
  { code: 'KeyD', label: 'D', col: 4.75, row: 3 },
  { code: 'KeyF', label: 'F', col: 5.75, row: 3 },
  { code: 'KeyG', label: 'G', col: 6.75, row: 3 },
  { code: 'KeyH', label: 'H', col: 7.75, row: 3 },
  { code: 'KeyJ', label: 'J', col: 8.75, row: 3 },
  { code: 'KeyK', label: 'K', col: 9.75, row: 3 },
  { code: 'KeyL', label: 'L', col: 10.75, row: 3 },
  { code: 'Semicolon', label: ';', col: 11.75, row: 3 },
  { code: 'Quote', label: "'", col: 12.75, row: 3 },
  { code: 'Enter', label: 'Enter', col: 13.75, row: 3, colSpan: 2.25 },
  { code: 'ShiftLeft', label: 'Shift', col: 1, row: 4, colSpan: 2.25 },
  { code: 'KeyZ', label: 'Z', col: 3.25, row: 4 },
  { code: 'KeyX', label: 'X', col: 4.25, row: 4 },
  { code: 'KeyC', label: 'C', col: 5.25, row: 4 },
  { code: 'KeyV', label: 'V', col: 6.25, row: 4 },
  { code: 'KeyB', label: 'B', col: 7.25, row: 4 },
  { code: 'KeyN', label: 'N', col: 8.25, row: 4 },
  { code: 'KeyM', label: 'M', col: 9.25, row: 4 },
  { code: 'Comma', label: ',', col: 10.25, row: 4 },
  { code: 'Period', label: '.', col: 11.25, row: 4 },
  { code: 'Slash', label: '/', col: 12.25, row: 4 },
  { code: 'ShiftRight', label: 'Shift', col: 13.25, row: 4, colSpan: 2.75 },
  { code: 'ArrowUp', label: '↑', col: 17.5, row: 4 },
  { code: 'ControlLeft', label: 'Ctrl', col: 1, row: 5, colSpan: 1.5 },
  { code: 'MetaLeft', label: 'Win', col: 2.5, row: 5, colSpan: 1.25 },
  { code: 'AltLeft', label: 'Alt', col: 3.75, row: 5, colSpan: 1.25 },
  { code: 'Space', label: '', col: 5, row: 5, colSpan: 6.25 },
  { code: 'AltRight', label: 'Alt', col: 11.25, row: 5, colSpan: 1.25 },
  { code: 'MetaRight', label: 'Win', col: 12.5, row: 5, colSpan: 1.25 },
  { code: 'ContextMenu', label: 'Menu', col: 13.75, row: 5, colSpan: 1.25 },
  { code: 'ControlRight', label: 'Ctrl', col: 15, row: 5, colSpan: 1.5 },
  { code: 'ArrowLeft', label: '←', col: 16.5, row: 5 },
  { code: 'ArrowDown', label: '↓', col: 17.5, row: 5 },
  { code: 'ArrowRight', label: '→', col: 18.5, row: 5 },
]

const NUMPAD_KEYS: KeyDef[] = [
  { code: 'NumLock', label: 'Num', col: 20, row: 1 },
  { code: 'NumpadDivide', label: '/', col: 21, row: 1 },
  { code: 'NumpadMultiply', label: '*', col: 22, row: 1 },
  { code: 'NumpadSubtract', label: '-', col: 23, row: 1 },
  { code: 'Numpad7', label: '7', col: 20, row: 2 },
  { code: 'Numpad8', label: '8', col: 21, row: 2 },
  { code: 'Numpad9', label: '9', col: 22, row: 2 },
  { code: 'NumpadAdd', label: '+', col: 23, row: 2, rowSpan: 2 },
  { code: 'Numpad4', label: '4', col: 20, row: 3 },
  { code: 'Numpad5', label: '5', col: 21, row: 3 },
  { code: 'Numpad6', label: '6', col: 22, row: 3 },
  { code: 'Numpad1', label: '1', col: 20, row: 4 },
  { code: 'Numpad2', label: '2', col: 21, row: 4 },
  { code: 'Numpad3', label: '3', col: 22, row: 4 },
  { code: 'NumpadEnter', label: 'Enter', col: 23, row: 4, rowSpan: 2 },
  { code: 'Numpad0', label: '0', col: 20, row: 5, colSpan: 2 },
  { code: 'NumpadDecimal', label: '.', col: 22, row: 5 },
]

const ALL_KEYS_ARR = [...MAIN_KEYS, ...NUMPAD_KEYS]
const ALL_KEYS = new Set(ALL_KEYS_ARR.map((k) => k.code))
const MIN_COL = Math.min(...ALL_KEYS_ARR.map((k) => k.col))
const MAX_COL = Math.max(...ALL_KEYS_ARR.map((k) => k.col + (k.colSpan ?? 1)))
const MAX_ROW = Math.max(...ALL_KEYS_ARR.map((k) => k.row + (k.rowSpan ?? 1)))
const CANVAS_W = (MAX_COL - MIN_COL) * UNIT
const CANVAS_H = MAX_ROW * UNIT

const STYLES = {
  panel: 'space-y-4',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  statusRow: 'flex items-center gap-3 text-sm text-text-muted',
  resetBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1 rounded-lg transition-colors hover:bg-surface-raised hover:text-text',
  wrapper: 'relative w-full overflow-hidden',
  canvas: 'relative',
  key: (pressed: boolean, tested: boolean) =>
    [
      'absolute flex items-center justify-center rounded text-[11px] font-medium select-none box-border transition-[background,border-color] duration-[80ms] text-text',
      pressed
        ? 'bg-accent border border-accent'
        : tested
        ? 'bg-success border border-success'
        : 'bg-surface border border-border',
    ].join(' '),
  typeBox: 'w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm text-text placeholder-text-muted resize-none focus:outline-none focus:border-accent transition-colors',
}

export function KeyboardPanel() {
  const [pressed, setPressed] = useState<Set<string>>(() => new Set())
  const [tested, setTested] = useState<Set<string>>(() => new Set())
  const [typed, setTyped] = useState('')
  const [scale, setScale] = useState(1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const code = e.code
    if (!ALL_KEYS.has(code)) return
    setPressed((prev) => {
      if (prev.has(code)) return prev
      const next = new Set(prev); next.add(code); return next
    })
    setTested((prev) => {
      if (prev.has(code)) return prev
      const next = new Set(prev); next.add(code); return next
    })
  }, [])

  const handleKeyUp = useCallback((e: KeyboardEvent) => {
    const code = e.code
    if (!ALL_KEYS.has(code)) return
    setPressed((prev) => {
      if (!prev.has(code)) return prev
      const next = new Set(prev); next.delete(code); return next
    })
  }, [])

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    function handleBlur() { setPressed(new Set()) }
    el.addEventListener('keydown', handleKeyDown)
    el.addEventListener('keyup', handleKeyUp)
    el.addEventListener('blur', handleBlur)
    return () => {
      el.removeEventListener('keydown', handleKeyDown)
      el.removeEventListener('keyup', handleKeyUp)
      el.removeEventListener('blur', handleBlur)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    textareaRef.current?.focus()
  }, [])

  function reset() { setTested(new Set()); setPressed(new Set()); setTyped('') }


  useEffect(() => {
    const el = wrapperRef.current
    if (!el) return
    const observer = new ResizeObserver(() => {
      const available = el.clientWidth
      setScale(available > 0 ? Math.min(1, available / CANVAS_W) : 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Keyboard Test</h2>
        <p className={STYLES.description}>
          Press keys on your keyboard. Each key lights up while held and turns green once tested.
        </p>
      </div>
      <div className={STYLES.statusRow}>
        <span>{tested.size} / {ALL_KEYS.size} keys tested</span>
        <button className={STYLES.resetBtn} onClick={reset} aria-label="Reset test state">Reset</button>
      </div>
      <div ref={wrapperRef} className={STYLES.wrapper} style={{ height: CANVAS_H * scale }}>
        <div
          className={STYLES.canvas}
          style={{ width: CANVAS_W, height: CANVAS_H, transform: `scale(${scale})`, transformOrigin: 'top left' }}
        >
          {ALL_KEYS_ARR.map((k) => {
            const w = (k.colSpan ?? 1) * UNIT - GAP
            const h = (k.rowSpan ?? 1) * UNIT - GAP
            const x = (k.col - MIN_COL) * UNIT
            const y = k.row * UNIT
            return (
              <div
                key={k.code}
                className={STYLES.key(pressed.has(k.code), tested.has(k.code))}
                style={{ left: x, top: y, width: w, height: h }}
              >
                {k.label}
              </div>
            )
          })}
        </div>
      </div>
      <textarea
        ref={textareaRef}
        className={STYLES.typeBox}
        rows={3}
        placeholder="Click here and start typing…"
        value={typed}
        onChange={(e) => setTyped(e.target.value)}
        spellCheck={false}
        style={{ width: CANVAS_W * scale }}
      />
    </div>
  )
}
