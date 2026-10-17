<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { Cookie } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()
const isVisible = ref(false)

function handleShowBanner() {
  isVisible.value = true
}

onMounted(() => {
  try {
    const saved = localStorage.getItem('econane_cookie_consent')
    if (!saved) {
      setTimeout(() => {
        isVisible.value = true
      }, 600)
    }
  } catch (e) {
    // LocalStorage inaccessible
  }

  window.addEventListener('show-cookie-banner', handleShowBanner)
})

onUnmounted(() => {
  window.removeEventListener('show-cookie-banner', handleShowBanner)
})

function acceptAll() {
  try {
    localStorage.setItem('econane_cookie_consent', 'accepted')
  } catch (e) {}

  const win = window as any
  if (typeof win.gtag === 'function') {
    win.gtag('consent', 'update', {
      analytics_storage: 'granted',
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted'
    })
    win.gtag('event', 'page_view', {
      page_title: document.title,
      page_location: window.location.href,
      page_path: window.location.pathname
    })
  }
  if (Array.isArray(win.dataLayer)) {
    win.dataLayer.push({ event: 'consent_accepted' })
  }

  isVisible.value = false
}

function rejectNonEssential() {
  try {
    localStorage.setItem('econane_cookie_consent', 'rejected')
  } catch (e) {}

  const win = window as any
  if (typeof win.gtag === 'function') {
    win.gtag('consent', 'update', {
      analytics_storage: 'denied',
      ad_storage: 'denied',
      ad_user_data: 'denied',
      ad_personalization: 'denied'
    })
  }

  isVisible.value = false
}

function openPolicy() {
  window.dispatchEvent(new CustomEvent('open-cookies-modal'))
}
</script>

<template>
  <Transition
    enter-active-class="transition duration-300 ease-out"
    enter-from-class="opacity-0 translate-y-4"
    enter-to-class="opacity-100 translate-y-0"
    leave-active-class="transition duration-200 ease-in"
    leave-from-class="opacity-100 translate-y-0"
    leave-to-class="opacity-0 translate-y-4"
  >
    <div
      v-if="isVisible"
      class="fixed bottom-4 inset-x-4 sm:inset-x-auto sm:right-6 sm:max-w-md z-50 rounded-2xl bg-white/95 backdrop-blur-md p-5 shadow-2xl border border-brand-pink-light/40"
      role="dialog"
      aria-live="polite"
    >
      <div class="flex items-start gap-3">
        <div class="rounded-xl bg-brand-pink-light/30 p-2 text-brand-pink shrink-0">
          <Cookie class="h-5 w-5" />
        </div>
        <div class="flex-1">
          <h4 class="font-serif text-sm font-bold text-brand-brown-dark flex items-center gap-1.5">
            {{ t('cookieBanner.title', 'COOKIES') }}
          </h4>
          <p class="mt-1.5 text-xs leading-relaxed text-brand-brown/85">
            <strong class="font-bold text-brand-brown-dark">EcoNane</strong>
            {{ ' ' }}
            {{ t('cookieBanner.description', 'utiliza cookies propias para garantizar una navegación segura y personalizar el contenido según tus necesidades. También utilizamos cookies de terceros para analizar tus hábitos de navegación en la web (por ejemplo, páginas visitadas).') }}
            <button
              @click="openPolicy"
              type="button"
              class="text-brand-pink font-semibold underline hover:text-brand-brown ml-1 cursor-pointer"
            >
              {{ t('cookieBanner.moreInfo', 'Más información en nuestra Política de cookies.') }}
            </button>
          </p>

          <div class="mt-4 flex flex-wrap items-center gap-2">
            <button
              @click="acceptAll"
              type="button"
              class="btn-pink px-4 py-2 text-xs font-bold rounded-full cursor-pointer shadow-xs"
            >
              {{ t('cookieBanner.accept', 'Aceptar todas') }}
            </button>
            <button
              @click="rejectNonEssential"
              type="button"
              class="rounded-full border border-brand-brown/20 bg-white px-3.5 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-cream/50 transition-colors cursor-pointer"
            >
              {{ t('cookieBanner.reject', 'Solo necesarias') }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>
