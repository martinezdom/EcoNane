<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { BusinessInfo, BookingSettings } from '@/types'
import {
  Calendar,
  Building,
  Lock,
  AlertTriangle,
  RotateCcw,
  Plus,
  X,
  Check,
  Clock,
  ShieldCheck,
  Trash2
} from '@lucide/vue'

const {
  businessInfo,
  updateBusinessInfo,
  bookingSettings,
  saveBookingSettings,
  setAdminPin,
  resetSalesTickets,
  resetAllSessions
} = useSiteData()

// -------------------------------------------------------------
// 1. HORARIOS SEMANALES Y DÍAS FESTIVOS
// -------------------------------------------------------------
const settingsForm = ref<BookingSettings>(JSON.parse(JSON.stringify(bookingSettings.value)))
const newBlockedDateInput = ref('')
const isSavingSchedule = ref(false)

watch(
  bookingSettings,
  (val) => {
    settingsForm.value = JSON.parse(JSON.stringify(val))
  },
  { deep: true }
)

const weekDayLabels: Record<number, string> = {
  1: 'Lunes',
  2: 'Martes',
  3: 'Miércoles',
  4: 'Jueves',
  5: 'Viernes',
  6: 'Sábado',
  0: 'Domingo'
}

const scheduleDays = computed(() => {
  return [1, 2, 3, 4, 5, 6, 0].map(dayIndex => ({
    dayIndex,
    label: weekDayLabels[dayIndex] || '',
    data: settingsForm.value.schedule[dayIndex] || {
      isOpen: false,
      morningStart: '10:00',
      morningEnd: '14:00',
      afternoonStart: '16:30',
      afternoonEnd: '20:30'
    }
  }))
})

function addBlockedDate() {
  if (!newBlockedDateInput.value) return
  if (!settingsForm.value.blockedDates.includes(newBlockedDateInput.value)) {
    settingsForm.value.blockedDates.push(newBlockedDateInput.value)
    settingsForm.value.blockedDates.sort()
  }
  newBlockedDateInput.value = ''
}

function removeBlockedDate(index: number) {
  settingsForm.value.blockedDates.splice(index, 1)
}

async function handleSaveBookingSettings() {
  isSavingSchedule.value = true
  try {
    await saveBookingSettings(settingsForm.value)
    showFeedback('¡Configuración de horarios y festivos guardada con éxito!')
  } catch (err: any) {
    alert('Error al guardar la configuración: ' + (err?.message || err))
  } finally {
    isSavingSchedule.value = false
  }
}

// -------------------------------------------------------------
// 2. DATOS FISCALES DEL NEGOCIO
// -------------------------------------------------------------
const businessForm = ref<BusinessInfo>({ ...businessInfo.value })
const isSavingBusiness = ref(false)

watch(
  businessInfo,
  (val) => {
    businessForm.value = { ...val }
  },
  { deep: true }
)

async function saveBusinessSettings() {
  isSavingBusiness.value = true
  try {
    await updateBusinessInfo(businessForm.value)
    showFeedback('Datos fiscales y de facturación guardados correctamente.')
  } catch (err: any) {
    alert('Error al guardar los datos fiscales: ' + (err?.message || err))
  } finally {
    isSavingBusiness.value = false
  }
}

// -------------------------------------------------------------
// 3. SEGURIDAD Y PIN DE ACCESO
// -------------------------------------------------------------
const newPin = ref('')
const confirmNewPin = ref('')
const pinSuccess = ref('')
const isSavingPin = ref(false)

async function handleSavePin() {
  pinSuccess.value = ''
  if (!newPin.value || newPin.value.length < 4) {
    alert('La clave debe tener al menos 4 caracteres.')
    return
  }
  if (newPin.value !== confirmNewPin.value) {
    alert('Las claves no coinciden.')
    return
  }

  isSavingPin.value = true
  try {
    await setAdminPin(newPin.value)
    newPin.value = ''
    confirmNewPin.value = ''
    pinSuccess.value = '¡Clave de acceso actualizada y protegida con cifrado SHA-256 en Supabase!'
    showFeedback('Clave PIN actualizada correctamente.')
  } catch (err: any) {
    alert('Error al actualizar el PIN: ' + (err?.message || err))
  } finally {
    isSavingPin.value = false
  }
}

