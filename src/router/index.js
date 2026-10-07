import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

// Hash history works both in the browser and inside Capacitor's webview.
export const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    { path: '/', name: 'home', component: HomeView },
    { path: '/journal', name: 'journal', component: () => import('@/views/JournalView.vue') },
    { path: '/play', name: 'play', component: () => import('@/views/PlayView.vue') },
    { path: '/collection', name: 'collection', component: () => import('@/views/CollectionView.vue') },
    { path: '/garden', name: 'garden', component: () => import('@/views/GardenView.vue') },
    { path: '/farm', name: 'farm', component: () => import('@/views/FarmView.vue') },
    { path: '/shop', name: 'shop', component: () => import('@/views/ShopView.vue') },
    { path: '/visit/:code', name: 'visit', component: () => import('@/views/VisitView.vue') },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
  scrollBehavior: () => ({ top: 0 }),
})
