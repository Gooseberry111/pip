// 3D models for everything on the farm. Each model stands at the centre of its footprint
// (w x h tiles, one tile = 1 unit); +z is the front, towards the camera.
import { box, rbox, cyl, ball, roof, disc, ring, group, dynamic } from './kit'
import { wander, orbit, hen, chick, cow, sheep, pig, goat, horse, bunny, duck, dog, cat } from './animals'
import { cropStage, treeById, producerById, sizeOf } from '@/utils/farmLogic'

const cone = (r, h, color, at, seg = 8) => cyl(0, r, h, color, at, seg)

const WOOD = '#B98C63'
const WOOD_DARK = '#8C6A4F'
const STONE = '#B4AC9C'

// ---------------------------------------------------------------- plots and crops
const FAMILY = {
  wheat: 'grain', corn: 'corn', sunflower: 'flower', rose: 'flower', lavender: 'flower',
  carrot: 'root', potato: 'root', tomato: 'bush', strawberry: 'bush', blueberry: 'bush', pumpkin: 'vine', watermelon: 'vine',
}
const FRUIT = { tomato: '#E35D4B', strawberry: '#E5485E', blueberry: '#5B74C9' }

function plot(o, now) {
  const wet = o.crop?.watered
  const soil = wet ? '#5E4330' : '#7A5638'
  const top = wet ? '#6F4E37' : '#8E6446'
  const parts = [
    rbox(0.9, 0.12, 0.09, WOOD, { z: -0.405 }, 0.03),
    rbox(0.9, 0.12, 0.09, WOOD, { z: 0.405 }, 0.03),
    rbox(0.09, 0.12, 0.72, WOOD, { x: -0.405 }, 0.03),
    rbox(0.09, 0.12, 0.72, WOOD, { x: 0.405 }, 0.03),
    box(0.74, 0.1, 0.74, soil),
  ]
  for (const z of [-0.24, 0, 0.24]) parts.push(rbox(0.7, 0.05, 0.13, top, { y: 0.08, z }, 0.04))
  const g = group(parts)
  if (o.crop) g.add(crop(o.crop, cropStage(o.crop, now), o.uid))
  return g
}

function crop(c, stage, uid) {
  const fam = FAMILY[c.id] ?? 'bush'
  const y = 0.12
  const parts = []
  const grid = (n) => {
    const out = []
    const step = 0.6 / n
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) out.push([-0.3 + step / 2 + i * step, -0.3 + step / 2 + j * step])
    return out
  }
  if (stage === 0) {
    for (const [x, z] of grid(3)) parts.push(ball(0.02, '#4A3426', { x, y, z }, 0))
  } else if (stage === 1) {
    for (const [x, z] of grid(3)) {
      parts.push(cyl(0.006, 0.008, 0.06, '#6E9E5C', { x, y, z }, 4))
      parts.push(ball(0.025, '#9CC584', { x: x - 0.02, y: y + 0.06, z, s: [1.4, 0.5, 0.8] }, 0))
      parts.push(ball(0.025, '#9CC584', { x: x + 0.02, y: y + 0.065, z, s: [1.4, 0.5, 0.8] }, 0))
    }
  } else {
    const ripe = stage === 3
    if (fam === 'grain') {
      for (const [x, z] of grid(4)) {
        const h = ripe ? 0.32 : 0.22
        parts.push(cyl(0.008, 0.01, h, ripe ? '#C9A646' : '#8FB86A', { x, y, z, rz: (x * 3) % 0.2 }, 4))
        if (ripe) parts.push(ball(0.025, '#E8C268', { x, y: y + h, z, s: [0.8, 2, 0.8] }, 0))
        else parts.push(ball(0.02, '#A9CC88', { x, y: y + h, z, s: [0.7, 1.6, 0.7] }, 0))
      }
    } else if (fam === 'corn') {
      for (const [x, z] of grid(2)) {
        const h = ripe ? 0.62 : 0.4
        parts.push(cyl(0.018, 0.024, h, '#7FA85C', { x, y, z }, 5))
        parts.push(box(0.2, 0.01, 0.05, '#93BD6E', { x: x + 0.08, y: y + h * 0.45, z, rz: 0.5 }))
        parts.push(box(0.2, 0.01, 0.05, '#93BD6E', { x: x - 0.08, y: y + h * 0.65, z, rz: -0.5 }))
        if (ripe) parts.push(ball(0.04, '#F2CB4C', { x: x + 0.04, y: y + h * 0.55, z: z + 0.02, s: [0.8, 1.8, 0.8] }, 1))
      }
    } else if (fam === 'flower') {
      for (const [x, z] of grid(3)) {
        const h = c.id === 'sunflower' ? (ripe ? 0.5 : 0.32) : ripe ? 0.26 : 0.18
        parts.push(cyl(0.008, 0.01, h, '#79A066', { x, y, z }, 4))
        parts.push(ball(0.03, '#93BD6E', { x: x + 0.03, y: y + h * 0.5, z, s: [1.6, 0.4, 0.8] }, 0))
        if (!ripe) parts.push(ball(0.025, '#B6D49B', { x, y: y + h, z }, 0))
        else if (c.id === 'sunflower') {
          parts.push(cyl(0.07, 0.07, 0.02, '#F4C443', { x, y: y + h, z: z + 0.01, rx: Math.PI / 2.4 }, 12))
          parts.push(cyl(0.035, 0.035, 0.025, '#8B6142', { x, y: y + h, z: z + 0.015, rx: Math.PI / 2.4 }, 10))
        } else if (c.id === 'rose') parts.push(ball(0.045, '#E05A7A', { x, y: y + h, z }, 1))
        else for (let k = 0; k < 4; k++) parts.push(ball(0.022 - k * 0.003, '#A68BD6', { x, y: y + h - 0.02 + k * 0.035, z, s: [1, 1.4, 1] }, 0))
      }
    } else if (fam === 'root') {
      for (const [x, z] of grid(3)) {
        for (let k = 0; k < 3; k++) parts.push(cone(0.02, ripe ? 0.16 : 0.11, '#7FB063', { x: x + (k - 1) * 0.025, y, z, rz: (k - 1) * 0.35 }, 4))
        if (ripe && c.id === 'carrot') parts.push(cone(0.04, 0.06, '#EE9447', { x, y: y + 0.04, z, rx: Math.PI }, 6))
        if (ripe && c.id === 'potato') parts.push(ball(0.04, '#C9A06D', { x: x + 0.04, y: y + 0.02, z: z + 0.04 }, 0))
      }
    } else if (fam === 'vine') {
      for (const [x, z] of grid(3)) parts.push(ball(0.06, '#8FB86A', { x, y: y + 0.03, z, s: [1.2, 0.5, 1.2] }, 0))
      if (ripe && c.id === 'pumpkin') {
        parts.push(ball(0.2, '#EB8C35', { y: y + 0.13, s: [1.2, 0.8, 1.2] }, 2))
        parts.push(cyl(0.02, 0.025, 0.07, '#6F8E4A', { y: y + 0.27 }, 5))
      } else if (ripe) parts.push(ball(0.2, '#5FA55A', { y: y + 0.13, s: [1.4, 0.8, 1] }, 2))
      else parts.push(ball(0.05, '#B6D49B', { y: y + 0.06 }, 0))
    } else {
      for (const [x, z] of [[-0.16, -0.12], [0.16, 0.12], [0.16, -0.16], [-0.16, 0.16]]) {
        parts.push(ball(0.14, '#7FAA5C', { x, y: y + 0.12, z }, 1, { flat: true }))
        if (ripe) for (let k = 0; k < 4; k++) parts.push(ball(c.id === 'blueberry' ? 0.03 : 0.04, FRUIT[c.id] ?? '#E35D4B', { x: x + Math.cos(k * 1.6) * 0.12, y: y + 0.12 + Math.sin(k * 2.3) * 0.06, z: z + Math.sin(k * 1.6) * 0.12 }, 1))
      }
    }
  }
  const g = group(parts)
  if (stage < 2) return g
  // crops sway in the breeze
  return dynamic(g, (node, t) => {
    node.rotation.z = Math.sin(t * 1.6 + uid) * 0.035
    node.rotation.x = Math.cos(t * 1.3 + uid) * 0.025
  })
}

