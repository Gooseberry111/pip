// Photo mode: turns Pip's garden (a stack of SVG layers) into a picture with a little caption.
// Each top-level SVG is drawn onto a canvas where it sits on screen; everything else is skipped.

function svgToImage(svg, width, height) {
  const clone = svg.cloneNode(true)
  clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
  clone.setAttribute('width', String(width))
  clone.setAttribute('height', String(height))
  const src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(new XMLSerializer().serializeToString(clone))}`
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/**
 * Snap the element. Returns a PNG Blob.
 * caption: big line under the picture; note: the small line under that.
 */
export async function takePhoto(el, { caption = '', note = '' } = {}) {
  const box = el.getBoundingClientRect()
  const W = 1080
  const pad = 54
  const scale = (W - pad * 2) / box.width
  const picH = Math.round(box.height * scale)
  const H = pad + picH + 210
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')

  // a cream card, like an instant photo
  ctx.fillStyle = '#FBF6EE'
  ctx.fillRect(0, 0, W, H)

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(pad, pad, W - pad * 2, picH, 36)
  ctx.clip()
  ctx.fillStyle = '#F5ECDF'
  ctx.fillRect(pad, pad, W - pad * 2, picH)
  const layers = [...el.querySelectorAll('svg')].filter((s) => !s.parentElement?.closest('svg') && s.getBoundingClientRect().width > 0)
  for (const svg of layers) {
    const r = svg.getBoundingClientRect()
    try {
      const img = await svgToImage(svg, r.width, r.height)
      ctx.drawImage(img, pad + (r.left - box.left) * scale, pad + (r.top - box.top) * scale, r.width * scale, r.height * scale)
    } catch {
      // one layer failing shouldn't spoil the photo
    }
  }
  ctx.restore()

  await document.fonts?.ready
  ctx.textAlign = 'center'
  ctx.fillStyle = '#3A2D23'
  ctx.font = '600 64px "Fredoka Variable", ui-rounded, system-ui, sans-serif'
  ctx.fillText(caption, W / 2, pad + picH + 104)
  ctx.fillStyle = '#7D6B5B'
  ctx.font = '600 34px "Plus Jakarta Sans Variable", system-ui, sans-serif'
  ctx.fillText(note, W / 2, pad + picH + 158)

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'))
}
