<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import {
  Calendar as CalendarIcon,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Heart,
  Send,
  AlertCircle,
  Loader2,
  CalendarPlus,
  ArrowRight,
  ArrowLeft,
  Phone,
  Mail,
  User,
  ShieldCheck,
  Camera
} from '@lucide/vue'
import { useSiteData } from '@/composables/useSiteData'
import type { Appointment } from '@/types'

const {
  experiences,
  packs,
  collaboratorPacks,
  getAvailableSlots,
  createAppointment,
  generateGoogleCalendarUrl,
  generateWhatsAppBookingUrl,
  bookingSettings
} = useSiteData()

// Steps: 1: Service, 2: Date & Time, 3: Client Details, 4: Confirmed
const currentStep = ref<1 | 2 | 3 | 4>(1)

// Step 1: Selected Service & Grouped Containers
type ServiceOption = {
  id: string
  title: string
  duration: number
  price: string
  badge?: string
  description?: string
  category: 'experience' | 'pack' | 'collab'
  type: 'experience' | 'pack'
}

const serviceOptions = computed<ServiceOption[]>(() => {
  const list: ServiceOption[] = []

  // Active experiences
  experiences.value
    .filter(e => e.active !== false)
    .forEach((e, idx) => {
      // Parse duration from string e.g. "45 min" or default 45
      let dur = 45
      if (e.duration) {
        const match = e.duration.match(/\d+/)
        if (match) dur = parseInt(match[0], 10)
      }
      list.push({
        id: `exp-${idx}`,
        title: e.title,
        duration: dur,
        price: e.price,
        badge: e.badge,
        description: e.description,
        category: 'experience',
        type: 'experience'
      })
    })

  // Packs
  packs.value.forEach((p, idx) => {
    list.push({
      id: `pack-${idx}`,
      title: p.title,
      duration: 55,
      price: p.price,
      badge: p.save || undefined,
      description: p.description,
      category: 'pack',
      type: 'pack'
    })
  })

  // Packs Colaborador (Eco + Fotografía)
  collaboratorPacks.value.forEach((cp, idx) => {
    list.push({
      id: `collab-${idx}`,
      title: `[Eco + Foto] ${cp.title}`,
      duration: 50,
      price: cp.price,
      badge: cp.badge || 'Eco + Foto',
      description: `${cp.subtitle} (Penélope Photograph)`,
      category: 'collab',
      type: 'pack'
    })
  })

  return list
})

// Grouped services for separate container blocks
const individualExperiences = computed(() => {
  return serviceOptions.value.filter(s => s.category === 'experience')
})

const packExperiences = computed(() => {
  return serviceOptions.value.filter(s => s.category === 'pack')
})

const collabExperiences = computed(() => {
  return serviceOptions.value.filter(s => s.category === 'collab')
})

const selectedService = ref<ServiceOption | null>(null)

// Step 2: Date & Time
const currentMonthDate = ref(new Date())
const selectedDate = ref<string>('')
const selectedTime = ref<string>('')

// Step 3: Client Details
const clientName = ref('')
const clientPhone = ref('')
const clientEmail = ref('')
const clientGestation = ref('')
const clientNotes = ref('')
const acceptTerms = ref(true)

const errors = ref({
  name: '',
  phone: '',
  email: '',
  terms: ''
})

const isSubmitting = ref(false)
const confirmedAppointment = ref<Appointment | null>(null)

// Gestation quick chips
const gestationPresets = [
  'Semana 12 - 16 (Sexo)',
  'Semana 17 - 23 (Cuerpo entero)',
  'Semana 24 - 30 (Carita 5D estrella)',
  'Semana 31 - 38 (Última etapa)',
  'No lo sé / Consultar'
]

// Set initial service
onMounted(() => {
  if (serviceOptions.value.length > 0) {
    selectedService.value = serviceOptions.value[0] || null
  }
})

// Calendar Calculations
const calendarYear = computed(() => currentMonthDate.value.getFullYear())
const calendarMonth = computed(() => currentMonthDate.value.getMonth())

const monthNames = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const currentMonthLabel = computed(() => {
  return `${monthNames[calendarMonth.value]} ${calendarYear.value}`
})

const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

type CalendarDay = {
  dateStr: string
  dayNumber: number
  isCurrentMonth: boolean
  isPast: boolean
  isToday: boolean
  isOpen: boolean
  isBlocked: boolean
  hasSlots: boolean
}

