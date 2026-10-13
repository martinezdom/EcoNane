<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { ClientSession } from '@/types'
import {
  Camera,
  RotateCcw,
  User,
  Phone,
  Calendar,
  UploadCloud,
  X,
  Sparkles,
  Send,
  Check,
  Copy,
  Eye,
  Trash2,
  Image as ImageIcon,
  Search
} from '@lucide/vue'

const props = defineProps<{
  prefilledSession?: { clientName: string; clientPhone: string; serviceType: string } | null
}>()

const emit = defineEmits<{
  (e: 'notify', message: string): void
  (e: 'clear-prefilled'): void
}>()

const {
  sessions,
  experiences,
  packs,
  createSession,
  deleteSession,
  resetAllSessions
} = useSiteData()

const newSession = ref({
  clientName: '',
  clientPhone: '',
  sessionDate: new Date().toISOString().slice(0, 10),
  serviceType: 'Eco Básica 4D / 5D',
  note: '',
  expiryDays: 120
})

watch(
  () => props.prefilledSession,
  (prefilled) => {
    if (prefilled) {
      if (prefilled.clientName) newSession.value.clientName = prefilled.clientName
      if (prefilled.clientPhone) newSession.value.clientPhone = prefilled.clientPhone
      if (prefilled.serviceType) newSession.value.serviceType = prefilled.serviceType
      emit('clear-prefilled')
    }
  },
  { immediate: true }
)

const uploadedPhotos = ref<string[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const copiedSessionId = ref<string | null>(null)
const searchSessionQuery = ref('')

const filteredSessions = computed(() => {
  if (!searchSessionQuery.value.trim()) return sessions.value
  const q = searchSessionQuery.value.toLowerCase().trim()
  return sessions.value.filter(s =>
    s.clientName.toLowerCase().includes(q) ||
    s.clientPhone.includes(q) ||
    s.code.toLowerCase().includes(q) ||
    s.serviceType.toLowerCase().includes(q)
  )
})

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFilesSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

function processFiles(files: File[]) {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  if (imageFiles.length === 0) {
    alert('Por favor selecciona archivos de imagen válidos (.jpg, .png, etc.)')
    return
  }

  for (const file of imageFiles) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      if (res) {
        uploadedPhotos.value.push(res)
      }
    }
    reader.readAsDataURL(file)
  }
}

function removeUploadedPhoto(index: number) {
  uploadedPhotos.value.splice(index, 1)
}

function handleCreateSession() {
  if (!newSession.value.clientName.trim() || !newSession.value.clientPhone.trim()) {
    alert('Por favor, indica el nombre y teléfono de la madre.')
    return
  }

  const photos =
    uploadedPhotos.value.length > 0
      ? [...uploadedPhotos.value]
      : ['/gallery-4.webp', '/gallery-5.webp', '/gallery-6.webp', '/gallery-1.webp', '/gallery-2.webp', '/gallery-3.webp']

  const created = createSession({
    clientName: newSession.value.clientName,
    clientPhone: newSession.value.clientPhone,
    sessionDate: newSession.value.sessionDate || new Date().toISOString().slice(0, 10),
    serviceType: newSession.value.serviceType,
    photos,
    note: newSession.value.note,
    expiryDays: Number(newSession.value.expiryDays) || 120
  })

  // Reset form
  newSession.value.clientName = ''
  newSession.value.clientPhone = ''
  newSession.value.note = ''
  uploadedPhotos.value = []

  emit('notify', `¡Sesión para ${created.clientName} creada con éxito! Código: ${created.code}`)
}

function handleDeleteSession(id: string, name: string) {
  if (confirm(`¿Seguro que deseas eliminar la entrega de sesión de ${name}?`)) {
    deleteSession(id)
    emit('notify', `Sesión de ${name} eliminada.`)
  }
}

function handleResetAllSessions() {
  if (confirm('¿Vaciar todas las sesiones de prueba registradas? Esta acción no se puede deshacer.')) {
    resetAllSessions()
    emit('notify', '¡Sesiones de prueba vaciadas con éxito!')
  }
}

function getSessionUrl(code: string) {
  const origin = window.location.origin
  return `${origin}/sesion/${code}`
}

function copySessionLink(session: ClientSession) {
  const url = getSessionUrl(session.code)
  navigator.clipboard.writeText(url)
  copiedSessionId.value = session.id
  setTimeout(() => {
    copiedSessionId.value = null
  }, 2500)
}

