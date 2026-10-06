<script setup>
import { computed, nextTick, ref } from 'vue'
import { usePipStore } from '@/stores/pip'
import { ITEMS } from '@/data/items'
import { playSound } from '@/utils/sound'
import Garden from '@/components/Garden.vue'
import ItemPreview from '@/components/ItemPreview.vue'
import Icon from '@/components/Icon.vue'
import PageHeader from '@/components/PageHeader.vue'

const pip = usePipStore()

const ROWS = [
  { category: 'backgrounds', label: 'Scene' },
  { category: 'pots', label: 'Pot' },
  { category: 'leaves', label: 'Leaves' },
  { category: 'flowers', label: 'Flower' },
  { category: 'decorations', label: 'Decorations' },
]

const rows = computed(() =>
  ROWS.map((row) => {
    const all = ITEMS[row.category]
    const unlocked = all.filter((item) => pip.isUnlocked(row.category, item.id))
    return { ...row, unlocked, lockedCount: all.length - unlocked.length }
  }),
)

function choose(category, id) {
  pip.equip(category, id)
  playSound('select')
}

// ---- renaming ----
const editing = ref(false)
const draft = ref('')
const input = ref(null)

async function startRename() {
  draft.value = pip.plantName
  editing.value = true
  await nextTick()
  input.value?.select()
}

function finishRename() {
  if (!editing.value) return
  pip.rename(draft.value)
  editing.value = false
}
</script>

<template>
  <section class="page flex flex-col">
    <PageHeader eyebrow="A cosy little home" :title="`${pip.plantName}’s garden`">
      <template #title>
        <form v-if="editing" class="inline-flex" @submit.prevent="finishRename">
          <input
            ref="input"
            v-model="draft"
            maxlength="16"
            class="w-52 rounded-xl border border-line bg-surface px-3 py-0.5 font-display text-[1.6rem] font-semibold text-bark-600 shadow-soft outline-none focus:border-leaf-400"
            aria-label="Plant name"
            @blur="finishRename"
          />
        </form>
        <template v-else>{{ pip.plantName }}’s garden</template>
      </template>
      <button type="button" class="icon-btn" aria-label="Rename your plant" @click="startRename">
        <Icon name="pencil" :size="17" :stroke="2" />
      </button>
    </PageHeader>

    <div class="mt-5 flex flex-col gap-5 md:flex-row md:items-start">
      <div class="mx-auto w-full max-w-[22rem] md:sticky md:top-6 md:mx-0 md:w-[22rem] md:shrink-0">
        <Garden />
        <p class="mt-3 text-center text-[0.8125rem] font-medium text-bark-400">Tap the little things in the garden. They like it.</p>
      </div>

      <div class="card min-w-0 flex-1 divide-y divide-line overflow-hidden">
        <div v-for="row in rows" :key="row.category" class="py-3.5">
          <div class="mb-2 flex items-baseline justify-between px-4">
            <h2 class="eyebrow text-bark-500!">
              {{ row.label }}
              <span v-if="row.category === 'leaves' && pip.stageIndex < 1" class="ml-1 normal-case tracking-normal text-clay-400">
                appear at level 2
              </span>
              <span v-if="row.category === 'flowers' && pip.growthLevel < 5 && row.unlocked.length" class="ml-1 normal-case tracking-normal text-clay-400">
                bloom at level 5
              </span>
            </h2>
            <span v-if="row.lockedCount" class="flex items-center gap-1 text-xs font-semibold text-bark-300">
              <Icon name="lock" :size="12" />
              {{ row.lockedCount }} still to find
            </span>
          </div>

          <div class="no-scrollbar overflow-x-auto px-3">
            <div class="flex w-max gap-2 p-1">
              <button
                v-for="item in row.unlocked"
                :key="item.id"
                type="button"
                data-sound="none"
                class="relative h-16 w-16 overflow-hidden rounded-2xl border transition duration-300 active:scale-95"
                :class="pip.isEquipped(row.category, item.id) ? 'border-leaf-400 bg-leaf-200/40 ring-2 ring-leaf-300/60' : 'border-line bg-cream'"
                :aria-label="item.name"
                :aria-pressed="pip.isEquipped(row.category, item.id)"
                @click="choose(row.category, item.id)"
              >
                <span class="absolute inset-0" :class="row.category === 'backgrounds' ? '' : 'p-2'">
                  <ItemPreview :category="row.category" :id="item.id" />
                </span>
              </button>
              <p v-if="!row.unlocked.length" class="flex h-16 items-center rounded-2xl bg-sand-100/70 px-4 text-xs font-semibold text-bark-400">
                Nothing here yet. Keep caring for {{ pip.plantName }}.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
