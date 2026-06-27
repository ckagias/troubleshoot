import { useState, useRef, useEffect } from 'react'
import './HeadphonesPanel.css'
import { useOutputDevices } from '../hooks/useOutputDevices'

type Channel = 'left' | 'right' | 'both'

const STYLES = {
  panel: 'headphones-panel',
  description: 'description',
  deviceRow: 'device-row',
  deviceSelect: 'device-select',
  refreshBtn: 'refresh-btn',
  error: 'error-msg',
  channelBtns: 'channel-btns',
  channelBtn: (active: boolean) => `channel-btn${active ? ' active' : ''}`,
  stopBtn: 'stop-btn',
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

  // Auto-select first device when list populates
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
      const options: AudioContextOptions = {}
      // setSinkId is non-standard but widely supported; skip if not available
      const ctx = new AudioContext(options)
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

      if (channel === 'left' || channel === 'both') {
        splitter.connect(merger, 0, 0)
      }
      if (channel === 'right' || channel === 'both') {
        splitter.connect(merger, 0, 1)
      }

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
      <h2>Headphones / Speakers Test</h2>
      <p className={STYLES.description}>
        Pick your output device, then test left, right, and both channels to
        confirm your audio is wired and working correctly.
      </p>

      <div className={STYLES.deviceRow}>
        <label htmlFor="output-select">Output device</label>
        <select
          id="output-select"
          className={STYLES.deviceSelect}
          value={selectedId}
          onChange={(e) => setSelectedId(e.target.value)}
        >
          {devices.length === 0 && (
            <option value="">No outputs found</option>
          )}
          {devices.map((d) => (
            <option key={d.id} value={d.id}>
              {d.label}
            </option>
          ))}
        </select>
        <button className={STYLES.refreshBtn} onClick={refresh}>
          Refresh
        </button>
      </div>

      {error && <p className={STYLES.error}>{error}</p>}

      <div className={STYLES.channelBtns}>
        {CHANNELS.map(({ id, label }) => (
          <button
            key={id}
            className={STYLES.channelBtn(playing === id)}
            onClick={() => playChannel(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <button
        className={STYLES.stopBtn}
        disabled={playing === null}
        onClick={stopTone}
      >
        Stop
      </button>
    </div>
  )
}