// -------------------------------------------------------------
// 4. MANTENIMIENTO Y REINICIO
// -------------------------------------------------------------
async function handleResetTestTickets() {
  const userInput = prompt(
    '⚠️ ATENCIÓN: Esta acción borrará todas las facturas y tickets emitidos para que el próximo ticket sea el FS-2026-0001.\n\n' +
    'Solo debe utilizarse para limpiar ventas de prueba ficticias antes de abrir al público.\n\n' +
    'Para confirmar, escribe exactamente la palabra REINICIAR:'
  )
  if (userInput && userInput.trim().toUpperCase() === 'REINICIAR') {
    await resetSalesTickets()
    showFeedback('¡Historial reiniciado! El contador volverá a empezar en FS-2026-0001.')
  } else if (userInput !== null) {
    alert('Acción cancelada. No se ha modificado ningún dato porque no se escribió "REINICIAR".')
  }
}

async function handleResetAllSessions() {
  const confirmed = confirm(
    '¿Estás segura de que deseas vaciar todas las sesiones de prueba de clientas?\n\n' +
    'Esta acción dejará la lista de entregas completamente limpia y a cero.'
  )
  if (confirmed) {
    await resetAllSessions()
    showFeedback('¡Sesiones de prueba vaciadas con éxito!')
  }
}

// Feedback Toast
const feedbackMessage = ref('')
function showFeedback(msg: string) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}
</script>