const calendarDays = computed<CalendarDay[]>(() => {
  const year = calendarYear.value
  const month = calendarMonth.value

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)

  // In Spain Monday is day 1, Sunday is day 7 (0 in JS getDay)
  let startingDayOfWeek = firstDayOfMonth.getDay() - 1
  if (startingDayOfWeek === -1) startingDayOfWeek = 6

  const totalDays = lastDayOfMonth.getDate()

  const days: CalendarDay[] = []

  // Pad previous month days
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = startingDayOfWeek - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i
    const prevDate = new Date(year, month - 1, d)
    const dateStr = prevDate.toISOString().slice(0, 10)
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: false,
      isPast: true,
      isToday: false,
      isOpen: false,
      isBlocked: false,
      hasSlots: false
    })
  }

  const todayStr = new Date().toISOString().slice(0, 10)

  // Current month days
  for (let d = 1; d <= totalDays; d++) {
    const dateObj = new Date(year, month, d)
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

    const isPast = dateStr < todayStr
    const isToday = dateStr === todayStr

    const dayOfWeek = dateObj.getDay()
    const daySched = bookingSettings.value?.schedule?.[dayOfWeek]
    const isOpen = Boolean(daySched && daySched.isOpen)
    const isBlocked = Boolean(bookingSettings.value?.blockedDates?.includes(dateStr))

    const dur = selectedService.value?.duration || 45
    const slots = (!isPast && isOpen && !isBlocked) ? getAvailableSlots(dateStr, dur) : []
    const hasSlots = slots.length > 0

    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isPast,
      isToday,
      isOpen,
      isBlocked,
      hasSlots
    })
  }

  return days
})

function prevMonth() {
  const now = new Date()
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const target = new Date(calendarYear.value, calendarMonth.value - 1, 1)

  // Don't navigate to past months
  if (target >= currentMonthStart) {
    currentMonthDate.value = target
  }
}

function nextMonth() {
  const target = new Date(calendarYear.value, calendarMonth.value + 1, 1)
  // Limit to max 3 months ahead
  const maxFuture = new Date()
  maxFuture.setMonth(maxFuture.getMonth() + 3)

  if (target <= maxFuture) {
    currentMonthDate.value = target
  }
}

function handleSelectDay(day: CalendarDay) {
  if (day.isPast || !day.isOpen || day.isBlocked || !day.hasSlots) return
  selectedDate.value = day.dateStr
  selectedTime.value = ''
}

// Available slots for selected date
const availableSlots = computed<string[]>(() => {
  if (!selectedDate.value || !selectedService.value) return []
  return getAvailableSlots(selectedDate.value, selectedService.value.duration)
})

// Divide slots into Morning and Afternoon
const morningSlots = computed(() => {
  return availableSlots.value.filter(s => {
    const hour = parseInt(s.split(':')[0] || '0', 10)
    return hour < 15
  })
})

const afternoonSlots = computed(() => {
  return availableSlots.value.filter(s => {
    const hour = parseInt(s.split(':')[0] || '0', 10)
    return hour >= 15
  })
})

function selectSlot(time: string) {
  selectedTime.value = time
}

// Step validations
function goToStep2() {
  if (selectedService.value) {
    currentStep.value = 2
  }
}

function goToStep3() {
  if (selectedDate.value && selectedTime.value) {
    currentStep.value = 3
  }
}

function validateDetails(): boolean {
  errors.value = { name: '', phone: '', email: '', terms: '' }
  let valid = true

  if (!clientName.value.trim() || clientName.value.trim().length < 2) {
    errors.value.name = 'Por favor, introduce tu nombre completo.'
    valid = false
  }

  const cleanPhone = clientPhone.value.replace(/[\s\-\(\)]/g, '')
  const phonePattern = /^(\+?\d{1,4})?\d{9,12}$/
  if (!cleanPhone || !phonePattern.test(cleanPhone)) {
    errors.value.phone = 'Introduce un número de teléfono válido (ej: 644189856).'
    valid = false
  }

  if (clientEmail.value.trim()) {
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailPattern.test(clientEmail.value.trim())) {
      errors.value.email = 'El formato del correo electrónico no parece válido.'
      valid = false
    }
  }

  if (!acceptTerms.value) {
    errors.value.terms = 'Debes aceptar la cláusula de protección de datos.'
    valid = false
  }

  return valid
}

