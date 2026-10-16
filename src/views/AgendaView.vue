<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import type { Appointment, CollaboratorPack } from '@/types'
import {
  Calendar,
  Clock,
  User,
  Phone,
  Camera,
  Heart,
  Sparkles,
  Lock,
  LogOut,
  Plus,
  CheckCircle2,
  CalendarCheck,
  TrendingUp,
  MessageCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ShieldCheck
} from '@lucide/vue'

const router = useRouter()
const {
  appointments,
  collaboratorPacks,
  isCollaboratorLoggedIn,
  loginCollaborator,
  logoutCollaborator,
  getAvailableSlots,
  createAppointment,
  bookingSettings
} = useSiteData()

// Auth State
const enteredPin = ref('')
const pinError = ref('')

function handleLogin() {
  pinError.value = ''
  if (!enteredPin.value.trim()) {
    pinError.value = 'Introduce la clave de acceso.'
    return
  }
  const success = loginCollaborator(enteredPin.value)
  if (!success) {
    pinError.value = 'Clave incorrecta. Solicítala a la dirección de EcoNane.'
  } else {
    enteredPin.value = ''
  }
}

function handleLogout() {
  logoutCollaborator()
}

// Active Tab
const activeTab = ref<'calendar' | 'sessions' | 'settlement'>('calendar')

// Date helpers (timezone-safe, without UTC shift)
function parseLocalDate(dateStr: string): Date {
  const parts = (dateStr || '').split('-').map(Number)
  const y = parts[0] || 2026
  const m = parts[1] || 1
  const d = parts[2] || 1
  return new Date(y, m - 1, d, 12, 0, 0)
}

function formatToIsoDate(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function formatDateSpanish(dateStr?: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length === 3) {
    const [y, m, d] = parts
    return `${d}/${m}/${y}`
  }
  return dateStr
}

