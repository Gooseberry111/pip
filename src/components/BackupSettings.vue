<script setup>
// Settings: keep a backup online under a private code, and restore one on a new phone.
import { computed, ref } from 'vue'
import { backup, backupNow, turnOnBackup, turnOffBackup, fetchBackup, restoreBackup, formatCode, cleanCode, BACKUP_ERRORS } from '@/services/backup'
import { usePipStore } from '@/stores/pip'
import Icon from './Icon.vue'

const pip = usePipStore()

const working = ref(false)
const copied = ref(false)
const restoreOpen = ref(false)
const typed = ref('')
const found = ref(null) // { code, data, preview }
const error = ref('')
const showCode = ref(false)

const when = computed(() => {
  const at = backup.value.lastAt
  if (!at) return 'Not saved yet'
  const mins = Math.round((Date.now() - at) / 60000)
  if (mins < 1) return 'Saved just now'
  if (mins < 60) return `Saved ${mins} min ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `Saved ${hours} h ago`
  return `Saved ${new Date(at).toLocaleDateString()}`
})
const statusNote = computed(() => {
  const s = backup.value.status
  if (!s || s === 'saving') return ''
  return BACKUP_ERRORS[s] ?? BACKUP_ERRORS.server
})

async function toggle() {
  if (working.value) return
  working.value = true
  if (backup.value.on) await turnOffBackup()
  else {
    await turnOnBackup()
    showCode.value = true
  }
  working.value = false
}

async function saveNow() {
  working.value = true
  await backupNow({ force: true })
  working.value = false
}

async function copy() {
  try {
    await navigator.clipboard.writeText(formatCode(backup.value.code))
    copied.value = true
    setTimeout(() => (copied.value = false), 1800)
  } catch {
    // the code is on screen to write down anyway
  }
}

async function share() {
  const text = `My Pip backup code: ${formatCode(backup.value.code)}`
  if (navigator.share) {
    try {
      await navigator.share({ title: 'Pip backup code', text })
      return
    } catch {
      // cancelled
    }
  }
  copy()
}

async function lookUp() {
  error.value = ''
  found.value = null
  working.value = true
  const r = await fetchBackup(typed.value)
  working.value = false
  if (!r.ok) {
    error.value = BACKUP_ERRORS[r.reason] ?? BACKUP_ERRORS.server
    return
  }
  found.value = r
}

function restore() {
  if (found.value) restoreBackup(found.value.code, found.value.data)
}
</script>

<template>
  <div class="card mt-2 divide-y divide-line overflow-hidden">
    <button
      type="button"
      role="switch"
      :aria-checked="backup.on"
      :aria-busy="working"
      :data-sound="backup.on ? 'toggleOff' : 'toggleOn'"
      class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left"
      @click="toggle"
    >
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-water-100 text-water-500">
        <Icon name="cloud" :size="18" :stroke="2" />
      </span>
      <span class="flex-1">
        <span class="block text-[0.9375rem] font-bold text-bark-600">Keep a backup</span>
        <span class="block text-xs font-medium text-bark-400">{{ backup.on ? when : 'Bring everything back on any phone with a private code' }}</span>
      </span>
      <span class="switch" :class="{ 'is-on': backup.on }" aria-hidden="true"><span /></span>
    </button>

    <div v-if="backup.on && backup.code" class="px-4 py-3.5">
      <p class="text-xs font-bold text-bark-400">Your backup code</p>
      <div class="mt-2 flex items-center gap-2">
        <button
          type="button"
          class="min-w-0 flex-1 rounded-xl bg-cream px-3 py-2.5 text-center font-mono text-[1.05rem] font-bold tracking-[0.12em] text-bark-600"
          :aria-label="showCode ? 'Hide code' : 'Show code'"
          @click="showCode = !showCode"
        >
          {{ showCode ? formatCode(backup.code) : '••••-••••-••••' }}
        </button>
        <button type="button" class="icon-btn" aria-label="Copy code" @click="copy"><Icon :name="copied ? 'check' : 'copy'" :size="17" :stroke="2" /></button>
        <button type="button" class="icon-btn" aria-label="Share code" @click="share"><Icon name="share" :size="17" :stroke="2" /></button>
      </div>
      <p class="mt-2 text-xs font-medium text-bark-400">
        Write this down or keep it somewhere safe. It’s the only way to bring {{ pip.plantName }} back on a new phone, so keep it private too.
        Backups include Pip, the farm and your journal (not chats).
      </p>
      <p v-if="statusNote" class="mt-2 text-xs font-semibold text-clay-400">{{ statusNote }}</p>
      <button type="button" class="btn btn-secondary btn-sm mt-3 w-full" :disabled="working" @click="saveNow">
        {{ backup.status === 'saving' ? 'Saving…' : 'Back up now' }}
      </button>
    </div>

    <button type="button" class="flex min-h-16 w-full items-center gap-3.5 px-4 text-left" @click="restoreOpen = !restoreOpen">
      <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-leaf-200 text-leaf-500">
        <Icon name="undo" :size="17" :stroke="2" />
      </span>
      <span class="flex-1">
        <span class="block text-[0.9375rem] font-bold text-bark-600">Restore from a code</span>
        <span class="block text-xs font-medium text-bark-400">New phone? Bring your Pip and farm back</span>
      </span>
    </button>

    <div v-if="restoreOpen" class="px-4 py-3.5">
      <form class="flex gap-2" @submit.prevent="lookUp">
        <input
          v-model="typed"
          class="min-w-0 flex-1 rounded-xl border border-line bg-surface px-3 py-2.5 font-mono text-base font-bold uppercase tracking-[0.1em] text-bark-600 outline-none focus:border-leaf-400"
          placeholder="XXXX-XXXX-XXXX"
          autocapitalize="characters"
          autocomplete="off"
          aria-label="Backup code"
        />
        <button type="submit" class="btn btn-primary btn-sm" :disabled="cleanCode(typed).length !== 12 || working">Find</button>
      </form>
      <p v-if="error" class="mt-2 text-xs font-semibold text-clay-400">{{ error }}</p>
      <div v-if="found" class="mt-3 rounded-2xl bg-cream p-3">
        <p class="font-display text-base font-semibold text-bark-600">{{ found.preview.plant }}, level {{ found.preview.level }}</p>
        <p class="text-xs font-semibold text-bark-400">
          Farm level {{ found.preview.farmLevel }} · {{ found.preview.petals }} petals · saved {{ new Date(found.preview.at).toLocaleString() }}
        </p>
        <p class="mt-2 text-xs font-semibold text-clay-400">This replaces everything on this phone with the backup.</p>
        <button type="button" class="btn btn-primary btn-sm mt-3 w-full" @click="restore">Restore this backup</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.switch {
  position: relative;
  width: 2.75rem;
  height: 1.625rem;
  border-radius: 999px;
  background: var(--color-sand-300);
  transition: background-color 0.25s ease;
  flex-shrink: 0;
}
.switch > span {
  position: absolute;
  top: 0.1875rem;
  left: 0.1875rem;
  width: 1.25rem;
  height: 1.25rem;
  border-radius: 999px;
  background: #fff;
  box-shadow: 0 1px 3px rgb(0 0 0 / 0.2);
  transition: transform 0.25s cubic-bezier(0.3, 0.8, 0.3, 1);
}
.switch.is-on {
  background: var(--color-leaf-400);
}
.switch.is-on > span {
  transform: translateX(1.125rem);
}
</style>
