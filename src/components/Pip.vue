<script setup>
// Pip, drawn live in SVG so growth, drooping and equipped items all change smoothly.
// Coordinates: 200 x 250 canvas; the plant grows from the soil at (100, 171).
import { computed, ref, onMounted, onBeforeUnmount, useId } from 'vue'
import { useTween } from '@/animations/useTween'
import { STEM_COLOR, STEM_DARK, tiredTint } from '@/utils/shapes'
import PotArt from './art/PotArt.vue'
import LeafArt from './art/LeafArt.vue'
import FlowerArt from './art/FlowerArt.vue'

const props = defineProps({
  growth: { type: Number, default: 1 }, // 0 seed … 5 flowering (continuous)
  droop: { type: Number, default: 0 }, // 0 upright … 1 tired
  health: { type: String, default: 'healthy' },
  pot: { type: String, default: 'terracotta' },
  leaf: { type: String, default: 'classic' },
  flower: { type: String, default: null },
  sleeping: { type: Boolean, default: false },
  calm: { type: Boolean, default: false }, // eyes softly closed, content (breathing together)
  wet: { type: Boolean, default: false }, // just watered: darker soil, dewdrops
  idle: { type: Boolean, default: true }, // occasional stretches and wiggles
  interactive: { type: Boolean, default: true }, // eyes follow the pointer, can be petted
  still: { type: Boolean, default: false }, // a quiet snapshot: no timers, no animation
})

const emit = defineEmits(['tap', 'pet'])

const g = useTween(() => props.growth, 1.6)
const d = useTween(() => props.droop, 1.4)

const uid = useId()
const stemGradId = `${uid}-stem`
const blushId = `${uid}-blush`

const clamp = (v, min, max) => Math.max(min, Math.min(max, v))
const clamp01 = (v) => clamp(v, 0, 1)

// ---- stem ----
const HEIGHTS = [0, 34, 58, 84, 104, 112]

function lerpTable(table, x) {
  const i = clamp(Math.floor(x), 0, table.length - 1)
  const j = Math.min(table.length - 1, i + 1)
  return table[i] + (table[j] - table[i]) * (x - i)
}

const stem = computed(() => {
  const h = lerpTable(HEIGHTS, Math.min(g.value, 5)) * (1 - d.value * 0.2)
  const lean = d.value * h * 0.42
  const p1 = { x: lean, y: -h }
  const c = { x: -d.value * 8, y: -h * 0.7 }
  return { h, p1, c }
})

function pointAt(t) {
  const { p1, c } = stem.value
  const u = 1 - t
  return { x: 2 * u * t * c.x + t * t * p1.x, y: 2 * u * t * c.y + t * t * p1.y }
}

const stemPath = computed(() => {
  const { p1, c } = stem.value
  return `M0 0 Q ${c.x.toFixed(2)} ${c.y.toFixed(2)} ${p1.x.toFixed(2)} ${p1.y.toFixed(2)}`
})

const stemWidth = computed(() => 2.6 + Math.min(g.value, 5) * 0.5)
const stemLight = computed(() => tiredTint(STEM_COLOR, d.value))
const stemDark = computed(() => tiredTint(STEM_DARK, d.value))

// ---- leaves ----
// f: position along the stem, side: -1 left / 1 right, appear: growth value where it unfurls
const LEAVES = [
  { f: 0.16, side: 1, size: 31, appear: 4.0, angle: -8 },
  { f: 0.3, side: -1, size: 30, appear: 2.85, angle: -16 },
  { f: 0.4, side: 1, size: 29, appear: 3.05, angle: -18 },
  { f: 0.55, side: 1, size: 26, appear: 1.85, angle: -26 },
  { f: 0.68, side: -1, size: 25, appear: 2.05, angle: -30 },
  { f: 0.83, side: 1, size: 22, appear: 3.85, angle: -38 },
  { f: 0.88, side: -1, size: 21, appear: 4.15, angle: -40 },
  { f: 1, side: -1, size: 19, appear: 0.6, angle: -52 },
  { f: 1, side: 1, size: 19, appear: 0.6, angle: -52 },
]

const leaves = computed(() => {
  const sizeK = 0.72 + 0.28 * clamp01(g.value / 4)
  return LEAVES.map((leaf, i) => {
    const grown = clamp01((g.value - leaf.appear) / 0.45)
    if (grown <= 0) return null
    const pos = pointAt(leaf.f)
    const angle = leaf.angle + d.value * (leaf.f === 1 ? 92 : 78) + (1 - grown) * -25
    return {
      key: i,
      transform: `translate(${pos.x.toFixed(2)} ${pos.y.toFixed(2)}) scale(${leaf.side} 1) rotate(${angle.toFixed(2)})`,
      length: leaf.size * sizeK * (0.25 + 0.75 * grown),
      delay: `${(i * 0.45).toFixed(2)}s`,
      dew: i % 2 === 1,
    }
  }).filter(Boolean)
})

