// Farm animals, built from simple shapes. Each one wanders, grazes or paddles about inside an
// area it's given, so the farm feels alive. Every model faces +x when its rotation is 0.
import { box, rbox, cyl, ball, group, dynamic } from './kit'

// cone helper (kit has cyl with rt = 0)
function cone(r, h, color, at) {
  return cyl(0, r, h, color, at, 8)
}

function legs(color, xs, zs, h = 0.08, r = 0.018) {
  const out = []
  for (const x of xs) for (const z of zs) out.push(cyl(r, r, h, color, { x, z }, 6))
  return out
}

export function hen(color = '#FFFDF8') {
  return group(
    ...legs('#F2B544', [0], [-0.025, 0.025], 0.06, 0.008),
    ball(0.075, color, { y: 0.11, s: [1.2, 1, 0.9] }),
    ball(0.045, color, { x: 0.07, y: 0.18 }),
    cone(0.018, 0.04, '#F2B544', { x: 0.115, y: 0.17, rz: -Math.PI / 2 }),
    box(0.03, 0.03, 0.012, '#E35D4B', { x: 0.075, y: 0.215 }),
    ball(0.035, color, { x: -0.08, y: 0.15, s: [0.8, 1.2, 0.6] }),
  )
}

export function chick() {
  return group(ball(0.04, '#F6D266', { y: 0.05 }), ball(0.028, '#F6D266', { x: 0.03, y: 0.09 }), cone(0.01, 0.02, '#EE9447', { x: 0.06, y: 0.09, rz: -Math.PI / 2 }))
}

export function cow() {
  const spots = '#3E2F25'
  return group(
    ...legs('#F4EFE6', [-0.11, 0.11], [-0.06, 0.06], 0.13, 0.022),
    rbox(0.34, 0.16, 0.18, '#FFFFFF', { y: 0.12 }, 0.05),
    box(0.1, 0.004, 0.1, spots, { x: -0.05, y: 0.281 }),
    box(0.006, 0.08, 0.07, spots, { x: -0.02, y: 0.16, z: 0.088 }),
    box(0.006, 0.07, 0.06, spots, { x: 0.08, y: 0.17, z: -0.088 }),
    rbox(0.12, 0.11, 0.11, '#FFFFFF', { x: 0.2, y: 0.2 }, 0.04),
    rbox(0.05, 0.06, 0.1, '#F3B9B5', { x: 0.27, y: 0.19 }, 0.02),
    cyl(0.008, 0.012, 0.05, '#E8D3B5', { x: 0.2, y: 0.3, z: 0.04, rx: -0.4 }, 6),
    cyl(0.008, 0.012, 0.05, '#E8D3B5', { x: 0.2, y: 0.3, z: -0.04, rx: 0.4 }, 6),
    cyl(0.006, 0.01, 0.12, '#FFFFFF', { x: -0.17, y: 0.16, rz: 0.4 }, 5),
  )
}

export function sheep() {
  return group(
    ...legs('#3E2F25', [-0.07, 0.07], [-0.045, 0.045], 0.09, 0.015),
    ball(0.12, '#F4EFE6', { y: 0.17, s: [1.25, 0.95, 0.95] }, 1),
    ball(0.07, '#F4EFE6', { x: -0.05, y: 0.24 }, 1),
    ball(0.06, '#F4EFE6', { x: 0.07, y: 0.25 }, 1),
    rbox(0.08, 0.08, 0.07, '#3E2F25', { x: 0.17, y: 0.18 }, 0.03),
    box(0.04, 0.012, 0.03, '#3E2F25', { x: 0.17, y: 0.22, z: 0.05, rx: 0.4 }),
    box(0.04, 0.012, 0.03, '#3E2F25', { x: 0.17, y: 0.22, z: -0.05, rx: -0.4 }),
  )
}