function getWhatsAppShareUrl(session: ClientSession) {
  const url = getSessionUrl(session.code)
  const last4 = session.clientPhone.replace(/\D/g, '').slice(-4)
  const text = encodeURIComponent(
    `¡Hola ${session.clientName}! ❤️\n\nYa tienes listas las fotos y recuerdos de tu ecografía en EcoNane.\n\nPuedes verlas y descargarlas en alta calidad desde tu enlace privado:\n👉 ${url}\n\n🔒 Clave de acceso: Los 4 últimos dígitos de tu teléfono (${last4})\n\n¡Esperamos que te encante el recuerdo de tu bebé!`
  )
  const phone = session.clientPhone.replace(/\D/g, '')
  const fullPhone = phone.startsWith('34') ? phone : `34${phone}`
  return `https://wa.me/${fullPhone}?text=${text}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Entrega de Fotos y Recuerdos</h2>
        <p class="text-sm text-brand-brown/80">
          Arrastra las fotos de la ecografía o selecciónalas del ordenador. Se generará un enlace privado protegido para la familia.
        </p>
      </div>

      <button
        v-if="sessions.length > 0"
        type="button"
        @click="handleResetAllSessions"
        class="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
        title="Borrar todas las sesiones de prueba para empezar de cero"
      >
        <RotateCcw class="h-3.5 w-3.5" />
        <span>Vaciar Sesiones de Prueba</span>
      </button>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- Create Session Form -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-5">
        <div class="flex items-center gap-3 border-b border-brand-pink-light/30 pb-4">
          <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-pink/20 text-brand-brown">
            <Camera class="h-5 w-5" />
          </div>
          <div>
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Nueva Entrega</h3>
            <p class="text-xs text-brand-brown/80">Selecciona las fotos y rellena los datos</p>
          </div>
        </div>

        <form @submit.prevent="handleCreateSession" class="mt-6 space-y-4 text-xs">
          <div>
            <label class="block font-bold text-brand-brown-dark uppercase mb-1">
              Nombre de la Madre / Clienta *
            </label>
            <div class="relative">
              <input
                v-model="newSession.clientName"
                type="text"
                required
                placeholder="Ej: Laura Domínguez"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 pl-9 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
              <User class="absolute top-2.5 left-3 h-3.5 w-3.5 text-brand-brown/60" />
            </div>
          </div>

          <div>
            <label class="block font-bold text-brand-brown-dark uppercase mb-1">
              Teléfono Móvil (Servirá como PIN de acceso) *
            </label>
            <div class="relative">
              <input
                v-model="newSession.clientPhone"
                type="tel"
                required
                placeholder="Ej: 644189856"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 pl-9 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
              <Phone class="absolute top-2.5 left-3 h-3.5 w-3.5 text-brand-brown/60" />
            </div>
            <p class="mt-1 text-[10px] text-brand-brown/70">
              La madre usará los últimos 4 dígitos para desbloquear sus fotos.
            </p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark uppercase mb-1">Fecha Sesión</label>
              <input
                v-model="newSession.sessionDate"
                type="date"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>

            <div>
              <label class="block font-bold text-brand-brown-dark uppercase mb-1">Caducidad</label>
              <select
                v-model="newSession.expiryDays"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
              >
                <option :value="120">120 días (Recomendado)</option>
                <option :value="180">180 días (6 meses)</option>
                <option :value="365">1 año</option>
                <option :value="9999">Sin caducidad</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-brand-brown-dark uppercase mb-1">Tipo de Sesión</label>
            <select
              v-model="newSession.serviceType"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
            >
              <option
                v-for="exp in experiences"
                :key="exp.title"
                :value="exp.title"
              >
                {{ exp.title }}
              </option>
              <option
                v-for="pack in packs"
                :key="pack.title"
                :value="pack.title"
              >
                {{ pack.title }}
              </option>
              <option value="Otra sesión personalizada">Otra sesión personalizada</option>
            </select>
          </div>

          <!-- DRAG & DROP PHOTO UPLOADER -->
          <div>
            <label class="block font-bold text-brand-brown-dark uppercase mb-1">
              Subir Fotografías de la Ecografía
            </label>

            <!-- Hidden Input -->
            <input
              ref="fileInputRef"
              type="file"
              multiple
              accept="image/*"
              class="hidden"
              @change="handleFilesSelected"
            />

            <div
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop="handleDrop"
              @click="triggerFileInput"
              :class="[
                'flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-all',
                isDragging
                  ? 'border-brand-pink bg-brand-pink/10'
                  : 'border-brand-pink-light/80 bg-brand-cream/20 hover:border-brand-pink hover:bg-brand-cream/40'
              ]"
            >
              <UploadCloud class="h-7 w-7 text-brand-brown" />
              <p class="mt-2 text-xs font-bold text-brand-brown-dark">
                Arrastra aquí las fotos o pulsa para buscar en el ordenador / Pendrive
              </p>
              <p class="mt-1 text-[10px] text-brand-brown/70">
                Puedes seleccionar varias fotos a la vez (.jpg, .png)
              </p>
            </div>

            <!-- Uploaded Photos Thumbnails -->
            <div v-if="uploadedPhotos.length > 0" class="mt-3 space-y-2">
              <div class="flex items-center justify-between text-xs font-bold text-brand-brown">
                <span>{{ uploadedPhotos.length }} fotos preparadas</span>
                <button
                  type="button"
                  @click="uploadedPhotos = []"
                  class="text-rose-600 hover:underline cursor-pointer text-[10px]"
                >
                  Quitar todas
                </button>
              </div>

              <div class="grid grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1.5 border border-brand-pink-light/30 rounded-xl bg-brand-cream/20">
                <div
                  v-for="(photo, pIdx) in uploadedPhotos"
                  :key="pIdx"
                  class="group relative aspect-square overflow-hidden rounded-lg border border-brand-pink-light/50 bg-stone-900"
                >
                  <img :src="photo" class="h-full w-full object-cover" />
                  <button
                    type="button"
                    @click.stop="removeUploadedPhoto(pIdx)"
                    class="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700 cursor-pointer"
                    title="Quitar foto"
                  >
                    <X class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label class="block font-bold text-brand-brown-dark uppercase mb-1">
              Nota o Dedicatoria para la Madre (Opcional)
            </label>
            <input
              v-model="newSession.note"
              type="text"
              placeholder="Ej: Sesión maravillosa, el bebé se dejó ver genial..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
          </div>

          <button
            type="submit"
            class="w-full cursor-pointer flex items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3 text-center font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
          >
            <Sparkles class="h-4 w-4" />
            <span>Crear Entrega y Generar Enlace</span>
          </button>
        </form>
      </div>

      <!-- Sessions List -->
      <div class="space-y-4 lg:col-span-7">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
            Sesiones Entregadas ({{ sessions.length }})
          </h3>

          <div class="relative w-full sm:w-60">
            <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-brown/60" />
            <input
              v-model="searchSessionQuery"
              type="text"
              placeholder="Buscar por clienta, teléfono..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-white pl-8 pr-3 py-1.5 text-xs text-brand-brown-dark placeholder:text-brand-brown/50 focus:border-brand-pink focus:outline-none"
            />
          </div>
        </div>

        <div v-if="filteredSessions.length === 0" class="rounded-3xl border border-brand-pink-light/40 bg-white p-12 text-center text-brand-brown/60">
          <Camera class="mx-auto h-8 w-8 text-brand-pink-light" />
          <p class="mt-2 text-sm font-medium">No se encontraron sesiones.</p>
        </div>

        <div v-else class="space-y-3">
          <div
            v-for="s in filteredSessions"
            :key="s.id"
            class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-xs transition-all hover:border-brand-pink hover:shadow-sm"
          >
            <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
              <div>
                <div class="flex items-center gap-2">
                  <h4 class="font-serif text-base font-bold text-brand-brown-dark">{{ s.clientName }}</h4>
                  <span class="rounded-full bg-brand-cream px-2.5 py-0.5 text-[11px] font-semibold text-brand-brown-dark">
                    {{ s.serviceType }}
                  </span>
                </div>

                <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-brown/80">
                  <span class="flex items-center gap-1">
                    <Phone class="h-3.5 w-3.5 text-brand-brown" />
                    {{ s.clientPhone }}
                  </span>
                  <span class="flex items-center gap-1">
                    <Calendar class="h-3.5 w-3.5 text-brand-brown" />
                    {{ s.sessionDate }}
                  </span>
                  <span class="flex items-center gap-1">
                    <ImageIcon class="h-3.5 w-3.5 text-brand-brown" />
                    {{ s.photos ? s.photos.length : 0 }} fotos
                  </span>
                </div>

                <div class="mt-2 flex items-center gap-2">
                  <span class="text-[11px] font-bold text-brand-brown/60 uppercase">Código:</span>
                  <span class="rounded-lg bg-brand-cream px-2 py-0.5 font-mono text-xs font-bold text-brand-brown-dark">
                    {{ s.code }}
                  </span>
                </div>
              </div>

              <!-- Actions -->
              <div class="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                <a
                  :href="getWhatsAppShareUrl(s)"
                  target="_blank"
                  class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-xs transition-all hover:bg-emerald-700"
                >
                  <Send class="h-3 w-3" />
                  <span>Enviar por WhatsApp</span>
                </a>

                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="copySessionLink(s)"
                    class="flex cursor-pointer items-center gap-1 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-2.5 py-1.5 text-xs font-medium text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
                  >
                    <Check v-if="copiedSessionId === s.id" class="h-3.5 w-3.5 text-emerald-600" />
                    <Copy v-else class="h-3.5 w-3.5" />
                    <span>{{ copiedSessionId === s.id ? '¡Copiado!' : 'Copiar Enlace' }}</span>
                  </button>

                  <router-link
                    :to="'/sesion/' + s.code"
                    target="_blank"
                    class="rounded-xl border border-brand-pink-light/60 p-1.5 text-brand-brown-dark hover:bg-brand-cream"
                    title="Ver como clienta"
                  >
                    <Eye class="h-3.5 w-3.5" />
                  </router-link>

                  <button
                    type="button"
                    @click="handleDeleteSession(s.id, s.clientName)"
                    class="cursor-pointer rounded-xl border border-rose-200 p-1.5 text-rose-600 hover:bg-rose-50"
                    title="Eliminar sesión"
                  >
                    <Trash2 class="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
