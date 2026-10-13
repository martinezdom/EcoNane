<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import type { Appointment } from '@/types'

// Admin Modular Components
import AdminNavbar, { type AdminTab } from '@/components/admin/AdminNavbar.vue'
import AgendaTab from '@/components/admin/AgendaTab.vue'
import TpvTab from '@/components/admin/TpvTab.vue'
import AccountingTab from '@/components/admin/AccountingTab.vue'
import SessionsTab from '@/components/admin/SessionsTab.vue'
import PricesTab from '@/components/admin/PricesTab.vue'
import PromoTab from '@/components/admin/PromoTab.vue'
import SettingsTab from '@/components/admin/SettingsTab.vue'
import PinModal from '@/components/admin/PinModal.vue'

const router = useRouter()
const { isAdminLoggedIn, syncFromSupabase } = useSiteData()

// Auth Guard
if (!isAdminLoggedIn.value) {
  router.push('/admin/login')
}

// Active Tab State
const activeTab = ref<AdminTab>('agenda')

// Modal and cross-tab navigation state
const showPinModal = ref(false)
const prefilledTpvAppt = ref<Appointment | null>(null)
const prefilledSession = ref<{ clientName: string; clientPhone: string; serviceType: string } | null>(null)

// Cross-tab workflows
function handleChargeInTpv(appt: Appointment) {
  prefilledTpvAppt.value = appt
  activeTab.value = 'tpv'
}

function handleCreateSessionFromAppt(appt: Appointment) {
  prefilledSession.value = {
    clientName: appt.clientName,
    clientPhone: appt.clientPhone,
    serviceType: appt.serviceTitle
  }
  activeTab.value = 'sessions'
}

// Background sync on window focus (for multi-device real-time updates)
function handleWindowFocus() {
  syncFromSupabase()
}

onMounted(() => {
  window.addEventListener('focus', handleWindowFocus)
})

onUnmounted(() => {
  window.removeEventListener('focus', handleWindowFocus)
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream/30 text-brand-brown-dark font-sans pb-16">
    <!-- Modular Navigation Bar with Environment / Database Switcher -->
    <AdminNavbar
      :active-tab="activeTab"
      @update:active-tab="activeTab = $event"
      @open-pin-modal="showPinModal = true"
    />

    <!-- Main Content Area -->
    <main class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- 1. AGENDA Y CITAS ONLINE -->
      <AgendaTab
        v-if="activeTab === 'agenda'"
        @charge-in-tpv="handleChargeInTpv"
        @create-session="handleCreateSessionFromAppt"
        @open-settings="activeTab = 'settings'"
      />

      <!-- 2. TPV Y COBRO RÁPIDO -->
      <TpvTab
        v-else-if="activeTab === 'tpv'"
        :prefilled-appointment="prefilledTpvAppt"
      />

      <!-- 3. CONTABILIDAD, CAJA E INFORMES FISCALES -->
      <AccountingTab
        v-else-if="activeTab === 'accounting'"
      />

      <!-- 4. ENTREGAS DE FOTOS Y SESIONES DE CLIENTAS -->
      <SessionsTab
        v-else-if="activeTab === 'sessions'"
        :prefilled-session="prefilledSession"
        @clear-prefilled="prefilledSession = null"
      />

      <!-- 5. PRECIOS, PACKS Y CATÁLOGO DE PRODUCTOS -->
      <PricesTab
        v-else-if="activeTab === 'prices'"
      />

      <!-- 6. BANNER Y PROMOCIÓN DE APERTURA -->
      <PromoTab
        v-else-if="activeTab === 'promo'"
      />

      <!-- 7. CONFIGURACIÓN, HORARIOS Y DATOS FISCALES -->
      <SettingsTab
        v-else-if="activeTab === 'settings'"
      />
    </main>

    <!-- Modal para cambiar PIN de Administrador -->
    <PinModal
      v-if="showPinModal"
      @close="showPinModal = false"
    />
  </div>
</template>
