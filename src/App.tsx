import { useState, useEffect, type ReactElement } from 'react'
import { FaHeadphonesSimple, FaMicrophoneLines, FaKeyboard, FaComputerMouse, FaDisplay } from 'react-icons/fa6'
import { IoGameController } from 'react-icons/io5'
import { RxHamburgerMenu } from 'react-icons/rx'
import { HeadphonesPanel } from './components/HeadphonesPanel'
import { MicrophonePanel } from './components/MicrophonePanel'
import { KeyboardPanel } from './components/KeyboardPanel'
import { MousePanel } from './components/MousePanel'
import { ControllerPanel } from './components/ControllerPanel'
import { DisplayPanel } from './components/DisplayPanel'
import { LandingPanel } from './components/LandingPanel'

type Module = 'headphones' | 'microphone' | 'keyboard' | 'mouse' | 'controller' | 'display'

const Icons: Record<Module, ReactElement> = {
  headphones: <FaHeadphonesSimple size={16} />,
  microphone: <FaMicrophoneLines size={16} />,
  keyboard: <FaKeyboard size={16} />,
  mouse: <FaComputerMouse size={16} />,
  controller: <IoGameController size={16} />,
  display: <FaDisplay size={16} />,
}

const MODULES: { id: Module; label: string }[] = [
  { id: 'headphones', label: 'Headphones / Speakers' },
  { id: 'microphone', label: 'Microphone' },
  { id: 'keyboard', label: 'Keyboard' },
  { id: 'mouse', label: 'Mouse' },
  { id: 'controller', label: 'Controller' },
  { id: 'display', label: 'Display / Monitor' },
]

const MODULE_IDS = new Set(MODULES.map((m) => m.id))

function hashToModule(): Module | null {
  const id = window.location.hash.slice(1) as Module
  return MODULE_IDS.has(id) ? id : null
}

const STYLES = {
  app: 'flex flex-col min-h-screen bg-bg text-text',
  header: 'px-4 md:px-8 py-5 border-b border-border flex items-center gap-3',
  hamburger: 'md:hidden text-text-muted hover:text-text transition-colors cursor-pointer',
  headerLogo: 'flex items-center gap-2.5 cursor-pointer hover:text-text-muted transition-colors',
  headerTitle: 'text-xl font-semibold tracking-tight',
  body: 'flex flex-1 relative',
  // desktop sidebar
  sidebar: 'hidden md:flex w-50 shrink-0 border-r border-border px-2 py-4 flex-col gap-0.5',
  // mobile drawer backdrop
  backdrop: 'fixed inset-0 z-20 bg-black/50 md:hidden',
  // mobile drawer panel
  drawer: 'fixed inset-y-0 left-0 z-30 w-56 bg-bg border-r border-border px-2 py-4 flex flex-col gap-0.5 md:hidden',
  sidebarBtn: (active: boolean) =>
    [
      'w-full text-left text-sm px-3 py-2 rounded-lg transition-colors cursor-pointer flex items-center gap-2.5',
      active
        ? 'bg-surface-raised text-text'
        : 'text-text-muted hover:bg-surface-raised hover:text-text',
    ].join(' '),
  panelArea: (wide: boolean) =>
    ['flex-1 p-4 md:p-8', wide ? '' : 'max-w-2xl'].join(' ').trim(),
}

export default function App() {
  const [active, setActive] = useState<Module | null>(hashToModule)
  const [displayTest, setDisplayTest] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  useEffect(() => {
    const onHashChange = () => setActive(hashToModule())
    window.addEventListener('hashchange', onHashChange)
    return () => window.removeEventListener('hashchange', onHashChange)
  }, [])

  const selectModule = (id: Module) => {
    window.location.hash = id
    setDrawerOpen(false)
  }

  const goHome = () => {
    window.location.hash = ''
  }

  if (active === null) {
    return <LandingPanel onSelect={selectModule} />
  }

  const navButtons = (onClick?: () => void) => MODULES.map((m) => (
    <button
      key={m.id}
      className={STYLES.sidebarBtn(active === m.id)}
      onClick={() => { selectModule(m.id); onClick?.() }}
      aria-current={active === m.id ? 'page' : undefined}
    >
      {Icons[m.id]}
      {m.label}
    </button>
  ))

  return (
    <div className={STYLES.app}>
      <header className={STYLES.header}>
        <button
          className={STYLES.hamburger}
          onClick={() => setDrawerOpen(true)}
          aria-label="Open navigation menu"
          aria-expanded={drawerOpen}
          aria-controls="mobile-drawer"
        >
          <RxHamburgerMenu size={20} />
        </button>
        <button className={STYLES.headerLogo} onClick={goHome} aria-label="Go to home">
          <h1 className={STYLES.headerTitle}>Trouble</h1>
        </button>
      </header>
      <div className={STYLES.body}>
        <nav className={STYLES.sidebar} aria-label="Module navigation">
          {navButtons()}
        </nav>

        {drawerOpen && (
          <>
            <div className={STYLES.backdrop} onClick={() => setDrawerOpen(false)} aria-hidden="true" />
            <nav
              id="mobile-drawer"
              className={STYLES.drawer}
              aria-label="Module navigation"
              aria-modal="true"
            >
              {navButtons(() => setDrawerOpen(false))}
            </nav>
          </>
        )}

        <main className={STYLES.panelArea(active === 'keyboard')}>
          {active === 'headphones' && <HeadphonesPanel />}
          {active === 'microphone' && <MicrophonePanel />}
          {active === 'keyboard' && <KeyboardPanel />}
          {active === 'mouse' && <MousePanel />}
          {active === 'controller' && <ControllerPanel />}
          {active === 'display' && <DisplayPanel activeTest={displayTest} onActivate={setDisplayTest} />}
        </main>
      </div>
    </div>
  )
}