// ---------------------------------------------------------------- trees
const CANOPY = {
  appletree: '#7FAF6B', cherrytree: '#A9C98C', orangetree: '#6E9E5C', peachtree: '#94BC7F', lemontree: '#A3C77F',
}
const FRUIT_TREE = { appletree: '#E35D4B', cherrytree: '#C8314B', orangetree: '#F29A38', peachtree: '#F5AE8C', lemontree: '#F2D04B' }
const SEASON_LEAF = { autumn: ['#E39A4A', '#D2773A', '#E8B24C'], winter: ['#C9D6DA', '#B5C5CA', '#DCE6E8'] }

function tree(o, now, season) {
  const t = treeById[o.type]
  const ripe = o.readyAt && now >= o.readyAt
  const blooming = !ripe && o.readyAt && o.readyAt - now < (t?.every ?? 60) * 60000 * 0.35
  const growing = !o.grown && o.plantedAt && o.readyAt > now && !o.harvested
  const scale = growing ? 0.55 + 0.45 * Math.min(1, Math.max(0, (now - o.plantedAt) / (o.readyAt - o.plantedAt))) : 1
  const leaf = SEASON_LEAF[season] ? SEASON_LEAF[season][o.uid % 3] : CANOPY[o.type] ?? '#7FAF6B'
  const dark = SEASON_LEAF[season] ? SEASON_LEAF[season][(o.uid + 1) % 3] : '#5E8E4F'
  const crown = group(
    ball(0.3, leaf, { y: 0.78 }, 1, { flat: true }),
    ball(0.22, dark, { x: -0.18, y: 0.66, z: 0.06 }, 1, { flat: true }),
    ball(0.22, leaf, { x: 0.17, y: 0.68, z: -0.05 }, 1, { flat: true }),
    ball(0.2, dark, { y: 0.62, z: 0.17 }, 1, { flat: true }),
  )
  if (ripe) for (let k = 0; k < 7; k++) crown.add(ball(0.045, FRUIT_TREE[o.type] ?? '#E35D4B', { x: Math.cos(k * 0.9) * 0.27, y: 0.62 + (k % 3) * 0.1, z: Math.sin(k * 0.9) * 0.27 + 0.05 }, 1))
  else if (blooming) for (let k = 0; k < 8; k++) crown.add(ball(0.03, '#FBE1E6', { x: Math.cos(k * 0.8) * 0.28, y: 0.64 + (k % 3) * 0.1, z: Math.sin(k * 0.8) * 0.28 }, 0))
  if (season === 'winter') crown.add(ball(0.2, '#FFFFFF', { y: 0.98, s: [1.3, 0.4, 1.3] }, 1))
  const g = group(
    disc(0.32, '#5E7E48', { y: 0.005 }, 16, { opacity: 0.35 }),
    cyl(0.05, 0.08, 0.6, '#8C6A4F', {}, 7),
    cyl(0.02, 0.03, 0.22, '#8C6A4F', { x: 0.08, y: 0.42, rz: -0.7 }, 5),
    dynamic(crown, (node, tt) => (node.rotation.z = Math.sin(tt * 0.9 + o.uid) * 0.02)),
  )
  g.scale.setScalar(scale)
  return g
}

// ---------------------------------------------------------------- buildings
function win(x, y, z, lit, w = 0.18, h = 0.16, ry = 0) {
  return group(
    box(w + 0.04, h + 0.04, 0.02, '#FFFBF4', { x, y: y - 0.02, z, ry }),
    box(w, h, 0.025, lit ? '#FFE7A0' : '#9DC4D6', { x, y, z, ry }, lit ? { emissive: '#FFC861' } : undefined),
  )
}

function barn(ctx) {
  return group(
    rbox(1.5, 0.78, 1.1, '#C9584A', { z: -0.25 }, 0.03),
    ...[-0.55, -0.28, 0.28, 0.55].map((x) => box(0.012, 0.74, 0.01, '#A9463B', { x, y: 0.02, z: 0.305 })),
    roof(1.62, 0.5, 1.26, '#8E3C33', { y: 0.78, z: -0.25 }),
    box(1.64, 0.05, 0.05, '#F6EFE2', { y: 0.78, z: 0.37 }),
    box(0.5, 0.56, 0.03, '#A84438', { y: 0.0, z: 0.31 }),
    box(0.54, 0.04, 0.035, '#F6EFE2', { y: 0.56, z: 0.315 }),
    box(0.04, 0.6, 0.035, '#F6EFE2', { x: -0.25, z: 0.315 }),
    box(0.04, 0.6, 0.035, '#F6EFE2', { x: 0.25, z: 0.315 }),
    box(0.7, 0.035, 0.03, '#F6EFE2', { y: 0.28, z: 0.32, rz: 0.84 }),
    box(0.7, 0.035, 0.03, '#F6EFE2', { y: 0.28, z: 0.32, rz: -0.84 }),
    win(0, 0.92, 0.33, ctx.lit, 0.22, 0.18),
    rbox(0.28, 0.2, 0.2, '#E8C268', { x: 0.6, z: 0.6 }, 0.05),
    rbox(0.24, 0.18, 0.2, '#E3B85A', { x: 0.62, y: 0.2, z: 0.6 }, 0.05),
  )
}

function smoke() {
  const puffs = group(...[0, 1, 2].map((k) => ball(0.06 + k * 0.02, '#FFFFFF', { y: k * 0.15 }, 1, { opacity: 0.7 })))
  return dynamic(puffs, (node, t) => {
    const k = (t * 0.4) % 1
    node.position.y = 1.3 + k * 0.25
    node.scale.setScalar(0.8 + k * 0.5)
    node.visible = true
  })
}

function kitchen(ctx) {
  return group(
    rbox(1.4, 0.62, 1.0, '#F6EBD8', { z: -0.2 }, 0.03),
    roof(1.55, 0.48, 1.18, '#D9805E', { y: 0.62, z: -0.2 }),
    rbox(0.16, 0.42, 0.16, '#B9927A', { x: 0.45, y: 0.72, z: -0.4 }, 0.02),
    rbox(0.22, 0.42, 0.04, '#9C7351', { y: 0, z: 0.3 }, 0.02),
    ball(0.015, '#F6CF6E', { x: 0.07, y: 0.22, z: 0.33 }, 0),
    win(-0.42, 0.32, 0.31, ctx.lit || ctx.busy),
    win(0.42, 0.32, 0.31, ctx.lit || ctx.busy),
    box(0.24, 0.06, 0.07, WOOD, { x: -0.42, y: 0.18, z: 0.34 }),
    box(0.24, 0.06, 0.07, WOOD, { x: 0.42, y: 0.18, z: 0.34 }),
    ...[-0.5, -0.42, -0.34, 0.34, 0.42, 0.5].map((x, i) => ball(0.025, ['#E48C9C', '#F2C66B', '#B48CD1'][i % 3], { x, y: 0.26, z: 0.35 }, 0)),
    ctx.busy ? group(smoke()).translateX(0.45).translateZ(-0.4) : null,
  )
}