// ---- flowers ----
const flowerBloom = computed(() => clamp01((g.value - 2.6) / 2.2))
const mainFlower = computed(() => {
  if (!props.flower || flowerBloom.value <= 0) return null
  const { p1, c } = stem.value
  const tangent = (Math.atan2(p1.y - c.y, p1.x - c.x) * 180) / Math.PI + 90
  return {
    transform: `translate(${p1.x.toFixed(2)} ${(p1.y - 3).toFixed(2)}) rotate(${(tangent + d.value * 30).toFixed(2)})`,
    bloom: flowerBloom.value,
  }
})

const sideFlowers = computed(() => {
  const amount = clamp01((g.value - 4.85) / 0.3)
  if (!props.flower || amount <= 0) return []
  return [-1, 1].map((side) => {
    const base = pointAt(0.62)
    const tip = { x: base.x + side * 27 + d.value * 8, y: base.y - 12 + d.value * 16 }
    return {
      side,
      stalk: `M${base.x.toFixed(1)} ${base.y.toFixed(1)} Q ${(base.x + side * 4).toFixed(1)} ${(tip.y + 2).toFixed(1)} ${tip.x.toFixed(1)} ${tip.y.toFixed(1)}`,
      transform: `translate(${tip.x.toFixed(1)} ${tip.y.toFixed(1)}) rotate(${side * 22 + d.value * 30})`,
      bloom: amount,
    }
  })
})

// ---- seed ----
const seedOpacity = computed(() => 1 - clamp01((g.value - 1.1) / 0.5))

// ---- face ----
const blinking = ref(false)
const reaction = ref(null)

const face = computed(() => {
  if (props.sleeping) return { eyes: 'sleep', mouth: 'small', blush: 0.5 }
  if (props.calm) return { eyes: 'sleep', mouth: 'smile', blush: 0.75 }
  if (['happy', 'grow', 'pet'].includes(reaction.value)) return { eyes: 'happy', mouth: 'open', blush: 1 }
  if (reaction.value === 'wiggle') return { eyes: 'happy', mouth: 'smile', blush: 0.85 }
  if (props.health === 'wilting') return { eyes: 'tired', mouth: 'flat', blush: 0.45 }
  if (props.health === 'thirsty') return { eyes: 'open', mouth: 'flat', blush: 0.5 }
  return { eyes: 'open', mouth: 'smile', blush: 0.7 }
})

// ---- looking around ----
const root = ref(null)
const look = ref({ x: 0, y: 0 })
let lastPointer = 0

function lookAt(clientX, clientY) {
  const r = root.value?.getBoundingClientRect()
  if (!r) return
  const dx = (clientX - (r.left + r.width / 2)) / (r.width * 0.8)
  const dy = (clientY - (r.top + r.height * 0.82)) / (r.height * 0.8)
  look.value = { x: clamp(dx, -1, 1) * 2.2, y: clamp(dy, -1, 1) * 1.6 }
}

function onWindowPointer(e) {
  if (!props.interactive || props.sleeping) return
  lastPointer = Date.now()
  lookAt(e.clientX, e.clientY)
}

// ---- petting: stroke Pip back and forth ----
let pressed = false
let travelled = 0
let petted = 0

function onPointerDown(e) {
  pressed = true
  travelled = 0
  petted = 0
  root.value?.setPointerCapture?.(e.pointerId)
}

function onPointerMove(e) {
  if (!pressed || !props.interactive) return
  travelled += Math.abs(e.movementX ?? 0) + Math.abs(e.movementY ?? 0)
  if (travelled - petted > 70) {
    petted = travelled
    emit('pet')
  }
}

function onPointerUp() {
  if (pressed && travelled < 12) emit('tap')
  pressed = false
}

// ---- reactions ----
const REACTION_MS = { happy: 1100, grow: 1500, wiggle: 750, stretch: 1800, rustle: 2200, pet: 1300 }
let reactionTimer = null

function react(type) {
  clearTimeout(reactionTimer)
  reaction.value = null
  // next frame, so the same reaction can replay
  requestAnimationFrame(() => {
    reaction.value = type
    reactionTimer = setTimeout(() => (reaction.value = null), REACTION_MS[type] ?? 1000)
  })
}

