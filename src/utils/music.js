// Gentle background music, generated live with the Web Audio API.
// Each track is a short looping arrangement: electric piano chords, a soft bass,
// a melody on marimba, kalimba or bell, and (for the lively games) a light shaker.
// Melodies are seeded so a track always sounds like itself, with small human variations
// in timing and touch each time round.
import { onBeforeUnmount, onMounted } from 'vue'
import { buses, existingAudio, getAudio, isRunning, midiToFreq, onAudioReady } from './audio'
import { marimba, kalimba, bell, epiano, pad, bass, shaker, tok } from './synth'

// Chords as semitones above the track's root.
const I = [0, 4, 7, 11] // maj7
const ii = [2, 5, 9, 12] // min7
const IV = [5, 9, 12, 16] // maj7
const V = [7, 11, 14, 17] // dominant-ish (sus feel)
const vi = [9, 12, 16, 19] // min7
const iii = () => [4, 7, 11, 14] // min7

const TRACKS = {
  // home: a slow, cosy music box lullaby
  home: { bpm: 72, root: 60, prog: [I, vi, IV, V], lead: 'kalimba', comp: 'epiano', density: 0.28, swing: 0.14, volume: 0.6, seed: 3 },
  // Raindrop Catch: bouncy and bright
  rain: { bpm: 112, root: 62, prog: [I, V, vi, IV], lead: 'marimba', comp: 'epiano', density: 0.6, swing: 0.1, volume: 0.62, seed: 7, shaker: true, walk: true },
  // Seed Memory: thoughtful, steady
  memory: { bpm: 92, root: 65, prog: [I, ii, IV, V], lead: 'marimba', comp: 'epiano', density: 0.4, swing: 0.12, volume: 0.58, seed: 11, shaker: 'soft' },
  // Firefly Night: dreamy bells under the stars
  firefly: { bpm: 70, root: 57, prog: [vi, IV, I, V], lead: 'bell', comp: 'pad', density: 0.3, swing: 0.08, volume: 0.62, seed: 5 },
  // Seed Glide: airy and floating, with a gentle pulse
  glide: { bpm: 100, root: 64, prog: [IV, I, V, vi], lead: 'kalimba', comp: 'epiano', density: 0.45, swing: 0.08, volume: 0.58, seed: 13, shaker: 'soft' },
  // Bloom Puzzle: unhurried thinking music
  puzzle: { bpm: 80, root: 62, prog: [I, iii(), IV, V], lead: 'marimba', comp: 'epiano', density: 0.32, swing: 0.12, volume: 0.55, seed: 17 },
  // Bloom Burst: bright and bubbly
  burst: { bpm: 108, root: 65, prog: [I, vi, ii, V], lead: 'marimba', comp: 'epiano', density: 0.5, swing: 0.1, volume: 0.56, seed: 19, shaker: 'soft' },
  // Petal Pop: playful
  pop: { bpm: 100, root: 60, prog: [IV, V, iii(), vi], lead: 'kalimba', comp: 'epiano', density: 0.48, swing: 0.12, volume: 0.56, seed: 29, shaker: 'soft' },
  // Snail Race: quick and cheerful
  race: { bpm: 132, root: 62, prog: [I, IV, V, IV], lead: 'marimba', comp: 'epiano', density: 0.62, swing: 0.06, volume: 0.6, seed: 31, shaker: true, walk: true },
  // Bug Hotel: cosy thinking music
  hotel: { bpm: 84, root: 60, prog: [vi, ii, V, I], lead: 'bell', comp: 'epiano', density: 0.3, swing: 0.14, volume: 0.52, seed: 43 },
  // Rain Rhythm brings its own music, so everything else goes quiet
  silent: { silent: true, bpm: 60, root: 60, prog: [I], lead: 'bell', comp: 'pad', density: 0, swing: 0, volume: 0, seed: 1 },
  // Breathe: only a slow pad and the odd bell
  breathe: { bpm: 46, root: 57, prog: [vi, IV, I, V], lead: 'bell', comp: 'pad', density: 0.06, swing: 0, volume: 0.65, seed: 2, noBass: true },
  // Flower Song: a quiet bed so the player's notes stand out
  song: { bpm: 60, root: 60, prog: [I, IV, vi, V], lead: 'kalimba', comp: 'pad', density: 0, swing: 0, volume: 0.45, seed: 9, noBass: true },
}

const LEADS = { kalimba, marimba, bell }
const PENTA = [0, 2, 4, 7, 9]
const STEPS = 8 // eighth notes per bar

let enabled = true
let current = null
let timer = null
let nextTime = 0
let step = 0
let melody = []
const stack = ['home']