function board() {
  return group(
    cyl(0.025, 0.03, 0.55, WOOD_DARK, { x: -0.28 }, 6),
    cyl(0.025, 0.03, 0.55, WOOD_DARK, { x: 0.28 }, 6),
    rbox(0.7, 0.42, 0.05, WOOD, { y: 0.24 }, 0.02),
    box(0.16, 0.14, 0.01, '#FFFBF4', { x: -0.17, y: 0.48, z: 0.03, rz: 0.08 }),
    box(0.15, 0.15, 0.01, '#FCE9EC', { x: 0.08, y: 0.47, z: 0.03, rz: -0.06 }),
    box(0.17, 0.12, 0.01, '#EAF2E1', { x: -0.02, y: 0.31, z: 0.03 }),
    box(0.12, 0.12, 0.01, '#FFF6D9', { x: 0.2, y: 0.32, z: 0.03, rz: 0.1 }),
    roof(0.84, 0.14, 0.2, '#9C7351', { y: 0.68 }),
  )
}

function fenceRun(x0, x1, z, color = WOOD) {
  const parts = []
  const n = Math.max(2, Math.round((x1 - x0) / 0.3) + 1)
  for (let i = 0; i < n; i++) parts.push(rbox(0.05, 0.22, 0.05, color, { x: x0 + ((x1 - x0) * i) / (n - 1), z }, 0.01))
  parts.push(box(x1 - x0, 0.035, 0.025, color, { x: (x0 + x1) / 2, y: 0.08, z }))
  parts.push(box(x1 - x0, 0.035, 0.025, color, { x: (x0 + x1) / 2, y: 0.16, z }))
  return parts
}
function fenceSide(x, z0, z1, color = WOOD) {
  const g = group(fenceRun(z0, z1, 0, color))
  g.rotation.y = -Math.PI / 2
  g.position.x = x
  return g
}

function yard(dirt = '#B9A27E') {
  return [disc(0.85, dirt, { y: 0.004, s: [1.05, 1, 0.55], z: 0.45 }, 24, { opacity: 0.55 })]
}

function coop(ctx, o) {
  return group(
    ...yard(),
    ...[[-0.3, -0.35], [0.3, -0.35], [-0.3, 0.05], [0.3, 0.05]].map(([x, z]) => cyl(0.025, 0.025, 0.2, WOOD_DARK, { x: x - 0.3, z: z - 0.15 }, 5)),
    rbox(0.8, 0.45, 0.6, '#F3E3C6', { x: -0.3, y: 0.2, z: -0.3 }, 0.03),
    roof(0.92, 0.32, 0.74, '#C9584A', { x: -0.3, y: 0.65, z: -0.3 }),
    box(0.2, 0.24, 0.02, '#8C6A4F', { x: -0.3, y: 0.24, z: 0.01 }),
    box(0.14, 0.02, 0.45, WOOD, { x: -0.3, y: 0.11, z: 0.2, rx: 0.45 }),
    ...fenceRun(-0.9, 0.9, 0.88),
    fenceSide(0.9, 0.1, 0.88),
    wander(hen(), { x0: -0.7, x1: 0.75, z0: 0.25, z1: 0.75 }, { speed: 0.18, style: 'peck', seed: o.uid * 3 + 1 }),
    wander(hen('#C98A52'), { x0: -0.7, x1: 0.75, z0: 0.25, z1: 0.75 }, { speed: 0.15, style: 'peck', seed: o.uid * 3 + 2 }),
    wander(chick(), { x0: -0.5, x1: 0.7, z0: 0.3, z1: 0.75 }, { speed: 0.2, style: 'peck', seed: o.uid * 3 + 3 }),
    ctx.ready ? group(...[0, 1, 2].map((k) => ball(0.035, k % 2 ? '#FFF8EA' : '#F6E7CF', { x: 0.4 + k * 0.08, y: 0.03, z: -0.1, s: [1, 1.25, 1] }, 1))) : null,
  )
}

function hive(ctx, o) {
  const working = ctx.working
  return group(
    rbox(0.5, 0.08, 0.5, WOOD_DARK, {}, 0.02),
    rbox(0.42, 0.2, 0.42, '#F2C66B', { y: 0.08 }, 0.02),
    rbox(0.4, 0.18, 0.4, '#F5D383', { y: 0.28 }, 0.02),
    rbox(0.5, 0.06, 0.5, WOOD, { y: 0.46 }, 0.02),
    box(0.12, 0.03, 0.02, '#5B4636', { y: 0.12, z: 0.215 }),
    ...(working ? [0, 1, 2].map((k) => orbit(group(ball(0.03, '#F6C443', { s: [1.4, 1, 1] }, 1), box(0.015, 0.06, 0.064, '#2E2219', {})), { r: 0.32 + k * 0.05, y: 0.45 + k * 0.08, speed: 2 + k * 0.6, phase: k * 2 + o.uid })) : []),
  )
}

function mill(ctx) {
  const blades = group(...[0, 1, 2, 3].map((k) => {
    const g = group(box(0.07, 0.62, 0.02, '#FFFBF4', { y: 0.06 }), box(0.012, 0.6, 0.025, '#B9927A', { y: 0.07 }))
    g.rotation.z = (k * Math.PI) / 2
    return g
  }), ball(0.06, '#8C6A4F', {}, 1))
  return group(
    cyl(0.42, 0.55, 1.1, '#F3E6CF', { z: -0.1 }, 10),
    cone(0.5, 0.42, '#9C7351', { y: 1.1, z: -0.1 }, 10),
    rbox(0.22, 0.36, 0.05, '#8C6A4F', { y: 0, z: 0.44 }, 0.03),
    win(0, 0.65, 0.42, ctx.lit, 0.14, 0.14),
    dynamic(blades, (node, t) => {
      if (ctx.working) node.rotation.z = -t * 1.6
    }),
  ).translateY(0)
}
function placeBlades(g) {
  // the blade hub sits on the front of the cap
  const blades = g.children.find((c) => c.userData.dynamic)
  if (blades) blades.position.set(0, 1.08, 0.38)
  return g
}

function cowshed(ctx, o) {
  return group(
    ...yard('#A9C27E'),
    rbox(1.6, 0.55, 0.7, '#E9D7B8', { z: -0.55 }, 0.03),
    roof(1.72, 0.36, 0.86, '#7E9A63', { y: 0.55, z: -0.55 }),
    box(1.0, 0.42, 0.02, '#8C6A4F', { y: 0.0, z: -0.19 }),
    ...fenceRun(-0.9, 0.9, 0.88),
    fenceSide(-0.9, -0.15, 0.88),
    fenceSide(0.9, -0.15, 0.88),
    rbox(0.4, 0.1, 0.14, WOOD, { x: 0.55, z: 0.0 }, 0.02),
    box(0.34, 0.03, 0.1, '#E8C268', { x: 0.55, y: 0.1, z: 0.0 }),
    wander(cow(), { x0: -0.6, x1: 0.6, z0: 0.2, z1: 0.7 }, { speed: 0.08, style: 'graze', seed: o.uid * 5 + 1 }),
  )
}