export function pig() {
  return group(
    ...legs('#E89A9E', [-0.08, 0.08], [-0.05, 0.05], 0.07, 0.02),
    ball(0.11, '#F4AEB2', { y: 0.14, s: [1.4, 1, 1] }, 2),
    cyl(0.04, 0.04, 0.03, '#E8898F', { x: 0.17, y: 0.14, rz: -Math.PI / 2 }, 10),
    cone(0.03, 0.05, '#F4AEB2', { x: 0.1, y: 0.23, z: 0.045, rx: 0.3 }),
    cone(0.03, 0.05, '#F4AEB2', { x: 0.1, y: 0.23, z: -0.045, rx: -0.3 }),
    ball(0.012, '#3E2F25', { x: 0.135, y: 0.18, z: 0.04 }, 0),
    ball(0.012, '#3E2F25', { x: 0.135, y: 0.18, z: -0.04 }, 0),
  )
}

export function goat() {
  return group(
    ...legs('#D9CFC0', [-0.07, 0.07], [-0.04, 0.04], 0.12, 0.014),
    rbox(0.22, 0.11, 0.11, '#F4EFE6', { y: 0.12 }, 0.04),
    rbox(0.08, 0.09, 0.07, '#F4EFE6', { x: 0.13, y: 0.22 }, 0.03),
    cone(0.012, 0.07, '#9C7351', { x: 0.12, y: 0.27, z: 0.02, rz: 0.5 }),
    cone(0.012, 0.07, '#9C7351', { x: 0.12, y: 0.27, z: -0.02, rz: 0.5 }),
    cone(0.012, 0.04, '#D9CFC0', { x: 0.17, y: 0.16, rz: Math.PI }),
  )
}

export function horse() {
  return group(
    ...legs('#6B4A33', [-0.13, 0.13], [-0.05, 0.05], 0.22, 0.022),
    rbox(0.4, 0.16, 0.16, '#9C6B45', { y: 0.2 }, 0.06),
    rbox(0.08, 0.2, 0.08, '#9C6B45', { x: 0.2, y: 0.28, rz: -0.5 }, 0.03),
    rbox(0.16, 0.08, 0.08, '#9C6B45', { x: 0.29, y: 0.42, rz: -0.35 }, 0.03),
    box(0.16, 0.06, 0.03, '#4A3426', { x: 0.17, y: 0.38, rz: -0.6 }),
    cyl(0.02, 0.04, 0.2, '#4A3426', { x: -0.22, y: 0.14, rz: 0.4 }, 6),
  )
}

export function bunny(color = '#FFFDF8') {
  return group(
    ball(0.06, color, { y: 0.06, s: [1.2, 1, 1] }, 2),
    ball(0.04, color, { x: 0.06, y: 0.1 }, 2),
    box(0.016, 0.07, 0.03, color, { x: 0.05, y: 0.13, z: 0.015, rz: -0.2 }),
    box(0.016, 0.07, 0.03, color, { x: 0.05, y: 0.13, z: -0.015, rz: -0.2 }),
    ball(0.02, '#FFFFFF', { x: -0.07, y: 0.07 }, 1),
  )
}

export function duck() {
  return group(
    ball(0.07, '#F6D266', { y: 0.05, s: [1.3, 0.8, 1] }, 2),
    ball(0.04, '#F6D266', { x: 0.07, y: 0.11 }, 2),
    box(0.04, 0.012, 0.03, '#EE9447', { x: 0.115, y: 0.105 }),
    cone(0.03, 0.05, '#F6D266', { x: -0.09, y: 0.07, rz: Math.PI / 2 + 0.6 }),
  )
}

export function dog() {
  return group(
    ...legs('#C98A52', [-0.07, 0.07], [-0.035, 0.035], 0.08, 0.015),
    rbox(0.22, 0.09, 0.09, '#D9A066', { y: 0.08 }, 0.035),
    rbox(0.09, 0.08, 0.08, '#D9A066', { x: 0.13, y: 0.15 }, 0.03),
    box(0.05, 0.04, 0.05, '#F4E2C8', { x: 0.18, y: 0.14 }),
    ball(0.012, '#3E2F25', { x: 0.205, y: 0.165 }, 0),
    box(0.02, 0.06, 0.03, '#8C5A33', { x: 0.12, y: 0.17, z: 0.045, rx: 0.4 }),
    box(0.02, 0.06, 0.03, '#8C5A33', { x: 0.12, y: 0.17, z: -0.045, rx: -0.4 }),
    cyl(0.01, 0.012, 0.09, '#D9A066', { x: -0.12, y: 0.12, rz: 0.9 }, 5),
  )
}

