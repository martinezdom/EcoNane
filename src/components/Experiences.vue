<script setup lang="ts">
import type { Experience } from '@/types'

const experiences: Experience[] = [
  {
    title: 'Ecografía 3D',
    description:
      'Imágenes estáticas en tres dimensiones con gran nitidez y detalle para un primer recuerdo real.',
    image: '/ultrasound-baby.png',
    link: 'https://wa.me/34600000000?text=Hola,%20quiero%20más%20información%20sobre%20la%20Ecografía%203D.'
  },
  {
    title: 'Ecografía 4D',
    description:
      'Imágenes en movimiento en tiempo real para ver los gestos, bostezos y sonrisas de tu bebé.',
    image: '/ultrasound-baby.png',
    link: 'https://wa.me/34600000000?text=Hola,%20quiero%20más%20información%20sobre%20la%20Ecografía%204D.'
  },
  {
    title: 'Ecografía 5D',
    description:
      'La máxima definición y realismo del tono de piel para una experiencia aún más cercana y emocionante.',
    image: '/ultrasound-baby.png',
    link: 'https://wa.me/34600000000?text=Hola,%20quiero%20más%20información%20sobre%20la%20Ecografía%205D.'
  },
  {
    title: 'Pack Recuerdos',
    description:
      'Incluye reportaje de fotos, vídeos de la sesión y recuerdos impresos para guardar toda la vida.',
    image: '/hero-woman.png',
    link: 'https://wa.me/34600000000?text=Hola,%20quiero%20más%20información%20sobre%20el%20Pack%20Recuerdos.'
  }
]
</script>

<template>
  <section id="ecografias" class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase"
          >Nuestras Ecografías</span
        >
        <h2
          class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl"
        >
          Elige tu experiencia
        </h2>
      </div>

      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="exp in experiences"
          :key="exp.title"
          class="bg-brand-cream/40 border-brand-pink-light/10 group flex flex-col overflow-hidden rounded-3xl border shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
        >
          <div class="bg-brand-beige relative aspect-4/3 overflow-hidden">
            <img
              :src="exp.image"
              :alt="exp.title"
              class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div
              class="from-brand-brown-dark/20 absolute inset-0 bg-linear-to-t to-transparent"
            ></div>
          </div>
          <div class="flex grow flex-col p-6">
            <h3 class="text-brand-brown-dark mb-3 font-serif text-xl font-bold">
              {{ exp.title }}
            </h3>
            <p class="text-brand-brown/75 mb-6 grow text-sm leading-relaxed">
              {{ exp.description }}
            </p>
            <a :href="exp.link" target="_blank" class="btn-outline w-full"> Más información </a>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
