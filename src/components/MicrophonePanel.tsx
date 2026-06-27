import { useState, useRef, useEffect, useCallback } from 'react'
import './MicrophonePanel.css'
import { useInputDevices } from '../hooks/useInputDevices'

const STYLES = {
  panel: 'microphone-panel',
  description: 'description',
  deviceRow: 'device-row',
  deviceSelect: 'device-select',
  refreshBtn: 'refresh-btn',
  error: 'error-msg',
  meterSection: 'meter-section',
  meterLabel: 'meter-label',
  meterTrack: 'meter-track',
  meterFill: (pct: number) =>
    `meter-fill${pct > 70 ? ' danger' : pct > 40 ? ' warning' : ''}`,
  meterPeak: 'meter-peak',
  controls: 'mic-controls',
  controlBtn: (variant: 'record' | 'stop' | 'play') => `control-btn ${variant}-btn`,
  playbackSection: 'playback-section',
  playbackLabel: 'playback-label',
}

export function MicrophonePanel() {
  const { devices, error: deviceError, refresh } = useInputDevices()
  const [selectedId, setSelectedId] = useState('')
  const [monitorError, setMonitorError] = useState<string | null>(null)
  const [recordError, setRecordError] = useState<string | null>(null)
  const [level, setLevel] = useState(0)
  const [peak, setPeak] = useState(0)
  const [recording, setRecording] = useState(false)
  const [clipUrl, setClipUrl] = useState<string | null>(null)

  const ctxRef = useRef<AudioContext | null>(null)
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const rafRef = useRef<number | null>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Auto-select first device when list populates.
  useEffect(() => {
    if (devices.length > 0 && !selectedId) {
      setSelectedId(devices[0].id)
    }
  }, [devices, selectedId])

  const stopMonitor = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
    sourceRef.current?.disconnect()
    sourceRef.current = null
    analyserRef.current?.disconnect()
    analyserRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    ctxRef.current?.close()
    ctxRef.current = null
    setLevel(0)
    setPeak(0)
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

      let currentPeak = 0

      function tick() {
        analyser.getByteTimeDomainData(buf)
        let max = 0
        for (let i = 0; i < buf.length; i++) {
          const v = Math.abs(buf[i] - 128)
          if (v > max) max = v
        }
        // Scale 0..128 to 0..100
        const pct = Math.min(100, Math.round((max / 128) * 100))
        setLevel(pct)
        if (pct > currentPeak) {
          currentPeak = pct
        } else {
          currentPeak = Math.max(0, currentPeak - 0.8)
        }
        setPeak(Math.round(currentPeak))
        rafRef.current = requestAnimationFrame(tick)
      }
      rafRef.current = requestAnimationFrame(tick)
    } catch (err) {
      setMonitorError(err instanceof Error ? err.message : 'Could not access microphone.')
    }
  }, [stopMonitor])

  // Start monitor whenever selected device changes.
  useEffect(() => {
    if (selectedId) {
      startMonitor(selectedId)
    }
    return () => {
      stopMonitor()
    }
  // startMonitor/stopMonitor are stable callbacks; selectedId is the real trigger.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId])

  function stopRecording() {
    if (recorderRef.current && recorderRef.current.state !== 'inactive') {
      recorderRef.current.stop()
    }
  }

  function startRecording() {
    if (!streamRef.current) return
    setRecordError(null)
    // Revoke any previous clip URL.
    if (clipUrl) {
      URL.revokeObjectURL(clipUrl)
      setClipUrl(null)
    }
    chunksRef.current = []
    try {
      const recorder = new MediaRecorder(streamRef.current)
      recorderRef.current = recorder
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType })
        const url = URL.createObjectURL(blob)
        setClipUrl(url)
        setRecording(false)
      }
      recorder.start()
      setRecording(true)
    } catch (err) {
      setRecordError(err instanceof Error ? err.message : 'Could not start recording.')
    }
  }

  function playClip() {
    if (!clipUrl) return
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current = null
    }
    const audio = new Audio(clipUrl)
    audioRef.current = audio
    audio.play()
  }

  // Revoke object URL and teardown on unmount.
  useEffect(() => {
    return () => {
      stopMonitor()
      if (clipUrl) URL.revokeObjectURL(clipUrl)
      audioRef.current?.pause()
    }
  // Run only on unmount.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const error = deviceError ?? monitorError ?? recordError

  return (
    <div className={STYLES.panel}>
      <h2>Microphone Test</h2>
      <p className={STYLES.description}>
        Pick your microphone below, speak, and watch the input level. Use Record and Play Back to
        hear what your mic captures.
      </p>

      <div className={STYLES.deviceRow}>
        <label htmlFor="mic-select">Input device:</label>
        <select
          id="mic-select"
          className={STYLES.deviceSelect}
          value={selectedId}
          onChange={(e) => {
            setSelectedId(e.target.value)
          }}
        >
          {devices.length === 0 && <option value="">No microphones found</option>}
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

      <div className={STYLES.meterSection}>
        <span className={STYLES.meterLabel}>Input Level</span>
        <div className={STYLES.meterTrack}>
          <div
            className={STYLES.meterFill(level)}
            style={{ width: `${level}%` }}
          />
          {peak > 0 && (
            <div
              className={STYLES.meterPeak}
              style={{ left: `${peak}%` }}
            />
          )}
        </div>
      </div>

      <div className={STYLES.controls}>
        {!recording ? (
          <button
            className={STYLES.controlBtn('record')}
            onClick={startRecording}
            disabled={!streamRef.current}
          >
            Record
          </button>
        ) : (
          <button className={STYLES.controlBtn('stop')} onClick={stopRecording}>
            Stop
          </button>
        )}
        <button
          className={STYLES.controlBtn('play')}
          onClick={playClip}
          disabled={!clipUrl || recording}
        >
          Play Back
        </button>
      </div>

      {clipUrl && !recording && (
        <p className={STYLES.playbackLabel}>Recording ready. Press Play Back to listen.</p>
      )}
    </div>
  )
}
