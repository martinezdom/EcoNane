<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useI18n } from '@/composables/useI18n'
import { Globe } from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { t, currentLanguage, setLanguage } = useI18n()

const isOpen = ref(false)

const navItems = computed(() => [
  { name: t('nav.home'), href: '#inicio' },
  { name: t('nav.about'), href: '#sobre-nosotros' },
  { name: t('nav.experiences'), href: '#ecografias' },
  { name: t('nav.gallery'), href: '#galeria' },
  { name: t('nav.faq'), href: '#faq' },
  { name: t('nav.contact'), href: '#contacto' }
])

function navigateToSection(href: string) {
  isOpen.value = false
  if (route.path !== '/') {
    router.push('/' + href)
    return
  }

  const targetId = href.replace(/^#/, '')
  const el = document.getElementById(targetId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (window.history.pushState) {
      window.history.pushState(null, '', href)
    }
  }
}

function toggleLanguage() {
  const next = currentLanguage.value === 'es' ? 'en' : 'es'
  setLanguage(next)
}
</script>

<template>
  <nav
    class="bg-brand-cream/85 fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-all duration-300 border-b border-brand-pink-light/20"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <a
            href="#inicio"
            @click.prevent="navigateToSection('#inicio')"
            class="group flex items-center gap-3"
          >
            <img
              src="/logo.webp"
              alt="Logo EcoNane"
              class="border-brand-pink/30 shadow-xs h-12 w-12 rounded-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div class="flex flex-col">
              <span
                class="text-brand-brown-dark font-serif text-lg leading-none font-bold tracking-wider"
                >ECONANE</span
              >
              <span
                class="text-brand-pink mt-1 text-[9px] leading-none font-semibold tracking-widest uppercase"
                >Ecografías Emocionales</span
              >
            </div>
          </a>
        </div>

        <!-- Desktop Navigation -->
        <div class="hidden items-center gap-6 lg:flex">
          <div class="flex items-center gap-5">
            <a
              v-for="item in navItems"
              :key="item.href"
              :href="item.href"
              @click.prevent="navigateToSection(item.href)"
              class="text-brand-brown-dark/80 hover:text-brand-brown text-sm font-medium transition-colors duration-200 cursor-pointer"
            >
              {{ item.name }}
            </a>
          </div>

          <!-- Language Switcher Pill -->
          <button
            @click="toggleLanguage"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-full border border-brand-pink-light/60 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30 hover:border-brand-pink cursor-pointer"
            :title="currentLanguage === 'es' ? 'Switch to English' : 'Cambiar a Español'"
          >
            <Globe class="h-3.5 w-3.5 text-brand-pink" />
            <span :class="currentLanguage === 'es' ? 'text-brand-brown font-extrabold' : 'text-gray-400'">ES</span>
            <span class="text-gray-300 text-[10px]">|</span>
            <span :class="currentLanguage === 'en' ? 'text-brand-brown font-extrabold' : 'text-gray-400'">EN</span>
          </button>

          <!-- Book Appointment Button -->
          <a
            href="#contacto"
            @click.prevent="navigateToSection('#contacto')"
            class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg cursor-pointer"
          >
            {{ t('nav.bookAppointment') }}
          </a>
        </div>

        <!-- Mobile Menu & Lang Toggle -->
        <div class="flex items-center gap-2 lg:hidden">
          <button
            @click="toggleLanguage"
            type="button"
            class="inline-flex items-center gap-1 rounded-full border border-brand-pink-light/50 bg-white/70 px-2.5 py-1 text-xs font-bold text-brand-brown-dark"
          >
            <Globe class="h-3 w-3 text-brand-pink" />
            <span>{{ currentLanguage.toUpperCase() }}</span>
          </button>

          <button
            @click="isOpen = !isOpen"
            type="button"
            class="text-brand-brown hover:bg-brand-pink-light/20 inline-flex items-center justify-center rounded-md p-2 transition-colors cursor-pointer"
            aria-label="Abrir menú"
          >
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                v-if="!isOpen"
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M4 6h16M4 12h16M4 18h16"
              />
              <path
                v-else
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Mobile Dropdown -->
    <div
      v-show="isOpen"
      class="bg-brand-cream border-brand-pink-light/25 border-t shadow-inner lg:hidden"
    >
      <div class="space-y-1 px-4 py-4">
        <a
          v-for="item in navItems"
          :key="item.href"
          :href="item.href"
          @click.prevent="navigateToSection(item.href)"
          class="text-brand-brown-dark hover:bg-brand-pink-light/20 block rounded-md px-3 py-2 text-base font-medium transition-colors cursor-pointer"
        >
          {{ item.name }}
        </a>
        <div class="border-brand-pink-light/20 border-t pt-4">
          <a
            href="#contacto"
            @click.prevent="navigateToSection('#contacto')"
            class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark flex w-full items-center justify-center rounded-full py-3 text-center text-base font-medium transition-all duration-300 cursor-pointer"
          >
            {{ t('nav.bookAppointment') }}
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>
