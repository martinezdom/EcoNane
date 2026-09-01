<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import type { Promotion, Experience, Pack } from '@/types'
import {
  Tag,
  CreditCard,
  Camera,
  Settings,
  LogOut,
  ExternalLink,
  Check,
  Copy,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  Calendar,
  Phone,
  User,
  Lock,
  Eye,
  CheckCircle2,
  Clock,
  Send,
  UploadCloud,
  Image as ImageIcon,
  X
} from '@lucide/vue'

const router = useRouter()
const {
  promotion,
  experiences,
  packs,
  sessions,
  isAdminLoggedIn,
  updatePromotion,
  resetPromotionToDefault,
  updateExperiences,
  resetExperiencesToDefault,
  updatePacks,
  resetPacksToDefault,
  createSession,
  deleteSession,
  logoutAdmin,
  setAdminPin
} = useSiteData()

if (!isAdminLoggedIn.value) {
  router.push('/admin/login')
}

const activeTab = ref<'promo' | 'prices' | 'sessions' | 'settings'>('promo')
const saveSuccessMessage = ref('')

function showSuccess(msg: string) {
  saveSuccessMessage.value = msg
  setTimeout(() => {
    saveSuccessMessage.value = ''
  }, 4000)
}

// 1. Promotion Local Form
const promoForm = ref<Promotion>({ ...promotion.value })

function savePromo() {
  updatePromotion(promoForm.value)
  showSuccess('¡Promoción y ofertas actualizadas correctamente!')
}

function handleResetPromo() {
  if (confirm('¿Seguro que deseas restaurar la promoción de apertura predeterminada?')) {
    resetPromotionToDefault()
    promoForm.value = { ...promotion.value }
    showSuccess('Promoción restaurada a los valores originales.')
  }
}

// 2. Experiences & Packs Local Form
const experiencesForm = ref<Experience[]>(JSON.parse(JSON.stringify(experiences.value)))
const packsForm = ref<Pack[]>(JSON.parse(JSON.stringify(packs.value)))

function addFeature(expIndex: number) {
  const exp = experiencesForm.value[expIndex]
  if (exp) {
    exp.features.push('Nueva ventaja incluida')
  }
}

function removeFeature(expIndex: number, featIndex: number) {
  const exp = experiencesForm.value[expIndex]
  if (exp) {
    exp.features.splice(featIndex, 1)
  }
}

function savePrices() {
  updateExperiences(experiencesForm.value)
  updatePacks(packsForm.value)
  showSuccess('¡Precios de sesiones y packs actualizados en la web!')
}

function handleResetPrices() {
  if (confirm('¿Deseas restaurar todos los precios y packs originales?')) {
    resetExperiencesToDefault()
    resetPacksToDefault()
    experiencesForm.value = JSON.parse(JSON.stringify(experiences.value))
    packsForm.value = JSON.parse(JSON.stringify(packs.value))
    showSuccess('Precios restaurados a los valores originales.')
  }
}

// 3. Client Delivery Sessions
const newSession = ref({
  clientName: '',
  clientPhone: '',
  sessionDate: new Date().toISOString().slice(0, 10),
  serviceType: 'Eco Básica 4D / 5D',
  note: '',
  expiryDays: 120
})

const uploadedPhotos = ref<string[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const copiedSessionId = ref<string | null>(null)

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

  showSuccess(`¡Sesión para ${created.clientName} creada con éxito! Código: ${created.code}`)
}

function handleDeleteSession(id: string, name: string) {
  if (confirm(`¿Seguro que deseas eliminar la entrega de sesión de ${name}?`)) {
    deleteSession(id)
    showSuccess(`Sesión de ${name} eliminada.`)
  }
}

function getSessionUrl(code: string) {
  const origin = window.location.origin
  return `${origin}/sesion/${code}`
}

function copySessionLink(session: any) {
  const url = getSessionUrl(session.code)
  navigator.clipboard.writeText(url)
  copiedSessionId.value = session.id
  setTimeout(() => {
    copiedSessionId.value = null
  }, 2500)
}

