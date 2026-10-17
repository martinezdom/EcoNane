import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '@/views/HomeView.vue'

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
      component: () => import('@/views/AdminDashboardView.vue')
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/AdminLoginView.vue')
    },
    {
      path: '/sesion/:code',
      name: 'client-session',
      component: () => import('@/views/ClientSessionView.vue')
    },
    {
      path: '/descarga/:code',
      name: 'client-download',
      component: () => import('@/views/ClientSessionView.vue')
    },
    {
      path: '/ticket/:ticketNumber',
      name: 'client-ticket',
      component: () => import('@/views/TicketPublicView.vue')
    },
    {
      path: '/agenda',
      name: 'collaborator-agenda',
      component: () => import('@/views/AgendaView.vue')
    }
  ],
  scrollBehavior(to, _from, savedPosition) {
    if (to.hash) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({
            el: to.hash,
            behavior: 'smooth'
          })
        }, 100)
      })
    }
    if (savedPosition) {
      return savedPosition
    }
    return { top: 0 }
  }
})

router.beforeEach((to, _from, next) => {
  if (to.path === '/admin') {
    const isAuth = sessionStorage.getItem('econane_admin_auth') === 'true'
    if (!isAuth) {
      return next('/admin/login')
    }
  }
  if (to.path === '/admin/login') {
    const isAuth = sessionStorage.getItem('econane_admin_auth') === 'true'
    if (isAuth) {
      return next('/admin')
    }
  }
  next()
})

router.afterEach((to, from) => {
  if (from.name && to.path !== from.path) {
    const win = window as any
    if (typeof win.gtag === 'function') {
      win.gtag('event', 'page_view', {
        page_title: document.title,
        page_location: window.location.href,
        page_path: to.fullPath
      })
    }
  }
})

export default router
