type Module = 'headphones' | 'microphone' | 'keyboard' | 'mouse' | 'controller' | 'display'

const MODULES: { id: Module; label: string; description: string }[] = [
  { id: 'headphones', label: 'Headphones / Speakers', description: 'Play a test tone and verify audio output' },
  { id: 'microphone', label: 'Microphone', description: 'Check input level and device detection' },
  { id: 'keyboard', label: 'Keyboard', description: 'Press any key to see which keys register' },
  { id: 'mouse', label: 'Mouse', description: 'Test buttons, scroll wheel, and movement' },
  { id: 'controller', label: 'Controller', description: 'Check buttons, sticks, and triggers' },
  { id: 'display', label: 'Display / Monitor', description: 'Check for dead pixels, uniformity, and color accuracy' },
]

const STYLES = {
  root: 'flex flex-col items-center justify-center min-h-screen bg-bg px-8',
  hero: 'mb-12 text-center',
  title: 'text-4xl font-bold tracking-tight text-text mb-3',
  tagline: 'text-base text-text-muted',
  grid: 'grid grid-cols-2 sm:grid-cols-3 gap-4 w-full max-w-2xl',
  card: 'flex flex-col gap-1.5 rounded-xl border border-border bg-surface p-5 text-left cursor-pointer transition-colors hover:bg-surface-raised hover:text-text',
  cardLabel: 'text-sm font-semibold text-text',
  cardDesc: 'text-xs text-text-muted leading-relaxed',
}

interface Props {
  onSelect: (module: Module) => void
}

export function LandingPanel({ onSelect }: Props) {
  return (
    <div className={STYLES.root}>
      <div className={STYLES.hero}>
        <h1 className={STYLES.title}>Trouble</h1>
        <p className={STYLES.tagline}>Test your hardware directly in the browser.</p>
      </div>
      <div className={STYLES.grid}>
        {MODULES.map((m) => (
          <button key={m.id} className={STYLES.card} onClick={() => onSelect(m.id)}>
            <span className={STYLES.cardLabel}>{m.label}</span>
            <span className={STYLES.cardDesc}>{m.description}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
