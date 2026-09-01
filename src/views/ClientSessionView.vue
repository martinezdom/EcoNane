<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import type { ClientSession } from '@/types'
import JSZip from 'jszip'
import {
  Lock,
  Unlock,
  ShieldCheck,
  Heart,
  Download,
  Eye,
  Calendar,
  Phone,
  Sparkles,
  ArrowLeft,
  AlertCircle,
  Clock,
  CheckCircle2,
  ExternalLink,
  Loader2,
  FolderArchive,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  X
} from '@lucide/vue'

const route = useRoute()
const { getSessionByCode, verifySessionPhone } = useSiteData()

const code = computed(() => (route.params.code as string) || '')
const sessionData = ref<ClientSession | null>(null)
const isExpired = ref(false)
const isUnlocked = ref(false)

// PIN / Phone Input
const phoneInput = ref('')
const verificationError = ref('')
const isChecking = ref(false)

// ZIP Download state
const isZipping = ref(false)
const zipStatusText = ref('')

// Lightbox Modal Navigation & Rotation
const selectedPhotoIndex = ref<number | null>(null)
const photoRotations = ref<Record<number, number>>({})

const currentPhoto = computed(() => {
  if (selectedPhotoIndex.value === null || !sessionData.value?.photos) return null
  return sessionData.value.photos[selectedPhotoIndex.value] || null
})

const currentRotation = computed(() => {
  if (selectedPhotoIndex.value === null) return 0
  return photoRotations.value[selectedPhotoIndex.value] || 0
})

const totalPhotos = computed(() => sessionData.value?.photos?.length || 0)
const hasPrev = computed(() => selectedPhotoIndex.value !== null && selectedPhotoIndex.value > 0)
const hasNext = computed(() => selectedPhotoIndex.value !== null && selectedPhotoIndex.value < totalPhotos.value - 1)

function openPhoto(index: number) {
  selectedPhotoIndex.value = index
}

function closePhoto() {
  selectedPhotoIndex.value = null
}

function prevPhoto() {
  if (hasPrev.value && selectedPhotoIndex.value !== null) {
    selectedPhotoIndex.value--
  }
}

function nextPhoto() {
  if (hasNext.value && selectedPhotoIndex.value !== null) {
    selectedPhotoIndex.value++
  }
}

function rotateCurrentPhoto() {
  if (selectedPhotoIndex.value === null) return
  const current = photoRotations.value[selectedPhotoIndex.value] || 0
  photoRotations.value[selectedPhotoIndex.value] = (current + 90) % 360
}

// Mobile Touch Swipe Gestures
let touchStartX = 0
let touchEndX = 0
let touchStartY = 0
let touchEndY = 0

function handleTouchStart(e: TouchEvent) {
  const touch = e.touches[0]
  if (touch) {
    touchStartX = touch.clientX
    touchStartY = touch.clientY
  }
}

function handleTouchEnd(e: TouchEvent) {
  const touch = e.changedTouches[0]
  if (touch) {
    touchEndX = touch.clientX
    touchEndY = touch.clientY
    handleSwipe()
  }
}

function handleSwipe() {
  const deltaX = touchEndX - touchStartX
  const deltaY = touchEndY - touchStartY

  // Ensure horizontal swipe is dominant over vertical scroll
  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 40) {
    if (deltaX > 0) {
      // Swiped Right -> Previous photo
      prevPhoto()
    } else {
      // Swiped Left -> Next photo
      nextPhoto()
    }
  }
}

function handleKeyDown(e: KeyboardEvent) {
  if (selectedPhotoIndex.value === null) return
  if (e.key === 'Escape') {
    closePhoto()
  } else if (e.key === 'ArrowLeft') {
    prevPhoto()
  } else if (e.key === 'ArrowRight') {
    nextPhoto()
  } else if (e.key === 'r' || e.key === 'R') {
    rotateCurrentPhoto()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  if (code.value) {
    const result = getSessionByCode(code.value)
    sessionData.value = result.session
    isExpired.value = result.isExpired

    // Check if previously unlocked in this session
    const unlockedKey = `econane_unlocked_${code.value}`
    if (sessionStorage.getItem(unlockedKey) === 'true') {
      isUnlocked.value = true
    }
  }
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
})

