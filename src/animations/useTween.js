import { ref, watch, onBeforeUnmount } from 'vue'

/**
 * Follows a reactive number smoothly, easing toward each new value.
 * `seconds` is roughly how long it takes to get most of the way there.
 */
export function useTween(source, seconds = 1) {
  const value = ref(source())
  let frame = null
  let last = 0

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  function step(time) {
    const dt = last ? (time - last) / 1000 : 0.016
    last = time
    const target = source()
    const k = 1 - Math.exp((-dt * 3) / seconds)
    value.value += (target - value.value) * k
    if (Math.abs(target - value.value) < 0.001) {
      value.value = target
      frame = null
      return
    }
    frame = requestAnimationFrame(step)
  }

  watch(source, (target) => {
    if (reduceMotion) {
      value.value = target
      return
    }
    if (!frame) {
      last = 0
      frame = requestAnimationFrame(step)
    }
  })

  onBeforeUnmount(() => frame && cancelAnimationFrame(frame))

  return value
}