function sheepfold(ctx, o) {
  return group(
    ...yard('#A9C27E'),
    rbox(1.0, 0.42, 0.6, '#D9C4A6', { x: -0.35, z: -0.6 }, 0.03),
    roof(1.1, 0.3, 0.74, '#6F8E9C', { x: -0.35, y: 0.42, z: -0.6 }),
    box(0.3, 0.3, 0.02, '#8C6A4F', { x: -0.35, z: -0.29 }),
    ...fenceRun(-0.9, 0.9, 0.88, '#E9DCC6'),
    fenceSide(-0.9, -0.2, 0.88, '#E9DCC6'),
    fenceSide(0.9, -0.85, 0.88, '#E9DCC6'),
    wander(sheep(), { x0: -0.65, x1: 0.7, z0: 0.0, z1: 0.7 }, { speed: 0.09, style: 'graze', seed: o.uid * 7 + 1 }),
    wander(sheep(), { x0: -0.65, x1: 0.7, z0: 0.0, z1: 0.7 }, { speed: 0.1, style: 'graze', seed: o.uid * 7 + 2 }),
  )
}

function pigpen(ctx, o) {
  return group(
    disc(0.6, '#8A6A4A', { x: 0.1, y: 0.006, z: 0.3, s: [1.2, 1, 0.8] }, 20),
    disc(0.3, '#6F523A', { x: 0.3, y: 0.008, z: 0.4 }, 16),
    rbox(0.7, 0.36, 0.5, '#C9684F', { x: -0.5, z: -0.6 }, 0.03),
    roof(0.8, 0.26, 0.64, '#8C6A4F', { x: -0.5, y: 0.36, z: -0.6 }),
    box(0.24, 0.22, 0.02, '#5B4636', { x: -0.5, z: -0.34 }),
    rbox(0.42, 0.08, 0.14, '#8C8F94', { x: 0.45, z: -0.45 }, 0.02),
    ...fenceRun(-0.9, 0.9, 0.88),
    fenceSide(-0.9, -0.3, 0.88),
    fenceSide(0.9, -0.85, 0.88),
    wander(pig(), { x0: -0.6, x1: 0.7, z0: -0.1, z1: 0.7 }, { speed: 0.12, style: 'graze', seed: o.uid * 11 + 1 }),
    wander(pig(), { x0: -0.6, x1: 0.7, z0: -0.1, z1: 0.7 }, { speed: 0.14, style: 'walk', seed: o.uid * 11 + 2 }),
  )
}

// ---------------------------------------------------------------- decorations
function flowerHeads(points, colors) {
  return points.map(([x, z], i) => group(cyl(0.006, 0.008, 0.1, '#79A066', { x, z }, 4), ball(0.03, colors[i % colors.length], { x, y: 0.1, z }, 0)))
}

function lampLight(ctx, y, color = '#FFD27A') {
  // glow is drawn with an emissive bulb; the scene adds real light near a few lamps at night
  return ctx.lit ? ball(0.16, color, { y }, 1, { opacity: 0.25, emissive: color }) : null
}