<template>
  <div class="max-w-4xl space-y-8">
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
    <div>
      <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Configuración General y Seguridad</h2>
      <p class="text-sm text-brand-brown/80">
        Gestiona los horarios de la clínica, días festivos, datos legales de facturación y clave de acceso.
      </p>
    </div>

    <!-- 1. HORARIOS DE APERTURA Y FESTIVOS -->
    <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs sm:p-8 space-y-6">
      <div class="border-b border-brand-pink-light/20 pb-4 flex items-center justify-between flex-wrap gap-2">
        <div class="flex items-center gap-2">
          <Clock class="h-5 w-5 text-brand-brown" />
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
            Horarios de Apertura y Agenda Online
          </h3>
        </div>
        <span class="rounded-full bg-brand-cream/80 px-3 py-1 text-xs font-bold text-brand-brown border border-brand-pink-light/40">
          Booksy Alternativa
        </span>
      </div>

      <form @submit.prevent="handleSaveBookingSettings" class="space-y-6">
        <!-- Interval & Buffer -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Frecuencia de Citas (Huecos)
            </label>
            <select
              v-model.number="settingsForm.slotIntervalMinutes"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
            >
              <option :value="30">30 minutos</option>
              <option :value="40">40 minutos</option>
              <option :value="45">45 minutos (Recomendado)</option>
              <option :value="50">50 minutos</option>
              <option :value="60">60 minutos</option>
            </select>
            <p class="text-[10px] text-brand-brown/60 mt-1">Frecuencia en la que se generan los huecos disponibles.</p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Margen de Descanso entre Citas
            </label>
            <select
              v-model.number="settingsForm.bufferMinutes"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
            >
              <option :value="0">0 minutos (Citas seguidas)</option>
              <option :value="5">5 minutos</option>
              <option :value="10">10 minutos</option>
              <option :value="15">15 minutos (Para ventilación y preparación)</option>
              <option :value="20">20 minutos</option>
            </select>
            <p class="text-[10px] text-brand-brown/60 mt-1">Tiempo mínimo reservado tras cada sesión antes de la siguiente.</p>
          </div>
        </div>

        <!-- Weekly Schedule Days -->
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-3">
            Horario Semanal de Apertura
          </h4>
          <div class="space-y-2.5">
            <div
              v-for="day in scheduleDays"
              :key="day.dayIndex"
              class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-2xl border border-brand-pink-light/40 bg-brand-cream/10"
            >
              <div class="flex items-center gap-2.5 w-36">
                <input
                  :id="`day_toggle_${day.dayIndex}`"
                  type="checkbox"
                  v-model="day.data.isOpen"
                  class="h-4 w-4 rounded text-brand-brown focus:ring-brand-pink cursor-pointer"
                />
                <label :for="`day_toggle_${day.dayIndex}`" class="text-xs font-bold text-brand-brown-dark cursor-pointer">
                  {{ day.label }}
                </label>
              </div>

              <div v-if="day.data.isOpen" class="flex flex-wrap items-center gap-2 text-xs">
                <!-- Turno Mañana -->
                <span class="text-[11px] font-semibold text-brand-brown/70">Mañana:</span>
                <input
                  type="time"
                  v-model="day.data.morningStart"
                  class="rounded-lg border border-brand-pink-light/60 bg-white px-2 py-1 text-xs text-brand-brown-dark focus:outline-none"
                />
                <span>a</span>
                <input
                  type="time"
                  v-model="day.data.morningEnd"
                  class="rounded-lg border border-brand-pink-light/60 bg-white px-2 py-1 text-xs text-brand-brown-dark focus:outline-none"
                />

                <!-- Turno Tarde -->
                <span class="text-[11px] font-semibold text-brand-brown/70 ml-2">Tarde:</span>
                <input
                  type="time"
                  v-model="day.data.afternoonStart"
                  class="rounded-lg border border-brand-pink-light/60 bg-white px-2 py-1 text-xs text-brand-brown-dark focus:outline-none"
                />
                <span>a</span>
                <input
                  type="time"
                  v-model="day.data.afternoonEnd"
                  class="rounded-lg border border-brand-pink-light/60 bg-white px-2 py-1 text-xs text-brand-brown-dark focus:outline-none"
                />
              </div>

              <div v-else class="text-xs text-stone-400 italic">
                Cerrado todo el día
              </div>
            </div>
          </div>
        </div>

        <!-- Blocked Dates / Festivos / Vacaciones -->
        <div class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/20 p-4 space-y-3">
          <div>
            <h4 class="text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Días Festivos o Cerrados por Vacaciones
            </h4>
            <p class="text-[11px] text-brand-brown/70">
              Las fechas bloqueadas no permitirán reservas online en ningún horario.
            </p>
          </div>

          <div class="flex items-center gap-2">
            <input
              v-model="newBlockedDateInput"
              type="date"
              class="rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
            <button
              type="button"
              @click="addBlockedDate"
              class="flex cursor-pointer items-center gap-1 rounded-xl bg-brand-brown px-3.5 py-2 text-xs font-bold text-white hover:bg-brand-brown-dark transition-all"
            >
              <Plus class="h-3.5 w-3.5" />
              <span>Añadir Fecha</span>
            </button>
          </div>

          <!-- List of Blocked Dates -->
          <div v-if="settingsForm.blockedDates && settingsForm.blockedDates.length > 0" class="flex flex-wrap gap-2 pt-1">
            <span
              v-for="(blocked, idx) in settingsForm.blockedDates"
              :key="blocked"
              class="flex items-center gap-1.5 rounded-full bg-rose-100 border border-rose-200 px-3 py-1 text-xs font-bold text-rose-800"
            >
              <span>🏖️ {{ blocked }}</span>
              <button
                type="button"
                @click="removeBlockedDate(idx)"
                class="rounded-full hover:bg-rose-200 p-0.5 text-rose-600 transition-colors cursor-pointer"
              >
                <X class="h-3 w-3" />
              </button>
            </span>
          </div>
          <p v-else class="text-xs text-stone-400 italic">
            No hay fechas bloqueadas actualmente.
          </p>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="isSavingSchedule"
            class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
          >
            <Check class="h-4 w-4" />
            <span>{{ isSavingSchedule ? 'Guardando...' : 'Guardar Horarios y Festivos' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- 2. DATOS FISCALES DEL COMERCIO -->
    <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs sm:p-8 space-y-6">
      <div class="border-b border-brand-pink-light/20 pb-4">
        <div class="flex items-center gap-2">
          <Building class="h-5 w-5 text-brand-brown" />
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
            Datos Fiscales de Facturación (EcoNane)
          </h3>
        </div>
        <p class="mt-1 text-xs text-brand-brown/70">
          Estos datos aparecerán en los tickets oficiales y facturas simplificadas expedidas según el R.D. 1619/2012.
        </p>
      </div>

      <form @submit.prevent="saveBusinessSettings" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Nombre Comercial
            </label>
            <input
              v-model="businessForm.name"
              type="text"
              required
              placeholder="EcoNane Ecografías Emocionales"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Razón Social o Titular Autónomo
            </label>
            <input
              v-model="businessForm.legalName"
              type="text"
              placeholder="Nombre de la persona o SL"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              NIF / CIF
            </label>
            <input
              v-model="businessForm.nif"
              type="text"
              placeholder="Ej: 12345678Z o B-12345678"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div class="sm:col-span-2">
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Dirección Fiscal
            </label>
            <input
              v-model="businessForm.address"
              type="text"
              placeholder="Carrer Colón, 114..."
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Código Postal
            </label>
            <input
              v-model="businessForm.postalCode"
              type="text"
              placeholder="03570"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Ciudad
            </label>
            <input
              v-model="businessForm.city"
              type="text"
              placeholder="Villajoyosa"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Teléfono
            </label>
            <input
              v-model="businessForm.phone"
              type="tel"
              placeholder="644189856"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Email Emisor
            </label>
            <input
              v-model="businessForm.email"
              type="email"
              placeholder="info@econane.es"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-brand-pink-light/20 pt-4">
          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Serie de Facturación Simplificada
            </label>
            <input
              v-model="businessForm.ticketSeries"
              type="text"
              placeholder="FS"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark font-mono uppercase focus:border-brand-pink focus:bg-white focus:outline-none"
            />
            <p class="mt-1 text-[11px] text-brand-brown/60">Ejemplo: FS generará tickets como FS-2026-0001</p>
          </div>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
              Tipo de IVA por Defecto (%)
            </label>
            <input
              v-model.number="businessForm.defaultIva"
              type="number"
              min="0"
              max="100"
              placeholder="21"
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark font-mono focus:border-brand-pink focus:bg-white focus:outline-none"
            />
            <p class="mt-1 text-[11px] text-brand-brown/60">21% aplicable a ecografía emocional y comercial</p>
          </div>
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="isSavingBusiness"
            class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
          >
            <Check class="h-4 w-4" />
            <span>{{ isSavingBusiness ? 'Guardando...' : 'Guardar Datos Fiscales' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- 3. SEGURIDAD Y CLAVE DE ACCESO -->
    <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs sm:p-8 space-y-6">
      <div class="border-b border-brand-pink-light/20 pb-4">
        <div class="flex items-center gap-2">
          <ShieldCheck class="h-5 w-5 text-brand-brown" />
          <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
            Seguridad y Clave de Acceso al Panel
          </h3>
        </div>
        <p class="mt-1 text-xs text-brand-brown/70">
          Cambia la clave numérica o contraseña de administrador. Queda protegida con hashing SHA-256.
        </p>
      </div>

      <form @submit.prevent="handleSavePin" class="space-y-4">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase">Nueva Clave</label>
            <input
              v-model="newPin"
              type="password"
              required
              placeholder="Mínimo 4 caracteres..."
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase">Confirmar Nueva Clave</label>
            <input
              v-model="confirmNewPin"
              type="password"
              required
              placeholder="Repite la nueva clave..."
              class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        <div v-if="pinSuccess" class="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
          {{ pinSuccess }}
        </div>

        <div class="flex justify-end pt-2">
          <button
            type="submit"
            :disabled="isSavingPin"
            class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50"
          >
            <Lock class="h-4 w-4" />
            <span>{{ isSavingPin ? 'Guardando...' : 'Guardar Nueva Clave' }}</span>
          </button>
        </div>
      </form>
    </div>

    <!-- 4. ZONA DE MANTENIMIENTO Y PUESTA A CERO -->
    <div class="rounded-3xl border border-rose-200 bg-rose-50/40 p-6 shadow-xs sm:p-8 space-y-4">
      <div class="border-b border-rose-200/70 pb-3">
        <div class="flex items-center gap-2 text-rose-800 font-bold">
          <AlertTriangle class="h-5 w-5 text-rose-600" />
          <h3 class="font-serif text-lg">Zona de Mantenimiento y Puesta a Cero</h3>
        </div>
        <p class="mt-1 text-xs text-rose-700/80">
          Opciones protegidas para administradores. Requiere confirmación escrita manual para evitar cualquier borrado accidental.
        </p>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-rose-950">Reiniciar Contador de Ventas a 0001</h4>
          <p class="text-xs text-stone-600 mt-0.5 max-w-lg">
            Borra el registro actual de facturas y sitúa la próxima venta en el número <strong>FS-2026-0001</strong>. Solo debe utilizarse para limpiar pruebas ficticias antes de la apertura oficial.
          </p>
        </div>
        <button
          type="button"
          @click="handleResetTestTickets"
          class="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition-all hover:bg-rose-100 active:scale-95 shrink-0"
          title="Borrar las ventas de prueba para dejar la caja limpia y empezar en FS-2026-0001"
        >
          <RotateCcw class="h-3.5 w-3.5" />
          <span>Reiniciar a Ticket 0001</span>
        </button>
      </div>

      <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-3 border-t border-rose-200/50">
        <div>
          <h4 class="text-xs font-bold uppercase tracking-wider text-rose-950">Vaciar Entregas de Fotos de Prueba</h4>
          <p class="text-xs text-stone-600 mt-0.5 max-w-lg">
            Borra las sesiones de prueba creadas durante la fase de desarrollo para dejar el listado limpio para las clientas reales.
          </p>
        </div>
        <button
          type="button"
          @click="handleResetAllSessions"
          class="flex cursor-pointer items-center justify-center gap-1.5 rounded-2xl border border-rose-300 bg-white px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition-all hover:bg-rose-100 active:scale-95 shrink-0"
        >
          <Trash2 class="h-3.5 w-3.5" />
          <span>Vaciar Sesiones</span>
        </button>
      </div>
    </div>
  </div>
</template>
