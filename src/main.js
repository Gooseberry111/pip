import { createApp } from 'vue'
import { createPinia } from 'pinia'
import '@fontsource-variable/plus-jakarta-sans'
import '@fontsource-variable/fredoka'
import './style.css'
import App from './App.vue'
import { router } from './router'
import { usePipStore } from './stores/pip'

const app = createApp(App)
const pinia = createPinia()
app.use(pinia)
app.use(router)

const pip = usePipStore()

// Handy for trying things out in the browser console during development:
//   __pip.passTime(12)  let 12 hours go by
//   __pip.grow(100)     add growth points
//   __pip.petals(50)    add petals
//   __pip.reset()       start again from a seed
if (import.meta.env.DEV) {
  window.__pip = { store: pip, passTime: pip.devPassTime, grow: pip.devGrow, petals: pip.devPetals, reset: pip.devReset }
}

pip.load().then(() => app.mount('#app'))
