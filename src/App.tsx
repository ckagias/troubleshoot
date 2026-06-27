import { useState } from 'react'
import './App.css'
import { HeadphonesPanel } from './components/HeadphonesPanel'
import { MicrophonePanel } from './components/MicrophonePanel'
import { KeyboardPanel } from './components/KeyboardPanel'

type Module = 'headphones' | 'microphone' | 'keyboard'

const MODULES: { id: Module; label: string }[] = [
  { id: 'headphones', label: 'Headphones / Speakers' },
  { id: 'microphone', label: 'Microphone' },
  { id: 'keyboard', label: 'Keyboard' },
]

const STYLES = {
  app: 'app',
  header: 'app-header',
  headerTitle: 'app-header h1',
  body: 'app-body',
  sidebar: 'sidebar',
  sidebarBtn: (active: boolean) => `sidebar-btn${active ? ' active' : ''}`,
  panelArea: (wide: boolean) => `panel-area${wide ? ' panel-area--wide' : ''}`,
}

export default function App() {
  const [active, setActive] = useState<Module>('headphones')

  return (
    <div className={STYLES.app}>
      <header className={STYLES.header}>
        <h1>Trouble</h1>
      </header>
      <div className={STYLES.body}>
        <nav className={STYLES.sidebar}>
          {MODULES.map((m) => (
            <button
              key={m.id}
              className={STYLES.sidebarBtn(active === m.id)}
              onClick={() => setActive(m.id)}
            >
              {m.label}
            </button>
          ))}
        </nav>
        <main className={STYLES.panelArea(active === 'keyboard')}>
          {active === 'headphones' && <HeadphonesPanel />}
          {active === 'microphone' && <MicrophonePanel />}
          {active === 'keyboard' && <KeyboardPanel />}
        </main>
      </div>
    </div>
  )
}
