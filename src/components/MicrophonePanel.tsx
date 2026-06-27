import { useState, useRef, useEffect, useCallback } from 'react'
import { useInputDevices } from '../hooks/useInputDevices'

const STYLES = {
  panel: 'space-y-6',
  title: 'text-lg font-semibold tracking-tight',
  description: 'text-sm text-text-muted leading-relaxed',
  deviceRow: 'flex items-center gap-2.5',
  deviceLabel: 'text-sm text-text-muted whitespace-nowrap w-24 shrink-0',
  deviceSelect: 'flex-1 min-w-0 bg-surface border border-border text-text text-sm px-2.5 py-1.5 rounded-lg focus:outline-2 focus:outline-accent focus:outline-offset-1',
  refreshBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:bg-surface-raised hover:text-text',
  error: 'text-sm text-danger',
  meterTrack: 'relative h-2.5 bg-surface border border-border rounded-lg overflow-hidden',
  meterFill: (pct: number) =>
    [
      'h-full rounded-lg transition-[width] duration-[50ms] linear',
      pct > 70 ? 'bg-danger' : pct > 40 ? 'bg-warning' : 'bg-success',
    ].join(' '),
  recordBtn: 'bg-surface border border-border text-text-muted text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:bg-surface-raised hover:text-text disabled:opacity-40 disabled:cursor-not-allowed',
  stopBtn: 'bg-danger border-danger text-white text-sm px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors hover:opacity-90',
  playbackLabel: 'text-sm text-text-muted',
  audioPlayer: 'w-full accent-accent',
}

export function MicrophonePanel() {
  const { devices, error: deviceError, refresh } = useInputDevices()
  const [selectedId, setSelectedId] = useState('')
  const [monitorError, setMonitorError] = useState<string | null>(null)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const [recording, setRecording] = useState(false)
  const [clipUrl, setClipUrl] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  useEffect(() => {
    if (devices.length > 0 && !selectedId) setSelectedId(devices[0].id)
  }, [devices, selectedId])

  const stopMonitor = useCallback(() => {
    if (rafRef.current !== null) { cancelAnimationFrame(rafRef.current); rafRef.current = null }
    sourceRef.current?.disconnect(); sourceRef.current = null
    analyserRef.current?.disconnect(); analyserRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop()); streamRef.current = null
    ctxRef.current?.close(); ctxRef.current = null
    setLevel(0)
  }, [])

  const startMonitor = useCallback(async (deviceId: string) => {
    stopMonitor()
    setMonitorError(null)
    if (!deviceId) return
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: deviceId ? { deviceId: { exact: deviceId } } : true,
      })
      streamRef.current = stream
      const ctx = new AudioContext()
      ctxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      sourceRef.current = source
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 1024
      analyserRef.current = analyser
      source.connect(analyser)
      const buf = new Uint8Array(analyser.fftSize)
      function tick() {
        analyser.getByteTimeDomainData(buf)
        let max = 0
        for (let i = 0; i < buf.length; i++) { const v = Math.abs(buf[i] - 128); if (v > max) max = v }
        const pct = Math.min(100, Math.round((max / 128) * 100))
        setLevel(pct)
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setMonitorError(err instanceof Error ? err.message : 'Could not access microphone.')
    }
  }, [stopMonitor])

  useEffect(() => {
    if (selectedId) startMonitor(selectedId)
    return () => { stopMonitor() }
  }, [selectedId, startMonitor, stopMonitor])

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') recorderRef.current.stop()
  }

  function startRecording() {
    if (!streamRef.current) return
    setRecordError(null)
    if (clipUrl) { URL.revokeObjectURL(clipUrl); setClipUrl(null) }
    chunksRef.current = []
    try {
      const recorder = new MediaRecorder(streamRef.current)
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        setClipUrl(URL.createObjectURL(blob))
        setRecording(false)
      }
      recorder.start()
      setRecording(true)
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Could not start recording.')
    }
  }

  useEffect(() => {
    return () => {
      stopMonitor()
      if (clipUrl) URL.revokeObjectURL(clipUrl)
    }
  }, [stopMonitor, clipUrl])

  const error = deviceError ?? monitorError ?? recordError

  return (
    <div className={STYLES.panel}>
      <div>
        <h2 className={STYLES.title}>Microphone Test</h2>
        <p className={STYLES.description}>
          Pick your microphone below, speak, and watch the input level. Use Record and Play Back to
          hear what your mic captures.
        </p>
      </div>

      <div className={STYLES.deviceRow}>
        <label htmlFor="mic-select" className={STYLES.deviceLabel}>Input device:</label>
        <div className="flex-1 min-w-0 flex flex-col gap-1.5">
          <div className="flex gap-2.5">
            <select
              id="mic-select"
              className={STYLES.deviceSelect}
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
            >
              {devices.length === 0 && <option value="">No microphones found</option>}
              {devices.map((d) => (
                <option key={d.id} value={d.id}>{d.label}</option>
              ))}
            </select>
            <button className={STYLES.refreshBtn} onClick={refresh} aria-label="Refresh input devices">Refresh</button>
            {!recording ? (
              <button className={STYLES.recordBtn} onClick={startRecording} disabled={!streamRef.current}>Record</button>
            ) : (
              <button className={STYLES.stopBtn} onClick={stopRecording}>Stop</button>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <span className={STYLES.deviceLabel}>Input level:</span>
        <div
          className={STYLES.meterTrack}
          style={{ flex: 1 }}
          role="meter"
          aria-label="Input level"
          aria-valuenow={level}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div className={STYLES.meterFill(level)} style={{ width: `${level}%` }} />
        </div>
      </div>

      {error && <p className={STYLES.error}>{error}</p>}

      {clipUrl && !recording && (
        <audio className={STYLES.audioPlayer} src={clipUrl} controls />
      )}
    </div>
  )
}
