<script setup lang="ts">
import { Sparkles, Heart, ShieldCheck, Camera } from '@lucide/vue'
import type { Feature } from '@/types'

const features: Feature[] = [
  {
    icon: Sparkles,
    title: 'Imágenes de Alta Definición',
    description: 'Tecnología avanzada 3D, 4D y 5D para ver cada detalle de tu bebé con nitidez.'
  },
  {
    icon: Heart,
    title: 'Experiencia Emocional',
    description: 'Un momento único y entrañable para compartir y conectar con tu bebé en familia.'
  },
  {
    icon: ShieldCheck,
    title: 'Seguridad y Confianza',
    description:
      'Equipos seguros con ultrasonidos homologados y personal especializado en bienestar.'
  },
  {
    icon: Camera,
    title: 'Fotos y Vídeos Incluidos',
    description: 'Llévate recuerdos inolvidables en imágenes y vídeos digitales de alta calidad.'
  }
]
</script>

<template>
  <section class="bg-brand-cream/50 py-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
        <div
          v-for="feature in features"
          :key="feature.title"
          class="border-brand-pink-light/20 flex flex-col items-center rounded-3xl border bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
        >
          <div
            class="bg-brand-pink-light/40 text-brand-brown mb-5 flex h-14 w-14 items-center justify-center rounded-2xl"
          >
            <component :is="feature.icon" class="h-7 w-7" />
          </div>
          <h3 class="text-brand-brown-dark mb-3 font-serif text-lg font-bold">
            {{ feature.title }}
          </h3>
          <p class="text-brand-brown/70 text-sm leading-relaxed">
            {{ feature.description }}
          </p>
        </div>
      </div>
    </div>
  </section>
</template>
