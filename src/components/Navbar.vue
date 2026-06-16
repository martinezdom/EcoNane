<script setup lang="ts">
import { ref } from 'vue'

const isOpen = ref(false)
const navItems = [
  { name: 'Inicio', href: '#inicio' },
  { name: 'Sobre Nosotros', href: '#sobre-nosotros' },
  { name: 'Ecografías', href: '#ecografias' },
  { name: 'Galería', href: '#galeria' },
  { name: 'Preguntas Frecuentes', href: '#faq' },
  { name: 'Contacto', href: '#contacto' }
]
</script>

<template>
  <nav
    class="bg-brand-cream/80 fixed inset-x-0 top-0 z-50 backdrop-blur-md transition-all duration-300"
  >
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex h-20 items-center justify-between">
        <div class="flex items-center gap-3">
          <a href="#inicio" class="flex items-center gap-2">
            <svg
              class="text-brand-brown h-10 w-10"
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                stroke="currentColor"
                stroke-width="2.5"
                class="opacity-30"
              />
              <path
                d="M42 38C42 32 46 28 50 28C54 28 58 32 58 38C58 42 55 45 52 48C49 51 46 54 46 58"
                stroke="currentColor"
                stroke-width="3"
                stroke-linecap="round"
              />
              <path d="M48 68C48 65 52 65 52 68C52 71 48 71 48 68Z" fill="currentColor" />
              <path
                d="M30 50C30 61 39 70 50 70C61 70 70 61 70 50C70 39 61 30 50 30"
                stroke="currentColor"
                stroke-width="1.5"
                stroke-dasharray="4 4"
              />
            </svg>
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

        <div class="hidden items-center gap-8 lg:flex">
          <div class="flex gap-6">
            <a
              v-for="item in navItems"
              :key="item.name"
              :href="item.href"
              class="text-brand-brown-dark/80 hover:text-brand-brown text-sm font-medium transition-colors duration-200"
            >
              {{ item.name }}
            </a>
          </div>
          <a
            href="https://wa.me/34600000000?text=Hola,%20quiero%20pedir%20cita%20para%20una%20ecografía%20en%20EcoNane."
            target="_blank"
            class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark inline-flex items-center justify-center rounded-full px-6 py-2.5 text-sm font-medium shadow-md transition-all duration-300 hover:shadow-lg"
          >
            Pide tu cita
          </a>
        </div>

        <div class="flex lg:hidden">
          <button
            @click="isOpen = !isOpen"
            type="button"
            class="text-brand-brown hover:bg-brand-pink-light/20 inline-flex items-center justify-center rounded-md p-2 transition-colors"
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

    <div
      v-show="isOpen"
      class="bg-brand-cream border-brand-pink-light/25 border-t shadow-inner lg:hidden"
    >
      <div class="space-y-1 px-4 py-4">
        <a
          v-for="item in navItems"
          :key="item.name"
          :href="item.href"
          @click="isOpen = false"
          class="text-brand-brown-dark hover:bg-brand-pink-light/20 block rounded-md px-3 py-2 text-base font-medium transition-colors"
        >
          {{ item.name }}
        </a>
        <div class="border-brand-pink-light/20 border-t pt-4">
          <a
            href="https://wa.me/34600000000?text=Hola,%20quiero%20pedir%20cita%20para%20una%20ecografía%20en%20EcoNane."
            target="_blank"
            class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark flex w-full items-center justify-center rounded-full py-3 text-center text-base font-medium transition-all duration-300"
          >
            Pide tu cita
          </a>
        </div>
      </div>
    </div>
  </nav>
</template>
