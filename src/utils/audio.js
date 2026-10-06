// One shared audio context with two channels (sound effects and music), both sent
// through a soft room reverb so everything sounds warm and close rather than beepy.
// Browsers only allow audio after a tap, so the context is created on first touch.

let ctx = null
let master = null
let sfx = null
let music = null
const listeners = new Set()

function makeImpulse(ac, seconds = 2.2, decay = 2.8) {
  const rate = ac.sampleRate
  const length = Math.floor(rate * seconds)
  const buffer = ac.createBuffer(2, length, rate)
  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch)
    for (let i = 0; i < length; i++) {
      // a short pre-delay, then a smooth decaying tail
      const t = i / length
      data[i] = i < rate * 0.012 ? 0 : (Math.random() * 2 - 1) * Math.pow(1 - t, decay)
    }
  }
  return buffer
}

export function getAudio() {
  if (typeof window === 'undefined') return null
  const AudioContext = window.AudioContext || window.webkitAudioContext
  if (!AudioContext) return null
  if (!ctx) {
    ctx = new AudioContext()

    master = ctx.createGain()
    master.gain.value = 0.85
    // take the edge off the highs, and keep loud moments gentle
    const soften = ctx.createBiquadFilter()
    soften.type = 'lowpass'
    soften.frequency.value = 9000
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.ratio.value = 3.5
    comp.attack.value = 0.01
    comp.release.value = 0.25
    master.connect(soften).connect(comp).connect(ctx.destination)

    const reverb = ctx.createConvolver()
    reverb.buffer = makeImpulse(ctx)
    const wet = ctx.createGain()
    wet.gain.value = 0.3
    reverb.connect(wet).connect(master)

    sfx = ctx.createGain()
    sfx.gain.value = 1
    sfx.connect(master)
    const sfxSend = ctx.createGain()
    sfxSend.gain.value = 0.22
    sfx.connect(sfxSend).connect(reverb)

    music = ctx.createGain()
    music.gain.value = 0
    music.connect(master)
    const musicSend = ctx.createGain()
    musicSend.gain.value = 0.45
    music.connect(musicSend).connect(reverb)
  }
  if (ctx.state === 'suspended') ctx.resume().then(() => listeners.forEach((fn) => fn()))
  return ctx
}

export function buses() {
  getAudio()
  return { sfx, music, master }
}

/** The audio context if it already exists. Never creates one (that needs a tap first). */
export function existingAudio() {
  return ctx
}

export function isRunning() {
  return ctx?.state === 'running'
}

/** Called whenever the audio context becomes available. */
export function onAudioReady(fn) {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function midiToFreq(m) {
  return 440 * Math.pow(2, (m - 69) / 12)
}