async function handleConfirmBooking() {
  if (!validateDetails() || !selectedService.value || !selectedDate.value || !selectedTime.value) {
    return
  }

  isSubmitting.value = true
  try {
    const appt = await createAppointment({
      clientName: clientName.value,
      clientPhone: clientPhone.value,
      clientEmail: clientEmail.value,
      gestationWeek: clientGestation.value,
      serviceTitle: selectedService.value.title,
      serviceDuration: selectedService.value.duration,
      servicePrice: selectedService.value.price,
      date: selectedDate.value,
      time: selectedTime.value,
      notes: clientNotes.value
    })

    confirmedAppointment.value = appt
    currentStep.value = 4
  } catch (err) {
    alert('Hubo un problema al tramitar tu reserva. Por favor, inténtalo de nuevo o contáctanos por WhatsApp.')
  } finally {
    isSubmitting.value = false
  }
}

function handleDownloadIcs() {
  if (!confirmedAppointment.value) return
  const appt = confirmedAppointment.value
  const [year, month, day] = appt.date.split('-')
  const [hour, min] = appt.time.split(':')
  const start = `${year}${month}${day}T${hour}${min}00`

  const dur = appt.serviceDuration || 45
  const endMinutes = Number(hour) * 60 + Number(min) + dur
  const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0')
  const endM = (endMinutes % 60).toString().padStart(2, '0')
  const end = `${year}${month}${day}T${endH}${endM}00`

  const ics = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EcoNane//Reserva Cita//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Ecografía en EcoNane - ${appt.serviceTitle}
DESCRIPTION:Cita confirmada para ${appt.clientName} (Código: ${appt.bookingCode}). Teléfono: +34 644 18 98 56
LOCATION:Carrer Colón\\, 114\\, 03570 La Vila Joiosa\\, Alicante
DTSTART:${start}
DTEND:${end}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `Cita-EcoNane-${appt.bookingCode}.ics`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function resetWizard() {
  currentStep.value = 1
  selectedDate.value = ''
  selectedTime.value = ''
  clientName.value = ''
  clientPhone.value = ''
  clientEmail.value = ''
  clientGestation.value = ''
  clientNotes.value = ''
  confirmedAppointment.value = null
}
</script>

<template>
  <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 sm:p-8 shadow-sm">
    <!-- Header Step Progress -->
    <div class="mb-8">
      <div class="flex items-center justify-between gap-2 border-b border-brand-pink-light/20 pb-4">
        <div class="flex items-center gap-2">
          <span class="flex h-7 w-7 items-center justify-center rounded-full bg-brand-brown text-xs font-bold text-white shadow-xs">
            {{ currentStep }}
          </span>
          <div>
            <h3 class="font-serif text-lg sm:text-xl font-bold text-brand-brown-dark leading-tight">
              <span v-if="currentStep === 1">Elige tu Experiencia</span>
              <span v-else-if="currentStep === 2">Selecciona Día y Hora</span>
              <span v-else-if="currentStep === 3">Tus Datos de Contacto</span>
              <span v-else>¡Cita Confirmada!</span>
            </h3>
            <p class="text-xs text-brand-brown/70 mt-0.5">
              <span v-if="currentStep === 1">Paso 1 de 3 · Experiencias y Packs de ecografía</span>
              <span v-else-if="currentStep === 2">Paso 2 de 3 · Disponibilidad en tiempo real</span>
              <span v-else-if="currentStep === 3">Paso 3 de 3 · Datos para la confirmación oficial</span>
              <span v-else>Reserva completada con éxito</span>
            </p>
          </div>
        </div>

        <!-- Back Button (if on steps 2 or 3) -->
        <button
          v-if="currentStep === 2 || currentStep === 3"
          type="button"
          @click="currentStep--"
          class="flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-3 py-1.5 text-xs font-bold text-brand-brown hover:bg-brand-pink-light/20 transition-colors cursor-pointer"
        >
          <ArrowLeft class="h-3.5 w-3.5" />
          <span>Atrás</span>
        </button>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- STEP 1: SELECT EXPERIENCE / PACK (DIVIDIDO EN BLOQUES) -->
    <!-- ============================================== -->
    <div v-if="currentStep === 1" class="space-y-6 animate-in fade-in">
      <!-- BLOQUE 1: ECOGRAFÍAS 4D/5D INDIVIDUALES -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-brand-cream/25 p-4 sm:p-6 space-y-4 shadow-2xs">
        <div class="flex items-center justify-between pb-3 border-b border-brand-pink-light/30">
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-8 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
              <Sparkles class="h-4 w-4" />
            </div>
            <div>
              <h3 class="font-serif text-base sm:text-lg font-bold text-brand-brown-dark leading-tight">
                Ecografías 4D / 5D
              </h3>
              <p class="text-[11px] sm:text-xs text-brand-brown/70">Sesiones individuales para conocer y conectar con tu bebé.</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-brand-brown/70 bg-white px-2.5 py-1 rounded-full border border-brand-pink-light/40 shrink-0">
            {{ individualExperiences.length }} opciones
          </span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="service in individualExperiences"
            :key="service.id"
            @click="selectedService = service"
            :class="[
              'relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200',
              selectedService?.id === service.id
                ? 'border-brand-brown bg-brand-cream/70 shadow-md ring-2 ring-brand-brown/20'
                : 'border-brand-pink-light/40 bg-white hover:border-brand-pink hover:bg-brand-cream/20'
            ]"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <span class="font-serif text-base font-bold text-brand-brown-dark">
                  {{ service.title }}
                </span>
                <span
                  v-if="service.badge"
                  class="rounded-full bg-brand-pink/20 px-2.5 py-0.5 text-[10px] font-bold text-brand-brown-dark shrink-0"
                >
                  {{ service.badge }}
                </span>
              </div>

              <p class="mt-1 text-xs text-brand-brown/80 line-clamp-2 leading-relaxed">
                {{ service.description || 'Sesión de ecografía emocional de alta definición.' }}
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-3">
              <div class="flex items-center gap-1.5 text-xs text-brand-brown/70 font-medium">
                <Clock class="h-3.5 w-3.5" />
                <span>{{ service.duration }} min aprox.</span>
              </div>
              <span class="font-serif text-base font-bold text-brand-brown-dark">
                {{ service.price }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- BLOQUE 2: PACKS ECOGRAFÍAS (SEGUIMIENTO) -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-brand-cream/25 p-4 sm:p-6 space-y-4 shadow-2xs">
        <div class="flex items-center justify-between pb-3 border-b border-brand-pink-light/30">
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-8 rounded-xl bg-brand-pink/15 text-brand-pink flex items-center justify-center">
              <Heart class="h-4 w-4" />
            </div>
            <div>
              <h3 class="font-serif text-base sm:text-lg font-bold text-brand-brown-dark leading-tight">
                Packs Ecografías (Seguimiento)
              </h3>
              <p class="text-[11px] sm:text-xs text-brand-brown/70">Acompaña la evolución de tu embarazo en varios trimestres con descuento.</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-brand-brown/70 bg-white px-2.5 py-1 rounded-full border border-brand-pink-light/40 shrink-0">
            {{ packExperiences.length }} packs
          </span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="service in packExperiences"
            :key="service.id"
            @click="selectedService = service"
            :class="[
              'relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200',
              selectedService?.id === service.id
                ? 'border-brand-brown bg-brand-cream/70 shadow-md ring-2 ring-brand-brown/20'
                : 'border-brand-pink-light/40 bg-white hover:border-brand-pink hover:bg-brand-cream/20'
            ]"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <span class="font-serif text-base font-bold text-brand-brown-dark">
                  {{ service.title }}
                </span>
                <span
                  v-if="service.badge"
                  class="rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200 px-2.5 py-0.5 text-[10px] font-bold shrink-0"
                >
                  {{ service.badge }}
                </span>
              </div>

              <p class="mt-1 text-xs text-brand-brown/80 line-clamp-2 leading-relaxed">
                {{ service.description || 'Packs combinados de ecografías en diferentes trimestres.' }}
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-3">
              <div class="flex items-center gap-1.5 text-xs text-brand-brown/70 font-medium">
                <Clock class="h-3.5 w-3.5" />
                <span>{{ service.duration }} min aprox.</span>
              </div>
              <span class="font-serif text-base font-bold text-brand-brown-dark">
                {{ service.price }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- BLOQUE 3: PACKS ECOGRAFÍA + FOTOGRAFÍA (PENÉLOPE PHOTOGRAPH) -->
      <div class="rounded-3xl border border-brand-pink/30 bg-gradient-to-b from-brand-pink/5 to-white p-4 sm:p-6 space-y-4 shadow-2xs">
        <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-brand-pink-light/30">
          <div class="flex items-center gap-2.5">
            <div class="h-8 w-8 rounded-xl bg-brand-pink text-white flex items-center justify-center shadow-xs">
              <Camera class="h-4 w-4" />
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h3 class="font-serif text-base sm:text-lg font-bold text-brand-brown-dark leading-tight">
                  Packs Ecografía + Recuerdo Fotográfico
                </h3>
                <span class="rounded-full bg-brand-pink/20 px-2 py-0.5 text-[10px] font-bold text-brand-brown-dark">
                  Penélope
                </span>
              </div>
              <p class="text-[11px] sm:text-xs text-brand-brown/70">Ecografía 4D/5D en clínica + sesión fotográfica profesional de premamá o familia.</p>
            </div>
          </div>
          <span class="text-[11px] font-bold text-brand-brown/70 bg-white px-2.5 py-1 rounded-full border border-brand-pink-light/40 shrink-0">
            {{ collabExperiences.length }} packs
          </span>
        </div>

        <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div
            v-for="service in collabExperiences"
            :key="service.id"
            @click="selectedService = service"
            :class="[
              'relative flex cursor-pointer flex-col justify-between rounded-2xl border p-4 transition-all duration-200',
              selectedService?.id === service.id
                ? 'border-brand-brown bg-brand-cream/70 shadow-md ring-2 ring-brand-brown/20'
                : 'border-brand-pink-light/40 bg-white hover:border-brand-pink hover:bg-brand-cream/20'
            ]"
          >
            <div>
              <div class="flex items-start justify-between gap-2">
                <span class="font-serif text-base font-bold text-brand-brown-dark">
                  {{ service.title }}
                </span>
                <span
                  v-if="service.badge"
                  class="rounded-full bg-brand-pink text-white px-2.5 py-0.5 text-[10px] font-bold shrink-0 shadow-2xs"
                >
                  {{ service.badge }}
                </span>
              </div>

              <p class="mt-1 text-xs text-brand-brown/80 line-clamp-2 leading-relaxed">
                {{ service.description }}
              </p>
            </div>

            <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-3">
              <div class="flex items-center gap-1.5 text-xs text-brand-brown/70 font-medium">
                <Clock class="h-3.5 w-3.5" />
                <span>{{ service.duration }} min aprox.</span>
              </div>
              <div class="text-right">
                <span class="font-serif text-base font-bold text-brand-brown-dark">
                  {{ service.price }}
                </span>
                <span class="block text-[10px] text-brand-brown/60 font-medium leading-none">pack completo</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Action Bar with Selection Feedback -->
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-brand-pink-light/30">
        <div v-if="selectedService" class="text-xs text-brand-brown-dark flex items-center gap-2">
          <span class="font-bold">Seleccionado:</span>
          <span class="bg-brand-pink/15 text-brand-brown-dark font-semibold px-3 py-1 rounded-full border border-brand-pink/30">
            {{ selectedService.title }} ({{ selectedService.price }})
          </span>
        </div>
        <div v-else class="text-xs text-brand-brown/60 italic">
          Selecciona un servicio para continuar
        </div>

        <button
          type="button"
          @click="goToStep2"
          :disabled="!selectedService"
          class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-brown px-7 py-3.5 text-sm font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
        >
          <span>Elegir Día y Hora</span>
          <ArrowRight class="h-4 w-4" />
        </button>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- STEP 2: CALENDAR & TIME SLOTS                  -->
    <!-- ============================================== -->
    <div v-else-if="currentStep === 2" class="space-y-6 animate-in fade-in">
      <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <!-- Left: Interactive Calendar (7 cols) -->
        <div class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/20 p-4 sm:p-5 lg:col-span-7">
          <!-- Calendar Month Navigation -->
          <div class="flex items-center justify-between mb-4">
            <span class="font-serif text-base font-bold text-brand-brown-dark capitalize">
              {{ currentMonthLabel }}
            </span>
            <div class="flex items-center gap-1">
              <button
                type="button"
                @click="prevMonth"
                class="rounded-xl p-1.5 text-brand-brown hover:bg-brand-pink-light/20 transition-colors cursor-pointer"
                title="Mes anterior"
              >
                <ChevronLeft class="h-5 w-5" />
              </button>
              <button
                type="button"
                @click="nextMonth"
                class="rounded-xl p-1.5 text-brand-brown hover:bg-brand-pink-light/20 transition-colors cursor-pointer"
                title="Mes siguiente"
              >
                <ChevronRight class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Weekdays Row -->
          <div class="grid grid-cols-7 gap-1 text-center text-xs font-bold text-brand-brown/60 mb-2">
            <div v-for="wd in weekDays" :key="wd" class="py-1">
              {{ wd }}
            </div>
          </div>

          <!-- Month Grid Days -->
          <div class="grid grid-cols-7 gap-1.5 text-center">
            <button
              v-for="d in calendarDays"
              :key="d.dateStr"
              type="button"
              @click="handleSelectDay(d)"
              :disabled="d.isPast || !d.isOpen || d.isBlocked || !d.hasSlots"
              :class="[
                'aspect-square rounded-xl p-1 text-xs font-semibold flex flex-col items-center justify-center transition-all',
                !d.isCurrentMonth
                  ? 'opacity-20 pointer-events-none'
                  : d.isPast || !d.isOpen || d.isBlocked || !d.hasSlots
                    ? 'opacity-35 text-stone-400 bg-stone-100/50 cursor-not-allowed'
                    : selectedDate === d.dateStr
                      ? 'bg-brand-brown text-white shadow-md scale-105 font-bold cursor-pointer'
                      : 'bg-white hover:bg-brand-pink-light/30 text-brand-brown-dark cursor-pointer shadow-xs border border-brand-pink-light/20'
              ]"
            >
              <span>{{ d.dayNumber }}</span>
              <span
                v-if="d.isCurrentMonth && !d.isPast && d.isOpen && !d.isBlocked && d.hasSlots && selectedDate !== d.dateStr"
                class="h-1 w-1 rounded-full bg-emerald-500 mt-0.5"
              ></span>
            </button>
          </div>

          <!-- Calendar Legend -->
          <div class="mt-4 flex flex-wrap items-center gap-3 pt-3 border-t border-brand-pink-light/20 text-[11px] text-brand-brown/70">
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-emerald-500"></span>
              <span>Día Disponible</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-brand-brown"></span>
              <span>Seleccionado</span>
            </div>
            <div class="flex items-center gap-1.5">
              <span class="h-2 w-2 rounded-full bg-stone-300"></span>
              <span>Cerrado / Completo</span>
            </div>
          </div>
        </div>

        <!-- Right: Time Slots Selector (5 cols) -->
        <div class="rounded-2xl border border-brand-pink-light/40 bg-white p-4 sm:p-5 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h4 class="font-serif text-sm font-bold text-brand-brown-dark mb-1">
              Horas Disponibles
            </h4>
            <p v-if="selectedDate" class="text-xs text-brand-brown/70 mb-4">
              Día seleccionado: <strong class="text-brand-brown-dark">{{ selectedDate }}</strong>
            </p>
            <p v-else class="text-xs text-brand-brown/60 mb-4">
              Selecciona primero un día en el calendario para ver los turnos libres.
            </p>

            <div v-if="!selectedDate" class="p-8 text-center text-xs text-brand-brown/50 border border-dashed border-brand-pink-light/40 rounded-xl">
              👈 Toca un día verde en el calendario
            </div>

            <div v-else-if="availableSlots.length === 0" class="p-6 text-center text-xs text-amber-800 bg-amber-50 rounded-xl border border-amber-200">
              No quedan horas libres para este día. Por favor, selecciona otra fecha disponible.
            </div>

            <div v-else class="space-y-4 max-h-72 overflow-y-auto pr-1">
              <!-- Turno Mañana -->
              <div v-if="morningSlots.length > 0">
                <span class="text-[11px] font-bold uppercase tracking-wider text-brand-brown/60 block mb-2">
                  ☀️ Turno Mañana
                </span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="s in morningSlots"
                    :key="s"
                    type="button"
                    @click="selectSlot(s)"
                    :class="[
                      'py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      selectedTime === s
                        ? 'bg-brand-brown text-white shadow-sm scale-102'
                        : 'bg-brand-cream/50 text-brand-brown-dark hover:bg-brand-pink-light/30 border border-brand-pink-light/30'
                    ]"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>

              <!-- Turno Tarde -->
              <div v-if="afternoonSlots.length > 0">
                <span class="text-[11px] font-bold uppercase tracking-wider text-brand-brown/60 block mb-2">
                  🌙 Turno Tarde
                </span>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    v-for="s in afternoonSlots"
                    :key="s"
                    type="button"
                    @click="selectSlot(s)"
                    :class="[
                      'py-2 px-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer',
                      selectedTime === s
                        ? 'bg-brand-brown text-white shadow-sm scale-102'
                        : 'bg-brand-cream/50 text-brand-brown-dark hover:bg-brand-pink-light/30 border border-brand-pink-light/30'
                    ]"
                  >
                    {{ s }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Action -->
          <div class="pt-4 border-t border-brand-pink-light/20 mt-4">
            <button
              type="button"
              @click="goToStep3"
              :disabled="!selectedDate || !selectedTime"
              class="w-full flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
            >
              <span>Continuar con mis datos</span>
              <ArrowRight class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- STEP 3: CLIENT DETAILS                         -->
    <!-- ============================================== -->
    <div v-else-if="currentStep === 3" class="space-y-6 animate-in fade-in">
      <!-- Recap Box -->
      <div class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/40 p-4 text-xs flex flex-wrap items-center justify-between gap-3">
        <div>
          <span class="text-brand-brown/70 block text-[11px] uppercase font-bold">Servicio Seleccionado:</span>
          <span class="font-serif font-bold text-brand-brown-dark text-sm">{{ selectedService?.title }}</span>
        </div>
        <div class="flex items-center gap-4">
          <div>
            <span class="text-brand-brown/70 block text-[11px] uppercase font-bold">Fecha:</span>
            <span class="font-bold text-brand-brown-dark">📅 {{ selectedDate }}</span>
          </div>
          <div>
            <span class="text-brand-brown/70 block text-[11px] uppercase font-bold">Hora:</span>
            <span class="font-bold text-brand-brown-dark">⏰ {{ selectedTime }}</span>
          </div>
          <div>
            <span class="text-brand-brown/70 block text-[11px] uppercase font-bold">Precio:</span>
            <span class="font-serif font-bold text-brand-brown-dark text-sm">{{ selectedService?.price }}</span>
          </div>
        </div>
      </div>

      <!-- Form Inputs -->
      <form @submit.prevent="handleConfirmBooking" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Nombre de la Mamá / Familia <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <User class="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
              <input
                v-model="clientName"
                type="text"
                required
                placeholder="Ej: Laura Domínguez"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 pl-9 pr-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
            <p v-if="errors.name" class="mt-1 text-[11px] text-rose-600 font-semibold">{{ errors.name }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Teléfono Móvil (WhatsApp) <span class="text-rose-500">*</span>
            </label>
            <div class="relative">
              <Phone class="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
              <input
                v-model="clientPhone"
                type="tel"
                required
                placeholder="Ej: 644 18 98 56"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 pl-9 pr-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
            <p v-if="errors.phone" class="mt-1 text-[11px] text-rose-600 font-semibold">{{ errors.phone }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Correo Electrónico (Para recibir la confirmación)
            </label>
            <div class="relative">
              <Mail class="absolute left-3 top-2.5 h-4 w-4 text-brand-brown/50" />
              <input
                v-model="clientEmail"
                type="email"
                placeholder="tuemail@ejemplo.com"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 pl-9 pr-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
            <p v-if="errors.email" class="mt-1 text-[11px] text-rose-600 font-semibold">{{ errors.email }}</p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Semana de Gestación Aproximada
            </label>
            <input
              v-model="clientGestation"
              type="text"
              placeholder="Ej: Semana 27"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <!-- Quick Presets for Gestation -->
        <div>
          <span class="block text-[11px] font-bold text-brand-brown/60 uppercase mb-1.5">Atajos de semana:</span>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in gestationPresets"
              :key="preset"
              type="button"
              @click="clientGestation = preset"
              class="rounded-lg border border-brand-pink-light/50 bg-white px-2.5 py-1 text-[11px] font-medium text-brand-brown hover:bg-brand-pink-light/20 cursor-pointer"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <!-- Notes -->
        <div>
          <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
            Comentario o Petición Especial (Opcional)
          </label>
          <textarea
            v-model="clientNotes"
            rows="2"
            placeholder="¿Vendréis muchos familiares? ¿Es para revelación de sexo? Cuéntanos..."
            class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 p-3 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
          ></textarea>
        </div>

        <!-- Terms checkbox -->
        <div class="pt-2">
          <label class="flex items-start gap-2 text-xs text-brand-brown/80 cursor-pointer">
            <input
              v-model="acceptTerms"
              type="checkbox"
              required
              class="rounded text-brand-brown focus:ring-brand-pink mt-0.5 cursor-pointer"
            />
            <span>
              Acepto la <a href="#privacidad" class="text-brand-pink underline font-medium">política de privacidad</a> y el tratamiento de mis datos para la coordinación de la cita en EcoNane.
            </span>
          </label>
          <p v-if="errors.terms" class="mt-1 text-[11px] text-rose-600 font-semibold">{{ errors.terms }}</p>
        </div>

        <!-- Submit Button -->
        <div class="pt-4 flex justify-end">
          <button
            type="submit"
            :disabled="isSubmitting"
            class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-brand-brown px-8 py-3.5 text-sm font-bold text-white shadow-xl shadow-brand-brown/20 transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
          >
            <Loader2 v-if="isSubmitting" class="h-4 w-4 animate-spin" />
            <Sparkles v-else class="h-4 w-4" />
            <span>{{ isSubmitting ? 'Confirmando reserva...' : 'CONFIRMAR RESERVA ONLINE' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- ============================================== -->
    <!-- STEP 4: CONFIRMATION & SUCCESS SCREEN          -->
    <!-- ============================================== -->
    <div v-else-if="currentStep === 4 && confirmedAppointment" class="text-center py-4 space-y-6 animate-in zoom-in-95">
      <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600 shadow-sm">
        <CheckCircle2 class="h-9 w-9" />
      </div>

      <div>
        <span class="inline-flex items-center gap-1.5 rounded-full bg-brand-cream px-3 py-1 text-xs font-bold text-brand-brown">
          <Heart class="h-3.5 w-3.5 fill-brand-pink text-brand-pink" />
          <span>¡Reserva Confirmada!</span>
        </span>
        <h3 class="mt-2 font-serif text-2xl sm:text-3xl font-bold text-brand-brown-dark">
          ¡Nos vemos pronto, {{ confirmedAppointment.clientName }}! ❤️
        </h3>
        <p class="mt-1 text-xs sm:text-sm text-brand-brown/80 max-w-md mx-auto">
          Tu cita ha quedado registrada en la agenda de EcoNane. Te hemos reservado este hueco exclusivamente para ti.
        </p>
      </div>

      <!-- Booking Card -->
      <div class="max-w-md mx-auto rounded-3xl border border-brand-pink-light/60 bg-gradient-to-br from-brand-cream/50 via-white to-brand-pink-light/20 p-5 sm:p-6 text-left shadow-sm space-y-3">
        <div class="flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
          <span class="text-xs text-brand-brown/70 font-bold uppercase tracking-wider">Código de Reserva</span>
          <span class="font-mono text-base font-bold text-brand-brown tracking-wider bg-white px-2.5 py-0.5 rounded-lg border border-brand-pink-light/50">
            {{ confirmedAppointment.bookingCode }}
          </span>
        </div>

        <div class="space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Servicio:</span>
            <strong class="text-brand-brown-dark">{{ confirmedAppointment.serviceTitle }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Fecha:</span>
            <strong class="text-brand-brown-dark">📅 {{ confirmedAppointment.date }}</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Hora:</span>
            <strong class="text-brand-brown-dark">⏰ {{ confirmedAppointment.time }} h ({{ confirmedAppointment.serviceDuration }} min)</strong>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Ubicación:</span>
            <span class="text-brand-brown-dark font-medium text-right">Carrer Colón, 114, La Vila Joiosa</span>
          </div>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="max-w-md mx-auto flex flex-col gap-2.5 pt-2">
        <!-- Add to Google Calendar -->
        <a
          :href="generateGoogleCalendarUrl(confirmedAppointment)"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 rounded-2xl border border-brand-brown/30 bg-white px-5 py-3 text-xs font-bold text-brand-brown hover:bg-brand-cream transition-all shadow-xs"
        >
          <CalendarPlus class="h-4 w-4" />
          <span>Añadir a Google Calendar</span>
        </a>

        <!-- Download .ICS for Apple / Outlook -->
        <button
          type="button"
          @click="handleDownloadIcs"
          class="flex items-center justify-center gap-2 rounded-2xl border border-brand-pink-light/60 bg-brand-cream/30 px-5 py-3 text-xs font-bold text-brand-brown hover:bg-brand-pink-light/30 transition-all cursor-pointer"
        >
          <CalendarIcon class="h-4 w-4" />
          <span>Añadir a Apple Calendar / Outlook (.ics)</span>
        </button>

        <!-- WhatsApp Chat Button -->
        <a
          :href="generateWhatsAppBookingUrl(confirmedAppointment)"
          target="_blank"
          rel="noopener noreferrer"
          class="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-5 py-3 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
        >
          <Send class="h-4 w-4" />
          <span>Abrir chat de WhatsApp con EcoNane</span>
        </a>

        <!-- New Booking Button -->
        <button
          type="button"
          @click="resetWizard"
          class="mt-2 text-xs text-brand-brown/60 hover:text-brand-brown underline cursor-pointer"
        >
          Hacer otra reserva
        </button>
      </div>
    </div>
  </div>
</template>