function handleUnlock() {
  verificationError.value = ''
  if (!phoneInput.value || phoneInput.value.trim().length < 4) {
    verificationError.value = 'Por favor, introduce los 4 últimos dígitos de tu móvil.'
    return
  }

  if (!sessionData.value) return

  isChecking.value = true
  setTimeout(() => {
    isChecking.value = false
    const valid = verifySessionPhone(sessionData.value!, phoneInput.value)
    if (valid) {
      isUnlocked.value = true
      sessionStorage.setItem(`econane_unlocked_${code.value}`, 'true')
    } else {
      verificationError.value = 'Los 4 dígitos no coinciden con el teléfono registrado para esta sesión.'
    }
  }, 400)
}

async function handleDownloadAllZip() {
  if (!sessionData.value || !sessionData.value.photos || sessionData.value.photos.length === 0) return

  isZipping.value = true
  zipStatusText.value = 'Iniciando descarga...'

  try {
    const zip = new JSZip()
    const folderName = `EcoNane - ${sessionData.value.clientName}`
    const folder = zip.folder(folderName) || zip

    for (let i = 0; i < sessionData.value.photos.length; i++) {
      const photoUrl = sessionData.value.photos[i]!
      zipStatusText.value = `Empaquetando foto ${i + 1} de ${sessionData.value.photos.length}...`

      let blob: Blob
      if (photoUrl.startsWith('data:')) {
        const res = await fetch(photoUrl)
        blob = await res.blob()
      } else {
        const res = await fetch(photoUrl)
        blob = await res.blob()
      }

      const filename = `EcoNane-Ecografia-${sessionData.value.clientName.replace(/\s+/g, '_')}-${i + 1}.jpg`
      folder.file(filename, blob)
    }

    zipStatusText.value = 'Generando archivo .ZIP comprimido...'
    const content = await zip.generateAsync({ type: 'blob' })

    // Trigger download
    const link = document.createElement('a')
    link.href = URL.createObjectURL(content)
    link.download = `EcoNane-${sessionData.value.clientName.replace(/\s+/g, '_')}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(link.href)

    zipStatusText.value = '¡Descarga completada!'
    setTimeout(() => {
      isZipping.value = false
      zipStatusText.value = ''
    }, 2000)
  } catch (err) {
    console.error('Error generating zip:', err)
    alert('Hubo un problema al comprimir el archivo ZIP. Puedes descargar las fotos individualmente tocando cada foto.')
    isZipping.value = false
    zipStatusText.value = ''
  }
}

function downloadSinglePhoto(photoUrl: string) {
  const link = document.createElement('a')
  link.href = photoUrl
  link.download = `EcoNane-Ecografia-${Date.now()}.jpg`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}
</script>

<template>
  <div class="min-h-screen bg-brand-cream/60 pb-20 text-brand-brown-dark">
    <!-- Top Header (Mobile Friendly) -->
    <header class="sticky top-0 z-30 border-b border-brand-pink-light/40 bg-white/90 backdrop-blur-md">
      <div class="mx-auto flex max-w-5xl items-center justify-between px-4 py-3.5 sm:px-6">
        <router-link to="/" class="flex items-center gap-2.5">
          <img src="/logo.webp" alt="EcoNane" class="h-8 w-auto sm:h-9" />
          <span class="font-serif text-base font-bold tracking-tight text-brand-brown-dark sm:text-lg">EcoNane</span>
        </router-link>

        <a
          href="https://wa.me/34644189856"
          target="_blank"
          class="flex items-center gap-1.5 rounded-full border border-brand-pink-light/60 bg-brand-beige/50 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark transition-colors hover:bg-brand-pink-light/30"
        >
          <Heart class="h-3.5 w-3.5 fill-brand-pink text-brand-pink" />
          <span>Ayuda / Contacto</span>
        </a>
      </div>
    </header>

    <main class="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-10">
      <!-- 1. State: Session NOT Found -->
      <div
        v-if="!sessionData"
        class="mx-auto max-w-lg rounded-3xl border border-brand-pink-light/40 bg-white p-6 text-center shadow-lg sm:p-12"
      >
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-50 text-amber-700">
          <AlertCircle class="h-8 w-8" />
        </div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Enlace no encontrado</h2>
        <p class="mt-2 text-sm leading-relaxed text-brand-brown/80">
          El código de sesión no existe o ha sido modificado. Comprueba el enlace que te hemos enviado por WhatsApp.
        </p>
        <div class="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <router-link
            to="/"
            class="rounded-xl border border-brand-pink-light/60 bg-brand-beige/40 px-5 py-2.5 text-xs font-bold text-brand-brown-dark hover:bg-brand-pink-light/30"
          >
            Ir a la página principal
          </router-link>
          <a
            href="https://wa.me/34644189856?text=Hola%2C%20tengo%20un%20problema%20para%20acceder%20al%20enlace%20de%20mi%20sesi%C3%B3n."
            target="_blank"
            class="rounded-xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-md hover:bg-brand-brown-dark"
          >
            Contactar por WhatsApp
          </a>
        </div>
      </div>

      <!-- 2. State: Session EXPIRED (> 120 days) -->
      <div
        v-else-if="isExpired"
        class="mx-auto max-w-lg rounded-3xl border border-amber-200 bg-white p-6 text-center shadow-lg sm:p-12"
      >
        <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-800">
          <Clock class="h-8 w-8" />
        </div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Enlace Caducado</h2>
        <p class="mt-2 text-sm leading-relaxed text-brand-brown/80">
          Esta entrega ha superado el plazo de validez de <strong>{{ sessionData.expiryDays }} días</strong>.
          Si necesitas recuperar tus fotos, ponte en contacto con nosotros.
        </p>
        <div class="mt-6">
          <a
            href="https://wa.me/34644189856?text=Hola%2C%20se%20ha%20caducado%20el%20enlace%20de%20mi%20sesi%C3%B3n%20y%20me%20gustar%C3%ADa%20recuperar%20mis%20fotos."
            target="_blank"
            class="inline-flex items-center gap-2 rounded-2xl bg-brand-brown px-6 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-brown-dark"
          >
            Solicitar Reactivación
          </a>
        </div>
      </div>

      <!-- 3. State: LOCKED SCREEN (PIN / Phone 4 Digits Mobile Optimized) -->
      <div
        v-else-if="!isUnlocked"
        class="mx-auto max-w-md rounded-3xl border border-brand-pink-light/60 bg-white p-6 shadow-xl shadow-brand-brown/5 sm:p-10"
      >
        <div class="text-center">
          <div class="mx-auto mb-4 flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl bg-brand-pink/20 text-brand-brown shadow-inner">
            <Lock class="h-7 w-7 sm:h-8 sm:w-8" />
          </div>
          <div class="inline-flex items-center gap-1.5 rounded-full bg-brand-beige px-3 py-1 text-xs font-semibold text-brand-brown-dark">
            <Sparkles class="h-3 w-3 text-brand-pink" />
            <span>Entrega Privada EcoNane</span>
          </div>
          <h2 class="mt-3 font-serif text-xl sm:text-2xl font-bold text-brand-brown-dark">
            Tus Recuerdos Están Listos
          </h2>
          <p class="mt-2 text-xs leading-relaxed text-brand-brown/80">
            Para proteger la privacidad de tu bebé y tu familia, introduce los
            <strong class="text-brand-brown-dark">4 últimos dígitos de tu teléfono móvil</strong> registrado.
          </p>
        </div>

        <form @submit.prevent="handleUnlock" class="mt-6 space-y-5">
          <div>
            <label for="phoneDigits" class="block text-center text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
              Últimos 4 dígitos de tu móvil
            </label>
            <input
              id="phoneDigits"
              v-model="phoneInput"
              type="tel"
              inputmode="numeric"
              maxlength="4"
              pattern="[0-9]*"
              autofocus
              placeholder="••••"
              class="mt-2 w-full rounded-2xl border-2 border-brand-pink-light/60 bg-brand-cream/30 py-3.5 text-center font-mono text-2xl font-bold tracking-[0.4em] text-brand-brown-dark placeholder-brand-brown/30 focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-pink/20"
            />
          </div>

          <div
            v-if="verificationError"
            class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-xs font-semibold text-rose-700 animate-in fade-in"
          >
            {{ verificationError }}
          </div>

          <button
            type="submit"
            :disabled="isChecking"
            class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3.5 text-center font-bold text-white shadow-lg transition-all hover:bg-brand-brown-dark active:scale-98 disabled:opacity-50"
          >
            <Unlock class="h-4 w-4" />
            <span v-if="isChecking">Desbloqueando...</span>
            <span v-else>Ver mis Recuerdos</span>
          </button>
        </form>

        <div class="mt-6 border-t border-brand-pink-light/30 pt-4 text-center">
          <div class="flex items-center justify-center gap-1.5 text-xs text-brand-brown/70">
            <ShieldCheck class="h-4 w-4 text-emerald-600" />
            <span>Acceso seguro protegido de extremo a extremo</span>
          </div>
        </div>
      </div>

      <!-- 4. State: UNLOCKED PRIVATE GALLERY -->
      <div v-else class="space-y-8 sm:space-y-10 animate-in fade-in">
        <!-- Hero Greeting Card -->
        <div class="relative overflow-hidden rounded-3xl border border-brand-pink-light/50 bg-gradient-to-br from-brand-beige via-white to-brand-pink-light/40 p-6 shadow-md sm:p-12">
          <div class="flex flex-col justify-between gap-6 md:flex-row md:items-center">
            <div>
              <div class="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1 text-xs font-bold text-brand-brown shadow-sm">
                <Heart class="h-3.5 w-3.5 fill-brand-pink text-brand-pink" />
                <span>{{ sessionData.serviceType }}</span>
              </div>

              <h1 class="mt-3 font-serif text-2xl sm:text-3xl lg:text-4xl font-bold text-brand-brown-dark">
                Sesión de {{ sessionData.clientName }} ❤️
              </h1>

              <p class="mt-1.5 text-xs sm:text-sm text-brand-brown/90">
                Realizada el {{ sessionData.sessionDate }} en <strong>EcoNane Villajoyosa</strong>.
              </p>

              <p v-if="sessionData.note" class="mt-3 max-w-xl rounded-2xl border border-brand-pink-light/30 bg-white/80 p-3.5 text-xs italic leading-relaxed text-brand-brown-dark shadow-sm">
                “{{ sessionData.note }}”
              </p>
            </div>

            <!-- Download CTA Button (ZIP) -->
            <div class="flex flex-col items-center gap-2">
              <button
                @click="handleDownloadAllZip"
                :disabled="isZipping"
                class="w-full sm:w-auto flex cursor-pointer items-center justify-center gap-2.5 rounded-2xl bg-brand-brown px-7 py-4 text-center font-bold text-white shadow-xl shadow-brand-brown/20 transition-all hover:bg-brand-brown-dark active:scale-95 disabled:opacity-75"
              >
                <Loader2 v-if="isZipping" class="h-5 w-5 animate-spin" />
                <FolderArchive v-else class="h-5 w-5" />
                <span class="text-sm sm:text-base">{{ isZipping ? 'Descargando ZIP...' : 'Descargar Todas las Fotos (.ZIP)' }}</span>
              </button>

              <p v-if="zipStatusText" class="text-xs font-semibold text-brand-brown animate-pulse">
                {{ zipStatusText }}
              </p>
              <p v-else class="text-center text-[11px] text-brand-brown/70">
                Archivo ZIP con las {{ totalPhotos }} fotos en alta resolución
              </p>
            </div>
          </div>
        </div>

        <!-- Photos Grid (Responsive 2 cols on mobile, 3 cols on desktop) -->
        <div>
          <div class="mb-4 sm:mb-6 flex items-center justify-between">
            <div>
              <h2 class="font-serif text-xl sm:text-2xl font-bold text-brand-brown-dark">Fotografías de la Sesión</h2>
              <p class="text-xs text-brand-brown/80">
                Toca cualquier foto para ampliarla y desliza con el dedo para pasar.
              </p>
            </div>
            <span class="rounded-full bg-brand-pink/20 px-3 py-1 text-xs font-bold text-brand-brown-dark whitespace-nowrap">
              {{ totalPhotos }} Recuerdos
            </span>
          </div>

          <div class="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-6">
            <div
              v-for="(photo, idx) in sessionData.photos"
              :key="idx"
              @click="openPhoto(idx)"
              class="group relative aspect-square cursor-pointer overflow-hidden rounded-2xl sm:rounded-3xl border border-brand-pink-light/40 bg-stone-900 shadow-sm transition-all active:scale-98 hover:-translate-y-1 hover:shadow-xl"
            >
              <img
                :src="photo"
                :alt="'Ecografía ' + (idx + 1)"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                loading="lazy"
              />

              <!-- Hover Overlay with Actions -->
              <div class="absolute inset-0 flex items-center justify-center gap-2 sm:gap-3 bg-black/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
                <button
                  type="button"
                  @click.stop="openPhoto(idx)"
                  class="flex h-10 w-10 sm:h-11 sm:w-11 cursor-pointer items-center justify-center rounded-xl sm:rounded-2xl bg-white/95 text-brand-brown-dark shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Ver en grande"
                >
                  <Eye class="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
                <button
                  type="button"
                  @click.stop="downloadSinglePhoto(photo)"
                  class="flex h-10 w-10 sm:h-11 sm:w-11 cursor-pointer items-center justify-center rounded-xl sm:rounded-2xl bg-brand-pink text-white shadow-lg transition-transform hover:scale-110 active:scale-95"
                  title="Descargar esta foto"
                >
                  <Download class="h-4 w-4 sm:h-5 sm:w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact & Share Section -->
        <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 text-center shadow-sm sm:p-10">
          <Heart class="mx-auto h-7 w-7 sm:h-8 sm:w-8 fill-brand-pink text-brand-pink" />
          <h3 class="mt-3 font-serif text-lg sm:text-xl font-bold text-brand-brown-dark">
            ¡Gracias por confiar en EcoNane!
          </h3>
          <p class="mx-auto mt-2 max-w-md text-xs leading-relaxed text-brand-brown/80">
            Ha sido un honor acompañarte en este momento tan especial. Si tienes cualquier consulta o quieres compartirnos tu experiencia, estamos a un mensaje de distancia.
          </p>
          <div class="mt-5 flex flex-col sm:flex-row justify-center gap-3">
            <a
              :href="'https://wa.me/34644189856?text=Hola%20Mireia%2C%20muchas%20gracias%20por%20las%20fotos%20de%20la%20eco%2C%20nos%20han%20encantado%21'"
              target="_blank"
              class="flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-700"
            >
              <span>Escribir por WhatsApp</span>
            </a>
            <router-link
              to="/"
              class="flex items-center justify-center gap-2 rounded-2xl border border-brand-pink-light/60 bg-brand-beige/50 px-6 py-3 text-xs font-bold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
            >
              <span>Volver a la Web</span>
            </router-link>
          </div>
        </div>
      </div>
    </main>

    <!-- Photo Lightbox Modal - Touch Gestures & Mobile First -->
    <div
      v-if="selectedPhotoIndex !== null && currentPhoto"
      @click="closePhoto"
      class="fixed inset-0 z-50 flex flex-col items-center justify-between bg-black/95 backdrop-blur-lg animate-in fade-in select-none"
    >
      <!-- Top Bar across full width -->
      <div
        class="relative z-50 flex w-full items-center justify-between px-3 py-3 sm:px-8 sm:py-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent"
        @click.stop
      >
        <div class="flex items-center gap-2 sm:gap-3">
          <span class="rounded-full bg-white/15 px-3 py-1 font-mono text-xs font-semibold text-white backdrop-blur-md">
            {{ (selectedPhotoIndex ?? 0) + 1 }} / {{ totalPhotos }}
          </span>
          <span class="hidden text-xs text-white/50 md:inline">
            (Desliza con el dedo o usa flechas ← →)
          </span>
        </div>

        <div class="flex items-center gap-2 sm:gap-3">
          <!-- Rotate Button -->
          <button
            type="button"
            @click="rotateCurrentPhoto"
            class="flex cursor-pointer items-center gap-1 rounded-xl bg-white/15 px-3 py-2 text-xs font-semibold text-white shadow-md backdrop-blur-md transition-all hover:bg-white/25 active:scale-95"
            title="Girar foto 90° (R)"
          >
            <RotateCw class="h-4 w-4" />
            <span class="hidden sm:inline">Girar</span>
          </button>

          <!-- Download Single Photo Button -->
          <button
            type="button"
            @click="downloadSinglePhoto(currentPhoto)"
            class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-pink px-3.5 py-2 text-xs font-bold text-white shadow-lg transition-all hover:bg-brand-brown active:scale-95"
            title="Descargar foto"
          >
            <Download class="h-4 w-4" />
            <span class="hidden sm:inline">Descargar</span>
          </button>

          <!-- Close Button -->
          <button
            type="button"
            @click="closePhoto"
            class="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white/15 text-white transition-all hover:bg-white/30 hover:scale-105 active:scale-95"
            title="Cerrar"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </div>

      <!-- Main Center Viewport with Touch Gestures -->
      <div
        class="relative flex h-full w-full items-center justify-center p-2 sm:p-8 overflow-hidden touch-pan-y"
        @touchstart="handleTouchStart"
        @touchend="handleTouchEnd"
        @click="closePhoto"
      >
        <!-- Previous Arrow Button (Fixed Left Edge) -->
        <button
          type="button"
          @click.stop="prevPhoto"
          :disabled="!hasPrev"
          :class="[
            'fixed left-2 sm:left-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-2xl backdrop-blur-md transition-all',
            hasPrev
              ? 'cursor-pointer bg-white/15 text-white hover:bg-white hover:text-brand-brown-dark active:scale-95'
              : 'pointer-events-none opacity-20 bg-white/5 text-white/30'
          ]"
          title="Foto anterior"
        >
          <ChevronLeft class="h-6 w-6 sm:h-8 sm:w-8" />
        </button>

        <!-- The Image itself (Rotatable & High Quality) -->
        <div class="relative flex items-center justify-center max-h-full max-w-full" @click.stop>
          <img
            :key="selectedPhotoIndex"
            :src="currentPhoto"
            alt="Foto ecografía"
            :style="{
              transform: `rotate(${currentRotation}deg)`,
              transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
            }"
            class="max-h-[75vh] sm:max-h-[80vh] max-w-[92vw] sm:max-w-[80vw] object-contain rounded-xl sm:rounded-2xl shadow-2xl"
          />
        </div>

        <!-- Next Arrow Button (Fixed Right Edge) -->
        <button
          type="button"
          @click.stop="nextPhoto"
          :disabled="!hasNext"
          :class="[
            'fixed right-2 sm:right-6 top-1/2 -translate-y-1/2 z-50 flex h-11 w-11 sm:h-14 sm:w-14 items-center justify-center rounded-full shadow-2xl backdrop-blur-md transition-all',
            hasNext
              ? 'cursor-pointer bg-white/15 text-white hover:bg-white hover:text-brand-brown-dark active:scale-95'
              : 'pointer-events-none opacity-20 bg-white/5 text-white/30'
          ]"
          title="Foto siguiente"
        >
          <ChevronRight class="h-6 w-6 sm:h-8 sm:w-8" />
        </button>
      </div>

      <!-- Bottom Status / Hint Bar -->
      <div class="relative z-40 pb-4 text-center" @click.stop>
        <p class="text-[11px] font-medium tracking-wide text-white/60">
          <span class="sm:hidden">👉 Desliza el dedo a la izquierda o derecha para pasar de foto</span>
          <span class="hidden sm:inline">Usa las flechas ← → para navegar · R para girar · Esc para salir</span>
        </p>
      </div>
    </div>
  </div>
</template>
