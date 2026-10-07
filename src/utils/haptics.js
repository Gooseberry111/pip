// Gentle taps you can feel. Uses Capacitor's native haptics in the app, the vibration API on the web.
import { Capacitor } from '@capacitor/core'

let native = null
if (Capacitor.isNativePlatform()) {
  import('@capacitor/haptics').then((mod) => (native = mod)).catch(() => {})
}

const WEB_PATTERNS = { light: 8, soft: 12, success: [10, 60, 14], error: [20, 40, 20] }

let enabled = true

export function setHapticsEnabled(on) {
  enabled = on
}

export function haptic(kind = 'light') {
  if (!enabled) return
  try {
    if (native) {
      const { Haptics, ImpactStyle, NotificationType } = native
      if (kind === 'success') return Haptics.notification({ type: NotificationType.Success })
      if (kind === 'error') return Haptics.notification({ type: NotificationType.Warning })
      return Haptics.impact({ style: kind === 'soft' ? ImpactStyle.Medium : ImpactStyle.Light })
    }
    // browsers only allow vibrating after the first tap
    if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return
    navigator.vibrate?.(WEB_PATTERNS[kind] ?? 8)
  } catch {
    // Haptics are a nice extra.
  }
}