const DECOR = {
  stonepath: () => group(...[[-0.2, -0.2], [0.2, -0.18], [-0.18, 0.2], [0.22, 0.2]].map(([x, z], i) => cyl(0.17, 0.18, 0.04, i % 2 ? '#C4B8A2' : '#CBBFA9', { x, z, s: [1, 1, 0.8] }, 8))),
  gravel: () => group(box(0.96, 0.02, 0.96, '#DCD3C2'), ...Array.from({ length: 14 }, (_, k) => ball(0.025, k % 2 ? '#BFB49F' : '#CDC3B0', { x: Math.cos(k * 2.4) * 0.35 * ((k % 4) / 4 + 0.3), y: 0.02, z: Math.sin(k * 2.4) * 0.35 * ((k % 3) / 3 + 0.4) }, 0))),
  woodpath: () => group(...[-0.36, -0.12, 0.12, 0.36].map((z, i) => rbox(0.94, 0.04, 0.2, i % 2 ? '#C49A6C' : '#B98C63', { z }, 0.015))),
  brickpath: () => group(box(0.98, 0.02, 0.98, '#A9503C'), ...[-0.36, -0.12, 0.12, 0.36].flatMap((z, r) => (r % 2 ? [-0.24, 0.24] : [-0.36, 0, 0.36]).map((x) => rbox(r % 2 ? 0.44 : 0.22, 0.04, 0.2, '#C9684F', { x, z }, 0.01)))),
  mosspath: () => group(...[[-0.2, -0.2], [0.2, -0.15], [-0.15, 0.22], [0.22, 0.22]].map(([x, z]) => group(cyl(0.16, 0.17, 0.05, '#B8B3A3', { x, z }, 7), ball(0.06, '#7FAA5C', { x: x - 0.06, y: 0.05, z, s: [1, 0.4, 1] }, 0)))),
  flowerpath: () => group(cyl(0.2, 0.21, 0.04, '#E4DCCB', { z: -0.2 }, 10), cyl(0.2, 0.21, 0.04, '#E4DCCB', { z: 0.22 }, 10), ...flowerHeads([[-0.38, -0.38], [0.38, -0.3], [-0.4, 0.1], [0.4, 0.15], [-0.35, 0.4], [0.36, 0.42]], ['#FFFDF8', '#F2B544'])),
  tilepath: () => group(box(0.98, 0.02, 0.98, '#F4EDE0'), ...[[-0.24, -0.24], [0.24, -0.24], [-0.24, 0.24], [0.24, 0.24]].map(([x, z], i) => box(0.44, 0.035, 0.44, i % 3 ? '#7CB3D6' : '#5B8FC0', { x, z }))),

  fence: () => group(fenceRun(-0.5, 0.5, 0)),
  picket: () => group(...[-0.4, -0.2, 0, 0.2, 0.4].map((x) => group(box(0.1, 0.3, 0.03, '#FFFDF8', { x }), cone(0.07, 0.07, '#FFFDF8', { x, y: 0.3 }, 4))), box(1, 0.04, 0.02, '#F3EEE4', { y: 0.1, z: -0.02 }), box(1, 0.04, 0.02, '#F3EEE4', { y: 0.22, z: -0.02 })),
  hedge: () => group(rbox(1, 0.36, 0.4, '#6E9E5C', {}, 0.15), ...[-0.33, 0, 0.33].map((x) => ball(0.16, '#7FAA5C', { x, y: 0.34 }, 1, { flat: true }))),
  stonewall: () => group(...[0, 1, 2].flatMap((r) => [-0.34, 0, 0.34].map((x, i) => rbox(0.32, 0.12, 0.28, (i + r) % 2 ? '#C4BAA6' : STONE, { x: x + (r % 2 ? 0.08 : 0), y: r * 0.12 }, 0.04)))),
  bamboo: () => group(...[-0.4, -0.2, 0, 0.2, 0.4].map((x, i) => cyl(0.04, 0.045, 0.42 + (i % 2) * 0.06, '#C9C47A', { x }, 6)), box(1, 0.03, 0.02, WOOD_DARK, { y: 0.14, z: 0.04 }), box(1, 0.03, 0.02, WOOD_DARK, { y: 0.3, z: 0.04 })),
  rosearch: () => group(cyl(0.03, 0.03, 0.7, '#FFFDF8', { x: -0.38 }, 6), cyl(0.03, 0.03, 0.7, '#FFFDF8', { x: 0.38 }, 6), ring(0.38, 0.03, '#FFFDF8', { y: 0.7, rx: -Math.PI / 2 }, undefined, Math.PI), ...Array.from({ length: 9 }, (_, k) => ball(0.05, k % 2 ? '#E05A7A' : '#7FAA5C', { x: Math.cos((k / 8) * Math.PI) * 0.38, y: 0.7 + Math.sin((k / 8) * Math.PI) * 0.3 }, 1))),

  rock: () => group(ball(0.24, '#A9A397', { y: 0.12, s: [1.2, 0.8, 1] }, 0, { flat: true }), ball(0.12, '#7FAA5C', { x: -0.05, y: 0.26, s: [1.4, 0.4, 1] }, 0, { flat: true })),
  stump: () => group(cyl(0.2, 0.24, 0.22, '#9C7351', {}, 9), cyl(0.2, 0.2, 0.012, '#D9B48A', { y: 0.22 }, 9), ...[0, 1].map((k) => group(cyl(0.015, 0.02, 0.05, '#FFF8EA', { x: 0.24, y: 0.0, z: k * 0.08 }, 5), ball(0.035, '#E35D4B', { x: 0.24, y: 0.06, z: k * 0.08, s: [1, 0.6, 1] }, 1)))),
  can: () => group(cyl(0.12, 0.13, 0.22, '#9CB5C4', {}, 12), cyl(0.012, 0.018, 0.26, '#9CB5C4', { x: 0.17, y: 0.08, rz: -0.9 }, 6), ring(0.09, 0.012, '#6F8A99', { y: 0.28, rx: Math.PI / 2 })),
  bush: () => group(ball(0.24, '#7FAA5C', { x: -0.12, y: 0.2 }, 1, { flat: true }), ball(0.24, '#7FAA5C', { x: 0.12, y: 0.2 }, 1, { flat: true }), ball(0.27, '#8FB86A', { y: 0.32 }, 1, { flat: true })),
  flowerbed: () => group(cyl(0.38, 0.4, 0.08, '#8E6446', {}, 14), ...flowerHeads([[-0.2, -0.1], [0, -0.22], [0.2, -0.08], [-0.12, 0.15], [0.14, 0.16], [0, 0]], ['#E48C9C', '#F2C66B', '#B48CD1'])),
  signpost: () => group(cyl(0.03, 0.035, 0.7, WOOD_DARK, {}, 6), rbox(0.5, 0.12, 0.03, WOOD, { x: 0.12, y: 0.55, z: 0.03 }, 0.02), rbox(0.45, 0.11, 0.03, '#C49A6C', { x: -0.1, y: 0.38, z: 0.03, ry: 0.3 }, 0.02)),
  tulips: () => group(cyl(0.36, 0.38, 0.06, '#8E6446', { s: [1.1, 1, 0.8] }, 14), ...[[-0.24, 0], [-0.08, -0.12], [0.08, 0.06], [0.24, -0.08], [0, 0.18], [0.18, 0.2]].map(([x, z], i) => group(cyl(0.008, 0.01, 0.2, '#79A066', { x, z }, 4), cyl(0.045, 0.03, 0.08, ['#E35D4B', '#F2C66B', '#E48C9C', '#B48CD1'][i % 4], { x, y: 0.2, z }, 6)))),
  haybale: () => group(rbox(0.6, 0.4, 0.42, '#E8C268', {}, 0.08), box(0.03, 0.41, 0.43, '#A88332', { x: -0.14 }), box(0.03, 0.41, 0.43, '#A88332', { x: 0.14 })),
  mailbox: () => group(cyl(0.025, 0.03, 0.45, WOOD_DARK, {}, 6), rbox(0.3, 0.18, 0.18, '#7CB3D6', { y: 0.45 }, 0.08), box(0.02, 0.14, 0.02, '#E35D4B', { x: 0.12, y: 0.6, z: 0.1 }), box(0.08, 0.05, 0.02, '#E35D4B', { x: 0.15, y: 0.72, z: 0.1 })),
  logpile: () => group(...[[-0.22, 0.09], [0, 0.09], [0.22, 0.09], [-0.11, 0.27], [0.11, 0.27], [0, 0.45]].map(([x, y]) => group(cyl(0.1, 0.1, 0.5, '#9C7351', { x, y, z: -0.25, rx: Math.PI / 2 }, 9).translateY(0)))),
  crates: () => group(...[[-0.2, 0, 0], [0.2, 0, 0.02], [0, 0.26, -0.02]].map(([x, y, z], i) => group(rbox(0.36, 0.24, 0.3, '#C49A6C', { x, y, z }, 0.02), ...[-0.1, 0, 0.1].map((dx) => ball(0.05, i === 2 ? '#F2CB4C' : '#E35D4B', { x: x + dx, y: y + 0.25, z }, 1))))),
  bench: () => group(rbox(0.85, 0.05, 0.28, WOOD, { y: 0.24 }, 0.015), rbox(0.85, 0.2, 0.04, '#C49A6C', { y: 0.32, z: -0.13 }, 0.015), ...[-0.36, 0.36].flatMap((x) => [box(0.05, 0.24, 0.05, WOOD_DARK, { x, z: 0.1 }), box(0.05, 0.5, 0.05, WOOD_DARK, { x, z: -0.12 })])),
  lamp: (ctx) => group(cyl(0.12, 0.14, 0.05, '#4A4E5A', {}, 8), cyl(0.025, 0.03, 0.9, '#4A4E5A', {}, 6), rbox(0.16, 0.18, 0.16, ctx.lit ? '#FFE9A8' : '#FBE3A0', { y: 0.9 }, 0.02, ctx.lit ? { emissive: '#FFC861' } : undefined), cone(0.14, 0.1, '#4A4E5A', { y: 1.08 }, 4), lampLight(ctx, 0.99)),
  birdhouse: () => group(cyl(0.025, 0.03, 0.6, WOOD_DARK, {}, 6), rbox(0.24, 0.22, 0.22, '#7CB3D6', { y: 0.6 }, 0.02), roof(0.3, 0.14, 0.3, '#C9584A', { y: 0.82 }), cyl(0.04, 0.04, 0.01, '#3E2F25', { y: 0.72, z: 0.11, rx: Math.PI / 2 }, 10)),
  pumpkins: () => group(ball(0.18, '#EB8C35', { x: -0.15, y: 0.13, z: 0.08, s: [1.2, 0.8, 1.2] }, 2), ball(0.15, '#F29A38', { x: 0.17, y: 0.11, z: 0.05, s: [1.2, 0.8, 1.2] }, 2), ball(0.13, '#EB8C35', { y: 0.32, z: -0.04, s: [1.2, 0.8, 1.2] }, 2), cyl(0.015, 0.02, 0.06, '#6F8E4A', { y: 0.42, z: -0.04 }, 5)),
  wheelbarrow: () => group(cyl(0.11, 0.11, 0.05, '#4A4E5A', { x: 0.3, y: 0.11, rx: Math.PI / 2 }, 12), rbox(0.5, 0.18, 0.4, '#7CB3D6', { y: 0.18 }, 0.04), ball(0.08, '#8FB86A', { x: -0.1, y: 0.37 }, 1), ball(0.08, '#E35D4B', { x: 0.08, y: 0.37 }, 1), box(0.4, 0.03, 0.03, WOOD_DARK, { x: -0.35, y: 0.25, z: 0.12 }), box(0.4, 0.03, 0.03, WOOD_DARK, { x: -0.35, y: 0.25, z: -0.12 })),
  gnome: () => group(cyl(0.1, 0.13, 0.18, '#5B74C9', {}, 10), ball(0.08, '#F3C7A9', { y: 0.25 }, 2), cone(0.09, 0.08, '#FFFDF8', { y: 0.16, z: 0.04, rx: Math.PI }, 8), cone(0.09, 0.22, '#E35D4B', { y: 0.3 }, 10)),
  lanterns: (ctx) => group(cyl(0.02, 0.025, 0.85, WOOD_DARK, { x: -0.42 }, 5), cyl(0.02, 0.025, 0.85, WOOD_DARK, { x: 0.42 }, 5), box(0.84, 0.01, 0.01, '#5B4636', { y: 0.8 }), ...[-0.22, 0, 0.22].map((x, i) => ball(0.07, ['#E35D4B', '#F2C66B', '#E48C9C'][i], { x, y: 0.7, s: [1, 1.2, 1] }, 1, ctx.lit ? { emissive: ['#E35D4B', '#F2C66B', '#E48C9C'][i] } : undefined))),
  scarecrow: () => group(cyl(0.025, 0.03, 0.9, WOOD_DARK, {}, 6), box(0.6, 0.03, 0.03, WOOD_DARK, { y: 0.6 }), rbox(0.3, 0.3, 0.14, '#5B74C9', { y: 0.38 }, 0.04), ball(0.1, '#F3E3C6', { y: 0.8 }, 1), cyl(0.18, 0.18, 0.02, '#B98C63', { y: 0.86 }, 10), cyl(0.08, 0.1, 0.1, '#B98C63', { y: 0.87 }, 10), cone(0.04, 0.12, '#E8C268', { x: 0.32, y: 0.55, rz: -1.2 }, 5), cone(0.04, 0.12, '#E8C268', { x: -0.32, y: 0.55, rz: 1.2 }, 5)),
  kennel: (ctx, o) => group(rbox(0.5, 0.36, 0.5, '#C49A6C', { z: -0.15 }, 0.03), roof(0.6, 0.24, 0.6, '#C9584A', { y: 0.36, z: -0.15 }), box(0.2, 0.22, 0.02, '#4A3426', { z: 0.11 }), wander(dog(), { x0: -0.35, x1: 0.35, z0: 0.2, z1: 0.42 }, { speed: 0.12, seed: o.uid })),
  birdbath: () => group(cyl(0.06, 0.1, 0.4, '#CBBFA9', {}, 8), cyl(0.28, 0.2, 0.08, '#CBBFA9', { y: 0.4 }, 14), disc(0.22, '#9CC7DA', { y: 0.481 }, 18), group(ball(0.05, '#E48C9C', { s: [1.3, 1, 1] }, 1), ball(0.035, '#E48C9C', { x: 0.05, y: 0.05 }, 1)).translateY(0.52).translateX(0.18)),
  cat: (ctx, o) => group(disc(0.22, '#E9D7B8', { y: 0.005 }, 16, { opacity: 0.8 }), group(cat()).rotateY(o.uid % 2 ? 0.6 : -0.6)),
  well: () => group(cyl(0.3, 0.32, 0.3, '#B4A890', {}, 12), cyl(0.24, 0.24, 0.02, '#5A7F94', { y: 0.29 }, 12), cyl(0.025, 0.025, 0.6, WOOD_DARK, { x: -0.28, y: 0.25 }, 5), cyl(0.025, 0.025, 0.6, WOOD_DARK, { x: 0.28, y: 0.25 }, 5), roof(0.7, 0.24, 0.5, '#C9584A', { y: 0.82 }), cyl(0.02, 0.02, 0.56, WOOD, { y: 0.66, rz: Math.PI / 2 }, 5)),
  topiary: () => group(cyl(0.16, 0.13, 0.22, '#C9684F', {}, 10), cyl(0.025, 0.03, 0.4, WOOD_DARK, { y: 0.2 }, 5), ball(0.2, '#6E9E5C', { y: 0.45 }, 1, { flat: true }), ball(0.13, '#7FAA5C', { y: 0.72 }, 1, { flat: true })),
  firepit: (ctx) => group(
    ...Array.from({ length: 9 }, (_, k) => ball(0.07, STONE, { x: Math.cos(k * 0.7) * 0.26, y: 0.04, z: Math.sin(k * 0.7) * 0.26 }, 0, { flat: true })),
    cyl(0.03, 0.03, 0.36, '#9C7351', { y: 0.04, rz: Math.PI / 2, ry: 0.5 }, 5),
    cyl(0.03, 0.03, 0.36, '#9C7351', { y: 0.04, rz: Math.PI / 2, ry: -0.5 }, 5),
    dynamic(group(cone(0.12, 0.3, '#F29A38', { y: 0.05 }, 6, { emissive: '#F29A38' }), cone(0.07, 0.2, '#FBE3A0', { y: 0.05 }, 6, { emissive: '#FBE3A0' })), (node, t) => node.scale.set(1, 0.85 + Math.sin(t * 13) * 0.12, 1)),
    lampLight(ctx, 0.25, '#FFB35C'),
  ),
  picnic: () => group(box(1.8, 0.015, 0.8, '#FCE9EC'), ...[-0.7, -0.35, 0, 0.35, 0.7].map((x) => box(0.16, 0.017, 0.8, '#E48C9C', { x }, { opacity: 0.85 })), rbox(0.36, 0.2, 0.26, '#C49A6C', { x: 0.45 }, 0.04), ring(0.13, 0.015, WOOD_DARK, { x: 0.45, y: 0.22, rx: Math.PI / 2 }), cyl(0.1, 0.1, 0.02, '#FFFFFF', { x: -0.45 }, 12), ball(0.05, '#F5AE8C', { x: -0.45, y: 0.04 }, 1)),
  swing: () => group(cyl(0.03, 0.035, 1.0, WOOD_DARK, { x: -0.42, rz: 0.1 }, 6), cyl(0.03, 0.035, 1.0, WOOD_DARK, { x: 0.42, rz: -0.1 }, 6), cyl(0.03, 0.03, 0.9, WOOD_DARK, { y: 0.98, rz: Math.PI / 2 }, 6), dynamic(group(box(0.01, 0.62, 0.01, '#C9B08A', { x: -0.15, y: -0.62 }), box(0.01, 0.62, 0.01, '#C9B08A', { x: 0.15, y: -0.62 }), rbox(0.38, 0.04, 0.18, '#E48C9C', { y: -0.64 }, 0.015)).translateY(0.98), (node, t) => (node.rotation.x = Math.sin(t * 1.8) * 0.18))),
  sundial: () => group(cyl(0.1, 0.12, 0.42, '#CBBFA9', {}, 8), cyl(0.28, 0.28, 0.04, '#E4DCCB', { y: 0.42 }, 16), box(0.02, 0.16, 0.16, '#C9952F', { y: 0.46, rx: 0.8 })),
  pond: (ctx, o) => group(
    cyl(0.9, 0.95, 0.06, STONE, { s: [1, 1, 0.9] }, 20),
    cyl(0.8, 0.8, 0.065, '#6FA8C2', { s: [1, 1, 0.88] }, 20, { opacity: 0.95 }),
    ...[[-0.35, 0.2], [0.3, -0.25], [0.2, 0.35]].map(([x, z]) => cyl(0.1, 0.1, 0.01, '#7FAA5C', { x, y: 0.068, z }, 10)),
    ball(0.035, '#F6C7CD', { x: 0.3, y: 0.09, z: -0.25 }, 1),
    ...Array.from({ length: 10 }, (_, k) => ball(0.09, k % 2 ? '#A9A397' : STONE, { x: Math.cos(k * 0.63) * 0.88, y: 0.05, z: Math.sin(k * 0.63) * 0.8 }, 0, { flat: true })),
    wander(duck(), { x0: -0.5, x1: 0.5, z0: -0.4, z1: 0.4 }, { speed: 0.1, style: 'swim', seed: o.uid }).translateY(0.06),
  ),
  statue: () => group(rbox(0.36, 0.24, 0.36, '#CBBFA9', {}, 0.02), ball(0.13, '#E4DCCB', { y: 0.36, s: [1, 1.1, 0.9] }, 1), ball(0.08, '#E4DCCB', { y: 0.55 }, 1), box(0.04, 0.18, 0.06, '#E4DCCB', { x: -0.03, y: 0.6 }), box(0.04, 0.18, 0.06, '#E4DCCB', { x: 0.03, y: 0.6 })),
  flowercart: () => group(rbox(1.1, 0.28, 0.5, '#C49A6C', { y: 0.2 }, 0.03), cyl(0.15, 0.15, 0.05, WOOD_DARK, { x: -0.35, y: 0.15, z: 0.28, rx: Math.PI / 2 }, 12), cyl(0.15, 0.15, 0.05, WOOD_DARK, { x: 0.35, y: 0.15, z: 0.28, rx: Math.PI / 2 }, 12), box(0.6, 0.03, 0.03, WOOD_DARK, { x: 0.8, y: 0.3, rz: -0.3 }), ...Array.from({ length: 10 }, (_, k) => ball(0.07, ['#E35D4B', '#F2C66B', '#E48C9C', '#B48CD1', '#FFFDF8'][k % 5], { x: -0.42 + (k % 5) * 0.21, y: 0.52, z: k < 5 ? -0.1 : 0.1 }, 1))),
  fountain: () => group(cyl(0.9, 0.95, 0.2, STONE, {}, 20), cyl(0.82, 0.82, 0.18, '#7FB2CB', { y: 0.03 }, 20), cyl(0.1, 0.14, 0.62, '#CBBFA9', {}, 10), cyl(0.36, 0.26, 0.1, '#CBBFA9', { y: 0.6 }, 14), cyl(0.3, 0.3, 0.02, '#9CC7DA', { y: 0.69 }, 14), dynamic(group(...Array.from({ length: 6 }, (_, k) => ball(0.03, '#E4F2F7', { x: Math.cos(k) * 0.2, y: 0.8, z: Math.sin(k) * 0.2 }, 0, { opacity: 0.8 }))), (node, t) => (node.position.y = Math.abs(Math.sin(t * 3)) * 0.06))),
  gazebo: () => group(cyl(0.95, 0.95, 0.06, '#E6DCCB', {}, 8), ...Array.from({ length: 6 }, (_, k) => cyl(0.035, 0.035, 1.0, '#FFFDF8', { x: Math.cos((k / 6) * Math.PI * 2) * 0.78, z: Math.sin((k / 6) * Math.PI * 2) * 0.78 }, 6)), cone(1.05, 0.55, '#9CB5C4', { y: 1.0 }, 6), ball(0.06, '#F2C66B', { y: 1.58 }, 1), rbox(0.6, 0.05, 0.3, WOOD, { y: 0.3, z: -0.4 }, 0.02)),
  tent: (ctx) => group(roof(1.5, 1.1, 1.6, '#EB8C35', {}), box(0.3, 0.55, 0.02, ctx.lit ? '#FFE9A8' : '#5A4636', { z: 0.7 }, ctx.lit ? { emissive: '#FFC861' } : undefined), cyl(0.012, 0.012, 0.25, WOOD_DARK, { y: 1.08, x: 0.7 }, 4), lampLight(ctx, 0.4)),
  greenhouse: () => group(rbox(1.7, 0.08, 1.4, '#C9B08A', {}, 0.02), box(1.6, 0.9, 1.3, '#D6EBF2', { y: 0.06 }, { opacity: 0.45 }), roof(1.6, 0.5, 1.3, '#D6EBF2', { y: 0.96 }, { opacity: 0.45 }), ...[-0.8, 0, 0.8].map((x) => box(0.04, 1.36, 0.04, '#FFFDF8', { x, y: 0.06, z: 0.65 })), ...[[-0.45, -0.3], [0.1, -0.3], [0.5, 0.2], [-0.3, 0.3]].map(([x, z]) => group(cyl(0.12, 0.09, 0.15, '#C9684F', { x, y: 0.08, z }, 8), ball(0.14, '#7FAA5C', { x, y: 0.32, z }, 1, { flat: true })))),
  telescope: () => group(...[0, 2.1, 4.2].map((a) => cyl(0.015, 0.02, 0.5, WOOD_DARK, { x: Math.cos(a) * 0.12, z: Math.sin(a) * 0.12, rx: Math.sin(a) * 0.3, rz: -Math.cos(a) * 0.3 }, 5)), cyl(0.07, 0.09, 0.6, '#5B74C9', { y: 0.52, rz: -0.9 }, 10), cyl(0.1, 0.1, 0.08, '#F2C66B', { x: 0.36, y: 0.74, rz: -0.9 }, 10)),
  treehouse: (ctx) => group(cyl(0.12, 0.18, 1.3, '#8C6A4F', {}, 8), ball(0.6, '#7FAA5C', { y: 1.6 }, 1, { flat: true }), ball(0.45, '#6E9E5C', { x: -0.5, y: 1.35 }, 1, { flat: true }), ball(0.45, '#6E9E5C', { x: 0.5, y: 1.4 }, 1, { flat: true }), rbox(0.9, 0.45, 0.7, '#C49A6C', { y: 0.9, z: 0.2 }, 0.03), roof(1.0, 0.32, 0.86, '#C9584A', { y: 1.35, z: 0.2 }), win(-0.2, 1.1, 0.56, ctx.lit), box(0.2, 0.3, 0.02, '#8C6A4F', { x: 0.22, y: 0.92, z: 0.56 }), ...[0, 1, 2, 3, 4].map((k) => box(0.3, 0.025, 0.04, WOOD, { x: 0.6, y: 0.15 + k * 0.16, z: 0.6 })), box(0.03, 0.85, 0.03, WOOD, { x: 0.46, z: 0.6 }), box(0.03, 0.85, 0.03, WOOD, { x: 0.74, z: 0.6 })),
  rainbow: () => group(...['#F28B82', '#F8C77A', '#F6E58D', '#9FD39B', '#8EC5E8', '#C3A8E6'].map((c, i) => {
    return ring(0.8 - i * 0.08, 0.04, c, { y: 0, rx: -Math.PI / 2 }, undefined, Math.PI)
  }), ball(0.18, '#FFFFFF', { x: -0.8, y: 0.08 }, 1), ball(0.18, '#FFFFFF', { x: 0.8, y: 0.08 }, 1)),
  snowman: () => group(ball(0.22, '#FFFFFF', { y: 0.2 }, 2), ball(0.16, '#FFFFFF', { y: 0.52 }, 2), cone(0.03, 0.12, '#EE9447', { y: 0.53, z: 0.14, rx: Math.PI / 2 }, 6), cyl(0.12, 0.12, 0.02, '#3E4A7A', { y: 0.66 }, 10), cyl(0.08, 0.08, 0.14, '#3E4A7A', { y: 0.67 }, 10), ring(0.14, 0.03, '#E35D4B', { y: 0.4 })),
  goldencan: () => group(cyl(0.12, 0.13, 0.22, '#F2C66B', {}, 12, { emissive: '#8A6A1E' }), cyl(0.012, 0.018, 0.26, '#F2C66B', { x: 0.17, y: 0.08, rz: -0.9 }, 6, { emissive: '#8A6A1E' }), ring(0.09, 0.012, '#C9952F', { y: 0.28, rx: Math.PI / 2 })),

  // animal friends
  bunnyhutch: (ctx, o) => group(rbox(0.45, 0.3, 0.32, '#C49A6C', { y: 0.1, z: -0.25 }, 0.03), ...[[-0.18, -0.36], [0.18, -0.36], [-0.18, -0.12], [0.18, -0.12]].map(([x, z]) => box(0.03, 0.1, 0.03, WOOD_DARK, { x, z })), roof(0.52, 0.18, 0.4, '#7E9A63', { y: 0.4, z: -0.25 }), box(0.3, 0.2, 0.01, '#5B4636', { y: 0.14, z: -0.085 }), wander(bunny(), { x0: -0.38, x1: 0.38, z0: 0.0, z1: 0.42 }, { speed: 0.2, style: 'hop', seed: o.uid + 1 }), wander(bunny('#C9A06D'), { x0: -0.38, x1: 0.38, z0: 0.0, z1: 0.42 }, { speed: 0.18, style: 'hop', seed: o.uid + 2 })),
  duckhouse: (ctx, o) => group(disc(0.32, '#7FB2CB', { x: 0.15, y: 0.006, z: 0.2 }, 18), rbox(0.36, 0.28, 0.3, '#F3E3C6', { x: -0.22, z: -0.25 }, 0.03), roof(0.42, 0.18, 0.38, '#5B8FC0', { x: -0.22, y: 0.28, z: -0.25 }), box(0.14, 0.16, 0.01, '#5B4636', { x: -0.22, z: -0.095 }), wander(duck(), { x0: -0.1, x1: 0.35, z0: 0.05, z1: 0.38 }, { speed: 0.1, style: 'swim', seed: o.uid + 3 }), wander(duck(), { x0: -0.35, x1: 0.35, z0: 0.0, z1: 0.4 }, { speed: 0.12, style: 'walk', seed: o.uid + 4 })),
  goats: (ctx, o) => group(...fenceRun(-0.95, 0.95, 0.42), ball(0.2, STONE, { x: 0.45, y: 0.08, z: -0.15, s: [1.4, 0.8, 1] }, 0, { flat: true }), wander(goat(), { x0: -0.8, x1: 0.8, z0: -0.35, z1: 0.3 }, { speed: 0.15, seed: o.uid + 5 }), wander(goat(), { x0: -0.8, x1: 0.8, z0: -0.35, z1: 0.3 }, { speed: 0.12, style: 'graze', seed: o.uid + 6 })),
  horse: (ctx, o) => group(disc(0.85, '#B9A27E', { y: 0.005 }, 24, { opacity: 0.4 }), ...fenceRun(-0.95, 0.95, -0.92, '#FFFDF8'), ...fenceRun(-0.95, 0.95, 0.92, '#FFFDF8'), fenceSide(-0.95, -0.92, 0.92, '#FFFDF8'), fenceSide(0.95, -0.92, 0.92, '#FFFDF8'), rbox(0.36, 0.14, 0.14, WOOD, { x: -0.55, z: -0.6 }, 0.02), wander(horse(), { x0: -0.6, x1: 0.6, z0: -0.5, z1: 0.6 }, { speed: 0.16, seed: o.uid + 7 })),
}
// the mushrooms helper above builds in place; rebuild it simply
DECOR.mushrooms = () => group(...[[-0.15, 0.1, 1], [0.15, 0.12, 0.8], [0.02, -0.15, 0.65]].map(([x, z, s]) => {
  const g = group(cyl(0.04, 0.05, 0.12, '#FFF8EA', {}, 6), ball(0.13, '#E35D4B', { y: 0.12, s: [1, 0.55, 1] }, 1), ball(0.025, '#FFFFFF', { x: 0.05, y: 0.18, z: 0.05 }, 0))
  g.position.set(x, 0, z)
  g.scale.setScalar(s)
  return g
}))