defineExpose({ react })

// ---- idle life: blinking, glancing about, the occasional stretch ----
let blinkTimer = null
let idleTimer = null
let glanceTimer = null

function blink(ms = 130) {
  blinking.value = true
  setTimeout(() => (blinking.value = false), ms)
}

function scheduleBlink() {
  blinkTimer = setTimeout(() => {
    if (!props.sleeping) {
      blink()
      if (Math.random() < 0.2) setTimeout(() => blink(110), 280)
    }
    scheduleBlink()
  }, 2600 + Math.random() * 3800)
}

function scheduleGlance() {
  glanceTimer = setTimeout(() => {
    if (!props.sleeping && Date.now() - lastPointer > 3500) {
      look.value = Math.random() < 0.4 ? { x: 0, y: 0 } : { x: (Math.random() * 2 - 1) * 2, y: Math.random() * 1.6 - 1 }
    }
    scheduleGlance()
  }, 2200 + Math.random() * 3200)
}

function scheduleIdle() {
  idleTimer = setTimeout(() => {
    if (props.idle && !props.sleeping && !reaction.value) {
      const options = props.health === 'healthy' ? ['stretch', 'rustle', 'rustle', 'wiggle'] : ['rustle']
      react(options[Math.floor(Math.random() * options.length)])
    }
    scheduleIdle()
  }, 9000 + Math.random() * 9000)
}

onMounted(() => {
  if (props.still) return
  scheduleBlink()
  scheduleIdle()
  scheduleGlance()
  if (!props.interactive) return
  window.addEventListener('pointermove', onWindowPointer, { passive: true })
  window.addEventListener('pointerdown', onWindowPointer, { passive: true })
})

onBeforeUnmount(() => {
  clearTimeout(blinkTimer)
  clearTimeout(idleTimer)
  clearTimeout(glanceTimer)
  clearTimeout(reactionTimer)
  window.removeEventListener('pointermove', onWindowPointer)
  window.removeEventListener('pointerdown', onWindowPointer)
})
</script>