function getWhatsAppShareUrl(session: any) {
  const url = getSessionUrl(session.code)
  const last4 = session.clientPhone.replace(/\D/g, '').slice(-4)
  const text = encodeURIComponent(
    `¡Hola ${session.clientName}! ❤️\n\nYa tienes listas las fotos y recuerdos de tu ecografía en EcoNane.\n\nPuedes verlas y descargarlas en alta calidad desde tu enlace privado:\n👉 ${url}\n\n🔒 Clave de acceso: Los 4 últimos dígitos de tu teléfono (${last4})\n\n¡Esperamos que te encante el recuerdo de tu bebé!`
  )
  const phone = session.clientPhone.replace(/\D/g, '')
  const fullPhone = phone.startsWith('34') ? phone : `34${phone}`
  return `https://wa.me/${fullPhone}?text=${text}`
}

// 4. Admin Settings
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
  } finally {
    isSavingPin.value = false
  }
}

function handleLogout() {
  logoutAdmin()
  router.push('/admin/login')
}
</script>

<template>
  <div class="min-h-screen bg-brand-cream/60 pb-20 text-brand-brown-dark">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-30 border-b border-brand-pink-light/40 bg-white/95 shadow-sm backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <img src="/logo.webp" alt="EcoNane" class="h-10 w-auto" />
          <div>
            <h1 class="font-serif text-lg font-bold leading-tight text-brand-brown-dark">Panel EcoNane</h1>
            <p class="text-xs text-brand-brown/80">Gestión de Promociones, Precios y Entregas</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <router-link
            to="/"
            target="_blank"
            class="flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-beige/50 px-3.5 py-2 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
          >
            <ExternalLink class="h-3.5 w-3.5 text-brand-brown" />
            <span class="hidden md:inline">Ver</span> Web Pública
          </router-link>

          <button
            @click="handleLogout"
            class="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 cursor-pointer"
          >
            <LogOut class="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex gap-2 overflow-x-auto border-t border-brand-pink-light/20 pt-2 pb-1.5 scrollbar-none">
          <button
            @click="activeTab = 'promo'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'promo'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Tag class="h-4 w-4" />
            <span>Ofertas y Promoción</span>
          </button>

          <button
            @click="activeTab = 'prices'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'prices'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <CreditCard class="h-4 w-4" />
            <span>Precios y Servicios</span>
          </button>

          <button
            @click="activeTab = 'sessions'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'sessions'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Camera class="h-4 w-4" />
            <span>Entrega de Fotos (Clientas)</span>
            <span
              v-if="sessions.length > 0"
              class="ml-1 rounded-full bg-white/25 px-2 py-0.5 text-xs text-white"
            >
              {{ sessions.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'settings'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'settings'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Settings class="h-4 w-4" />
            <span>Seguridad</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Global Success Toast Banner -->
    <div
      v-if="saveSuccessMessage"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-600 px-5 py-4 text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom"
    >
      <CheckCircle2 class="h-5 w-5" />
      <span>{{ saveSuccessMessage }}</span>
    </div>

    <!-- Main Content Area -->
    <main class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <!-- 1. TAB: PROMO & OFFERS -->
      <div v-if="activeTab === 'promo'" class="space-y-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Gestión de Promociones</h2>
            <p class="text-sm text-brand-brown/80">
              Modifica los textos, el mes de la oferta o activa/desactiva el banner de la web.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="handleResetPromo"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-beige"
            >
              <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
              Restaurar Original
            </button>
            <button
              @click="savePromo"
              class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Check class="h-4 w-4" />
              Guardar Cambios
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Form Card -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div class="space-y-6">
              <!-- Switch Active -->
              <div class="flex items-center justify-between rounded-2xl border border-brand-pink-light/30 bg-brand-beige/40 p-4">
                <div>
                  <h4 class="font-semibold text-brand-brown-dark">Banner de Promoción Activo</h4>
                  <p class="text-xs text-brand-brown/80">
                    Si lo desactivas, el bloque de oferta desaparecerá de la web.
                  </p>
                </div>
                <label class="relative inline-flex cursor-pointer items-center">
                  <input type="checkbox" v-model="promoForm.active" class="peer sr-only" />
                  <div
                    class="peer h-7 w-12 rounded-full bg-stone-300 transition-colors after:absolute after:top-0.5 after:left-[3px] after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"
                  ></div>
                </label>
              </div>

              <!-- Badge text -->
              <div>
                <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
                  Etiqueta Superior (Badge)
                </label>
                <input
                  v-model="promoForm.badge"
                  type="text"
                  placeholder="Ej: OFERTA DE APERTURA"
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                />
              </div>

              <!-- Title -->
              <div>
                <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
                  Título de la Oferta
                </label>
                <input
                  v-model="promoForm.title"
                  type="text"
                  placeholder="Ej: ¡Gran Promoción de Apertura en Octubre!"
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                />
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
                  Descripción Detallada
                </label>
                <textarea
                  v-model="promoForm.description"
                  rows="3"
                  placeholder="Texto descriptivo de la promoción..."
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                ></textarea>
              </div>

              <!-- WhatsApp Text -->
              <div>
                <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
                  Mensaje que recibirá Mireia por WhatsApp al pulsar el botón
                </label>
                <input
                  v-model="promoForm.whatsappText"
                  type="text"
                  placeholder="Ej: Hola, me gustaría reservar mi ecografía..."
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                />
              </div>
            </div>
          </div>

          <!-- Live Preview Card -->
          <div class="space-y-4 lg:col-span-5">
            <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
              Vista previa en tiempo real
            </h3>

            <div
              v-if="promoForm.active"
              class="relative overflow-hidden rounded-3xl border border-brand-pink-light/60 bg-gradient-to-br from-brand-beige via-white to-brand-pink-light/40 p-6 shadow-sm"
            >
              <div class="inline-flex items-center gap-1.5 rounded-full bg-brand-pink px-3.5 py-1 text-xs font-bold text-white shadow-sm">
                <Sparkles class="h-3.5 w-3.5 fill-white" />
                <span>{{ promoForm.badge || 'PROMOCIÓN' }}</span>
              </div>

              <h4 class="mt-4 font-serif text-xl font-bold text-brand-brown-dark">
                {{ promoForm.title || 'Título de ejemplo' }}
              </h4>

              <p class="mt-2 text-xs leading-relaxed text-brand-brown/90">
                {{ promoForm.description || 'Descripción de la promoción...' }}
              </p>

              <div class="mt-6">
                <div class="inline-flex w-full items-center justify-center rounded-2xl bg-brand-pink py-3 text-center text-xs font-bold text-white shadow-md">
                  Reservar promoción
                </div>
              </div>
            </div>

            <div
              v-else
              class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-pink-light/60 bg-white/60 p-12 text-center text-brand-brown/60"
            >
              <Tag class="h-8 w-8 text-brand-pink" />
              <p class="mt-2 text-sm font-medium">El banner de promoción está oculto</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 2. TAB: PRICES & SERVICES -->
      <div v-if="activeTab === 'prices'" class="space-y-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Precios y Experiencias</h2>
            <p class="text-sm text-brand-brown/80">
              Ajusta los precios de las ecografías individuales y de los packs de seguimiento.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="handleResetPrices"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-beige"
            >
              <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
              Restaurar Originales
            </button>
            <button
              @click="savePrices"
              class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Check class="h-4 w-4" />
              Guardar Todos los Precios
            </button>
          </div>
        </div>

        <!-- 4 Experiences Grid -->
        <div>
          <h3 class="mb-4 text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
            Sesiones Individuales (4)
          </h3>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              v-for="(exp, expIdx) in experiencesForm"
              :key="expIdx"
              class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Título</label>
                  <input
                    v-model="exp.title"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>

                <div class="w-28">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Precio</label>
                  <input
                    v-model="exp.price"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-pink/40 bg-brand-pink/15 px-3 py-2 text-center text-sm font-extrabold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div class="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Duración</label>
                  <input
                    v-model="exp.duration"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Etiqueta Destacada</label>
                  <input
                    v-model="exp.badge"
                    type="text"
                    placeholder="Opcional (ej: MÁS POPULAR)"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Descripción</label>
                <textarea
                  v-model="exp.description"
                  rows="2"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                ></textarea>
              </div>

              <!-- Features list -->
              <div class="mt-4">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Incluye</label>
                  <button
                    type="button"
                    @click="addFeature(expIdx)"
                    class="flex cursor-pointer items-center gap-1 text-xs font-bold text-brand-brown hover:text-brand-brown-dark"
                  >
                    <Plus class="h-3.5 w-3.5" />
                    Añadir ventaja
                  </button>
                </div>

                <div class="mt-2 space-y-2">
                  <div
                    v-for="(_, featIdx) in exp.features"
                    :key="featIdx"
                    class="flex items-center gap-2"
                  >
                    <input
                      v-model="exp.features[featIdx]"
                      type="text"
                      class="flex-1 rounded-lg border border-brand-pink-light/50 bg-brand-cream/20 px-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                    />
                    <button
                      type="button"
                      @click="removeFeature(expIdx, featIdx)"
                      class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Trash2 class="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 2 Packs Grid -->
        <div class="pt-6">
          <h3 class="mb-4 text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
            Packs de Ahorro y Seguimiento (2)
          </h3>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              v-for="(pack, packIdx) in packsForm"
              :key="packIdx"
              class="rounded-3xl border border-brand-gold/40 bg-gradient-to-br from-white via-brand-beige/40 to-brand-gold/15 p-6 shadow-sm"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Título del Pack</label>
                  <input
                    v-model="pack.title"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                  />
                </div>

                <div class="w-28">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Precio</label>
                  <input
                    v-model="pack.price"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-gold/50 bg-brand-gold/20 px-3 py-2 text-center text-sm font-extrabold text-amber-950 focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Etiqueta de Ahorro</label>
                <input
                  v-model="pack.save"
                  type="text"
                  placeholder="Ej: Ahorra 10€"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                />
              </div>

              <div class="mt-4">
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Descripción</label>
                <textarea
                  v-model="pack.description"
                  rows="2"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TAB: CLIENT PHOTO SESSIONS -->
      <div v-if="activeTab === 'sessions'" class="space-y-8">
        <div>
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Entrega de Fotos y Recuerdos a Madres</h2>
          <p class="text-sm text-brand-brown/80">
            Arrastra las fotos de la ecografía o selecciónalas de tu ordenador. Se generará un enlace privado protegido para la clienta.
          </p>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Create Session Form -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-6">
            <div class="flex items-center gap-3 border-b border-brand-pink-light/30 pb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-pink/20 text-brand-brown">
                <Camera class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Nueva Entrega</h3>
                <p class="text-xs text-brand-brown/80">Selecciona las fotos y rellena los datos</p>
              </div>
            </div>

            <form @submit.prevent="handleCreateSession" class="mt-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Nombre de la Madre / Clienta *
                </label>
                <div class="relative mt-1">
                  <input
                    v-model="newSession.clientName"
                    type="text"
                    required
                    placeholder="Ej: Laura Domínguez"
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 pl-10 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                  />
                  <User class="absolute top-3 left-3 h-4 w-4 text-brand-brown/60" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Teléfono Móvil (Servirá como PIN de seguridad) *
                </label>
                <div class="relative mt-1">
                  <input
                    v-model="newSession.clientPhone"
                    type="tel"
                    required
                    placeholder="Ej: 644189856"
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 pl-10 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                  />
                  <Phone class="absolute top-3 left-3 h-4 w-4 text-brand-brown/60" />
                </div>
                <p class="mt-1 text-[11px] text-brand-brown/70">
                  La madre usará los últimos 4 dígitos para desbloquear sus fotos.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark uppercase">Fecha Sesión</label>
                  <input
                    v-model="newSession.sessionDate"
                    type="date"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark uppercase">Caducidad</label>
                  <select
                    v-model="newSession.expiryDays"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  >
                    <option :value="120">120 días (Recomendado)</option>
                    <option :value="180">180 días (6 meses)</option>
                    <option :value="365">1 año</option>
                    <option :value="9999">Sin caducidad</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">Tipo de Sesión</label>
                <select
                  v-model="newSession.serviceType"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                >
                  <option value="Eco Básica 4D / 5D">Eco Básica 4D / 5D</option>
                  <option value="Eco para Conocer el Sexo">Eco para Conocer el Sexo</option>
                  <option value="Eco + Revelación de Sexo">Eco + Revelación de Sexo</option>
                  <option value="Gafas Realidad Virtual + Eco 5D">Gafas Realidad Virtual + Eco 5D</option>
                  <option value="Pack Seguimiento de Embarazo">Pack Seguimiento de Embarazo</option>
                </select>
              </div>

              <!-- DRAG & DROP PHOTO UPLOADER -->
              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
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
                    'mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all',
                    isDragging
                      ? 'border-brand-pink bg-brand-pink/10'
                      : 'border-brand-pink-light/80 bg-brand-beige/30 hover:border-brand-pink hover:bg-brand-beige/50'
                  ]"
                >
                  <UploadCloud class="h-8 w-8 text-brand-brown" />
                  <p class="mt-2 text-xs font-bold text-brand-brown-dark">
                    Arrastra aquí las fotos o pulsa para buscar en el PC / Pendrive
                  </p>
                  <p class="mt-1 text-[11px] text-brand-brown/70">
                    Puedes seleccionar varias fotos a la vez (.jpg, .png)
                  </p>
                </div>

                <!-- Uploaded Photos Thumbnails -->
                <div v-if="uploadedPhotos.length > 0" class="mt-4 space-y-2">
                  <div class="flex items-center justify-between text-xs font-bold text-brand-brown">
                    <span>{{ uploadedPhotos.length }} fotos preparadas</span>
                    <button
                      type="button"
                      @click="uploadedPhotos = []"
                      class="text-rose-600 hover:underline cursor-pointer text-[11px]"
                    >
                      Quitar todas
                    </button>
                  </div>

                  <div class="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-brand-pink-light/30 rounded-xl bg-brand-cream/20">
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
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Nota o Dedicatoria para la Madre (Opcional)
                </label>
                <input
                  v-model="newSession.note"
                  type="text"
                  placeholder="Ej: Sesión maravillosa, el bebé se dejó ver genial..."
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3.5 text-center font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
              >
                <Sparkles class="h-4 w-4" />
                Crear Entrega y Generar Enlace
              </button>
            </form>
          </div>

          <!-- Sessions List -->
          <div class="space-y-4 lg:col-span-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
                Sesiones Entregadas ({{ sessions.length }})
              </h3>
            </div>

            <div v-if="sessions.length === 0" class="rounded-3xl border border-brand-pink-light/40 bg-white p-12 text-center text-brand-brown/60">
              <Camera class="mx-auto h-8 w-8 text-brand-pink-light" />
              <p class="mt-2 text-sm font-medium">Aún no hay entregas de sesiones registradas.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="s in sessions"
                :key="s.id"
                class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm transition-all hover:border-brand-pink hover:shadow-md"
              >
                <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-serif text-lg font-bold text-brand-brown-dark">{{ s.clientName }}</h4>
                      <span class="rounded-full bg-brand-beige px-2.5 py-0.5 text-[11px] font-semibold text-brand-brown-dark">
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

                    <div class="mt-3 flex items-center gap-2">
                      <span class="text-xs font-bold text-brand-brown/60 uppercase">Token Privado:</span>
                      <span class="rounded-lg bg-brand-beige px-2 py-0.5 font-mono text-xs font-bold text-brand-brown-dark">
                        {{ s.code }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <a
                      :href="getWhatsAppShareUrl(s)"
                      target="_blank"
                      class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                    >
                      <Send class="h-3.5 w-3.5" />
                      Enviar por WhatsApp
                    </a>

                    <div class="flex items-center gap-2">
                      <button
                        @click="copySessionLink(s)"
                        class="flex cursor-pointer items-center gap-1 rounded-xl border border-brand-pink-light/60 bg-brand-beige/50 px-3 py-1.5 text-xs font-medium text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
                      >
                        <Check v-if="copiedSessionId === s.id" class="h-3.5 w-3.5 text-emerald-600" />
                        <Copy v-else class="h-3.5 w-3.5" />
                        <span>{{ copiedSessionId === s.id ? '¡Copiado!' : 'Copiar Enlace' }}</span>
                      </button>

                      <router-link
                        :to="'/sesion/' + s.code"
                        target="_blank"
                        class="rounded-xl border border-brand-pink-light/60 p-2 text-brand-brown-dark hover:bg-brand-beige"
                        title="Ver como clienta"
                      >
                        <Eye class="h-3.5 w-3.5" />
                      </router-link>

                      <button
                        @click="handleDeleteSession(s.id, s.clientName)"
                        class="cursor-pointer rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
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

      <!-- 4. TAB: SETTINGS & PIN -->
      <div v-if="activeTab === 'settings'" class="max-w-xl space-y-6">
        <div>
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Seguridad y Acceso</h2>
          <p class="text-sm text-brand-brown/80">
            Modifica la clave de acceso que utilizáis para entrar a este panel.
          </p>
        </div>

        <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8">
          <form @submit.prevent="handleSavePin" class="space-y-4">
            <div class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/30 p-4">
              <div class="flex items-center gap-2 text-xs font-bold text-brand-brown">
                <ShieldCheck class="h-4 w-4 text-emerald-600" />
                <span>Estado de Acceso: Protegido con Cifrado SHA-256</span>
              </div>
              <p class="mt-1 text-[11px] text-brand-brown/70">
                La contraseña se almacena de forma encriptada e irreversible en la base de datos de Supabase.
              </p>
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase">Nueva Clave de Acceso</label>
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

            <div v-if="pinSuccess" class="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {{ pinSuccess }}
            </div>

            <button
              type="submit"
              class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Lock class="h-4 w-4" />
              Guardar Nueva Clave
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
