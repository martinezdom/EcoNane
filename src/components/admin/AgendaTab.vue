<script setup lang="ts">
import { ref, computed } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { Appointment, AppointmentStatus } from '@/types'
import {
  Calendar,
  Clock,
  CheckCircle2,
  Sparkles,
  Plus,
  RefreshCw,
  Download,
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarRange,
  LayoutGrid,
  List,
  Calculator,
  Send,
  Star,
  Camera,
  Pencil,
  Trash2,
  CalendarPlus,
  Phone,
  Mail,
  Search,
  X,
  Check
} from '@lucide/vue'

const emit = defineEmits<{
  (e: 'charge-in-tpv', appointment: Appointment): void
  (e: 'create-session', appointment: Appointment): void
  (e: 'open-settings'): void
}>()

const {
  experiences,
  packs,
  appointments,
  bookingSettings,
  getAvailableSlots,
  createAppointment,
  updateAppointment,
  updateAppointmentStatus,
  deleteAppointment,
  generateGoogleCalendarUrl,
  exportAppointmentsToCSV,
  syncFromSupabase
} = useSiteData()

// -------------------------------------------------------------
// DATES & CONSTANTS
// -------------------------------------------------------------
const daysOfWeekEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const monthsEs = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

const todayStr = computed(() => {
  const now = new Date()
  const year = now.getFullYear()
  const month = (now.getMonth() + 1).toString().padStart(2, '0')
  const day = now.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
})

const tomorrowStr = computed(() => {
  const tmr = new Date()
  tmr.setDate(tmr.getDate() + 1)
  const year = tmr.getFullYear()
  const month = (tmr.getMonth() + 1).toString().padStart(2, '0')
  const day = tmr.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
})

function formatApptDateHuman(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const y = Number(parts[0])
  const m = Number(parts[1]) - 1
  const d = Number(parts[2])
  const dateObj = new Date(y, m, d)
  const dayName = daysOfWeekEs[dateObj.getDay()] || ''
  const monthName = monthsEs[m] || ''
  return `${dayName}, ${d} de ${monthName}`
}

// -------------------------------------------------------------
// KPIS
// -------------------------------------------------------------
const todayAppointmentsCount = computed(() => {
  return appointments.value.filter(a => a.date === todayStr.value && a.status !== 'cancelled').length
})

const upcomingAppointmentsCount = computed(() => {
  return appointments.value.filter(a => a.date >= todayStr.value && a.status === 'confirmed').length
})

const thisMonthCompletedCount = computed(() => {
  const currentMonthPrefix = todayStr.value.slice(0, 7)
  return appointments.value.filter(a => a.date.startsWith(currentMonthPrefix) && a.status === 'completed').length
})

// -------------------------------------------------------------
// CALENDAR VIEW MODES (Día, Semana, Mes, Lista)
// -------------------------------------------------------------
const agendaViewMode = ref<'day' | 'week' | 'month' | 'list'>('day')
const calendarCursor = ref<Date>(new Date())
const selectedDayDateStr = ref<string>(todayStr.value)

const agendaDateFilter = ref<'today' | 'week' | 'month' | 'all'>('today')
const agendaStatusFilter = ref<string>('all')
const agendaSearchQuery = ref('')

const isSyncing = ref(false)
const feedbackMessage = ref('')

function showFeedback(msg: string) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}

