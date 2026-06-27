import { useState, useEffect, useCallback, useRef } from 'react'
import './MousePanel.css'

type ButtonId = 0 | 1 | 2 | 3 | 4

const CLICK_ROWS: { id: ButtonId | 'scrollUp' | 'scrollDown'; label: string }[] = [
  { id: 0, label: 'Left Click' },
  { id: 2, label: 'Right Click' },
  { id: 1, label: 'Wheel Click' },
  { id: 4, label: 'Back' },
  { id: 3, label: 'Forward' },
  { id: 'scrollUp', label: 'Scroll Up' },
  { id: 'scrollDown', label: 'Scroll Down' },
]

const STYLES = {
  panel: 'mouse-panel',
  description: 'description',
  statusRow: 'ms-status-row',
  resetBtn: 'ms-reset-btn',
  layout: 'ms-layout',
  mouseWrap: 'ms-mouse-wrap',
  mouse: 'ms-mouse',
  topHalf: 'ms-top-half',
  btnLeft: (pressed: boolean, tested: boolean) =>
    `ms-btn ms-left${pressed ? ' pressed' : tested ? ' tested' : ''}`,
  btnRight: (pressed: boolean, tested: boolean) =>
    `ms-btn ms-right${pressed ? ' pressed' : tested ? ' tested' : ''}`,
  wheelCol: 'ms-wheel-col',
  wheelBtn: (pressed: boolean, tested: boolean) =>
    `ms-wheel-btn${pressed ? ' pressed' : tested ? ' tested' : ''}`,
  scrollArrow: (active: boolean) => `ms-scroll-arrow${active ? ' active' : ''}`,
  bottomHalf: 'ms-bottom-half',
  sideButtons: 'ms-side-buttons',
  sideBtn: (pressed: boolean, tested: boolean) =>
    `ms-side-btn${pressed ? ' pressed' : tested ? ' tested' : ''}`,
  counter: 'ms-counter',
  counterTitle: 'ms-counter-title',
  counterRow: 'ms-counter-row',
  counterLabel: 'ms-counter-label',
  counterVal: (n: number) => `ms-counter-val${n > 0 ? ' hit' : ''}`,
}

type BtnCounts = Record<ButtonId, number>

export function MousePanel() {
  const [btnPressed, setBtnPressed] = useState<Set<number>>(() => new Set())
  const [btnCounts, setBtnCounts] = useState<BtnCounts>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
  const [scrollUpCount, setScrollUpCount] = useState(0)
  const [scrollDownCount, setScrollDownCount] = useState(0)
  const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleMouseDown = useCallback((e: MouseEvent) => {
    const btn = e.button as ButtonId
    setBtnPressed((prev) => { const s = new Set(prev); s.add(btn); return s })
    setBtnCounts((prev) => ({ ...prev, [btn]: (prev[btn] ?? 0) + 1 }))
  }, [])

  const handleMouseUp = useCallback((e: MouseEvent) => {
    const btn = e.button
    setBtnPressed((prev) => { const s = new Set(prev); s.delete(btn); return s })
  }, [])

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setScrollUpCount((n) => n + 1)
      setScrollDir('up')
    } else {
      setScrollDownCount((n) => n + 1)
      setScrollDir('down')
    }
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setScrollDir(null), 400)
  }, [])

  useEffect(() => {
    function suppressContext(e: MouseEvent) { e.preventDefault() }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('contextmenu', suppressContext)
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('contextmenu', suppressContext)
    }
  }, [handleMouseDown, handleMouseUp, handleWheel])

  function reset() {
    setBtnPressed(new Set())
    setBtnCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
    setScrollUpCount(0)
    setScrollDownCount(0)
    setScrollDir(null)
  }

  const testedCount =
    ([0, 1, 2, 3, 4] as ButtonId[]).filter((b) => btnCounts[b] > 0).length +
    (scrollUpCount > 0 ? 1 : 0) +
    (scrollDownCount > 0 ? 1 : 0)
  const totalCount = 7

  const counts: Record<ButtonId | 'scrollUp' | 'scrollDown', number> = {
    0: btnCounts[0],
    1: btnCounts[1],
    2: btnCounts[2],
    3: btnCounts[3],
    4: btnCounts[4],
    scrollUp: scrollUpCount,
    scrollDown: scrollDownCount,
  }

  const leftPressed = btnPressed.has(0)
  const leftTested = btnCounts[0] > 0
  const rightPressed = btnPressed.has(2)
  const rightTested = btnCounts[2] > 0
  const middlePressed = btnPressed.has(1)
  const middleTested = btnCounts[1] > 0
  const backPressed = btnPressed.has(4)
  const backTested = btnCounts[4] > 0
  const fwdPressed = btnPressed.has(3)
  const fwdTested = btnCounts[3] > 0

  return (
    <div className={STYLES.panel}>
      <h2>Mouse Test</h2>
      <p className={STYLES.description}>
        Click buttons and scroll anywhere on the page.
      </p>
      <div className={STYLES.statusRow}>
        <span>{testedCount} / {totalCount} inputs tested</span>
        <button className={STYLES.resetBtn} onClick={reset}>Reset</button>
      </div>

      <div className={STYLES.layout}>
        <div className={STYLES.mouseWrap}>
          <div className={STYLES.mouse}>
            <div className={STYLES.sideButtons}>
              <div className={STYLES.sideBtn(backPressed, backTested)}>Back</div>
              <div className={STYLES.sideBtn(fwdPressed, fwdTested)}>Fwd</div>
            </div>
            <div className={STYLES.topHalf}>
              <div className={STYLES.btnLeft(leftPressed, leftTested)}>Left</div>
              <div className={STYLES.wheelCol}>
                <span className={STYLES.scrollArrow(scrollDir === 'up')}>▲</span>
                <div className={STYLES.wheelBtn(middlePressed, middleTested)} />
                <span className={STYLES.scrollArrow(scrollDir === 'down')}>▼</span>
              </div>
              <div className={STYLES.btnRight(rightPressed, rightTested)}>Right</div>
            </div>
            <div className={STYLES.bottomHalf} />
          </div>
        </div>

        <div className={STYLES.counter}>
          <p className={STYLES.counterTitle}>Click Counter</p>
          {CLICK_ROWS.map((row) => (
            <div key={String(row.id)} className={STYLES.counterRow}>
              <span className={STYLES.counterLabel}>{row.label}</span>
              <span className={STYLES.counterVal(counts[row.id])}>{counts[row.id]}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