export function cat(color = '#EE9447') {
  return group(
    ball(0.07, color, { y: 0.06, s: [1.5, 0.8, 1] }, 2),
    ball(0.045, color, { x: 0.1, y: 0.08 }, 2),
    cone(0.018, 0.035, color, { x: 0.1, y: 0.115, z: 0.022 }),
    cone(0.018, 0.035, color, { x: 0.1, y: 0.115, z: -0.022 }),
    cyl(0.012, 0.012, 0.14, color, { x: -0.09, y: 0.03, rz: Math.PI / 2 + 0.2, ry: 0.6 }, 5),
  )
}

export function bee() {
  return group(ball(0.025, '#F6C443', { s: [1.4, 1, 1] }, 1), box(0.012, 0.05, 0.054, '#2E2219', {}), ball(0.02, '#FFFFFF', { y: 0.025, s: [1, 0.4, 1.6] }, 0))
}

// ---- moving about ----
/**
 * Make a creature wander inside a box (in the parent model's space).
 * area: { x0, x1, z0, z1 }, speed in units a second, style: 'walk' | 'peck' | 'graze' | 'hop' | 'swim'
 */
export function wander(model, area, { speed = 0.25, style = 'walk', seed = 1 } = {}) {
  let rand = seed * 9301 + 49297
  const r = () => ((rand = (rand * 9301 + 49297) % 233280) / 233280)
  const s = {
    x: area.x0 + r() * (area.x1 - area.x0),
    z: area.z0 + r() * (area.z1 - area.z0),
    tx: 0,
    tz: 0,
    rest: r() * 2,
    heading: r() * Math.PI * 2,
  }
  const pickTarget = () => {
    s.tx = area.x0 + r() * (area.x1 - area.x0)
    s.tz = area.z0 + r() * (area.z1 - area.z0)
  }
  pickTarget()
  return dynamic(model, (node, t, dt) => {
    if (s.rest > 0) {
      s.rest -= dt
      // little idle motions
      if (style === 'peck') node.rotation.z = Math.max(0, Math.sin(t * 9 + seed)) * -0.5
      else if (style === 'graze') node.rotation.z = -0.12 + Math.sin(t * 1.5 + seed) * 0.05
      else node.rotation.z = 0
      node.position.y = style === 'swim' ? Math.sin(t * 2 + seed) * 0.01 : 0
    } else {
      const dx = s.tx - s.x
      const dz = s.tz - s.z
      const d = Math.hypot(dx, dz)
      if (d < 0.03) {
        s.rest = style === 'walk' ? 1 + r() * 3 : 0.8 + r() * 2.5
        pickTarget()
      } else {
        const step = Math.min(d, speed * dt)
        s.x += (dx / d) * step
        s.z += (dz / d) * step
        const want = Math.atan2(-dz, dx)
        let diff = want - s.heading
        diff = Math.atan2(Math.sin(diff), Math.cos(diff))
        s.heading += diff * Math.min(1, dt * 8)
        node.rotation.z = 0
        node.position.y = style === 'hop' ? Math.abs(Math.sin(t * 9 + seed)) * 0.06 : style === 'swim' ? 0 : Math.abs(Math.sin(t * 14 + seed)) * 0.012
      }
    }
    node.position.x = s.x
    node.position.z = s.z
    node.rotation.y = s.heading
  })
}

/** Something that circles a point (bees round a hive). */
export function orbit(model, { r = 0.25, y = 0.4, speed = 2, phase = 0 } = {}) {
  return dynamic(model, (node, t) => {
    const a = t * speed + phase
    node.position.set(Math.cos(a) * r, y + Math.sin(t * 3 + phase) * 0.05, Math.sin(a) * r)
    node.rotation.y = -a
  })
}