// ---------------------------------------------------------------- putting it together
/** Everything that changes how an object looks, as a string: rebuild when it changes. */
export function stateKey(o, ctx) {
  const t = ctx.now
  if (o.crop) return `${o.type}|${o.crop.id}|${cropStage(o.crop, t)}|${o.crop.watered ? 1 : 0}`
  if (treeById[o.type]) {
    const ripe = o.readyAt && t >= o.readyAt
    const bloom = !ripe && o.readyAt && o.readyAt - t < (treeById[o.type].every ?? 60) * 60000 * 0.35
    const grow = o.plantedAt && o.readyAt > t && !o.grown ? Math.floor(((t - o.plantedAt) / Math.max(1, o.readyAt - o.plantedAt)) * 5) : 'g'
    return `${o.type}|${ripe ? 'r' : bloom ? 'b' : 'n'}|${grow}|${ctx.season}`
  }
  const prod = producerById[o.type]
  if (prod) return `${o.type}|${o.readyAt && t >= o.readyAt ? 'ready' : o.readyAt ? 'work' : 'idle'}|${ctx.lit}`
  if (o.type === 'kitchen') return `kitchen|${ctx.kitchenBusy}|${ctx.lit}`
  return `${o.type}|${ctx.lit}`
}

/** Build the model for one object. Returns a Group whose origin is the footprint's centre. */
export function buildModel(o, ctx) {
  const t = ctx.now
  const prod = producerById[o.type]
  const c = {
    lit: ctx.lit,
    busy: o.type === 'kitchen' && ctx.kitchenBusy,
    working: prod && (Object.keys(prod.feed).length ? o.readyAt && t < o.readyAt : true),
    ready: prod && o.readyAt && t >= o.readyAt,
  }
  let g
  if (o.type === 'plot') g = plot(o, t)
  else if (treeById[o.type]) g = tree(o, t, ctx.season)
  else if (o.type === 'barn') g = barn(c)
  else if (o.type === 'kitchen') g = kitchen(c)
  else if (o.type === 'board') g = board()
  else if (o.type === 'coop') g = coop(c, o)
  else if (o.type === 'hive') g = hive(c, o)
  else if (o.type === 'mill') g = placeBlades(mill(c))
  else if (o.type === 'cowshed') g = cowshed(c, o)
  else if (o.type === 'sheepfold') g = sheepfold(c, o)
  else if (o.type === 'pigpen') g = pigpen(c, o)
  else if (o.type === 'pip') g = group(disc(0.3, '#000000', { y: 0.004 }, 18, { opacity: 0.12 }))
  else if (DECOR[o.type]) g = DECOR[o.type](c, o)
  else {
    // something new without a model yet: a little crate so it still shows
    const { w, h } = sizeOf(o.type)
    g = group(rbox(0.6 * w, 0.4, 0.6 * h, '#C49A6C', {}, 0.05))
  }
  return g
}

export { DECOR as DECOR_MODELS }
