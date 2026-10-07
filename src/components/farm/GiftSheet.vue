<script setup>
// Send a friend something from your barn. Up to three gifts per friend a day.
import { computed, ref } from 'vue'
import { useFarmStore } from '@/stores/farm'
import { usePipStore } from '@/stores/pip'
import { GOODS } from '@/data/farm'
import { sendGift, SHARE_ERRORS } from '@/services/farmShare'
import BottomSheet from '../BottomSheet.vue'
import GoodIcon from './GoodIcon.vue'

const props = defineProps({
  open: { type: Boolean, default: false },
  code: { type: String, required: true },
  friend: { type: String, default: 'your friend' },
})
const emit = defineEmits(['close', 'sent'])

const farm = useFarmStore()
const pip = usePipStore()
const picked = ref(null)
const amount = ref(1)
const sending = ref(false)
const error = ref('')

const KIND_ORDER = { dish: 0, product: 1, fruit: 2, crop: 3 }
const items = computed(() =>
  Object.entries(farm.state.barn)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ ...GOODS[id], count: n }))
    .sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind] || b.sell - a.sell),
)
const chosen = computed(() => items.value.find((i) => i.id === picked.value) ?? null)
const left = computed(() => Math.max(0, 3 - farm.giftsSentToday(props.code)))

function choose(id) {
  picked.value = picked.value === id ? null : id
  amount.value = 1
  error.value = ''
}

async function send() {
  const c = chosen.value
  if (!c || sending.value) return
  const n = Math.min(amount.value, c.count)
  if (!farm.packGift(props.code, c.id, n)) {
    error.value = left.value ? 'You don’t have enough of that.' : 'You’ve sent three gifts here today. More tomorrow!'
    return
  }
  sending.value = true
  const r = await sendGift({ code: props.code, from: pip.plantName, good: c.id, n })
  sending.value = false
  if (!r.ok) {
    farm.unpackGift(props.code, c.id, n)
    error.value = SHARE_ERRORS[r.reason] ?? SHARE_ERRORS.server
    return
  }
  emit('sent', { good: c.id, n })
  picked.value = null
}
</script>

<template>
  <BottomSheet :open="open" :title="`A gift for ${friend}`" :eyebrow="`${left} ${left === 1 ? 'gift' : 'gifts'} left today`" @close="emit('close')">
    <p v-if="!items.length" class="rounded-2xl bg-cream p-5 text-center text-sm font-semibold text-bark-400">
      Your barn is empty. Grow or cook something to share.
    </p>
    <div v-else class="grid grid-cols-4 gap-2 sm:grid-cols-5">
      <button
        v-for="item in items"
        :key="item.id"
        type="button"
        class="relative flex aspect-square flex-col items-center justify-center rounded-2xl border transition"
        :class="picked === item.id ? 'border-petal-400 bg-petal-100 ring-2 ring-petal-400/40' : 'border-line bg-cream'"
        :aria-label="`${item.name}, ${item.count}`"
        @click="choose(item.id)"
      >
        <GoodIcon :id="item.id" :size="30" />
        <span class="absolute bottom-1 right-1.5 text-xs font-extrabold tabular-nums text-bark-600">{{ item.count }}</span>
      </button>
    </div>

    <div v-if="chosen" class="sticky bottom-0 mt-4 rounded-2xl border border-line bg-surface p-3 shadow-float">
      <div class="flex items-center gap-3">
        <GoodIcon :id="chosen.id" :size="34" />
        <p class="min-w-0 flex-1 font-display text-base font-semibold text-bark-600">{{ chosen.name }}</p>
        <div class="flex items-center gap-1.5">
          <button type="button" class="icon-btn h-8! w-8!" :disabled="amount <= 1" aria-label="Fewer" @click="amount--">−</button>
          <span class="w-6 text-center font-display text-lg font-semibold tabular-nums">{{ amount }}</span>
          <button type="button" class="icon-btn h-8! w-8!" :disabled="amount >= Math.min(10, chosen.count)" aria-label="More" @click="amount++">+</button>
        </div>
      </div>
      <p v-if="error" class="mt-2 text-xs font-semibold text-clay-400">{{ error }}</p>
      <button type="button" class="btn btn-primary mt-3 w-full" :disabled="sending || !left" data-sound="none" @click="send">
        {{ sending ? 'Sending…' : `Send ${amount} to ${friend}` }}
      </button>
    </div>
  </BottomSheet>
</template>