<template>
  <div
    ref="root"
    class="pip"
    :class="[reaction && `pip--${reaction}`, { 'pip--sleeping': sleeping, 'pip--interactive': interactive && !still, 'pip--still': still }]"
    role="img"
    :aria-label="`${health} plant`"
    @pointerdown="onPointerDown"
    @pointermove="onPointerMove"
    @pointerup="onPointerUp"
    @pointercancel="pressed = false"
  >
    <svg viewBox="0 0 200 250" class="block h-full w-full overflow-visible">
      <defs>
        <linearGradient :id="stemGradId" x1="0" y1="0" x2="0" y2="-110" gradientUnits="userSpaceOnUse">
          <stop offset="0" :stop-color="stemDark" />
          <stop offset="1" :stop-color="stemLight" />
        </linearGradient>
        <radialGradient :id="blushId">
          <stop offset="0" stop-color="#F09A8A" stop-opacity="0.85" />
          <stop offset="1" stop-color="#F09A8A" stop-opacity="0" />
        </radialGradient>
      </defs>

      <!-- ground shadow -->
      <ellipse cx="100" cy="236" rx="50" ry="6.5" fill="#5B4636" opacity="0.1" class="pip-shadow" />
      <ellipse cx="100" cy="235" rx="36" ry="3.5" fill="#5B4636" opacity="0.08" />

      <g class="pip-body">
        <PotArt :pot="pot" :wet="wet" />

        <!-- face -->
        <g class="pip-face" transform="translate(100 207)">
          <ellipse cx="-24" cy="6.5" rx="8" ry="5" :fill="`url(#${blushId})`" :opacity="face.blush" class="blush" />
          <ellipse cx="24" cy="6.5" rx="8" ry="5" :fill="`url(#${blushId})`" :opacity="face.blush" class="blush" />

          <g fill="#47352A" stroke="#47352A" stroke-linecap="round" stroke-linejoin="round">
            <g v-if="face.eyes === 'open'" class="eyes" :class="{ 'is-blinking': blinking }">
              <g class="pupils" :style="{ transform: `translate(${look.x}px, ${look.y}px)` }">
                <ellipse cx="-14" cy="-1" rx="4.5" ry="5" stroke="none" />
                <ellipse cx="14" cy="-1" rx="4.5" ry="5" stroke="none" />
                <circle cx="-12.4" cy="-3" r="1.75" fill="#fff" stroke="none" />
                <circle cx="15.6" cy="-3" r="1.75" fill="#fff" stroke="none" />
                <circle cx="-15.5" cy="1.4" r="0.8" fill="#fff" opacity="0.8" stroke="none" />
                <circle cx="12.5" cy="1.4" r="0.8" fill="#fff" opacity="0.8" stroke="none" />
              </g>
            </g>
            <template v-else-if="face.eyes === 'tired'">
              <path d="M-18.4 -0.6 A4.4 4.4 0 0 0 -9.6 -0.6 Z" stroke="none" />
              <path d="M9.6 -0.6 A4.4 4.4 0 0 0 18.4 -0.6 Z" stroke="none" />
              <circle cx="-12.2" cy="1" r="0.9" fill="#fff" stroke="none" opacity="0.8" />
              <circle cx="15.8" cy="1" r="0.9" fill="#fff" stroke="none" opacity="0.8" />
              <path d="M-19 -0.4 Q-14 -2.2 -9 -1.2 M9 -1.2 Q14 -2.2 19 -0.4" stroke-width="1.7" fill="none" />
            </template>
            <template v-else-if="face.eyes === 'happy'">
              <path d="M-18.5 1 Q-14 -5.5 -9.5 1 M9.5 1 Q14 -5.5 18.5 1" stroke-width="2.4" fill="none" />
            </template>
            <template v-else>
              <path d="M-18 -1.5 Q-14 2.8 -10 -1.5 M10 -1.5 Q14 2.8 18 -1.5" stroke-width="2.1" fill="none" />
            </template>

            <path v-if="face.mouth === 'smile'" d="M-4.2 6.6 Q0 10.4 4.2 6.6" stroke-width="1.9" fill="none" />
            <g v-else-if="face.mouth === 'open'">
              <path d="M-5 5.6 Q0 5 5 5.6 Q4.6 12 0 12 Q-4.6 12 -5 5.6Z" stroke-width="0.8" fill="#8E4F45" />
              <ellipse cx="0" cy="10.2" rx="2.6" ry="1.6" fill="#E9928A" stroke="none" />
            </g>
            <path v-else-if="face.mouth === 'flat'" d="M-3.2 7.6 Q0 6.6 3.2 7.6" stroke-width="1.7" fill="none" />
            <ellipse v-else cx="0" cy="7.4" rx="1.6" ry="1.9" stroke="none" />
          </g>
        </g>

        <!-- the plant -->
        <g transform="translate(100 171)">
          <g class="pip-plant">
            <!-- seed -->
            <g v-if="seedOpacity > 0" :opacity="seedOpacity" class="pip-seed">
              <ellipse cx="2" cy="-3" rx="7.5" ry="5.4" fill="#B98D66" transform="rotate(-18)" />
              <ellipse cx="-0.5" cy="-5.4" rx="3.6" ry="1.5" fill="#DDBA94" transform="rotate(-18)" opacity="0.85" />
              <path d="M-4 -1 Q2 1 8 -4" stroke="#9C734F" stroke-width="0.8" fill="none" opacity="0.6" />
            </g>

            <template v-if="stem.h > 0.5">
              <path :d="stemPath" :stroke="`url(#${stemGradId})`" :stroke-width="stemWidth" stroke-linecap="round" fill="none" />
              <path
                :d="stemPath"
                stroke="#C3DBAE"
                :stroke-width="stemWidth * 0.3"
                stroke-linecap="round"
                fill="none"
                opacity="0.45"
                transform="translate(-0.7 0)"
              />
            </template>

            <g v-for="(sf, i) in sideFlowers" :key="`sf${i}`">
              <path :d="sf.stalk" :stroke="stemLight" stroke-width="1.8" stroke-linecap="round" fill="none" />
              <g :transform="sf.transform">
                <FlowerArt :flower="flower" :bloom="sf.bloom" :size="0.55" />
              </g>
            </g>

            <g v-for="leafItem in leaves" :key="leafItem.key" :transform="leafItem.transform">
              <g class="pip-leaf" :style="{ animationDelay: leafItem.delay }">
                <LeafArt :variant="leaf" :length="leafItem.length" :droop="d" :dew="wet && leafItem.dew" />
              </g>
            </g>

            <g v-if="mainFlower" :transform="mainFlower.transform">
              <g class="pip-flower">
                <FlowerArt :flower="flower" :bloom="mainFlower.bloom" :size="1.05" />
              </g>
            </g>
          </g>
        </g>
      </g>

      <!-- sleepy z's -->
      <g v-if="sleeping" class="pip-zzz" fill="#A08A75" font-weight="800" font-family="Fredoka Variable, sans-serif">
        <text x="140" y="168" font-size="14" style="animation-delay: 0s">z</text>
        <text x="140" y="168" font-size="11" style="animation-delay: 1.3s">z</text>
        <text x="140" y="168" font-size="9" style="animation-delay: 2.6s">z</text>
      </g>
    </svg>
  </div>
