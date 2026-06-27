import { useState, useEffect, useCallback } from 'react'

export interface DeviceInfo {
  id: string
  label: string
}

export function useOutputDevices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      // Browser hides device labels until a media permission is granted.
      // Request mic access briefly just to unlock the labels, then stop immediately.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        // Permission denied — we'll still enumerate but labels may be generic
      }

      const all = await navigator.mediaDevices.enumerateDevices()
      const outputs = all
        .filter((d) => d.kind === 'audiooutput')
        .map((d, i) => ({
          id: d.deviceId,
          label: d.label || `Output ${i + 1}`,
        }))
      setDevices(outputs)
      setError(null)
    } catch {
      setError('Could not enumerate audio output devices.')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { devices, error, refresh }
}
