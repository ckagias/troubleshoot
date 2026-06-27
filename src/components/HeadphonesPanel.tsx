import { useState, useRef, useEffect } from 'react'
import { useOutputDevices } from '../hooks/useOutputDevices'

type Channel = 'left' | 'right' | 'both'

const STYLES = {
  panel: 'space-y-6',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  deviceRow: 'flex items-center gap-2.5',
  deviceLabel: 'text-sm text-text-muted whitespace-nowrap',
  deviceSelect: 'flex-1 min-w-0 bg-surface border border-border text-text text-sm px-2.5 py-1.5 rounded-lg focus:outline-2 focus:outline-accent focus:outline-offset-1',
  refreshBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:bg-surface-raised hover:text-text',
  error: 'text-sm text-danger',
  channelBtns: 'flex gap-2.5',
  channelBtn: (active: boolean) =>
    [
      'flex-1 py-2.5 rounded-lg text-sm font-medium border transition-colors',
      active
        ? 'bg-accent border-accent text-white'
        : 'bg-surface border-border text-text-muted hover:bg-surface-raised hover:text-text',
    ].join(' '),
  stopBtn: 'bg-surface border border-border text-text-muted text-sm px-5 py-2 rounded-lg transition-colors hover:bg-surface-raised hover:text-text disabled:opacity-40 disabled:cursor-not-allowed',
}

const CHANNELS: { id: Channel; label: string }[] = [
  { id: 'left', label: 'Test Left' },
  { id: 'both', label: 'Test Both' },
  { id: 'right', label: 'Test Right' },
]

export function HeadphonesPanel() {
  const { devices, error: deviceError, refresh } = useOutputDevices()
  const [selectedId, setSelectedId] = useState('')
  const [playing, setPlaying] = useState<Channel | null>(null)
  const [playError, setPlayError] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const oscRef = useRef<OscillatorNode | null>(null)
  const splitterRef = useRef<ChannelSplitterNode | null>(null)
  const mergerRef = useRef<ChannelMergerNode | null>(null)

  useEffect(() => {
    if (devices.length > 0 && !selectedId) {
      setSelectedId(devices[0].id)
    }
  }, [devices, selectedId])

  function stopTone() {
    oscRef.current?.stop()
    oscRef.current?.disconnect()
    oscRef.current = null
    splitterRef.current?.disconnect()
    splitterRef.current = null
    mergerRef.current?.disconnect()
    mergerRef.current = null
    ctxRef.current?.close()
    ctxRef.current = null
    setPlaying(null)
  }

  async function playChannel(channel: Channel) {
    stopTone()
    setPlayError(null)

    try {
      const ctx = new AudioContext()
      ctxRef.current = ctx

      if (selectedId && 'setSinkId' in ctx) {
        await (ctx as AudioContext & { setSinkId(id: string): Promise<void> }).setSinkId(selectedId)
      }

      const osc = ctx.createOscillator()
      osc.type = 'sine'
      osc.frequency.value = 440
      oscRef.current = osc

      const splitter = ctx.createChannelSplitter(2)
      const merger = ctx.createChannelMerger(2)
      splitterRef.current = splitter
      mergerRef.current = merger

      osc.connect(splitter)

      if (channel === 'left' || channel === 'both') splitter.connect(merger, 0, 0)
      if (channel === 'right' || channel === 'both') splitter.connect(merger, 0, 1)

      merger.connect(ctx.destination)
      osc.start()
      setPlaying(channel)
    } catch (err) {
      setPlayError(err instanceof Error ? err.message : 'Failed to play tone.')
      stopTone()
    }
  }

  const error = deviceError ?? playError

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Headphones / Speakers Test</h2>
        <p className={STYLES.description}>
          Pick your output device, then test left, right, and both channels to
          confirm your audio is wired and working correctly.
        </p>
      </div>

      <div className={STYLES.deviceRow}>
        <label htmlFor="output-select" className={STYLES.deviceLabel}>Output device:</label>
        <select
          id="output-select"
          className={STYLES.deviceSelect}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {devices.length === 0 && <option value="">No outputs found</option>}
          {devices.map((d) => (
            <option key={d.id} value={d.id}>{d.label}</option>
          ))}
        </select>
        <button className={STYLES.refreshBtn} onClick={refresh} aria-label="Refresh output devices">Refresh</button>
      </div>

      {error && <p className={STYLES.error}>{error}</p>}

      <div className={STYLES.channelBtns}>
        {CHANNELS.map(({ id, label }) => (
          <button key={id} className={STYLES.channelBtn(playing === id)} onClick={() => playChannel(id)} aria-pressed={playing === id}>
            {label}
          </button>
        ))}
      </div>

      <button className={STYLES.stopBtn} disabled={playing === null} onClick={stopTone}>
        Stop
      </button>
    </div>
  )
}