function rng(seed) {
  let s = seed * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** A seeded melody that leans on chord tones on the strong beats. */
function buildMelody(track) {
  const rand = rng(track.seed)
  const notes = []
  let idx = 5
  for (let bar = 0; bar < track.prog.length * 2; bar++) {
    const chord = track.prog[bar % track.prog.length]
    for (let s = 0; s < STEPS; s++) {
      const strong = s % 4 === 0
      if (rand() > track.density * (strong ? 1.4 : s % 2 === 0 ? 1 : 0.6)) {
        notes.push(null)
        continue
      }
      let midi
      if (strong && rand() < 0.7) {
        // a chord tone, in the melody's register
        midi = track.root + 12 + chord[Math.floor(rand() * 3)]
      } else {
        idx = Math.max(0, Math.min(9, idx + Math.round((rand() - 0.5) * 3)))
        midi = track.root + 12 + PENTA[idx % 5] + Math.floor(idx / 5) * 12
      }
      notes.push({ midi, long: rand() < 0.3 })
    }
  }
  return notes
}

function scheduleStep(track, time) {
  if (track.silent) return
  const out = buses().music
  const stepLen = 60 / track.bpm / 2
  const bar = Math.floor(step / STEPS)
  const s = step % STEPS
  const chord = track.prog[bar % track.prog.length]
  // lazy swing on the off beats, plus a touch of human looseness
  const t = time + (s % 2 === 1 ? stepLen * track.swing : 0) + (Math.random() - 0.5) * 0.008
  const touch = 0.85 + Math.random() * 0.25

  // chords
  if (track.comp === 'epiano') {
    if (s === 0) chord.forEach((n, i) => epiano(out, midiToFreq(track.root + n), t + i * 0.012, { vol: 0.022 * touch, decay: stepLen * 7 }))
    if (s === 5 && bar % 2 === 1) epiano(out, midiToFreq(track.root + chord[1] + 12), t, { vol: 0.016 * touch, decay: stepLen * 3 })
  } else if (s === 0) {
    chord.slice(0, 3).forEach((n) => pad(out, midiToFreq(track.root + n), t, { vol: 0.016, length: stepLen * 8, attack: stepLen * 2 }))
  }

  // bass: root on the one, a step toward the next chord now and then
  if (!track.noBass) {
    if (s === 0) bass(out, midiToFreq(track.root - 12 + chord[0]), t, { vol: 0.085 * touch, decay: stepLen * 3.5 })
    if (s === 4) bass(out, midiToFreq(track.root - 12 + (track.walk ? chord[2] : chord[0])), t, { vol: 0.06 * touch, decay: stepLen * 2.5 })
    if (track.walk && s === 7) bass(out, midiToFreq(track.root - 12 + chord[1]), t, { vol: 0.045 * touch, decay: stepLen })
  }

  // light percussion
  if (track.shaker === true) {
    shaker(out, t, { vol: (s % 2 ? 0.011 : 0.006) * touch })
    if (s === 2 || s === 6) tok(out, t, { pitch: 0.7, vol: 0.022 * touch })
  } else if (track.shaker === 'soft' && s % 2 === 1) {
    shaker(out, t, { vol: 0.005 * touch })
  }

  // melody
  const note = melody[step % melody.length]
  if (note) {
    const decay = stepLen * (note.long ? 3.5 : 2)
    const vol = { kalimba: 0.045, marimba: 0.045, bell: 0.026 }[track.lead] * touch
    LEADS[track.lead](out, midiToFreq(note.midi), t, { vol, decay })
  }
}

function tick() {
  const ac = existingAudio()
  const track = TRACKS[current]
  if (!ac || !track) return
  const stepLen = 60 / track.bpm / 2
  while (nextTime < ac.currentTime + 0.3) {
    scheduleStep(track, nextTime)
    nextTime += stepLen
    step += 1
  }
}

function fadeTo(value, seconds = 0.8) {
  const ac = existingAudio()
  if (!ac) return
  const g = buses().music.gain
  g.cancelScheduledValues(ac.currentTime)
  g.setValueAtTime(g.value, ac.currentTime)
  g.linearRampToValueAtTime(value, ac.currentTime + seconds)
}

function start(name) {
  const ac = existingAudio()
  if (!ac || !isRunning() || !enabled) return
  clearInterval(timer)
  current = name
  const track = TRACKS[name]
  melody = buildMelody(track)
  step = 0
  nextTime = ac.currentTime + 0.12
  fadeTo(track.volume, 1.4)
  timer = setInterval(tick, 50)
}

function stop() {
  clearInterval(timer)
  timer = null
  current = null
  fadeTo(0, 0.6)
}

function refresh() {
  const want = stack[stack.length - 1]
  if (!enabled) return stop()
  if (want !== current || !timer) {
    if (current) {
      fadeTo(0, 0.45)
      clearInterval(timer)
      timer = null
      current = null
      setTimeout(() => start(stack[stack.length - 1]), 480)
    } else {
      start(want)
    }
  }
}

onAudioReady(refresh)

export function setMusicEnabled(on) {
  enabled = on
  refresh()
}

/** Make sure music starts once the browser allows audio (call from a tap). */
export function wakeMusic() {
  getAudio()
  if (isRunning()) refresh()
}

/** Play a track while a component is on screen, then go back to the previous one. */
export function useMusic(name) {
  onMounted(() => {
    stack.push(name)
    refresh()
  })
  onBeforeUnmount(() => {
    const i = stack.lastIndexOf(name)
    if (i > 0) stack.splice(i, 1)
    refresh()
  })
}
