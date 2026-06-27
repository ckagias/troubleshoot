import { useState, useEffect, useCallback, useRef } from 'react'

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
  panel: 'space-y-4',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  statusRow: 'flex items-center gap-3 text-sm text-text-muted',
  resetBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1 rounded-lg transition-colors hover:bg-surface-raised hover:text-text',
  layout: 'flex items-start gap-12',
  mouseWrap: 'relative',
  mouse: 'relative w-[200px] h-[360px] bg-surface border border-border select-none',
  topHalf: 'flex h-[160px] border-b border-border overflow-hidden',
  btn: (pressed: boolean, tested: boolean) =>
    [
      'flex items-center justify-center text-xs cursor-default transition-[background,color] duration-[80ms]',
      pressed ? 'bg-accent text-white' : tested ? 'bg-success text-bg' : 'text-text-muted',
    ].join(' '),
  btnLeft: 'flex-1 border-r border-border',
  btnRight: 'flex-1 border-l border-border',
  wheelCol: 'flex flex-col items-center justify-center gap-1 w-11 shrink-0',
  scrollArrow: (active: boolean) =>
    ['text-[13px] leading-none transition-colors duration-[80ms]', active ? 'text-accent' : 'text-border'].join(' '),
  wheelBtn: (pressed: boolean, tested: boolean) =>
    [
      'w-4 h-10 rounded-lg border transition-[background,border-color] duration-[80ms]',
      pressed
        ? 'bg-accent border-accent'
        : tested
        ? 'bg-success border-success'
        : 'bg-surface-raised border-border',
    ].join(' '),
  bottomHalf: 'h-[200px]',
  sideButtons: 'absolute left-0 top-[130px] flex flex-col gap-1.5 z-10 -translate-x-full',
  sideBtn: (pressed: boolean, tested: boolean) =>
    [
      'w-2 h-9 border-r-0 rounded-l-md flex items-center justify-center text-[0px] cursor-default transition-[background,border-color] duration-[80ms]',
      pressed
        ? 'bg-accent border border-accent'
        : tested
        ? 'bg-success border border-success'
        : 'bg-surface-raised border border-border',
    ].join(' '),
  counter: 'flex flex-col gap-0 min-w-[180px] ml-auto',
  counterTitle: 'text-sm font-semibold text-text mb-2.5',
  counterRow: 'flex items-center justify-between py-1.5 border-b border-border text-sm',
  counterLabel: 'text-text-muted',
  counterVal: (n: number) =>
    ['tabular-nums min-w-[24px] text-right', n > 0 ? 'text-success' : 'text-text-muted'].join(' '),
  trackerSection: 'space-y-2',
  trackerLabel: 'text-sm font-semibold text-text',
  trackerBox: 'relative w-full h-48 bg-surface border border-border rounded-xl overflow-hidden cursor-none',
  trackerCanvas: 'absolute inset-0 w-full h-full',
  trackerHint: 'absolute inset-0 flex items-center justify-center text-xs text-text-muted pointer-events-none',
}

const TRAIL_LENGTH = 40
const TRAIL_RADIUS = 3
const DOT_RADIUS = 5

