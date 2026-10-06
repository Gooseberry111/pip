// Sound effects, built from the soft instruments in synth.js.
// Everything sits in C major pentatonic so effects always harmonise with the music.
import { buses, getAudio, midiToFreq } from './audio'
import { marimba, kalimba, bell, bubble, tok, shaker, rustle, breath, bass } from './synth'

let enabled = true

export function setSoundEnabled(on) {
  enabled = on
}

const f = midiToFreq
const PENTA_HIGH = [84, 86, 88, 91, 93, 96] // C6 D6 E6 G6 A6 C7
const pickHigh = () => PENTA_HIGH[Math.floor(Math.random() * 4)]

const sounds = {
  // every tap: a little wooden bead with a whisper of a thumb piano
  tap(out, t) {
    tok(out, t, { pitch: 0.95 + Math.random() * 0.1, vol: 0.05 })
    kalimba(out, f(pickHigh()), t + 0.005, { vol: 0.012, decay: 0.35 })
  },
  select(out, t) {
    kalimba(out, f(79), t, { vol: 0.05, decay: 0.7 })
    kalimba(out, f(84), t + 0.08, { vol: 0.05, decay: 0.9 })
  },
  toggleOn(out, t) {
    kalimba(out, f(72), t, { vol: 0.045, decay: 0.5 })
    kalimba(out, f(79), t + 0.07, { vol: 0.045, decay: 0.7 })
  },
  toggleOff(out, t) {
    kalimba(out, f(79), t, { vol: 0.04, decay: 0.5 })
    kalimba(out, f(72), t + 0.07, { vol: 0.04, decay: 0.6 })
  },
  // water pouring: a run of little bubbles and a soft shimmer
  water(out, t) {
    for (let i = 0; i < 9; i++) {
      bubble(out, t + i * 0.085 + Math.random() * 0.03, { freq: 380 + Math.random() * 520, vol: 0.035, rise: 1.8 + Math.random() })
    }
    for (let i = 0; i < 6; i++) shaker(out, t + 0.1 + i * 0.12, { vol: 0.008 })
  },
  grow(out, t) {
    ;[72, 76, 79, 84].forEach((m, i) => marimba(out, f(m), t + i * 0.1, { vol: 0.06 }))
    bell(out, f(96), t + 0.42, { vol: 0.025, decay: 2 })
  },
  unlock(out, t) {
    bell(out, f(91), t, { vol: 0.035 })
    bell(out, f(96), t + 0.12, { vol: 0.03, decay: 2.2 })
  },
  // poking Pip: a happy little bubble
  boop(out, t) {
    bubble(out, t, { freq: 340 + Math.random() * 60, vol: 0.06, rise: 2.6, decay: 0.12 })
  },
  // catching: climbs the scale as the combo grows
  catch(out, t, { combo = 0, golden = false } = {}) {
    const scale = [72, 74, 76, 79, 81, 84, 86, 88, 91]
    const m = scale[Math.min(combo, scale.length - 1)]
    kalimba(out, f(m), t, { vol: 0.06, decay: 0.8 })
    bubble(out, t, { freq: 600, vol: 0.015, rise: 1.8 })
    if (golden) bell(out, f(m + 12), t + 0.05, { vol: 0.03, decay: 1.6 })
  },
  // something to avoid: a soft, low, slightly sad "bwomp"
  oops(out, t) {
    bass(out, f(43), t, { vol: 0.12, decay: 0.45 })
    marimba(out, f(58), t + 0.02, { vol: 0.04, decay: 0.4 })
    marimba(out, f(55), t + 0.14, { vol: 0.04, decay: 0.5 })
  },
  flip(out, t) {
    rustle(out, t, { vol: 0.035, decay: 0.09, from: 2600, to: 1200 })
    tok(out, t + 0.02, { pitch: 1.2, vol: 0.025 })
  },
  match(out, t) {
    kalimba(out, f(88), t, { vol: 0.055 })
    bell(out, f(91), t + 0.1, { vol: 0.03, decay: 1.6 })
  },
  miss(out, t) {
    marimba(out, f(62), t, { vol: 0.04, decay: 0.35 })
    marimba(out, f(60), t + 0.09, { vol: 0.035, decay: 0.4 })
  },
  petals(out, t) {
    ;[88, 91, 96].forEach((m, i) => bell(out, f(m), t + i * 0.07, { vol: 0.022, decay: 1.4 }))
  },
  tear(out, t) {
    rustle(out, t, { vol: 0.07, decay: 0.22, from: 1800, to: 450 })
    rustle(out, t + 0.06, { vol: 0.04, decay: 0.16, from: 2600, to: 900 })
  },
  breath(out, t, { rising = true } = {}) {
    breath(out, t, { rising, length: rising ? 3.6 : 5.4, vol: 0.05 })
  },
  tick(out, t) {
    tok(out, t, { pitch: 1.45, vol: 0.05 })
  },
  go(out, t) {
    marimba(out, f(84), t, { vol: 0.07 })
    bell(out, f(91), t + 0.03, { vol: 0.03 })
  },
  win(out, t) {
    ;[72, 76, 79, 84, 88].forEach((m, i) => marimba(out, f(m), t + i * 0.085, { vol: 0.055 }))
    bell(out, f(96), t + 0.45, { vol: 0.03, decay: 2.2 })
    bass(out, f(48), t + 0.34, { vol: 0.08, decay: 1.2 })
  },
  lose(out, t) {
    ;[76, 72, 69].forEach((m, i) => marimba(out, f(m), t + i * 0.17, { vol: 0.05, decay: 0.8 }))
  },
  star(out, t, { index = 0 } = {}) {
    bell(out, f([84, 88, 91][index] ?? 91), t, { vol: 0.04, decay: 1.6 })
    kalimba(out, f([72, 76, 79][index] ?? 79), t, { vol: 0.03 })
  },
  // a music box note, used by Flower Song
  note(out, t, { midi = 72 } = {}) {
    kalimba(out, f(midi), t, { vol: 0.09, decay: 1.4 })
    bell(out, f(midi + 12), t, { vol: 0.012, decay: 0.9, index: 1.2 })
  },
  hint(out, t) {
    ;[91, 96, 100, 103].forEach((m, i) => bell(out, f(m), t + i * 0.05, { vol: 0.02, decay: 1 }))
  },
  // a new level opens: a bright little fanfare with a sparkle on top
  levelUp(out, t) {
    ;[67, 72, 76, 79, 84].forEach((m, i) => marimba(out, f(m), t + i * 0.075, { vol: 0.06 }))
    ;[88, 91, 96].forEach((m, i) => bell(out, f(m), t + 0.42 + i * 0.06, { vol: 0.03, decay: 2 }))
    bass(out, f(48), t + 0.36, { vol: 0.1, decay: 1.4 })
  },
  // a lock popping open
  unlockPop(out, t) {
    bubble(out, t, { freq: 320, vol: 0.06, rise: 3, decay: 0.12 })
    bell(out, f(96), t + 0.08, { vol: 0.03, decay: 1.4 })
  },
}

/** Play a named sound. `on` lets callers pass the user's preference explicitly. */
export function playSound(name, on = true, options) {
  if (!enabled || !on) return
  try {
    const ac = getAudio()
    if (!ac || !sounds[name]) return
    sounds[name](buses().sfx, ac.currentTime + 0.005, options)
  } catch {
    // Sound is a nice extra; never let it break anything.
  }
}
