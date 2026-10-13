<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import {
  Calendar,
  Calculator,
  FileSpreadsheet,
  Camera,
  CreditCard,
  Tag,
  Building,
  ExternalLink,
  LogOut,
  Database,
  Cloud,
  CheckCircle2,
  RefreshCw,
  Lock
} from '@lucide/vue'

export type AdminTab = 'agenda' | 'tpv' | 'accounting' | 'sessions' | 'prices' | 'promo' | 'settings'

const props = defineProps<{
  activeTab: AdminTab
}>()

const emit = defineEmits<{
  (e: 'update:activeTab', tab: AdminTab): void
  (e: 'open-pin-modal'): void
}>()

const router = useRouter()
const {
  logoutAdmin,
  appointments,
  sessions,
  salesTickets,
  isCloudSynced,
  isDevEnvironment,
  activeDataSource,
  setDataSourceMode,
  syncFromSupabase
} = useSiteData()

const todayStr = new Date().toISOString().slice(0, 10)
const todayAppointmentsCount = computed(() => {
  return appointments.value.filter(a => a.date === todayStr && a.status === 'confirmed').length
})

const currentMonthStr = todayStr.slice(0, 7)
const monthTicketsCount = computed(() => {
  return salesTickets.value.filter(t => t.date.startsWith(currentMonthStr) && t.status === 'valido').length
})

function handleLogout() {
  logoutAdmin()
  router.push('/admin/login')
}

