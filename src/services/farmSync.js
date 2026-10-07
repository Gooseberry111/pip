// Keeps a shared farm up to date online, and brings back help from visiting friends.
// Only runs when the owner has turned sharing on.
import { ref } from 'vue'
import { publishFarm, unpublishFarm } from './farmShare'

/** The last upload: { ok, reason, at }. Shown in the friends sheet. */
export const syncStatus = ref(null)
let current = null

/** Upload right away (after turning sharing on, for example). */
export function syncFarmNow() {
  return current?.now()
}

const DEBOUNCE = 20 * 1000 // after a change, wait a little before uploading
const POLL = 5 * 60 * 1000 // check for visitors' help every few minutes

export function startFarmSync(farm, { onHelps, onGifts, onStatus } = {}) {
  let timer = null
  let busy = false
  let wasShared = farm.state.shared

  async function sync() {
    clearTimeout(timer)
    timer = null
    if (busy) return
    if (!farm.state.shared) {
      if (wasShared) {
        wasShared = false
        await unpublishFarm({ code: farm.state.code, key: farm.state.key })
      }
      return
    }
    wasShared = true
    busy = true
    let r = await publishFarm({ code: farm.state.code, key: farm.state.key, farm: farm.snapshot(), listed: farm.state.listed })
    if (!r.ok && r.reason === 'not-yours') {
      // someone else already has this code: take a new one and try again
      farm.newFarmCode()
      r = await publishFarm({ code: farm.state.code, key: farm.state.key, farm: farm.snapshot(), listed: farm.state.listed })
    }
    busy = false
    syncStatus.value = { ok: r.ok, reason: r.reason, at: Date.now() }
    onStatus?.(r)
    if (r.ok && Array.isArray(r.helps)) {
      const fresh = farm.applyHelps(r.helps)
      if (fresh.length) onHelps?.(fresh)
    }
    if (r.ok && Array.isArray(r.gifts)) {
      const fresh = farm.applyGifts(r.gifts)
      if (fresh.length) onGifts?.(fresh)
    }
  }

  function soon() {
    if (!farm.state.shared && !wasShared) return
    clearTimeout(timer)
    timer = setTimeout(sync, DEBOUNCE)
  }

  farm.onSave(soon)
  const poll = setInterval(() => {
    if (document.visibilityState === 'visible') sync()
  }, POLL)
  sync()

  current = {
    now: sync,
    stop() {
      clearTimeout(timer)
      clearInterval(poll)
    },
  }
  return current
}
