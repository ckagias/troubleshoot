import { useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'

type Test = {
  id: string
  label: string
  description: string
  render: () => React.ReactNode
}

function CheckerPattern() {
  return (
    <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <pattern id="checker" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <rect x="0" y="0" width="8" height="8" fill="white" />
          <rect x="8" y="8" width="8" height="8" fill="white" />
          <rect x="8" y="0" width="8" height="8" fill="black" />
          <rect x="0" y="8" width="8" height="8" fill="black" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#checker)" />
    </svg>
  )
}

function GradientPattern() {
  return (
    <div style={{ width: '100%', height: '100%', background: 'linear-gradient(to right, #000 0%, #fff 100%)' }} />
  )
}

function ColorStripes() {
  const colors = ['#ff0000', '#00ff00', '#0000ff', '#00ffff', '#ff00ff', '#ffff00', '#ffffff', '#000000']
  return (
    <div style={{ display: 'flex', width: '100%', height: '100%' }}>
      {colors.map((c) => (
        <div key={c} style={{ flex: 1, backgroundColor: c }} />
      ))}
    </div>
  )
}

const TESTS: Test[] = [
  {
    id: 'dead-pixels-black',
    label: 'Dead Pixels — Black',
    description: 'Solid black to spot lit stuck pixels',
    render: () => <div style={{ width: '100%', height: '100%', backgroundColor: '#000000' }} />,
  },
  {
    id: 'dead-pixels-white',
    label: 'Dead Pixels — White',
    description: 'Solid white to spot dark stuck pixels',
    render: () => <div style={{ width: '100%', height: '100%', backgroundColor: '#ffffff' }} />,
  },
  {
    id: 'uniformity',
    label: 'Uniformity',
    description: 'Mid-grey to reveal backlight bleed or clouding',
    render: () => <div style={{ width: '100%', height: '100%', backgroundColor: '#808080' }} />,
  },
  {
    id: 'gradient',
    label: 'Gradient',
    description: 'Black-to-white ramp to check for banding',
    render: () => <GradientPattern />,
  },
  {
    id: 'colors',
    label: 'Color Fill',
    description: 'Primary and secondary color stripes',
    render: () => <ColorStripes />,
  },
  {
    id: 'sharpness',
    label: 'Sharpness',
    description: 'Fine checkerboard to check pixel sharpness',
    render: () => <CheckerPattern />,
  },
]

const STYLES = {
  panel: 'space-y-6',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  grid: 'grid grid-cols-1 gap-2',
  row: 'flex items-center gap-4 bg-surface border border-border rounded-lg px-4 py-3 transition-colors hover:bg-surface-raised',
  runBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:bg-surface-raised hover:text-text',
  rowText: 'flex-1 min-w-0',
  rowLabel: 'text-sm font-medium text-text',
  rowDesc: 'text-xs text-text-muted',
  overlay: 'fixed inset-0 z-50 cursor-pointer',
  overlayHint: 'fixed bottom-6 left-1/2 -translate-x-1/2 text-xs text-white/50 z-50 pointer-events-none select-none',
}

interface OverlayProps {
  test: Test
  onClose: () => void
}

function TestOverlay({ test, onClose }: OverlayProps) {
  const handleKey = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
  }, [onClose])

  useEffect(() => {
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [handleKey])

  return createPortal(
    <>
      <div
        className={STYLES.overlay}
        onClick={onClose}
        role="dialog"
        aria-modal="true"
        aria-label={`${test.label} test — press Escape or click to exit`}
      >
        {test.render()}
      </div>
      <p className={STYLES.overlayHint} aria-hidden="true">Press Esc or click to exit</p>
    </>,
    document.body
  )
}

interface Props {
  activeTest: string | null
  onActivate: (id: string | null) => void
}

export function DisplayPanel({ activeTest, onActivate }: Props) {
  const running = TESTS.find((t) => t.id === activeTest) ?? null

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Display / Monitor Test</h2>
        <p className={STYLES.description}>
          Run fullscreen tests to check for dead pixels, backlight uniformity, color accuracy, and sharpness. Press Esc or click to exit any test.
        </p>
      </div>

      <div className={STYLES.grid}>
        {TESTS.map((t) => (
          <div key={t.id} className={STYLES.row}>
            <div className={STYLES.rowText}>
              <p className={STYLES.rowLabel}>{t.label}</p>
              <p className={STYLES.rowDesc}>{t.description}</p>
            </div>
            <button className={STYLES.runBtn} onClick={() => onActivate(t.id)} aria-label={`Run ${t.label} test`}>
              Run
            </button>
          </div>
        ))}
      </div>

      {running && <TestOverlay test={running} onClose={() => onActivate(null)} />}
    </div>
  )
}