async function toggleDataSource() {
  const newMode = activeDataSource.value === 'local' ? 'cloud' : 'local'
  if (newMode === 'cloud') {
    const confirmSwitch = confirm(
      '⚠️ ¿Conectar con Supabase Producción?\n\nAl activar el modo Cloud, trabajarás con la base de datos real de la clínica. Los cambios que hagas se guardarán en Supabase.'
    )
    if (!confirmSwitch) return
  }
  await setDataSourceMode(newMode)
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b border-brand-pink-light/40 bg-white/95 shadow-xs backdrop-blur-md">
    <!-- Top row -->
    <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
      <!-- Logo & Brand -->
      <div class="flex items-center gap-3">
        <img src="/logo.webp" alt="EcoNane" class="h-9 sm:h-10 w-auto" />
        <div>
          <div class="flex items-center gap-2">
            <h1 class="font-serif text-base sm:text-lg font-bold leading-tight text-brand-brown-dark">
              Panel EcoNane
            </h1>

            <!-- Entorno / Estado de Base de Datos -->
            <div v-if="isDevEnvironment">
              <button
                type="button"
                @click="toggleDataSource"
                :class="[
                  'flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[10px] font-bold transition-all cursor-pointer',
                  activeDataSource === 'local'
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                    : 'bg-emerald-100 text-emerald-900 border border-emerald-300 hover:bg-emerald-200'
                ]"
                :title="activeDataSource === 'local'
                  ? 'Estás en modo pruebas local (no toca Supabase). Haz clic para cambiar a Producción.'
                  : 'Estás conectado a Supabase Producción. Haz clic para aislar a modo pruebas local.'"
              >
                <component :is="activeDataSource === 'local' ? Database : Cloud" class="h-3 w-3" />
                <span>{{ activeDataSource === 'local' ? 'BD Local (Pruebas)' : 'Nube (Producción)' }}</span>
              </button>
            </div>

            <!-- Sync pill in production -->
            <div v-else class="hidden sm:flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5">
              <CheckCircle2 class="h-3 w-3" />
              <span>Nube Supabase</span>
            </div>
          </div>
          <p class="hidden sm:block text-[11px] text-brand-brown/70">
            Agenda, TPV, Facturación y Sesiones
          </p>
        </div>
      </div>

      <!-- Right Action Buttons -->
      <div class="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          @click="syncFromSupabase"
          class="hidden md:flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-3 py-1.5 text-xs font-semibold text-brand-brown hover:bg-brand-cream/60 transition-colors cursor-pointer"
          title="Forzar actualización con la nube"
        >
          <RefreshCw class="h-3.5 w-3.5" />
          <span>Sincronizar</span>
        </button>

        <router-link
          to="/"
          target="_blank"
          class="flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
          title="Ver página web pública en pestaña nueva"
        >
          <ExternalLink class="h-3.5 w-3.5 text-brand-brown" />
          <span class="hidden sm:inline">Ver Web</span>
        </router-link>

        <button
          type="button"
          @click="handleLogout"
          class="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 cursor-pointer"
          title="Cerrar sesión de administración"
        >
          <LogOut class="h-3.5 w-3.5" />
          <span class="hidden sm:inline">Salir</span>
        </button>
      </div>
    </div>

    <!-- Navigation Tabs row -->
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <nav class="flex gap-1 sm:gap-1.5 overflow-x-auto border-t border-brand-pink-light/20 pt-2 pb-2 scrollbar-none">
        <!-- 1. Agenda -->
        <button
          type="button"
          @click="emit('update:activeTab', 'agenda')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'agenda'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <Calendar class="h-4 w-4" />
          <span>Agenda</span>
          <span
            v-if="todayAppointmentsCount > 0"
            class="ml-1 rounded-full bg-brand-pink px-1.5 py-0.5 text-[10px] font-bold text-white shadow-xs"
          >
            {{ todayAppointmentsCount }} hoy
          </span>
        </button>

        <!-- 2. TPV / Cobro -->
        <button
          type="button"
          @click="emit('update:activeTab', 'tpv')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'tpv'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <Calculator class="h-4 w-4" />
          <span>TPV / Caja</span>
        </button>

        <!-- 3. Contabilidad -->
        <button
          type="button"
          @click="emit('update:activeTab', 'accounting')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'accounting'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <FileSpreadsheet class="h-4 w-4" />
          <span>Contabilidad e IVA</span>
          <span
            v-if="monthTicketsCount > 0"
            class="ml-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold"
            :class="activeTab === 'accounting' ? 'bg-white/20 text-white' : 'bg-brand-pink-light/40 text-brand-brown-dark'"
          >
            {{ monthTicketsCount }}
          </span>
        </button>

        <!-- 4. Sesiones y Fotos -->
        <button
          type="button"
          @click="emit('update:activeTab', 'sessions')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'sessions'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <Camera class="h-4 w-4" />
          <span>Subir Fotos</span>
          <span
            v-if="sessions.length > 0"
            class="ml-1 rounded-full px-1.5 py-0.5 text-[10px]"
            :class="activeTab === 'sessions' ? 'bg-white/20 text-white' : 'bg-brand-pink-light/40 text-brand-brown-dark'"
          >
            {{ sessions.length }}
          </span>
        </button>

        <!-- 5. Precios y Servicios -->
        <button
          type="button"
          @click="emit('update:activeTab', 'prices')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'prices'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <CreditCard class="h-4 w-4" />
          <span>Servicios y Precios</span>
        </button>

        <!-- 6. Ofertas y Promoción -->
        <button
          type="button"
          @click="emit('update:activeTab', 'promo')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'promo'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <Tag class="h-4 w-4" />
          <span>Oferta Destacada</span>
        </button>

        <!-- 7. Configuración -->
        <button
          type="button"
          @click="emit('update:activeTab', 'settings')"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-xs sm:px-3.5 sm:py-2.5 sm:text-sm font-semibold whitespace-nowrap transition-all duration-200',
            activeTab === 'settings'
              ? 'bg-brand-brown text-white shadow-md'
              : 'text-brand-brown-dark/75 hover:bg-brand-cream hover:text-brand-brown-dark'
          ]"
        >
          <Building class="h-4 w-4" />
          <span>Configuración</span>
        </button>
      </nav>
    </div>
  </header>
</template>
