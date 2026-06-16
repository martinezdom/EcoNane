<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Calendar, Gift, Sparkles } from '@lucide/vue'
import type { Benefit } from '@/types'

const isAvisoOpen = ref(false)

const benefits: Benefit[] = [
  {
    icon: MapPin,
    title: 'Fácil Acceso',
    desc: 'Céntrico y bien comunicado'
  },
  {
    icon: Calendar,
    title: 'Cita Previa',
    desc: 'Atención personalizada sin esperas'
  },
  {
    icon: Gift,
    title: 'Regala Emociones',
    desc: 'Tarjetas de regalo disponibles'
  },
  {
    icon: Sparkles,
    title: 'Máxima Calidad',
    desc: 'Tecnología 3D, 4D y 5D de última generación'
  }
]
</script>

<template>
  <footer class="bg-brand-brown-dark text-brand-cream mt-auto">
    <div class="border-brand-cream/10 bg-brand-brown border-b py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-6 text-center md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="border-brand-cream/10 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-white/5 p-4 sm:flex-row"
          >
            <div
              class="bg-brand-cream/10 text-brand-cream flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            >
              <component :is="benefit.icon" class="h-5 w-5" />
            </div>
            <div class="text-center sm:text-left">
              <h4 class="font-serif text-sm leading-tight font-bold tracking-wide uppercase">
                {{ benefit.title }}
              </h4>
              <p class="text-brand-pink-light/80 mt-0.5 text-[11px] leading-none">
                {{ benefit.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        class="border-brand-cream/10 grid grid-cols-1 items-center gap-8 border-b pb-12 md:grid-cols-12"
      >
        <div class="text-center md:col-span-5 md:text-left">
          <div class="mb-4 flex items-center justify-center gap-2 md:justify-start">
            <svg
              class="text-brand-cream h-8 w-8"
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
            <span class="font-serif text-xl leading-none font-bold tracking-wider">ECONANE</span>
          </div>
          <p class="text-brand-pink-light/70 max-w-sm text-xs leading-relaxed">
            Tu clínica de confianza en ecografías 3D, 4D y 5D. Vive una experiencia única conectando
            emocionalmente con tu bebé antes de su llegada.
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-6 sm:gap-10 md:col-span-7 md:justify-end">
          <div class="flex gap-6">
            <a
              href="#inicio"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Inicio</a
            >
            <a
              href="#sobre-nosotros"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Sobre Nosotros</a
            >
            <a
              href="#ecografias"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Ecografías</a
            >
            <a
              href="#galeria"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Galería</a
            >
            <a
              href="#faq"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >FAQ</a
            >
            <a
              href="#contacto"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Contacto</a
            >
          </div>
        </div>
      </div>

      <div
        class="text-brand-pink-light/50 flex flex-col items-center justify-between gap-4 pt-8 text-xs sm:flex-row"
      >
        <p>
          © 2026 EcoNane. Todos los derechos reservados. Desarrollado por
          <a
            href="https://confitic.es"
            target="_blank"
            class="hover:text-brand-cream decoration-brand-pink-light/30 underline transition-colors"
            >ConfiTIC</a
          >.
        </p>
        <div class="flex gap-4">
          <button
            @click="isAvisoOpen = true"
            class="hover:text-brand-cream cursor-pointer transition-colors"
          >
            Aviso Legal
          </button>
          <a href="#" class="hover:text-brand-cream transition-colors">Política de Privacidad</a>
          <a href="#" class="hover:text-brand-cream transition-colors">Cookies</a>
        </div>
      </div>
    </div>

    <div v-if="isAvisoOpen" class="modal-overlay" @click.self="isAvisoOpen = false">
      <div class="modal-card text-brand-brown-dark flex flex-col gap-4">
        <div class="border-brand-pink-light/30 flex items-center justify-between border-b pb-4">
          <h3 class="text-brand-brown-dark font-serif text-xl font-bold">Aviso Legal</h3>
          <button
            @click="isAvisoOpen = false"
            class="text-brand-brown hover:text-brand-brown-dark cursor-pointer p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <p>
            En cumplimiento del deber de información, se hace constar que este sitio web es una
            presentación comercial para la clínica de ecografías EcoNane.
          </p>
          <p>
            El desarrollo técnico y diseño web ha sido realizado a cargo de
            <a
              href="https://martinezdom.github.io/"
              target="_blank"
              class="text-brand-pink font-semibold hover:underline"
              >Miguel Ángel Martínez Domínguez</a
            >, bajo la marca comercial
            <a
              href="https://confitic.es"
              target="_blank"
              class="text-brand-pink font-semibold hover:underline"
              >ConfiTIC</a
            >.
          </p>
          <p>
            Todos los derechos sobre los contenidos, imágenes y código fuente de esta página web
            están protegidos por la normativa de propiedad intelectual.
          </p>
        </div>
        <div class="mt-6 flex justify-end">
          <button @click="isAvisoOpen = false" class="btn-pill-small">Cerrar</button>
        </div>
      </div>
    </div>
  </footer>
</template>