const currentCalendarMonthTitle = computed(() => {
  const y = calendarCursor.value.getFullYear()
  const m = calendarCursor.value.getMonth()
  const monthName = monthsEs[m] || ''
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${y}`
})

const selectedDayFullTitle = computed(() => {
  if (!selectedDayDateStr.value) return ''
  const parts = selectedDayDateStr.value.split('-')
  if (parts.length !== 3) return selectedDayDateStr.value
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]))
  const dayName = daysOfWeekEs[d.getDay()] || ''
  const monthName = monthsEs[d.getMonth()] || ''
  return `${dayName} – ${d.getDate()} de ${monthName} de ${d.getFullYear()}`
})

function goToToday() {
  const now = new Date()
  calendarCursor.value = now
  selectedDayDateStr.value = todayStr.value
  agendaDateFilter.value = 'today'
}

function prevCalendarPeriod() {
  if (agendaViewMode.value === 'day') {
    const d = new Date(selectedDayDateStr.value + 'T12:00:00')
    d.setDate(d.getDate() - 1)
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    selectedDayDateStr.value = `${y}-${m}-${day}`
    calendarCursor.value = new Date(d)
  } else if (agendaViewMode.value === 'week') {
    const d = new Date(calendarCursor.value)
    d.setDate(d.getDate() - 7)
    calendarCursor.value = d
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    selectedDayDateStr.value = `${y}-${m}-${day}`
  } else {
    const d = new Date(calendarCursor.value)
    d.setMonth(d.getMonth() - 1)
    calendarCursor.value = d
  }
}

function nextCalendarPeriod() {
  if (agendaViewMode.value === 'day') {
    const d = new Date(selectedDayDateStr.value + 'T12:00:00')
    d.setDate(d.getDate() + 1)
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    selectedDayDateStr.value = `${y}-${m}-${day}`
    calendarCursor.value = new Date(d)
  } else if (agendaViewMode.value === 'week') {
    const d = new Date(calendarCursor.value)
    d.setDate(d.getDate() + 7)
    calendarCursor.value = d
    const y = d.getFullYear()
    const m = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    selectedDayDateStr.value = `${y}-${m}-${day}`
  } else {
    const d = new Date(calendarCursor.value)
    d.setMonth(d.getMonth() + 1)
    calendarCursor.value = d
  }
}

function selectDay(dateStr: string) {
  selectedDayDateStr.value = dateStr
  calendarCursor.value = new Date(dateStr + 'T12:00:00')
}

// -------------------------------------------------------------
// COMPUTED VIEW MODELS
// -------------------------------------------------------------
// 1. Week Date Strip (para la vista Día)
const weekStripDays = computed(() => {
  const refDate = new Date(selectedDayDateStr.value + 'T12:00:00')
  const dayOfWeek = refDate.getDay()
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  const monday = new Date(refDate)
  monday.setDate(refDate.getDate() + diffToMonday)

  const dayLetters = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
  const dayNamesEs = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

  const result = []
  for (let i = 0; i < 7; i++) {
    const cur = new Date(monday)
    cur.setDate(monday.getDate() + i)
    const y = cur.getFullYear()
    const m = (cur.getMonth() + 1).toString().padStart(2, '0')
    const dayNum = cur.getDate().toString().padStart(2, '0')
    const dateStr = `${y}-${m}-${dayNum}`

    const appts = appointments.value.filter(a => a.date === dateStr && a.status !== 'cancelled')

    result.push({
      dateStr,
      dayNumber: cur.getDate(),
      letter: dayLetters[i],
      shortName: dayNamesEs[i],
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === selectedDayDateStr.value,
      appointmentsCount: appts.length,
      appointments: appts
    })
  }
  return result
})

// 2. Timeline del día (08:00 a 21:00)
const dayTimelineHours = computed(() => {
  const hours = [
    '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00',
    '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'
  ]

  const dateStr = selectedDayDateStr.value
  const dayAppts = appointments.value.filter(a => a.date === dateStr)

  return hours.map(hourStr => {
    const prefix = hourStr.slice(0, 2)
    const matchingAppts = dayAppts.filter(a => a.time.startsWith(prefix + ':'))
    return {
      hour: hourStr,
      appointments: matchingAppts
    }
  })
})

const selectedDayAppointments = computed(() => {
  return appointments.value
    .filter(a => a.date === selectedDayDateStr.value)
    .sort((a, b) => a.time.localeCompare(b.time))
})

// 3. Grid de Semana (7 Columnas L-D)
const weekGridDays = computed(() => {
  return weekStripDays.value.map(day => ({
    ...day,
    appointments: appointments.value
      .filter(a => a.date === day.dateStr)
      .sort((a, b) => a.time.localeCompare(b.time))
  }))
})

// 4. Celdas de Mes Completo
const monthCalendarCells = computed(() => {
  const year = calendarCursor.value.getFullYear()
  const month = calendarCursor.value.getMonth()

  const firstDayOfMonth = new Date(year, month, 1)
  const lastDayOfMonth = new Date(year, month + 1, 0)
  const totalDays = lastDayOfMonth.getDate()

  let firstDayWeekIndex = firstDayOfMonth.getDay()
  firstDayWeekIndex = firstDayWeekIndex === 0 ? 6 : firstDayWeekIndex - 1

  const cells = []

  // Prev month filler
  const prevMonthLastDay = new Date(year, month, 0).getDate()
  for (let i = firstDayWeekIndex - 1; i >= 0; i--) {
    const dayNum = prevMonthLastDay - i
    const prevDate = new Date(year, month - 1, dayNum)
    const y = prevDate.getFullYear()
    const m = (prevDate.getMonth() + 1).toString().padStart(2, '0')
    const d = dayNum.toString().padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const appts = appointments.value.filter(a => a.date === dateStr && a.status !== 'cancelled')
    cells.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === selectedDayDateStr.value,
      appointments: appts
    })
  }

  // Current month
  for (let dayNum = 1; dayNum <= totalDays; dayNum++) {
    const curDate = new Date(year, month, dayNum)
    const y = curDate.getFullYear()
    const m = (month + 1).toString().padStart(2, '0')
    const d = dayNum.toString().padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const appts = appointments.value.filter(a => a.date === dateStr && a.status !== 'cancelled')
    cells.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: true,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === selectedDayDateStr.value,
      appointments: appts
    })
  }

  // Next month filler
  const remainingCells = (7 - (cells.length % 7)) % 7
  const totalNeeded = cells.length + remainingCells < 35 ? 35 - cells.length : remainingCells
  for (let dayNum = 1; dayNum <= totalNeeded; dayNum++) {
    const nextDate = new Date(year, month + 1, dayNum)
    const y = nextDate.getFullYear()
    const m = (nextDate.getMonth() + 1).toString().padStart(2, '0')
    const d = dayNum.toString().padStart(2, '0')
    const dateStr = `${y}-${m}-${d}`
    const appts = appointments.value.filter(a => a.date === dateStr && a.status !== 'cancelled')
    cells.push({
      dateStr,
      dayNumber: dayNum,
      isCurrentMonth: false,
      isToday: dateStr === todayStr.value,
      isSelected: dateStr === selectedDayDateStr.value,
      appointments: appts
    })
  }

  return cells
})

// 5. Citas Filtradas para la Vista Lista
const filteredAppointments = computed(() => {
  let list = [...appointments.value]

  if (agendaDateFilter.value === 'today') {
    list = list.filter(a => a.date === todayStr.value)
  } else if (agendaDateFilter.value === 'week') {
    const today = new Date()
    const firstDay = new Date(today)
    firstDay.setDate(today.getDate() - (today.getDay() === 0 ? 6 : today.getDay() - 1))
    const lastDay = new Date(firstDay)
    lastDay.setDate(firstDay.getDate() + 6)
    const startStr = firstDay.toISOString().slice(0, 10)
    const endStr = lastDay.toISOString().slice(0, 10)
    list = list.filter(a => a.date >= startStr && a.date <= endStr)
  } else if (agendaDateFilter.value === 'month') {
    const currentMonthPrefix = todayStr.value.slice(0, 7)
    list = list.filter(a => a.date.startsWith(currentMonthPrefix))
  }

  if (agendaStatusFilter.value !== 'all') {
    list = list.filter(a => a.status === agendaStatusFilter.value)
  }

  if (agendaSearchQuery.value.trim()) {
    const q = agendaSearchQuery.value.toLowerCase().trim()
    list = list.filter(a =>
      a.clientName.toLowerCase().includes(q) ||
      a.clientPhone.toLowerCase().includes(q) ||
      (a.clientEmail && a.clientEmail.toLowerCase().includes(q)) ||
      a.bookingCode.toLowerCase().includes(q) ||
      a.serviceTitle.toLowerCase().includes(q)
    )
  }

  return list.sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date)
    return a.time.localeCompare(b.time)
  })
})

// -------------------------------------------------------------
// APPOINTMENT OPERATIONS
// -------------------------------------------------------------
async function setAppointmentStatus(apptId: string, newStatus: AppointmentStatus) {
  try {
    await updateAppointmentStatus(apptId, newStatus)
    showFeedback(`Estado de la cita actualizado a: ${newStatus}`)
  } catch (err: any) {
    alert('Error al actualizar el estado: ' + (err?.message || err))
  }
}

async function handleDeleteAppointment(appt: Appointment) {
  if (confirm(`¿Seguro que deseas eliminar la cita ${appt.bookingCode} de ${appt.clientName}?`)) {
    try {
      await deleteAppointment(appt.id)
      showFeedback(`Cita ${appt.bookingCode} eliminada correctamente.`)
    } catch (err: any) {
      alert('Error al eliminar la cita: ' + (err?.message || err))
    }
  }
}

function openWhatsAppReminder(appt: Appointment) {
  const cleanPhone = appt.clientPhone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = encodeURIComponent(
    `¡Hola ${appt.clientName}! ❤️ Te recordamos tu cita de ecografía en EcoNane:\n\n` +
    `📅 *Fecha:* ${appt.date}\n` +
    `⏰ *Hora:* ${appt.time} h (${appt.serviceDuration} min)\n` +
    `✨ *Servicio:* ${appt.serviceTitle} (${appt.servicePrice})\n` +
    `📍 *Ubicación:* Carrer Colón, 114, La Vila Joiosa\n` +
    `🔖 *Código de cita:* ${appt.bookingCode}\n\n` +
    `Si tienes cualquier duda o necesitas ajustar la hora, estamos aquí para ayudarte. ¡Te esperamos!`
  )
  window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank')
}

function sendGoogleReviewRequest(appt: Appointment) {
  const cleanPhone = appt.clientPhone.replace(/\D/g, '')
  const fullPhone = cleanPhone.startsWith('34') ? cleanPhone : `34${cleanPhone}`
  const text = encodeURIComponent(
    `¡Hola ${appt.clientName}! ❤️ Muchísimas gracias por visitarnos en EcoNane y compartir un momento tan emocionante con nosotros.\n\n` +
    `¿Qué te ha parecido la experiencia de tu ecografía? Nos ayudarías con tus 5 estrellas dejando una breve reseña en Google (¡solo te llevará 30 segundos!): ⭐\n\n` +
    `👉 https://share.google/BXdcvYZWLOvxcCEIX\n\n` +
    `¡Mil gracias y un fuerte abrazo para toda la familia!`
  )
  window.open(`https://wa.me/${fullPhone}?text=${text}`, '_blank')
}

