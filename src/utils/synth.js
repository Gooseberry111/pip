// Small synthesised instruments shared by the sound effects and the music.
// Each takes an output node, a frequency and a start time (in AudioContext seconds).
import { getAudio } from './audio'

let noise = null

function noiseBuffer(ac) {
  if (noise) return noise
  noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate)
  const data = noise.getChannelData(0)
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1
  return noise
}

/** A percussive envelope: quick rise, smooth exponential fall. */
function perc(gain, t, peak, attack, decay) {
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.linearRampToValueAtTime(peak, t + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
}

function partial(ac, out, { freq, t, vol, attack = 0.004, decay, type = 'sine', endFreq, detune = 0 }) {
  const osc = ac.createOscillator()
  const g = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, t)
  if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t + attack + decay)
  osc.detune.value = detune
  perc(g, t, vol, attack, decay)
  osc.connect(g).connect(out)
  osc.start(t)
  osc.stop(t + attack + decay + 0.05)
}

function ready() {
  return getAudio()
}

// ---- melodic ----

/** Warm wooden mallet with a bright little click. */
export function marimba(out, freq, t, { vol = 0.07, decay = 0.7 } = {}) {
  const ac = ready()
  partial(ac, out, { freq, t, vol, decay })
  partial(ac, out, { freq: freq * 3.99, t, vol: vol * 0.16, decay: decay * 0.16 })
  partial(ac, out, { freq: freq * 9.8, t, vol: vol * 0.04, decay: decay * 0.05 })
}

/** Soft thumb piano: round, with a gentle shimmer. */
export function kalimba(out, freq, t, { vol = 0.07, decay = 1.1 } = {}) {
  const ac = ready()
  partial(ac, out, { freq, t, vol, attack: 0.003, decay, endFreq: freq * 0.998 })
  partial(ac, out, { freq: freq * 2.01, t, vol: vol * 0.1, attack: 0.003, decay: decay * 0.35 })
  partial(ac, out, { freq: freq * 5.43, t, vol: vol * 0.05, attack: 0.002, decay: decay * 0.12 })
}

/** Glassy FM bell. */
export function bell(out, freq, t, { vol = 0.045, decay = 1.8, ratio = 3.5, index = 2.2 } = {}) {
  const ac = ready()
  const carrier = ac.createOscillator()
  const mod = ac.createOscillator()
  const modGain = ac.createGain()
  const g = ac.createGain()
  carrier.frequency.value = freq
  mod.frequency.value = freq * ratio
  modGain.gain.setValueAtTime(freq * index, t)
  modGain.gain.exponentialRampToValueAtTime(freq * 0.05, t + decay)
  mod.connect(modGain).connect(carrier.frequency)
  perc(g, t, vol, 0.004, decay)
  carrier.connect(g).connect(out)
  carrier.start(t)
  mod.start(t)
  carrier.stop(t + decay + 0.1)
  mod.stop(t + decay + 0.1)
}

/** Mellow electric piano (a soft FM tine with a touch of chorus). */
export function epiano(out, freq, t, { vol = 0.035, decay = 2.2 } = {}) {
  const ac = ready()
  for (const detune of [-4, 4]) {
    const carrier = ac.createOscillator()
    const mod = ac.createOscillator()
    const modGain = ac.createGain()
    const g = ac.createGain()
    carrier.frequency.value = freq
    carrier.detune.value = detune
    mod.frequency.value = freq
    modGain.gain.setValueAtTime(freq * 1.1, t)
    modGain.gain.exponentialRampToValueAtTime(freq * 0.08, t + 0.9)
    mod.connect(modGain).connect(carrier.frequency)
    perc(g, t, vol, 0.008, decay)
    carrier.connect(g).connect(out)
    carrier.start(t)
    mod.start(t)
    carrier.stop(t + decay + 0.1)
    mod.stop(t + decay + 0.1)
  }
}

/** A soft, slow pad: detuned saws through a dark filter. */
export function pad(out, freq, t, { vol = 0.018, length = 3, attack = 0.8 } = {}) {
  const ac = ready()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 700
  filter.Q.value = 0.5
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + attack)
  g.gain.setValueAtTime(vol, t + Math.max(attack, length - 0.8))
  g.gain.exponentialRampToValueAtTime(0.0001, t + length + 0.6)
  filter.connect(g).connect(out)
  for (const detune of [-7, 0, 7]) {
    const osc = ac.createOscillator()
    osc.type = 'sawtooth'
    osc.frequency.value = freq
    osc.detune.value = detune
    osc.connect(filter)
    osc.start(t)
    osc.stop(t + length + 0.7)
  }
}

/** Round, soft bass. */
export function bass(out, freq, t, { vol = 0.09, decay = 0.9 } = {}) {
  const ac = ready()
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 420
  filter.connect(out)
  partial(ac, filter, { freq, t, vol, attack: 0.015, decay })
  partial(ac, filter, { freq, t, vol: vol * 0.35, attack: 0.015, decay: decay * 0.6, type: 'triangle' })
}

// ---- textures ----

function noiseHit(out, t, { vol, decay, type = 'bandpass', freq = 2000, q = 1, endFreq, attack = 0.002 }) {
  const ac = ready()
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  const filter = ac.createBiquadFilter()
  filter.type = type
  filter.frequency.setValueAtTime(freq, t)
  if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, t + attack + decay)
  filter.Q.value = q
  const g = ac.createGain()
  perc(g, t, vol, attack, decay)
  src.connect(filter).connect(g).connect(out)
  src.start(t, Math.random() * 0.5)
  src.stop(t + attack + decay + 0.05)
}

/** A soft wooden "tok", like tapping a little wooden bead. */
export function tok(out, t, { pitch = 1, vol = 0.06 } = {}) {
  const ac = ready()
  partial(ac, out, { freq: 900 * pitch, endFreq: 520 * pitch, t, vol, attack: 0.002, decay: 0.07 })
  noiseHit(out, t, { vol: vol * 0.35, decay: 0.025, freq: 2600 * pitch, q: 2 })
}

/** A water bubble: a quick rising chirp. */
export function bubble(out, t, { freq = 500, vol = 0.05, rise = 2.3, decay = 0.09 } = {}) {
  const ac = ready()
  partial(ac, out, { freq, endFreq: freq * rise, t, vol, attack: 0.004, decay })
}

/** A soft shaker grain. */
export function shaker(out, t, { vol = 0.012, decay = 0.06 } = {}) {
  noiseHit(out, t, { vol, decay, type: 'highpass', freq: 6500, q: 0.6, attack: 0.008 })
}

/** Paper rustling. */
export function rustle(out, t, { vol = 0.05, decay = 0.2, from = 1600, to = 500 } = {}) {
  noiseHit(out, t, { vol, decay, freq: from, endFreq: to, q: 0.9, attack: 0.01 })
}

/** A breath: filtered air that swells in or out. */
export function breath(out, t, { rising = true, length = 2.6, vol = 0.05 } = {}) {
  const ac = ready()
  const src = ac.createBufferSource()
  src.buffer = noiseBuffer(ac)
  src.loop = true
  const filter = ac.createBiquadFilter()
  filter.type = 'lowpass'
  filter.Q.value = 0.7
  filter.frequency.setValueAtTime(rising ? 300 : 1400, t)
  filter.frequency.exponentialRampToValueAtTime(rising ? 1400 : 280, t + length)
  const g = ac.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(vol, t + length * 0.45)
  g.gain.exponentialRampToValueAtTime(0.0001, t + length)
  src.connect(filter).connect(g).connect(out)
  src.start(t)
  src.stop(t + length + 0.1)
}
