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
    },
    {
      path: '/ticket/:ticketNumber',
      name: 'client-ticket',
      component: () => import('@/views/TicketPublicView.vue')
    }
  ],
  scrollBehavior() {
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

export default router
