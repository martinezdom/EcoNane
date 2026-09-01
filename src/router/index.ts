import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'
import AdminLoginView from '@/views/AdminLoginView.vue'
import AdminDashboardView from '@/views/AdminDashboardView.vue'
import ClientSessionView from '@/views/ClientSessionView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminDashboardView
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: AdminLoginView
    },
    {
      path: '/sesion/:code',
      name: 'client-session',
      component: ClientSessionView
    },
    {
      path: '/descarga/:code',
      name: 'client-download',
      component: ClientSessionView
    }
  ],
  scrollBehavior() {
    return { top: 0 }
  }
})

export default router
