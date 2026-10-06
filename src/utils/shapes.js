// Small drawing helpers shared by Pip and the collection thumbnails.

const n = (v) => +v.toFixed(2)

// Each leaf is described by its upper and lower edge (cubic segments, in fractions of its
// length), running from the stem end at `start` to the tip at (1, 0) and back.
const LEAF_OUTLINES = {
  classic: {
    start: [0, 0],
    upper: [[0.22, -0.44, 0.74, -0.42, 1, 0]],
    lower: [[0.74, 0.34, 0.24, 0.36, 0, 0]],
  },
  round: {
    start: [0, 0],
    upper: [[0.08, -0.62, 1.02, -0.66, 1, 0]],
    lower: [[0.96, 0.56, 0.1, 0.52, 0, 0]],
  },
  heart: {
    start: [0.12, 0],
    upper: [[-0.06, -0.38, 0.36, -0.58, 0.56, -0.3], [0.7, -0.14, 0.88, -0.05, 1, 0]],
    lower: [[0.88, 0.05, 0.7, 0.14, 0.56, 0.3], [0.36, 0.58, -0.06, 0.38, 0.12, 0]],
  },
  rosy: {
    start: [0, 0],
    upper: [[0.2, -0.5, 0.72, -0.46, 1, 0]],
    lower: [[0.72, 0.4, 0.2, 0.42, 0, 0]],
  },
}
LEAF_OUTLINES.variegated = LEAF_OUTLINES.classic
LEAF_OUTLINES.starlight = LEAF_OUTLINES.rosy

function segs(list, L) {
  return list.map((s) => `C ${s.map((v) => n(v * L)).join(' ')}`).join(' ')
}

/** The pieces of a leaf pointing along +x: full outline, light upper half, darker lower half, veins. */
export function leafShape(variant, L) {
  const o = LEAF_OUTLINES[variant] ?? LEAF_OUTLINES.classic
  const sx = n(o.start[0] * L)
  const start = `M${sx} 0`
  const ribOut = `Q ${n(L * 0.5)} ${n(-L * 0.03)} ${n(L)} 0`
  const ribBack = `Q ${n(L * 0.5)} ${n(-L * 0.03)} ${sx} 0`
  const width = variant === 'round' ? 0.3 : variant === 'heart' ? 0.24 : 0.2
  const veins = [0.28, 0.48, 0.68].flatMap((t) => [
    `M${n(t * L)} ${n(-L * 0.02)} Q ${n((t + 0.08) * L)} ${n(-L * width * 0.6)} ${n((t + 0.16) * L)} ${n(-L * width)}`,
    `M${n(t * L)} ${n(-L * 0.01)} Q ${n((t + 0.08) * L)} ${n(L * width * 0.5)} ${n((t + 0.15) * L)} ${n(L * width * 0.85)}`,
  ])
  return {
    full: `${start} ${segs(o.upper, L)} ${segs(o.lower, L)} Z`,
    upper: `${start} ${segs(o.upper, L)} ${ribBack} Z`,
    lower: `${start} ${ribOut} ${segs(o.lower, L)} Z`,
    rib: `M${n(L * 0.06)} 0 ${ribOut}`,
    veins,
  }
}

/** Inner stripe for variegated leaves. */
export function leafStripePath(L) {
  return `M${n(L * 0.12)} 0 C ${n(L * 0.3)} ${n(-L * 0.18)} ${n(L * 0.68)} ${n(-L * 0.16)} ${n(L * 0.9)} 0 C ${n(L * 0.68)} ${n(L * 0.12)} ${n(L * 0.3)} ${n(L * 0.14)} ${n(L * 0.12)} 0 Z`
}

export const LEAF_COLORS = {
  classic: { top: '#A6C78F', bottom: '#7EA76B', vein: '#D2E3C2' },
  round: { top: '#B1CD98', bottom: '#8AB273', vein: '#D9E8CB' },
  heart: { top: '#9FC48A', bottom: '#77A165', vein: '#CFE2BF' },
  variegated: { top: '#93BA7E', bottom: '#6E995D', vein: '#E4EDD0', stripe: '#E3EDCF' },
  rosy: { top: '#9CC189', bottom: '#D9A3A2', vein: '#F2D6D2' },
  starlight: { top: '#79A894', bottom: '#557F70', vein: '#D3E8DD' },
}

export const STEM_COLOR = '#79A066'
export const STEM_DARK = '#628A52'

function hexToRgb(hex) {
  const v = parseInt(hex.slice(1), 16)
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255]
}

/** Blend two hex colours, t from 0 (a) to 1 (b). */
export function mixColor(a, b, t) {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const c = ca.map((v, i) => Math.round(v + (cb[i] - v) * t))
  return `#${c.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

/** Tired leaves fade a little toward a dry, olive tone. */
export function tiredTint(color, droop) {
  return mixColor(color, '#B9AE84', Math.max(0, droop - 0.2) * 0.5)
}