function downloadIcsForAppt(appt: Appointment) {
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
PRODID:-//EcoNane//Agenda//ES
CALSCALE:GREGORIAN
BEGIN:VEVENT
SUMMARY:Cita ${appt.serviceTitle} - ${appt.clientName}
DESCRIPTION:Cita confirmada en EcoNane (Código: ${appt.bookingCode}). Tel: ${appt.clientPhone}.
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

async function triggerManualSync() {
  isSyncing.value = true
  try {
    await syncFromSupabase()
    showFeedback('¡Agenda y datos sincronizados con la nube!')
  } catch (err: any) {
    alert('Error al sincronizar: ' + (err?.message || err))
  } finally {
    setTimeout(() => {
      isSyncing.value = false
    }, 600)
  }
}

// -------------------------------------------------------------
// MODALS: NUEVA CITA MANUAL & EDITAR CITA
// -------------------------------------------------------------
const showManualAppointmentModal = ref(false)
const manualAppointmentForm = ref({
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  gestationWeek: '',
  serviceTitle: '',
  servicePrice: '',
  serviceDuration: 45,
  date: todayStr.value,
  time: '11:00',
  notes: ''
})

function openNewManualAppointment(initialDate?: any, initialTime?: string) {
  const dateVal = typeof initialDate === 'string' ? initialDate : (selectedDayDateStr.value || todayStr.value)
  const timeVal = typeof initialTime === 'string' ? initialTime : '11:00'
  const firstService = experiences.value[0] || { title: 'Eco Básica 4D/5D', price: '45€' }
  manualAppointmentForm.value = {
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: firstService.title,
    servicePrice: firstService.price,
    serviceDuration: 45,
    date: dateVal,
    time: timeVal,
    notes: ''
  }
  showManualAppointmentModal.value = true
}

const manualAvailableSlots = computed(() => {
  if (!manualAppointmentForm.value.date) return []
  return getAvailableSlots(manualAppointmentForm.value.date, manualAppointmentForm.value.serviceDuration)
})

async function handleCreateManualAppointment() {
  if (!manualAppointmentForm.value.clientName.trim() || !manualAppointmentForm.value.clientPhone.trim()) {
    alert('Por favor indica al menos el nombre y el teléfono de la clienta.')
    return
  }
  if (!manualAppointmentForm.value.date || !manualAppointmentForm.value.time) {
    alert('Por favor selecciona la fecha y hora de la cita.')
    return
  }

  try {
    const appt = await createAppointment({
      clientName: manualAppointmentForm.value.clientName.trim(),
      clientPhone: manualAppointmentForm.value.clientPhone.trim(),
      clientEmail: manualAppointmentForm.value.clientEmail.trim(),
      gestationWeek: manualAppointmentForm.value.gestationWeek.trim(),
      serviceTitle: manualAppointmentForm.value.serviceTitle,
      servicePrice: manualAppointmentForm.value.servicePrice,
      serviceDuration: manualAppointmentForm.value.serviceDuration,
      date: manualAppointmentForm.value.date,
      time: manualAppointmentForm.value.time,
      notes: manualAppointmentForm.value.notes.trim()
    })

    showManualAppointmentModal.value = false
    showFeedback(`¡Cita registrada con éxito! Código: ${appt.bookingCode}`)
  } catch (err: any) {
    alert('Error al crear la cita: ' + (err?.message || err))
  }
}

// Edit Modal
const showEditAppointmentModal = ref(false)
const editingAppointmentId = ref('')
const editAppointmentForm = ref({
  clientName: '',
  clientPhone: '',
  clientEmail: '',
  gestationWeek: '',
  serviceTitle: '',
  servicePrice: '',
  serviceDuration: 45,
  date: '',
  time: '',
  notes: '',
  status: 'confirmed' as AppointmentStatus
})

function openEditAppointment(appt: Appointment) {
  editingAppointmentId.value = appt.id
  editAppointmentForm.value = {
    clientName: appt.clientName || '',
    clientPhone: appt.clientPhone || '',
    clientEmail: appt.clientEmail || '',
    gestationWeek: appt.gestationWeek || '',
    serviceTitle: appt.serviceTitle,
    servicePrice: appt.servicePrice,
    serviceDuration: appt.serviceDuration || 45,
    date: appt.date,
    time: appt.time,
    notes: appt.notes || '',
    status: appt.status
  }
  showEditAppointmentModal.value = true
}

async function handleSaveEditAppointment() {
  if (!editAppointmentForm.value.clientName.trim() || !editAppointmentForm.value.clientPhone.trim()) {
    alert('Por favor indica al menos el nombre y teléfono.')
    return
  }
  try {
    await updateAppointment(editingAppointmentId.value, {
      clientName: editAppointmentForm.value.clientName.trim(),
      clientPhone: editAppointmentForm.value.clientPhone.trim(),
      clientEmail: editAppointmentForm.value.clientEmail.trim(),
      gestationWeek: editAppointmentForm.value.gestationWeek.trim(),
      serviceTitle: editAppointmentForm.value.serviceTitle,
      servicePrice: editAppointmentForm.value.servicePrice,
      serviceDuration: editAppointmentForm.value.serviceDuration,
      date: editAppointmentForm.value.date,
      time: editAppointmentForm.value.time,
      notes: editAppointmentForm.value.notes.trim(),
      status: editAppointmentForm.value.status
    })
    showEditAppointmentModal.value = false
    showFeedback('¡Datos de la cita actualizados con éxito!')
  } catch (err: any) {
    alert('Error al actualizar la cita: ' + (err?.message || err))
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Feedback Toast -->
    <div
      v-if="feedbackMessage"
      class="rounded-2xl bg-emerald-500 text-white px-4 py-3 text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in"
    >
      <div class="flex items-center gap-2">
        <Check class="h-4 w-4" />
        <span>{{ feedbackMessage }}</span>
      </div>
      <button @click="feedbackMessage = ''" class="text-white/80 hover:text-white">
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Agenda y Citas</h2>
        </div>
        <p class="text-sm text-brand-brown/80">
          Gestiona todas las reservas web y presenciales, envía recordatorios y cóbralas directamente en el TPV.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="openNewManualAppointment()"
          class="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-brand-brown px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-brown-dark active:scale-95"
        >
          <Plus class="h-4 w-4" />
          <span>Nueva Cita Manual</span>
        </button>

        <button
          type="button"
          @click="triggerManualSync"
          class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-brand-pink-light/60 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-cream active:scale-95"
          :class="{ 'opacity-70 pointer-events-none': isSyncing }"
          title="Sincronizar citas con la nube para ver cambios en cualquier dispositivo"
        >
          <RefreshCw class="h-4 w-4" :class="{ 'animate-spin': isSyncing }" />
          <span>{{ isSyncing ? 'Sincronizando...' : 'Sincronizar' }}</span>
        </button>

        <button
          type="button"
          @click="exportAppointmentsToCSV(filteredAppointments)"
          class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-brand-pink-light/60 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-cream active:scale-95"
          title="Descargar lista de citas filtradas a Excel / CSV"
        >
          <Download class="h-4 w-4" />
          <span>Exportar Excel</span>
        </button>

        <button
          type="button"
          @click="emit('open-settings')"
          class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-brand-pink-light/60 bg-white px-3.5 py-2.5 text-xs font-bold text-brand-brown shadow-xs transition-all hover:bg-brand-cream active:scale-95"
        >
          <Settings class="h-4 w-4" />
          <span>Horarios y Festivos</span>
        </button>
      </div>
    </div>

    <!-- KPI Summary Cards -->
    <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-brand-brown/70 uppercase tracking-wider">Citas Hoy</span>
          <div class="rounded-xl bg-brand-pink-light/40 p-2 text-brand-pink">
            <Calendar class="h-4 w-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-brown-dark tracking-tight">{{ todayAppointmentsCount }}</span>
          <span class="text-[11px] text-brand-brown/60">programadas</span>
        </div>
      </div>

      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-brand-brown/70 uppercase tracking-wider">Próximas Citas</span>
          <div class="rounded-xl bg-emerald-100 p-2 text-emerald-700">
            <Clock class="h-4 w-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-brown-dark tracking-tight">{{ upcomingAppointmentsCount }}</span>
          <span class="text-[11px] text-brand-brown/60">confirmadas</span>
        </div>
      </div>

      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-brand-brown/70 uppercase tracking-wider">Completadas</span>
          <div class="rounded-xl bg-sky-100 p-2 text-sky-700">
            <CheckCircle2 class="h-4 w-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-brown-dark tracking-tight">{{ thisMonthCompletedCount }}</span>
          <span class="text-[11px] text-brand-brown/60">este mes</span>
        </div>
      </div>

      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-xs">
        <div class="flex items-center justify-between">
          <span class="text-xs font-bold text-brand-brown/70 uppercase tracking-wider">Total Histórico</span>
          <div class="rounded-xl bg-purple-100 p-2 text-purple-700">
            <Sparkles class="h-4 w-4" />
          </div>
        </div>
        <div class="mt-2 flex items-baseline gap-2">
          <span class="text-3xl font-black text-brand-brown-dark tracking-tight">{{ appointments.length }}</span>
          <span class="text-[11px] text-brand-brown/60">en sistema</span>
        </div>
      </div>
    </div>

    <!-- Calendar View Mode Bar & Navigation -->
    <div class="flex flex-col gap-3 rounded-2xl border border-brand-pink-light/40 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
      <!-- Navigation: < Hoy > Mes Año -->
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="prevCalendarPeriod"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 text-brand-brown hover:bg-brand-cream active:scale-95 transition-all cursor-pointer"
          title="Periodo anterior"
        >
          <ChevronLeft class="h-4 w-4" />
        </button>
        <button
          type="button"
          @click="goToToday"
          class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-3.5 py-1.5 text-xs font-bold text-brand-brown hover:bg-brand-beige active:scale-95 transition-all cursor-pointer"
        >
          Hoy
        </button>
        <button
          type="button"
          @click="nextCalendarPeriod"
          class="flex h-9 w-9 items-center justify-center rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 text-brand-brown hover:bg-brand-cream active:scale-95 transition-all cursor-pointer"
          title="Periodo siguiente"
        >
          <ChevronRight class="h-4 w-4" />
        </button>
        <span class="ml-2 font-serif text-base sm:text-lg font-bold text-brand-brown-dark">
          {{ currentCalendarMonthTitle }}
        </span>
      </div>

      <!-- View Selector (Día, Semana, Mes, Lista) -->
      <div class="flex items-center gap-1 rounded-2xl bg-brand-cream/50 p-1 border border-brand-pink-light/40 overflow-x-auto">
        <button
          type="button"
          @click="agendaViewMode = 'day'"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
            agendaViewMode === 'day'
              ? 'bg-brand-brown text-white shadow-xs'
              : 'text-brand-brown hover:bg-white/60'
          ]"
        >
          <Clock class="h-3.5 w-3.5" />
          <span>Día</span>
        </button>
        <button
          type="button"
          @click="agendaViewMode = 'week'"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
            agendaViewMode === 'week'
              ? 'bg-brand-brown text-white shadow-xs'
              : 'text-brand-brown hover:bg-white/60'
          ]"
        >
          <CalendarRange class="h-3.5 w-3.5" />
          <span>Semana</span>
        </button>
        <button
          type="button"
          @click="agendaViewMode = 'month'"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
            agendaViewMode === 'month'
              ? 'bg-brand-brown text-white shadow-xs'
              : 'text-brand-brown hover:bg-white/60'
          ]"
        >
          <LayoutGrid class="h-3.5 w-3.5" />
          <span>Mes</span>
        </button>
        <button
          type="button"
          @click="agendaViewMode = 'list'"
          :class="[
            'flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
            agendaViewMode === 'list'
              ? 'bg-brand-brown text-white shadow-xs'
              : 'text-brand-brown hover:bg-white/60'
          ]"
        >
          <List class="h-3.5 w-3.5" />
          <span>Lista</span>
        </button>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 1. VISTA DÍA / TIMELINE                        -->
    <!-- ============================================== -->
    <div v-if="agendaViewMode === 'day'" class="space-y-4">
      <!-- Week Date Strip -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-3.5 shadow-xs">
        <div class="grid grid-cols-7 gap-1 sm:gap-2 text-center">
          <button
            v-for="d in weekStripDays"
            :key="d.dateStr"
            type="button"
            @click="selectDay(d.dateStr)"
            class="flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all cursor-pointer relative"
            :class="[
              d.isSelected
                ? 'bg-brand-brown text-white shadow-md scale-102 font-bold'
                : 'hover:bg-brand-cream/60 text-brand-brown',
              d.isToday && !d.isSelected ? 'ring-2 ring-brand-pink/70' : ''
            ]"
          >
            <span class="text-[11px] font-bold uppercase tracking-wider opacity-75">
              {{ d.letter }}
            </span>
            <span
              class="text-lg sm:text-xl font-black mt-0.5 leading-none"
              :class="d.isSelected ? 'text-white' : 'text-stone-900'"
            >
              {{ d.dayNumber }}
            </span>
            <div class="mt-1 flex items-center justify-center h-2">
              <span
                v-if="d.appointmentsCount > 0"
                class="h-1.5 w-1.5 rounded-full"
                :class="d.isSelected ? 'bg-amber-300' : 'bg-brand-pink'"
              ></span>
            </div>
          </button>
        </div>
      </div>

      <!-- Selected Day Header -->
      <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brand-pink-light/30 pb-3">
        <div class="flex flex-wrap items-center gap-2">
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
            {{ selectedDayFullTitle }}
          </h3>
          <span
            v-if="selectedDayDateStr === todayStr"
            class="rounded-full bg-emerald-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider animate-pulse"
          >
            Hoy
          </span>
          <span
            v-else-if="selectedDayDateStr === tomorrowStr"
            class="rounded-full bg-blue-600 px-2.5 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider"
          >
            Mañana
          </span>
          <span
            v-if="bookingSettings.blockedDates?.includes(selectedDayDateStr)"
            class="rounded-full bg-rose-100 text-rose-800 px-2.5 py-0.5 text-[10px] font-bold"
          >
            🏖️ Festivo / Bloqueado
          </span>
        </div>

        <div class="flex items-center gap-2">
          <span class="text-xs text-brand-brown/70 font-semibold">
            {{ selectedDayAppointments.length }} {{ selectedDayAppointments.length === 1 ? 'cita' : 'citas' }} programadas
          </span>
          <button
            type="button"
            @click="openNewManualAppointment(selectedDayDateStr)"
            class="flex items-center gap-1 rounded-xl bg-brand-brown px-3 py-1.5 text-xs font-bold text-white hover:bg-brand-brown-dark transition-all cursor-pointer shadow-xs active:scale-95"
          >
            <Plus class="h-3.5 w-3.5" />
            <span>Añadir Cita</span>
          </button>
        </div>
      </div>

      <!-- Timeline 08:00 to 21:00 -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 sm:p-6 shadow-xs space-y-3">
        <div
          v-for="slot in dayTimelineHours"
          :key="slot.hour"
          class="flex items-start gap-3 sm:gap-4 border-b border-brand-pink-light/20 pb-3 pt-1 group"
        >
          <!-- Hour Label -->
          <div class="w-14 sm:w-16 shrink-0 pt-1 text-right">
            <span class="font-mono text-xs font-bold text-brand-brown/70 group-hover:text-brand-brown">
              {{ slot.hour }}
            </span>
          </div>

          <!-- Appointments or Free Slot -->
          <div class="flex-1 space-y-2">
            <div
              v-for="appt in slot.appointments"
              :key="appt.id"
              class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/30 p-3.5 transition-all hover:bg-white hover:shadow-sm hover:border-brand-pink/60"
            >
              <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brand-pink-light/20 pb-2">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="font-bold text-sm text-stone-900">{{ appt.clientName }}</span>
                  <span class="font-mono text-xs font-bold text-brand-pink bg-brand-pink-light/30 px-2 py-0.5 rounded-lg">
                    {{ appt.time }} h ({{ appt.serviceDuration }} min)
                  </span>
                  <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                    {{ appt.servicePrice }}
                  </span>
                </div>

                <select
                  :value="appt.status"
                  @change="(e) => setAppointmentStatus(appt.id, (e.target as HTMLSelectElement).value as AppointmentStatus)"
                  :class="[
                    'rounded-lg px-2 py-0.5 text-xs font-bold border transition-colors cursor-pointer',
                    appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : '',
                    appt.status === 'completed' ? 'bg-sky-50 text-sky-800 border-sky-300' : '',
                    appt.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' : '',
                    appt.status === 'no_show' ? 'bg-amber-50 text-amber-800 border-amber-300' : ''
                  ]"
                >
                  <option value="confirmed">Confirmada</option>
                  <option value="completed">Realizada</option>
                  <option value="cancelled">Cancelada</option>
                  <option value="no_show">No Presentada</option>
                </select>
              </div>

              <div class="mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div class="text-stone-700">
                  <span class="font-semibold text-brand-brown-dark">✨ {{ appt.serviceTitle }}</span>
                  <span v-if="appt.notes" class="block text-[11px] text-stone-500 italic mt-0.5">💬 {{ appt.notes }}</span>
                </div>

                <!-- Action Buttons -->
                <div class="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    @click="emit('charge-in-tpv', appt)"
                    class="flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 cursor-pointer shadow-xs active:scale-95"
                    title="Cobrar en TPV"
                  >
                    <Calculator class="h-3 w-3" />
                    <span>Cobrar</span>
                  </button>
                  <button
                    type="button"
                    @click="openWhatsAppReminder(appt)"
                    class="flex items-center gap-1 rounded-lg bg-emerald-50 border border-emerald-300 px-2 py-1 text-xs font-bold text-emerald-800 hover:bg-emerald-100 cursor-pointer"
                    title="Recordatorio WhatsApp"
                  >
                    <Send class="h-3 w-3" />
                    <span>Recordatorio</span>
                  </button>
                  <button
                    type="button"
                    @click="sendGoogleReviewRequest(appt)"
                    class="flex items-center gap-1 rounded-lg bg-amber-50 border border-amber-300 px-2 py-1 text-xs font-bold text-amber-800 hover:bg-amber-100 cursor-pointer"
                    title="Pedir Reseña Google"
                  >
                    <Star class="h-3 w-3 text-amber-500 fill-amber-400" />
                    <span>Pedir Reseña</span>
                  </button>
                  <button
                    type="button"
                    @click="emit('create-session', appt)"
                    class="flex items-center gap-1 rounded-lg border border-brand-pink-light/60 bg-white px-2 py-1 text-xs font-bold text-brand-brown hover:bg-brand-cream/60 cursor-pointer"
                    title="Subir fotos"
                  >
                    <Camera class="h-3 w-3" />
                    <span class="hidden sm:inline">Fotos</span>
                  </button>
                  <button
                    type="button"
                    @click="openEditAppointment(appt)"
                    class="p-1 rounded-lg border border-stone-200 text-stone-600 hover:text-stone-900 hover:bg-stone-50 cursor-pointer"
                    title="Editar cita"
                  >
                    <Pencil class="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    @click="handleDeleteAppointment(appt)"
                    class="p-1 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 cursor-pointer"
                    title="Eliminar cita"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            <!-- Free Slot Click-to-book -->
            <div
              v-if="slot.appointments.length === 0"
              @click="openNewManualAppointment(selectedDayDateStr, slot.hour)"
              class="group/slot flex items-center justify-between rounded-xl border border-dashed border-stone-200 hover:border-brand-pink/60 px-3 py-2 text-xs text-stone-400 hover:text-brand-brown hover:bg-brand-cream/20 cursor-pointer transition-all"
            >
              <span class="italic text-[11px] group-hover/slot:text-brand-brown font-medium">
                + Hueco disponible · Clic para agendar a las {{ slot.hour }}
              </span>
              <Plus class="h-3.5 w-3.5 opacity-40 group-hover/slot:opacity-100 text-brand-pink transition-opacity" />
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 2. VISTA SEMANA (7 Columnas L-D)               -->
    <!-- ============================================== -->
    <div v-else-if="agendaViewMode === 'week'" class="space-y-4">
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
        <div
          v-for="d in weekGridDays"
          :key="d.dateStr"
          class="rounded-3xl border bg-white p-3 shadow-xs flex flex-col min-h-[340px]"
          :class="[
            d.isToday ? 'border-brand-pink ring-2 ring-brand-pink/30 shadow-sm' : 'border-brand-pink-light/40',
            d.isSelected ? 'bg-brand-cream/15' : ''
          ]"
        >
          <!-- Header -->
          <div
            @click="selectDay(d.dateStr); agendaViewMode = 'day'"
            class="flex items-center justify-between border-b border-brand-pink-light/20 pb-2 cursor-pointer hover:opacity-85"
          >
            <div>
              <span class="text-xs font-bold text-brand-brown/70 uppercase block">{{ d.shortName }}</span>
              <span class="text-base font-black text-stone-900">{{ d.dayNumber }}</span>
            </div>
            <span
              v-if="d.appointments.length > 0"
              class="rounded-full bg-brand-pink px-2 py-0.5 text-[10px] font-extrabold text-white"
            >
              {{ d.appointments.length }}
            </span>
          </div>

          <!-- Appointments in column -->
          <div class="mt-2.5 flex-1 space-y-2 overflow-y-auto max-h-[420px] scrollbar-none">
            <div
              v-for="appt in d.appointments"
              :key="appt.id"
              @click="selectDay(d.dateStr); agendaViewMode = 'day'"
              class="rounded-xl border border-brand-pink-light/40 bg-brand-cream/40 p-2 text-xs hover:bg-brand-cream transition-colors cursor-pointer"
            >
              <div class="flex items-center justify-between font-bold text-stone-900">
                <span>{{ appt.time }} h</span>
                <span class="text-emerald-700 text-[11px]">{{ appt.servicePrice }}</span>
              </div>
              <p class="font-bold text-brand-brown-dark truncate mt-0.5">{{ appt.clientName }}</p>
              <p class="text-[11px] text-stone-500 truncate">{{ appt.serviceTitle }}</p>
            </div>

            <div v-if="d.appointments.length === 0" class="py-8 text-center text-xs text-stone-400 italic">
              Sin citas
            </div>
          </div>

          <button
            type="button"
            @click="openNewManualAppointment(d.dateStr)"
            class="mt-2 w-full flex items-center justify-center gap-1 rounded-xl border border-dashed border-stone-200 py-1.5 text-[11px] font-bold text-stone-500 hover:text-brand-brown hover:border-brand-pink hover:bg-brand-cream/30 cursor-pointer transition-all"
          >
            <Plus class="h-3 w-3" />
            <span>Añadir</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 3. VISTA MES                                   -->
    <!-- ============================================== -->
    <div v-else-if="agendaViewMode === 'month'" class="space-y-4">
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 sm:p-6 shadow-xs">
        <div class="grid grid-cols-7 gap-1 text-center font-bold text-xs uppercase tracking-wider text-brand-brown/70 border-b border-brand-pink-light/30 pb-2 mb-2">
          <span>Lun</span>
          <span>Mar</span>
          <span>Mié</span>
          <span>Jue</span>
          <span>Vie</span>
          <span>Sáb</span>
          <span>Dom</span>
        </div>

        <div class="grid grid-cols-7 gap-1 sm:gap-2">
          <div
            v-for="cell in monthCalendarCells"
            :key="cell.dateStr"
            @click="selectDay(cell.dateStr); agendaViewMode = 'day'"
            class="min-h-[75px] sm:min-h-[95px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between"
            :class="[
              cell.isCurrentMonth ? 'bg-white hover:bg-brand-cream/30' : 'bg-stone-50/50 text-stone-300 hover:bg-stone-100/50',
              cell.isToday ? 'border-brand-pink ring-2 ring-brand-pink/40 shadow-xs' : 'border-stone-100',
              cell.isSelected ? 'bg-brand-cream/40' : ''
            ]"
          >
            <div class="flex items-center justify-between">
              <span
                class="text-xs sm:text-sm font-bold"
                :class="[
                  cell.isCurrentMonth ? (cell.isToday ? 'text-brand-pink font-black' : 'text-stone-800') : 'text-stone-400'
                ]"
              >
                {{ cell.dayNumber }}
              </span>
              <span
                v-if="cell.appointments.length > 0"
                class="rounded-full bg-brand-pink px-1.5 py-0.2 text-[10px] font-extrabold text-white"
              >
                {{ cell.appointments.length }}
              </span>
            </div>

            <div class="space-y-1 mt-1 overflow-hidden">
              <div
                v-for="appt in cell.appointments.slice(0, 2)"
                :key="appt.id"
                class="truncate rounded-md bg-brand-cream/70 px-1 py-0.5 text-[10px] font-semibold text-brand-brown-dark"
              >
                {{ appt.time }} {{ appt.clientName }}
              </div>
              <div
                v-if="cell.appointments.length > 2"
                class="text-[9px] font-bold text-brand-brown/70 pl-1"
              >
                +{{ cell.appointments.length - 2 }} más
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- 4. VISTA LISTA                                 -->
    <!-- ============================================== -->
    <div v-else-if="agendaViewMode === 'list'" class="space-y-4">
      <!-- Filters and Search Toolbar -->
      <div class="flex flex-col gap-3 rounded-2xl border border-brand-pink-light/40 bg-white p-3.5 shadow-xs sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            type="button"
            @click="agendaDateFilter = 'today'"
            :class="[
              'cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              agendaDateFilter === 'today'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown hover:bg-brand-beige'
            ]"
          >
            Hoy
          </button>
          <button
            type="button"
            @click="agendaDateFilter = 'week'"
            :class="[
              'cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              agendaDateFilter === 'week'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown hover:bg-brand-beige'
            ]"
          >
            Esta Semana
          </button>
          <button
            type="button"
            @click="agendaDateFilter = 'month'"
            :class="[
              'cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              agendaDateFilter === 'month'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown hover:bg-brand-beige'
            ]"
          >
            Este Mes
          </button>
          <button
            type="button"
            @click="agendaDateFilter = 'all'"
            :class="[
              'cursor-pointer rounded-xl px-3 py-1.5 text-xs font-bold transition-all whitespace-nowrap',
              agendaDateFilter === 'all'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown hover:bg-brand-beige'
            ]"
          >
            Todas
          </button>
        </div>

        <div class="flex flex-col sm:flex-row items-center gap-2">
          <select
            v-model="agendaStatusFilter"
            class="w-full sm:w-auto rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
          >
            <option value="all">Todos los estados</option>
            <option value="confirmed">Confirmadas</option>
            <option value="completed">Realizadas</option>
            <option value="cancelled">Canceladas</option>
            <option value="no_show">No Presentada</option>
          </select>

          <div class="relative w-full sm:w-60">
            <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-brown/50" />
            <input
              v-model="agendaSearchQuery"
              type="text"
              placeholder="Buscar clienta, tlf, código..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 pl-8 pr-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Appointments Cards -->
      <div v-if="filteredAppointments.length === 0" class="rounded-3xl border border-brand-pink-light/40 bg-white p-12 text-center shadow-xs">
        <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-pink-light/30 text-brand-pink">
          <Calendar class="h-7 w-7" />
        </div>
        <h3 class="mt-4 font-serif text-lg font-bold text-brand-brown-dark">No hay citas en este periodo</h3>
        <p class="mx-auto mt-1 max-w-sm text-xs text-brand-brown/70">
          No se han encontrado citas con los filtros seleccionados.
        </p>
        <div class="mt-6 flex justify-center gap-3">
          <button
            type="button"
            @click="openNewManualAppointment()"
            class="flex cursor-pointer items-center gap-1.5 rounded-2xl bg-brand-brown px-4 py-2.5 text-xs font-bold text-white transition-all hover:bg-brand-brown-dark"
          >
            <Plus class="h-4 w-4" />
            <span>Registrar Cita Manual</span>
          </button>
        </div>
      </div>

      <div v-else class="space-y-3.5">
        <div
          v-for="appt in filteredAppointments"
          :key="appt.id"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-xs transition-all hover:border-brand-pink/60 hover:shadow-sm"
        >
          <div class="flex flex-wrap items-center justify-between gap-2 border-b border-brand-pink-light/20 pb-3">
            <div class="flex flex-wrap items-center gap-2">
              <span class="rounded-xl bg-brand-cream/80 px-3 py-1 text-xs font-bold text-brand-brown-dark border border-brand-pink-light/40">
                📅 {{ formatApptDateHuman(appt.date) }} · ⏰ {{ appt.time }} h ({{ appt.serviceDuration }} min)
              </span>
              <span class="font-mono text-xs font-extrabold text-brand-pink bg-brand-pink-light/30 px-2.5 py-1 rounded-xl">
                {{ appt.bookingCode }}
              </span>
              <span
                v-if="appt.date === todayStr"
                class="rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider animate-pulse"
              >
                Hoy
              </span>
              <span
                v-else-if="appt.date === tomorrowStr"
                class="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-extrabold text-white uppercase tracking-wider"
              >
                Mañana
              </span>
            </div>

            <select
              :value="appt.status"
              @change="(e) => setAppointmentStatus(appt.id, (e.target as HTMLSelectElement).value as AppointmentStatus)"
              :class="[
                'rounded-xl px-2.5 py-1 text-xs font-bold border transition-colors cursor-pointer',
                appt.status === 'confirmed' ? 'bg-emerald-50 text-emerald-800 border-emerald-300' : '',
                appt.status === 'completed' ? 'bg-sky-50 text-sky-800 border-sky-300' : '',
                appt.status === 'cancelled' ? 'bg-rose-50 text-rose-800 border-rose-300' : '',
                appt.status === 'no_show' ? 'bg-amber-50 text-amber-800 border-amber-300' : ''
              ]"
            >
              <option value="confirmed">Confirmada</option>
              <option value="completed">Realizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No Presentada</option>
            </select>
          </div>

          <div class="grid grid-cols-1 gap-4 py-3.5 sm:grid-cols-12 sm:items-center">
            <div class="space-y-1 sm:col-span-4">
              <div class="flex items-center gap-2">
                <h4 class="text-base font-bold text-brand-brown-dark">{{ appt.clientName }}</h4>
                <span
                  v-if="appt.gestationWeek"
                  class="rounded-full bg-brand-pink-light/30 px-2 py-0.5 text-[10px] font-bold text-brand-brown"
                >
                  {{ appt.gestationWeek }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-3 text-xs text-brand-brown/80">
                <a
                  :href="`tel:${appt.clientPhone}`"
                  class="flex items-center gap-1 font-semibold text-brand-brown hover:text-brand-pink transition-colors"
                >
                  <Phone class="h-3.5 w-3.5 text-stone-500" />
                  <span>{{ appt.clientPhone }}</span>
                </a>
                <a
                  v-if="appt.clientEmail"
                  :href="`mailto:${appt.clientEmail}`"
                  class="flex items-center gap-1 text-stone-500 hover:text-brand-pink transition-colors"
                >
                  <Mail class="h-3.5 w-3.5" />
                  <span>{{ appt.clientEmail }}</span>
                </a>
              </div>
            </div>

            <div class="space-y-1 sm:col-span-4">
              <div class="text-xs font-bold text-brand-brown-dark">
                ✨ {{ appt.serviceTitle }}
              </div>
              <div class="flex items-center gap-2">
                <span class="inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                  {{ appt.servicePrice }}
                </span>
                <span class="text-[11px] text-stone-500">({{ appt.serviceDuration }} min)</span>
              </div>
              <div v-if="appt.notes" class="text-[11px] text-stone-600 italic bg-brand-cream/30 rounded-lg px-2 py-1 border border-brand-pink-light/30">
                💬 "{{ appt.notes }}"
              </div>
            </div>

            <div class="flex flex-wrap items-center justify-end gap-1.5 sm:col-span-4">
              <button
                type="button"
                @click="emit('charge-in-tpv', appt)"
                class="flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-600 px-3 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-emerald-700 active:scale-95"
                title="Cobrar en TPV"
              >
                <Calculator class="h-3.5 w-3.5" />
                <span>Cobrar</span>
              </button>

              <button
                type="button"
                @click="openWhatsAppReminder(appt)"
                class="flex cursor-pointer items-center gap-1 rounded-xl bg-emerald-50 border border-emerald-300 px-2.5 py-2 text-xs font-bold text-emerald-800 transition-all hover:bg-emerald-100"
                title="Enviar recordatorio de cita por WhatsApp"
              >
                <Send class="h-3.5 w-3.5" />
                <span>Recordatorio</span>
              </button>

              <button
                type="button"
                @click="sendGoogleReviewRequest(appt)"
                class="flex cursor-pointer items-center gap-1 rounded-xl bg-amber-50 border border-amber-300 px-2.5 py-2 text-xs font-bold text-amber-800 transition-all hover:bg-amber-100"
                title="Enviar solicitud de reseña de Google"
              >
                <Star class="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
                <span>Pedir Reseña</span>
              </button>

              <button
                type="button"
                @click="emit('create-session', appt)"
                class="flex cursor-pointer items-center gap-1 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-2.5 py-2 text-xs font-bold text-brand-brown transition-all hover:bg-brand-pink-light/30"
                title="Crear entrega de fotos"
              >
                <Camera class="h-3.5 w-3.5" />
                <span class="hidden xl:inline">Fotos</span>
              </button>

              <a
                :href="generateGoogleCalendarUrl(appt)"
                target="_blank"
                rel="noopener noreferrer"
                class="flex items-center justify-center rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                title="Añadir a Google Calendar"
              >
                <CalendarPlus class="h-3.5 w-3.5" />
              </a>

              <button
                type="button"
                @click="downloadIcsForAppt(appt)"
                class="flex cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-50 transition-colors"
                title="Descargar archivo .ics"
              >
                <Download class="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                @click="openEditAppointment(appt)"
                class="flex cursor-pointer items-center justify-center rounded-xl border border-stone-200 bg-white p-2 text-stone-700 hover:text-brand-brown-dark hover:bg-brand-cream/50 transition-colors"
                title="Editar cita"
              >
                <Pencil class="h-3.5 w-3.5" />
              </button>

              <button
                type="button"
                @click="handleDeleteAppointment(appt)"
                class="flex cursor-pointer items-center justify-center rounded-xl border border-rose-200 bg-rose-50/50 p-2 text-rose-600 hover:bg-rose-100 transition-colors"
                title="Eliminar cita"
              >
                <Trash2 class="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL: NUEVA CITA MANUAL                       -->
    <!-- ============================================== -->
    <div
      v-if="showManualAppointmentModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-brand-pink-light/40">
        <button
          type="button"
          @click="showManualAppointmentModal = false"
          class="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>

        <div class="flex items-center gap-2 mb-1">
          <Calendar class="h-5 w-5 text-brand-pink" />
          <h3 class="font-serif text-xl font-bold text-brand-brown-dark">Nueva Cita Manual</h3>
        </div>
        <p class="text-xs text-brand-brown/70 mb-6">
          Registra una cita solicitada por teléfono, WhatsApp o presencialmente en la clínica.
        </p>

        <form @submit.prevent="handleCreateManualAppointment" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Nombre de la Mamá / Familia *</label>
              <input
                v-model="manualAppointmentForm.clientName"
                type="text"
                required
                placeholder="Ej: Laura Domínguez"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Teléfono Móvil *</label>
              <input
                v-model="manualAppointmentForm.clientPhone"
                type="tel"
                required
                placeholder="Ej: 644189856"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Email</label>
              <input
                v-model="manualAppointmentForm.clientEmail"
                type="email"
                placeholder="cliente@ejemplo.com"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Semanas de Gestación</label>
              <input
                v-model="manualAppointmentForm.gestationWeek"
                type="text"
                placeholder="Ej: Semana 24"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Servicio / Experiencia *</label>
            <select
              v-model="manualAppointmentForm.serviceTitle"
              @change="(e) => {
                const val = (e.target as HTMLSelectElement).value
                const exp = experiences.find(x => x.title === val)
                if (exp) {
                  manualAppointmentForm.servicePrice = exp.price
                  let dur = 45
                  if (exp.duration) {
                    const m = exp.duration.match(/\d+/)
                    if (m) dur = parseInt(m[0], 10)
                  }
                  manualAppointmentForm.serviceDuration = dur
                  return
                }
                const pack = packs.find(x => x.title === val)
                if (pack) {
                  manualAppointmentForm.servicePrice = pack.price
                  manualAppointmentForm.serviceDuration = 55
                }
              }"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none cursor-pointer"
            >
              <optgroup label="Ecografías y Experiencias">
                <option v-for="exp in experiences" :key="exp.title" :value="exp.title">
                  {{ exp.title }} ({{ exp.price }})
                </option>
              </optgroup>
              <optgroup label="Packs de Sesiones">
                <option v-for="pack in packs" :key="pack.title" :value="pack.title">
                  {{ pack.title }} ({{ pack.price }})
                </option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Fecha de la Cita *</label>
              <input
                v-model="manualAppointmentForm.date"
                type="date"
                required
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Hora *</label>
              <input
                v-model="manualAppointmentForm.time"
                type="text"
                required
                placeholder="11:30"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <!-- Suggested slots pills if available -->
          <div v-if="manualAvailableSlots.length > 0">
            <span class="block text-[11px] font-bold text-brand-brown/70 uppercase mb-1.5">
              Huecos disponibles sugeridos para el {{ manualAppointmentForm.date }}:
            </span>
            <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 bg-brand-cream/20 rounded-xl border border-brand-pink-light/40">
              <button
                v-for="slot in manualAvailableSlots"
                :key="slot"
                type="button"
                @click="manualAppointmentForm.time = slot"
                :class="[
                  'px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer',
                  manualAppointmentForm.time === slot
                    ? 'bg-brand-brown text-white shadow-xs'
                    : 'bg-white border border-brand-pink-light/60 text-brand-brown hover:bg-brand-pink-light/20'
                ]"
              >
                {{ slot }}
              </button>
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Observaciones / Notas</label>
            <textarea
              v-model="manualAppointmentForm.notes"
              rows="2"
              placeholder="Detalles sobre familiares que asistirán, peticiones..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-brand-pink-light/20">
            <button
              type="button"
              @click="showManualAppointmentModal = false"
              class="rounded-xl px-4 py-2.5 text-xs font-semibold text-brand-brown hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark active:scale-95 transition-all"
            >
              <Check class="h-4 w-4" />
              <span>Confirmar Cita</span>
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL: EDITAR CITA                             -->
    <!-- ============================================== -->
    <div
      v-if="showEditAppointmentModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div class="relative w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-brand-pink-light/40">
        <button
          type="button"
          @click="showEditAppointmentModal = false"
          class="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>

        <div class="flex items-center gap-2 mb-1">
          <Pencil class="h-5 w-5 text-brand-pink" />
          <h3 class="font-serif text-xl font-bold text-brand-brown-dark">Editar Datos de la Cita</h3>
        </div>
        <p class="text-xs text-brand-brown/70 mb-6">
          Modifica el nombre de la clienta, teléfono, servicio o notas de la reserva.
        </p>

        <form @submit.prevent="handleSaveEditAppointment" class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Nombre de la Mamá / Familia *</label>
              <input
                v-model="editAppointmentForm.clientName"
                type="text"
                required
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Teléfono Móvil *</label>
              <input
                v-model="editAppointmentForm.clientPhone"
                type="tel"
                required
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Email</label>
              <input
                v-model="editAppointmentForm.clientEmail"
                type="email"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Semanas de Gestación</label>
              <input
                v-model="editAppointmentForm.gestationWeek"
                type="text"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Servicio / Experiencia *</label>
            <select
              v-model="editAppointmentForm.serviceTitle"
              @change="(e) => {
                const val = (e.target as HTMLSelectElement).value
                const exp = experiences.find(x => x.title === val)
                if (exp) {
                  editAppointmentForm.servicePrice = exp.price
                  let dur = 45
                  if (exp.duration) {
                    const m = exp.duration.match(/\d+/)
                    if (m) dur = parseInt(m[0], 10)
                  }
                  editAppointmentForm.serviceDuration = dur
                  return
                }
                const pack = packs.find(x => x.title === val)
                if (pack) {
                  editAppointmentForm.servicePrice = pack.price
                  editAppointmentForm.serviceDuration = 55
                }
              }"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none cursor-pointer"
            >
              <optgroup label="Ecografías y Experiencias">
                <option v-for="exp in experiences" :key="exp.title" :value="exp.title">
                  {{ exp.title }} ({{ exp.price }})
                </option>
              </optgroup>
              <optgroup label="Packs de Sesiones">
                <option v-for="pack in packs" :key="pack.title" :value="pack.title">
                  {{ pack.title }} ({{ pack.price }})
                </option>
              </optgroup>
            </select>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Fecha de la Cita *</label>
              <input
                v-model="editAppointmentForm.date"
                type="date"
                required
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Hora *</label>
              <input
                v-model="editAppointmentForm.time"
                type="text"
                required
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Estado de la Cita</label>
            <select
              v-model="editAppointmentForm.status"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none cursor-pointer"
            >
              <option value="confirmed">Confirmada</option>
              <option value="completed">Realizada</option>
              <option value="cancelled">Cancelada</option>
              <option value="no_show">No Presentada</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Observaciones / Notas</label>
            <textarea
              v-model="editAppointmentForm.notes"
              rows="2"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <div class="flex items-center justify-end gap-3 pt-4 border-t border-brand-pink-light/20">
            <button
              type="button"
              @click="showEditAppointmentModal = false"
              class="rounded-xl px-4 py-2.5 text-xs font-semibold text-brand-brown hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark active:scale-95 transition-all"
            >
              <Check class="h-4 w-4" />
              <span>Guardar Cambios</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