function MovementTracker({ resetKey }: { resetKey: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const boxRef = useRef<HTMLDivElement>(null)
  const trailRef = useRef<{ x: number; y: number }[]>([])
  const rafRef = useRef<number | null>(null)
  const [hasMovement, setHasMovement] = useState(false)

  // resetKey change remounts this component via key prop — but we also
  // need in-instance reset for the mouseleave case without remounting
  useEffect(() => {
    trailRef.current = []
    setHasMovement(false)
  }, [resetKey])

  useEffect(() => {
    const canvas = canvasRef.current
    const box = boxRef.current
    if (!canvas || !box) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = box.clientWidth
      canvas.height = box.clientHeight
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(box)

    const draw = () => {
      const trail = trailRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      if (trail.length > 0) {
        for (let i = 1; i < trail.length; i++) {
          const t = i / trail.length
          ctx.beginPath()
          ctx.moveTo(trail[i - 1].x, trail[i - 1].y)
          ctx.lineTo(trail[i].x, trail[i].y)
          ctx.strokeStyle = `rgba(14,116,144,${t * 0.6})`
          ctx.lineWidth = TRAIL_RADIUS * t * 2
          ctx.lineCap = 'round'
          ctx.stroke()
        }
        const last = trail[trail.length - 1]
        ctx.beginPath()
        ctx.arc(last.x, last.y, DOT_RADIUS, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(14,116,144,0.9)'
        ctx.fill()
      }
      rafRef.current = requestAnimationFrame(draw)
    }
    rafRef.current = requestAnimationFrame(draw)

    const onMove = (e: MouseEvent) => {
      const rect = box.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      if (x < 0 || y < 0 || x > rect.width || y > rect.height) return
      setHasMovement(true)
      trailRef.current = [...trailRef.current, { x, y }].slice(-TRAIL_LENGTH)
    }

    const onLeave = () => {
      trailRef.current = []
      setHasMovement(false)
    }

    window.addEventListener('mousemove', onMove)
    box.addEventListener('mouseleave', onLeave)
    return () => {
      window.removeEventListener('mousemove', onMove)
      box.removeEventListener('mouseleave', onLeave)
      ro.disconnect()
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <div className={STYLES.trackerSection}>
      <p className={STYLES.trackerLabel}>Movement Tracker</p>
      <div ref={boxRef} className={STYLES.trackerBox}>
        <canvas ref={canvasRef} className={STYLES.trackerCanvas} />
        {!hasMovement && <span className={STYLES.trackerHint}>Move your mouse here</span>}
      </div>
    </div>
  )
}

type BtnCounts = Record<ButtonId, number>

export function MousePanel() {
  const [btnPressed, setBtnPressed] = useState<Set<number>>(() => new Set())
  const [btnCounts, setBtnCounts] = useState<BtnCounts>({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
  const [scrollUpCount, setScrollUpCount] = useState(0)
  const [scrollDownCount, setScrollDownCount] = useState(0)
  const [scrollDir, setScrollDir] = useState<'up' | 'down' | null>(null)
  const [trackerResetKey, setTrackerResetKey] = useState(0)
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
    if (e.deltaY < 0) { setScrollUpCount((n) => n + 1); setScrollDir('up') }
    else { setScrollDownCount((n) => n + 1); setScrollDir('down') }
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => setScrollDir(null), 400)
  }, [])

  useEffect(() => {
    function suppressContext(e: MouseEvent) { e.preventDefault() }
    function suppressNav(e: MouseEvent) {
      if (e.button === 3 || e.button === 4) e.preventDefault()
    }
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('wheel', handleWheel, { passive: false })
    window.addEventListener('contextmenu', suppressContext)
    window.addEventListener('mousedown', suppressNav, { capture: true })
    window.addEventListener('mouseup', suppressNav, { capture: true })
    window.addEventListener('auxclick', suppressNav, { capture: true })
    return () => {
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('contextmenu', suppressContext)
      window.removeEventListener('mousedown', suppressNav, { capture: true })
      window.removeEventListener('mouseup', suppressNav, { capture: true })
      window.removeEventListener('auxclick', suppressNav, { capture: true })
    }
  }, [handleMouseDown, handleMouseUp, handleWheel])

  function reset() {
    setBtnPressed(new Set())
    setBtnCounts({ 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 })
    setScrollUpCount(0); setScrollDownCount(0); setScrollDir(null)
    setTrackerResetKey((k) => k + 1)
  }

  const testedCount =
    ([0, 1, 2, 3, 4] as ButtonId[]).filter((b) => btnCounts[b] > 0).length +
    (scrollUpCount > 0 ? 1 : 0) + (scrollDownCount > 0 ? 1 : 0)

  const counts: Record<ButtonId | 'scrollUp' | 'scrollDown', number> = {
    0: btnCounts[0], 1: btnCounts[1], 2: btnCounts[2], 3: btnCounts[3], 4: btnCounts[4],
    scrollUp: scrollUpCount, scrollDown: scrollDownCount,
  }

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Mouse Test</h2>
        <p className={STYLES.description}>Click buttons and scroll anywhere on the page.</p>
      </div>
      <div className={STYLES.statusRow}>
        <span>{testedCount} / 7 inputs tested</span>
        <button className={STYLES.resetBtn} onClick={reset} aria-label="Reset test state">Reset</button>
      </div>

      <div className={STYLES.layout}>
        <div className={STYLES.mouseWrap}>
          <div
            className={STYLES.mouse}
            style={{ borderRadius: '100px 100px 80px 80px' }}
          >
            <div className={STYLES.sideButtons}>
              <div className={STYLES.sideBtn(btnPressed.has(4), btnCounts[4] > 0)} />
              <div className={STYLES.sideBtn(btnPressed.has(3), btnCounts[3] > 0)} />
            </div>
            <div className={STYLES.topHalf} style={{ borderRadius: '100px 100px 0 0' }}>
              <div
                className={`${STYLES.btn(btnPressed.has(0), btnCounts[0] > 0)} ${STYLES.btnLeft}`}
                style={{ borderRadius: '100px 0 0 0' }}
              />
              <div className={STYLES.wheelCol}>
                <span className={STYLES.scrollArrow(scrollDir === 'up')}>▲</span>
                <div className={STYLES.wheelBtn(btnPressed.has(1), btnCounts[1] > 0)} />
                <span className={STYLES.scrollArrow(scrollDir === 'down')}>▼</span>
              </div>
              <div
                className={`${STYLES.btn(btnPressed.has(2), btnCounts[2] > 0)} ${STYLES.btnRight}`}
                style={{ borderRadius: '0 100px 0 0' }}
              />
            </div>
            <div className={STYLES.bottomHalf} style={{ borderRadius: '0 0 80px 80px' }} />
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

      <MovementTracker resetKey={trackerResetKey} />
    </div>
  )
}
