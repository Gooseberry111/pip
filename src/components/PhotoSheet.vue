<script setup>
// The photo you just took of Pip: share it, save it, or take another.
import { ref, watch, onBeforeUnmount } from 'vue'
import { share, savePicture } from '@/services/native'
import { playSound } from '@/utils/sound'
import Modal from './Modal.vue'
import Icon from './Icon.vue'

const props = defineProps({
  photo: { type: Object, default: null }, // { blob, name }
})
const emit = defineEmits(['close'])

const url = ref('')
const status = ref('')
watch(
  () => props.photo,
  (p) => {
    if (url.value) URL.revokeObjectURL(url.value)
    url.value = p ? URL.createObjectURL(p.blob) : ''
    status.value = ''
  },
)
onBeforeUnmount(() => url.value && URL.revokeObjectURL(url.value))

const fileName = () => `${(props.photo?.name ?? 'pip').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().slice(0, 10)}.png`

async function onShare() {
  const r = await share({ title: props.photo.name, text: `Say hello to ${props.photo.name} 🌱`, image: props.photo.blob, fileName: fileName() })
  if (r === 'shared') playSound('petals')
  status.value = r === 'saved' ? 'Saved to your device.' : r === 'failed' ? 'Sharing didn’t work here. Try Save instead.' : ''
}

async function onSave() {
  const r = await savePicture(props.photo.blob, fileName())
  status.value = r === 'saved' ? 'Saved to your device.' : ''
  if (r === 'saved') playSound('petals')
}
</script>

<template>
  <Modal :open="Boolean(photo)" label="Your photo" @close="emit('close')">
    <template v-if="photo">
      <p class="eyebrow">Snap!</p>
      <img :src="url" :alt="`A photo of ${photo.name}`" class="photo mx-auto mt-3 w-full rounded-2xl" />
      <div class="mt-4 grid grid-cols-2 gap-2">
        <button type="button" class="btn btn-primary gap-2!" data-sound="none" @click="onShare">
          <Icon name="share" :size="17" :stroke="2.2" /> Share
        </button>
        <button type="button" class="btn btn-secondary gap-2!" data-sound="none" @click="onSave">
          <Icon name="download" :size="17" :stroke="2.2" /> Save
        </button>
      </div>
      <p v-if="status" class="mt-2 text-xs font-semibold text-bark-400">{{ status }}</p>
      <button type="button" class="btn btn-ghost btn-sm mt-1 w-full" @click="emit('close')">Done</button>
    </template>
  </Modal>
</template>

<style scoped>
.photo {
  max-height: 52dvh;
  object-fit: contain;
  box-shadow: 0 10px 24px -14px rgb(58 45 35 / 0.6);
  animation: develop 0.8s ease-out both;
}
@keyframes develop {
  from { filter: brightness(1.8) saturate(0); transform: rotate(-3deg) scale(0.92); }
  to { filter: none; transform: none; }
}
</style>