</template>

<style scoped>
.pip {
  position: relative;
  transform-origin: 50% 95%;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}
.pip--interactive {
  cursor: pointer;
  touch-action: pan-y;
}

/* gentle idle breathing and sway */
.pip-body {
  transform-box: view-box;
  transform-origin: 100px 236px;
  animation: breathe 5.5s ease-in-out infinite;
}
.pip-plant {
  animation: sway 7s ease-in-out infinite;
}
.pip-leaf {
  animation: leaf-flutter 5s ease-in-out infinite;
}
.pip-flower {
  animation: flower-nod 6s ease-in-out infinite;
}
.pip-seed {
  animation: seed-wiggle 4s ease-in-out infinite;
}
.pip--sleeping .pip-body {
  animation-duration: 8s;
}
.pip--sleeping .pip-plant {
  animation-duration: 11s;
}

/* eyes: smooth blinks and glances */
.eyes {
  transform-box: fill-box;
  transform-origin: center;
  transition: transform 0.08s ease-in;
}
.eyes.is-blinking {
  transform: scaleY(0.08);
}
.pupils {
  transition: transform 0.35s cubic-bezier(0.3, 0.7, 0.4, 1);
}
.blush {
  transition: opacity 0.6s ease;
}

/* reactions */
.pip--happy {
  animation: hop 1.1s cubic-bezier(0.3, 0.7, 0.4, 1);
}
.pip--grow {
  animation: grow-pop 1.5s ease-in-out;
}
.pip--wiggle {
  animation: wiggle 0.75s ease-in-out;
}
.pip--pet .pip-body {
  animation: snuggle 0.65s ease-in-out 2;
}
.pip--stretch .pip-body {
  animation: stretch 1.8s ease-in-out;
}
.pip--rustle .pip-leaf {
  animation: leaf-rustle 0.55s ease-in-out 4;
}

/* sleepy z's float up and fade */
.pip-zzz text {
  opacity: 0;
  animation: zzz 3.9s ease-in-out infinite;
}

@keyframes breathe {
  0%, 100% { transform: scale(1, 1); }
  50% { transform: scale(1.012, 0.988); }
}
@keyframes sway {
  0%, 100% { transform: rotate(-1.6deg); }
  50% { transform: rotate(1.6deg); }
}
@keyframes leaf-flutter {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-4deg); }
}
@keyframes leaf-rustle {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-9deg); }
}
@keyframes flower-nod {
  0%, 100% { transform: rotate(-4deg); }
  50% { transform: rotate(4deg); }
}
@keyframes seed-wiggle {
  0%, 85%, 100% { transform: rotate(0deg); }
  90% { transform: rotate(-6deg); }
  95% { transform: rotate(5deg); }
}
@keyframes hop {
  0% { transform: translateY(0) scale(1, 1); }
  15% { transform: translateY(0) scale(1.05, 0.94); }
  40% { transform: translateY(-14px) scale(0.97, 1.04); }
  65% { transform: translateY(0) scale(1.03, 0.97); }
  82% { transform: translateY(-3px) scale(1, 1); }
  100% { transform: translateY(0) scale(1, 1); }
}
@keyframes grow-pop {
  0%, 100% { transform: scale(1); }
  30% { transform: scale(1.07); }
  55% { transform: scale(0.98); }
  75% { transform: scale(1.02); }
}
@keyframes wiggle {
  0%, 100% { transform: rotate(0); }
  20% { transform: rotate(-4deg); }
  45% { transform: rotate(3.5deg); }
  70% { transform: rotate(-2deg); }
  88% { transform: rotate(1deg); }
}
@keyframes snuggle {
  0%, 100% { transform: scale(1, 1) rotate(0); }
  30% { transform: scale(1.03, 0.96) rotate(-1.5deg); }
  70% { transform: scale(1.03, 0.96) rotate(1.5deg); }
}
@keyframes stretch {
  0%, 100% { transform: scale(1, 1); }
  40%, 60% { transform: scale(0.97, 1.05); }
}
@keyframes zzz {
  0% { opacity: 0; transform: translate(0, 0); }
  20% { opacity: 0.9; }
  100% { opacity: 0; transform: translate(14px, -38px); }
}

.pip--still,
.pip--still * {
  animation: none !important;
}
@media (prefers-reduced-motion: reduce) {
  .pip,
  .pip * {
    animation: none !important;
  }
}
</style>
