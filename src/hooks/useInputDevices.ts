import { useState, useEffect, useCallback } from 'react'
import type { DeviceInfo } from './useOutputDevices'

export type { DeviceInfo }

export function useInputDevices() {
  const [devices, setDevices] = useState<DeviceInfo[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      // getUserMedia unlocks real device labels; stop the stream immediately after.
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        stream.getTracks().forEach((t) => t.stop())
      } catch {
        // Permission denied — labels will be generic
      }

      const all = await navigator.mediaDevices.enumerateDevices()
      const inputs = all
        .filter((d) => d.kind === 'audioinput')
        .map((d, i) => ({
          id: d.deviceId,
          label: d.label || `Input ${i + 1}`,
        }))
      setDevices(inputs)
      setError(null)
    } catch {
      setError('Could not enumerate audio input devices.')
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { devices, error, refresh }
}