function formatDateLongSpanish(dateStr?: string): string {
  if (!dateStr) return ''
  const d = parseLocalDate(dateStr)
  const formatted = d.toLocaleDateString('es-ES', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function getTodayIsoString(): string {
  return formatToIsoDate(new Date())
}

// Calendar Date Selection
const todayStr = getTodayIsoString()
const selectedDate = ref(todayStr)

// Filter Photo Sessions for Penélope
const photoAppointments = computed(() => {
  return appointments.value.filter((appt) => {
    const title = (appt.serviceTitle || '').toLowerCase()
    const notes = (appt.notes || '').toLowerCase()
    return (
      title.includes('foto') ||
      title.includes('noticia') ||
      title.includes('niño o niña') ||
      title.includes('conocerte') ||
      title.includes('momentos') ||
      notes.includes('penélope') ||
      notes.includes('colaborador')
    )
  }).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
})

// Appointments on the selected calendar date
const dayAppointments = computed(() => {
  return appointments.value
    .filter((a) => a.date === selectedDate.value && a.status !== 'cancelled')
    .sort((a, b) => a.time.localeCompare(b.time))
})

// Available slots for selected date
const daySlots = computed(() => {
  return getAvailableSlots(selectedDate.value, 45)
})

// Check if selected date is a Friday
const isFriday = computed(() => {
  if (!selectedDate.value) return false
  const dateObj = parseLocalDate(selectedDate.value)
  return dateObj.getDay() === 5
})

// Quick Date Navigation (supports backward AND forward smoothly)
function shiftDate(days: number) {
  const dateObj = parseLocalDate(selectedDate.value)
  dateObj.setDate(dateObj.getDate() + days)
  selectedDate.value = formatToIsoDate(dateObj)
}

function jumpToNextFriday() {
  const d = new Date()
  d.setHours(12, 0, 0, 0)
  const day = d.getDay()
  const diff = (5 - day + 7) % 7 || 7
  d.setDate(d.getDate() + diff)
  selectedDate.value = formatToIsoDate(d)
}

// ---------------------------------------------------------------------
// NEW BOOKING MODAL FOR PENÉLOPE
// ---------------------------------------------------------------------
const showNewBookingModal = ref(false)
const bookingForm = ref({
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  gestationWeek: '',
  selectedPackId: collaboratorPacks.value[0]?.id || 'collab-1',
  date: selectedDate.value,
  time: '',
  notes: ''
})
const bookingError = ref('')
const bookingSuccess = ref<{ code: string; clientName: string; packTitle: string; date: string; time: string } | null>(null)

function openBookingModal(presetTime?: string) {
  bookingError.value = ''
  bookingSuccess.value = null
  bookingForm.value = {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    gestationWeek: '',
    selectedPackId: collaboratorPacks.value[1]?.id || collaboratorPacks.value[0]?.id || 'collab-1',
    date: selectedDate.value,
    time: presetTime || '',
    notes: 'Reserva agendada directamente por Penélope Photograph'
  }
  showNewBookingModal.value = true
}

// Available slots for the booking modal date
const modalDateSlots = computed(() => {
  return getAvailableSlots(bookingForm.value.date, 45)
})

async function submitCollaboratorBooking() {
  bookingError.value = ''
  if (!bookingForm.value.clientName.trim()) {
    bookingError.value = 'Indica el nombre de la mamá.'
    return
  }
  if (!bookingForm.value.clientPhone.trim()) {
    bookingError.value = 'Indica un teléfono de contacto.'
    return
  }
  if (!bookingForm.value.date) {
    bookingError.value = 'Selecciona la fecha.'
    return
  }
  if (!bookingForm.value.time) {
    bookingError.value = 'Selecciona una hora disponible.'
    return
  }

  const pack = collaboratorPacks.value.find((p) => p.id === bookingForm.value.selectedPackId)
  if (!pack) {
    bookingError.value = 'Selecciona un pack válido.'
    return
  }

  try {
    const newAppt = await createAppointment({
      clientName: bookingForm.value.clientName.trim(),
      clientPhone: bookingForm.value.clientPhone.trim(),
      clientEmail: bookingForm.value.clientEmail.trim(),
      gestationWeek: bookingForm.value.gestationWeek ? `Semana ${bookingForm.value.gestationWeek}` : '',
      serviceTitle: `[Eco+Foto] ${pack.title}`,
      serviceDuration: 50,
      servicePrice: pack.price,
      date: bookingForm.value.date,
      time: bookingForm.value.time,
      notes: `[Reserva Fotografía - Penélope Photograph] ${bookingForm.value.notes.trim()}`
    })

    bookingSuccess.value = {
      code: newAppt.bookingCode,
      clientName: newAppt.clientName,
      packTitle: pack.title,
      date: newAppt.date,
      time: newAppt.time
    }
  } catch (err: any) {
    bookingError.value = err?.message || 'Error al guardar la reserva.'
  }
}

// ---------------------------------------------------------------------
// PENÉLOPE SETTLEMENT CALCULATIONS (Her 80% share)
// ---------------------------------------------------------------------
const settlementPeriod = ref<'month' | 'all'>('month')

const settlementAppointments = computed(() => {
  const currentMonth = new Date().toISOString().slice(0, 7)
  return photoAppointments.value.filter((appt) => {
    if (appt.status === 'cancelled') return false
    if (settlementPeriod.value === 'month') {
      return (appt.date || '').startsWith(currentMonth)
    }
    return true
  })
})

const settlementSummary = computed(() => {
  let totalGrossPhoto = 0
  let totalPenelopeEarned = 0
  let totalSessions = settlementAppointments.value.length

  settlementAppointments.value.forEach((appt) => {
    // Buscar precio correspondiente del pack
    const matchingPack = collaboratorPacks.value.find(p =>
      appt.serviceTitle.toLowerCase().includes(p.ecoTitle.toLowerCase()) ||
      appt.serviceTitle.toLowerCase().includes(p.photoTitle.toLowerCase()) ||
      appt.serviceTitle.toLowerCase().includes(p.title.toLowerCase())
    )
    if (matchingPack) {
      totalGrossPhoto += matchingPack.photoPrice
      totalPenelopeEarned += matchingPack.penelopeShare
    } else {
      // Estimación basada en pack 2 estándar si no hay coincidencia exacta
      totalGrossPhoto += 58
      totalPenelopeEarned += 46.40
    }
  })

  return {
    totalSessions,
    totalGrossPhoto: Math.round(totalGrossPhoto * 100) / 100,
    totalPenelopeEarned: Math.round(totalPenelopeEarned * 100) / 100
  }
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream text-brand-brown-dark">
    <!-- TOP HEADER -->
    <header class="border-b border-brand-pink-light/30 bg-white/80 backdrop-blur-md sticky top-0 z-40">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6">
        <div class="flex items-center gap-3">
          <router-link to="/" class="flex items-center gap-2.5">
            <img src="/logo.webp" alt="EcoNane" class="h-10 w-10 rounded-full border border-brand-pink/30 object-cover" />
            <div>
              <span class="block font-serif text-base font-bold leading-none text-brand-brown-dark">ECONANE</span>
              <span class="text-[9px] font-semibold uppercase tracking-widest text-brand-pink">Agenda</span>
            </div>
          </router-link>
          <div class="hidden sm:flex items-center gap-1.5 rounded-full bg-brand-pink/15 px-3 py-1 text-xs font-bold text-brand-brown">
            <Camera class="h-3.5 w-3.5 text-brand-pink" />
            <span>Penélope Photograph</span>
          </div>
        </div>

        <div v-if="isCollaboratorLoggedIn" class="flex items-center gap-3">
          <button
            @click="openBookingModal()"
            type="button"
            class="btn-primary py-2 px-4 text-xs font-bold gap-1.5 shadow-sm inline-flex items-center"
          >
            <Plus class="h-4 w-4" />
            <span>Nueva Cita</span>
          </button>

          <button
            @click="handleLogout"
            type="button"
            class="text-brand-brown/70 hover:text-brand-brown inline-flex items-center gap-1 text-xs font-semibold p-2 rounded-lg hover:bg-brand-pink-light/20 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut class="h-4 w-4" />
            <span class="hidden md:inline">Salir</span>
          </button>
        </div>
      </div>
    </header>

    <!-- IF NOT LOGGED IN: PIN ACCESS FORM -->
    <main v-if="!isCollaboratorLoggedIn" class="mx-auto flex min-h-[80vh] max-w-md items-center justify-center px-4 py-12">
      <div class="card-container w-full max-w-sm text-center bg-white shadow-xl border border-brand-pink-light/40 p-8 rounded-3xl">
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-pink-light/40 text-brand-brown">
          <Camera class="h-8 w-8 text-brand-pink" />
        </div>

        <h1 class="font-serif text-2xl font-bold text-brand-brown-dark">Agenda Penélope Photograph</h1>
        <p class="mt-2 text-xs sm:text-sm text-brand-brown/75 leading-relaxed">
          Acceso exclusivo para consultar disponibilidad, agendar packs de ecografía + fotografía y gestionar tus sesiones.
        </p>

        <form @submit.prevent="handleLogin" class="mt-6 space-y-4">
          <div class="text-left">
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Clave de Acceso
            </label>
            <div class="relative">
              <input
                v-model="enteredPin"
                type="password"
                placeholder="••••••••"
                autofocus
                class="form-input text-center text-lg tracking-widest font-mono"
              />
              <Lock class="absolute right-3.5 top-3.5 h-4 w-4 text-brand-pink pointer-events-none" />
            </div>
            <p v-if="pinError" class="mt-1.5 text-xs text-red-600 font-medium flex items-center gap-1">
              <AlertCircle class="h-3.5 w-3.5 shrink-0" />
              {{ pinError }}
            </p>
          </div>

          <button type="submit" class="btn-primary w-full py-3 text-sm font-bold shadow-md">
            Entrar a la Agenda
          </button>
        </form>

        <div class="mt-6 pt-6 border-t border-brand-pink-light/30 text-center">
          <router-link to="/" class="text-xs text-brand-brown/70 hover:text-brand-brown font-medium">
            ← Volver a la página principal
          </router-link>
        </div>
      </div>
    </main>

    <!-- IF LOGGED IN: MAIN COLLABORATOR PORTAL -->
    <main v-else class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <!-- NAVIGATION TABS -->
      <div class="mb-8 flex flex-wrap items-center justify-between gap-4 border-b border-brand-pink-light/30 pb-4">
        <div class="flex items-center gap-2">
          <button
            @click="activeTab = 'calendar'"
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'calendar'
                ? 'bg-brand-brown text-brand-cream shadow-sm'
                : 'bg-white/80 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            <Calendar class="h-4 w-4" />
            <span>Agenda & Disponibilidad</span>
          </button>

          <button
            @click="activeTab = 'sessions'"
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 relative',
              activeTab === 'sessions'
                ? 'bg-brand-brown text-brand-cream shadow-sm'
                : 'bg-white/80 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            <Camera class="h-4 w-4" />
            <span>Mis Sesiones de Fotos</span>
            <span
              v-if="photoAppointments.length > 0"
              class="ml-1 inline-flex items-center justify-center rounded-full bg-brand-pink px-2 py-0.5 text-[10px] font-bold text-white"
            >
              {{ photoAppointments.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'settlement'"
            type="button"
            :class="[
              'px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5',
              activeTab === 'settlement'
                ? 'bg-brand-brown text-brand-cream shadow-sm'
                : 'bg-white/80 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            <TrendingUp class="h-4 w-4" />
            <span>Mis Ganancias (80%)</span>
          </button>
        </div>

        <button
          @click="openBookingModal()"
          type="button"
          class="btn-primary py-2.5 px-5 text-xs font-bold gap-2 shadow-md hidden sm:inline-flex items-center"
        >
          <Plus class="h-4 w-4" />
          <span>Agendar Nueva Cita</span>
        </button>
      </div>

      <!-- TAB 1: AGENDA & CALENDAR VIEW -->
      <section v-if="activeTab === 'calendar'" class="space-y-6">
        <!-- Date Switcher Bar -->
        <div class="rounded-2xl border border-brand-pink-light/30 bg-white/80 p-4 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <div class="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
            <button
              @click="shiftDate(-1)"
              type="button"
              class="p-2 rounded-lg border border-brand-pink-light/40 hover:bg-brand-pink-light/20 text-brand-brown cursor-pointer transition-colors active:scale-95"
              title="Día anterior"
            >
              <ChevronLeft class="h-5 w-5" />
            </button>

            <div class="flex items-center gap-2">
              <input
                v-model="selectedDate"
                type="date"
                class="form-input py-1.5 px-3 text-sm font-bold text-brand-brown-dark cursor-pointer"
              />
              <span
                v-if="isFriday"
                class="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-800 border border-green-200"
              >
                <Sparkles class="h-3.5 w-3.5 text-green-600" />
                Viernes de Sesión
              </span>
            </div>

            <button
              @click="shiftDate(1)"
              type="button"
              class="p-2 rounded-lg border border-brand-pink-light/40 hover:bg-brand-pink-light/20 text-brand-brown cursor-pointer transition-colors active:scale-95"
              title="Día siguiente"
            >
              <ChevronRight class="h-5 w-5" />
            </button>
          </div>

          <div class="text-xs sm:text-sm font-bold text-brand-brown/85">
            {{ formatDateLongSpanish(selectedDate) }}
          </div>

          <div class="flex items-center gap-2 w-full md:w-auto justify-end">
            <button
              @click="selectedDate = todayStr"
              type="button"
              class="px-3 py-1.5 rounded-lg border border-brand-pink-light/50 bg-brand-cream text-xs font-bold text-brand-brown hover:bg-white"
            >
              Hoy
            </button>
            <button
              @click="jumpToNextFriday"
              type="button"
              class="px-3 py-1.5 rounded-lg border border-brand-pink text-brand-pink bg-brand-pink/10 hover:bg-brand-pink/20 text-xs font-bold flex items-center gap-1"
            >
              <Camera class="h-3.5 w-3.5" />
              Próximo Viernes
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Left: Available Slots Column -->
          <div class="lg:col-span-1 rounded-3xl border border-brand-pink-light/30 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-brand-pink-light/20">
              <h2 class="font-serif text-lg font-bold text-brand-brown-dark flex items-center gap-2">
                <Clock class="h-5 w-5 text-brand-pink" />
                <span>Huecos Libres</span>
              </h2>
              <span class="text-xs font-bold text-brand-brown/70 bg-brand-cream px-2 py-0.5 rounded-full">
                {{ daySlots.length }} libres
              </span>
            </div>

            <p class="text-xs text-brand-brown/75 mb-4">
              Haz clic en cualquier hora para agendar una sesión conjunta de ecografía y fotografía.
            </p>

            <div v-if="daySlots.length === 0" class="rounded-2xl bg-brand-cream/60 p-6 text-center text-xs text-brand-brown/70">
              No hay más huecos libres disponibles para este día o la clínica permanece cerrada.
            </div>

            <div v-else class="grid grid-cols-2 gap-2.5 max-h-[420px] overflow-y-auto pr-1">
              <button
                v-for="slot in daySlots"
                :key="slot"
                @click="openBookingModal(slot)"
                type="button"
                class="flex items-center justify-between p-2.5 rounded-xl border border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/80 transition-all text-emerald-900 text-xs font-bold cursor-pointer group"
              >
                <span>{{ slot }}</span>
                <Plus class="h-3.5 w-3.5 text-emerald-600 opacity-60 group-hover:opacity-100" />
              </button>
            </div>
          </div>

          <!-- Right: Day Schedule / Existing Bookings -->
          <div class="lg:col-span-2 rounded-3xl border border-brand-pink-light/30 bg-white p-6 shadow-sm">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-brand-pink-light/20">
              <h2 class="font-serif text-lg font-bold text-brand-brown-dark flex items-center gap-2">
                <CalendarCheck class="h-5 w-5 text-brand-brown" />
                <span>Citas del Día ({{ formatDateSpanish(selectedDate) }})</span>
              </h2>
              <span class="text-xs font-bold text-brand-brown/80">
                {{ dayAppointments.length }} reservas en clínica
              </span>
            </div>

            <div v-if="dayAppointments.length === 0" class="rounded-2xl bg-brand-cream/40 p-10 text-center text-sm text-brand-brown/70">
              No hay citas programadas para esta fecha en la clínica. Todo el día está libre.
            </div>

            <div v-else class="space-y-3">
              <div
                v-for="appt in dayAppointments"
                :key="appt.id"
                :class="[
                  'p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3',
                  appt.serviceTitle.toLowerCase().includes('foto') || appt.notes?.toLowerCase().includes('penélope')
                    ? 'border-brand-pink bg-brand-pink/10 shadow-xs'
                    : 'border-brand-pink-light/30 bg-brand-cream/30'
                ]"
              >
                <div class="flex items-start gap-3">
                  <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white border border-brand-pink-light/40 font-mono font-bold text-brand-brown text-sm">
                    {{ appt.time }}
                  </div>
                  <div>
                    <div class="flex items-center gap-2">
                      <span class="font-bold text-sm text-brand-brown-dark">{{ appt.clientName }}</span>
                      <span
                        v-if="appt.serviceTitle.toLowerCase().includes('foto') || appt.notes?.toLowerCase().includes('penélope')"
                        class="inline-flex items-center gap-1 rounded-full bg-brand-pink text-white px-2 py-0.5 text-[10px] font-bold"
                      >
                        <Camera class="h-3 w-3" />
                        Tu Sesión de Foto
                      </span>
                    </div>

                    <p class="text-xs font-medium text-brand-brown/80 mt-0.5">
                      {{ appt.serviceTitle }} ({{ appt.servicePrice }})
                    </p>

                    <div v-if="appt.clientPhone" class="flex items-center gap-3 mt-1.5 text-xs text-brand-brown/75">
                      <span class="inline-flex items-center gap-1">
                        <Phone class="h-3 w-3 text-brand-pink" />
                        {{ appt.clientPhone }}
                      </span>
                      <a
                        :href="'https://wa.me/34' + appt.clientPhone.replace(/\D/g, '')"
                        target="_blank"
                        class="text-emerald-700 hover:text-emerald-800 font-bold inline-flex items-center gap-1"
                      >
                        <MessageCircle class="h-3 w-3" />
                        WhatsApp
                      </a>
                    </div>
                  </div>
                </div>

                <div class="text-right sm:self-center">
                  <span class="font-mono text-xs text-brand-brown/60">#{{ appt.bookingCode }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 2: ALL PHOTO SESSIONS -->
      <section v-if="activeTab === 'sessions'" class="space-y-6">
        <div class="flex items-center justify-between">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Próximas Sesiones de Fotos</h2>
            <p class="text-xs sm:text-sm text-brand-brown/75 mt-1">
              Listado completo de clientas que han contratado pack combinado con recuerdo fotográfico.
            </p>
          </div>
          <button
            @click="openBookingModal()"
            type="button"
            class="btn-primary py-2 px-4 text-xs font-bold gap-1.5 shadow-sm inline-flex items-center"
          >
            <Plus class="h-4 w-4" />
            <span>Nueva Cita</span>
          </button>
        </div>

        <div v-if="photoAppointments.length === 0" class="rounded-3xl border border-brand-pink-light/30 bg-white p-12 text-center">
          <Camera class="mx-auto h-12 w-12 text-brand-pink-light mb-3" />
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Aún no hay sesiones de fotos programadas</h3>
          <p class="text-xs sm:text-sm text-brand-brown/70 mt-1 max-w-md mx-auto">
            Cuando las mamás reserven desde la web pública o tú misma agendas una cita desde el botón "+ Nueva Cita", aparecerán aquí.
          </p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div
            v-for="appt in photoAppointments"
            :key="appt.id"
            class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between"
          >
            <div class="absolute top-0 right-0 h-1.5 w-full bg-brand-pink"></div>

            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="inline-flex items-center gap-1 rounded-full bg-brand-pink/15 px-2.5 py-1 text-[11px] font-bold text-brand-brown">
                  <Calendar class="h-3 w-3 text-brand-pink" />
                  {{ formatDateSpanish(appt.date) }} - {{ appt.time }}
                </span>
                <span class="font-mono text-xs text-brand-brown/60">#{{ appt.bookingCode }}</span>
              </div>

              <h4 class="font-bold text-base text-brand-brown-dark">{{ appt.clientName }}</h4>
              <p class="text-xs font-semibold text-brand-pink mt-1">{{ appt.serviceTitle }}</p>

              <div class="mt-4 pt-3 border-t border-brand-pink-light/20 space-y-1.5 text-xs text-brand-brown/80">
                <div v-if="appt.clientPhone" class="flex items-center justify-between">
                  <span class="flex items-center gap-1.5">
                    <Phone class="h-3.5 w-3.5 text-brand-pink" />
                    {{ appt.clientPhone }}
                  </span>
                  <a
                    :href="'https://wa.me/34' + appt.clientPhone.replace(/\D/g, '')"
                    target="_blank"
                    class="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                  >
                    <MessageCircle class="h-3 w-3" />
                    Chat
                  </a>
                </div>

                <div v-if="appt.gestationWeek" class="text-xs text-brand-brown/70">
                  Etapa: <strong class="text-brand-brown-dark">{{ appt.gestationWeek }}</strong>
                </div>

                <div v-if="appt.notes" class="text-[11px] text-brand-brown/60 bg-brand-cream/50 p-2 rounded-xl mt-2 italic">
                  {{ appt.notes }}
                </div>
              </div>
            </div>

            <div class="mt-4 pt-3 border-t border-brand-pink-light/20 flex items-center justify-between text-xs font-bold text-brand-brown">
              <span>Importe Pack: {{ appt.servicePrice }}</span>
              <span class="text-emerald-700">Tu 80% asegurado</span>
            </div>
          </div>
        </div>
      </section>

      <!-- TAB 3: SETTLEMENT & EARNINGS TRACKER -->
      <section v-if="activeTab === 'settlement'" class="space-y-6">
        <div>
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Liquidación y Ganancias</h2>
          <p class="text-xs sm:text-sm text-brand-brown/75 mt-1">
            Transparencia total: consulta el 80% correspondiente a tu servicio fotográfico para cada sesión.
          </p>
        </div>

        <!-- Metric KPI Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <div class="rounded-3xl border border-brand-pink-light/30 bg-white p-6 shadow-sm">
            <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Sesiones Registradas</span>
            <div class="mt-2 text-3xl font-extrabold text-brand-brown-dark font-serif">
              {{ settlementSummary.totalSessions }}
            </div>
            <p class="mt-1 text-xs text-brand-brown/60">Packs Eco + Foto agendados</p>
          </div>

          <div class="rounded-3xl border border-brand-pink-light/30 bg-white p-6 shadow-sm">
            <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Total Servicio Fotos</span>
            <div class="mt-2 text-3xl font-extrabold text-brand-brown-dark font-serif">
              {{ settlementSummary.totalGrossPhoto }} €
            </div>
            <p class="mt-1 text-xs text-brand-brown/60">Valor total del concepto fotos</p>
          </div>

          <div class="rounded-3xl border border-emerald-300 bg-emerald-50/70 p-6 shadow-sm">
            <span class="text-xs font-bold uppercase tracking-wider text-emerald-800">Tu Parte a Cobrar (80%)</span>
            <div class="mt-2 text-3xl font-extrabold text-emerald-900 font-serif">
              {{ settlementSummary.totalPenelopeEarned.toFixed(2) }} €
            </div>
            <p class="mt-1 text-xs text-emerald-700 font-medium">Neto suplido a transferir por EcoNane</p>
          </div>
        </div>

        <!-- Breakdown Table -->
        <div class="rounded-3xl border border-brand-pink-light/30 bg-white p-6 shadow-sm">
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark mb-4">Tarifas y Repartos Oficiales Acordados</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs sm:text-sm">
              <thead>
                <tr class="border-b border-brand-pink-light/30 text-brand-brown/70 uppercase text-[10px] tracking-wider">
                  <th class="py-3 px-3">Pack Combinado</th>
                  <th class="py-3 px-3 text-right">PVP Clienta</th>
                  <th class="py-3 px-3 text-right">Parte Eco</th>
                  <th class="py-3 px-3 text-right">Parte Foto</th>
                  <th class="py-3 px-3 text-right text-emerald-700 font-bold">Tu 80% (Penélope)</th>
                  <th class="py-3 px-3 text-right">EcoNane (Eco + 20%)</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-pink-light/20">
                <tr v-for="pack in collaboratorPacks" :key="pack.id" class="hover:bg-brand-cream/30">
                  <td class="py-3.5 px-3">
                    <strong class="text-brand-brown-dark block">{{ pack.title }}</strong>
                    <span class="text-xs text-brand-brown/60">{{ pack.subtitle }}</span>
                  </td>
                  <td class="py-3.5 px-3 text-right font-bold text-brand-brown-dark">{{ pack.price }}</td>
                  <td class="py-3.5 px-3 text-right text-brand-brown/70">{{ pack.ecoPrice }} €</td>
                  <td class="py-3.5 px-3 text-right text-brand-brown/70">{{ pack.photoPrice }} €</td>
                  <td class="py-3.5 px-3 text-right text-emerald-700 font-extrabold bg-emerald-50/40">{{ pack.penelopeShare.toFixed(2) }} €</td>
                  <td class="py-3.5 px-3 text-right text-brand-brown/80">{{ pack.econaneShare.toFixed(2) }} €</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>

    <!-- NEW BOOKING MODAL -->
    <div v-if="showNewBookingModal" class="modal-overlay">
      <div class="modal-card max-w-xl max-h-[90vh] overflow-y-auto">
        <div class="flex items-center justify-between pb-4 border-b border-brand-pink-light/30">
          <div class="flex items-center gap-2">
            <Camera class="h-5 w-5 text-brand-pink" />
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Agendar Cita Eco + Foto</h3>
          </div>
          <button
            @click="showNewBookingModal = false"
            type="button"
            class="text-brand-brown/60 hover:text-brand-brown p-1"
          >
            ✕
          </button>
        </div>

        <!-- Success feedback screen -->
        <div v-if="bookingSuccess" class="py-6 text-center space-y-4">
          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 class="h-8 w-8" />
          </div>
          <h4 class="font-serif text-xl font-bold text-brand-brown-dark">¡Cita agendada con éxito!</h4>
          <p class="text-xs sm:text-sm text-brand-brown/80 max-w-md mx-auto">
            La cita para <strong>{{ bookingSuccess.clientName }}</strong> ha quedado confirmada el <strong>{{ formatDateSpanish(bookingSuccess.date) }} a las {{ bookingSuccess.time }}</strong>.
          </p>
          <div class="inline-block bg-brand-cream border border-brand-pink-light/40 rounded-2xl p-4 font-mono text-sm font-bold text-brand-brown">
            Código: #{{ bookingSuccess.code }}
          </div>
          <div class="pt-4 flex justify-center gap-3">
            <button
              @click="showNewBookingModal = false"
              type="button"
              class="btn-primary py-2.5 px-6 text-xs font-bold"
            >
              Cerrar
            </button>
          </div>
        </div>

        <!-- Booking Form -->
        <form v-else @submit.prevent="submitCollaboratorBooking" class="mt-4 space-y-4">
          <div>
            <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Pack Seleccionado *</label>
            <select v-model="bookingForm.selectedPackId" class="form-select text-xs sm:text-sm font-semibold">
              <option v-for="p in collaboratorPacks" :key="p.id" :value="p.id">
                {{ p.title }} ({{ p.price }})
              </option>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Nombre Mamá *</label>
              <input v-model="bookingForm.clientName" type="text" placeholder="Ej: María Gómez" class="form-input text-xs" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Teléfono Móvil *</label>
              <input v-model="bookingForm.clientPhone" type="tel" placeholder="Ej: 644189856" class="form-input text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Semana Embarazo (opcional)</label>
              <input v-model="bookingForm.gestationWeek" type="text" placeholder="Ej: 24" class="form-input text-xs" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Email (opcional)</label>
              <input v-model="bookingForm.clientEmail" type="email" placeholder="cliente@correo.com" class="form-input text-xs" />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Fecha de la Cita *</label>
              <input v-model="bookingForm.date" type="date" class="form-input text-xs font-bold" />
            </div>
            <div>
              <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Hora *</label>
              <select v-model="bookingForm.time" class="form-select text-xs font-bold">
                <option value="" disabled>Selecciona hora disponible</option>
                <option v-for="slot in modalDateSlots" :key="slot" :value="slot">
                  {{ slot }}
                </option>
              </select>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase text-brand-brown-dark mb-1">Notas de la sesión (opcional)</label>
            <input v-model="bookingForm.notes" type="text" placeholder="Vestuario, extras o detalles para la sesión" class="form-input text-xs" />
          </div>

          <p v-if="bookingError" class="text-xs text-red-600 font-bold flex items-center gap-1">
            <AlertCircle class="h-3.5 w-3.5" />
            {{ bookingError }}
          </p>

          <div class="pt-2 flex justify-end gap-3">
            <button
              @click="showNewBookingModal = false"
              type="button"
              class="btn-secondary py-2.5 px-4 text-xs font-bold"
            >
              Cancelar
            </button>
            <button type="submit" class="btn-primary py-2.5 px-6 text-xs font-bold shadow-md">
              Confirmar Reserva
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
