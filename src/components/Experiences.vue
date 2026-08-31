<script setup lang="ts">
import { Check, Clock, Heart, Sparkles, Gift } from '@lucide/vue'
import type { Experience, Pack } from '@/types'

const experiences: Experience[] = [
  {
    title: 'Eco Básica 4D/5D',
    duration: 'Sesión de 30-45 min',
    price: '45€',
    description: 'Visualiza a tu bebé en 4D/5D, escucha su latido y llévate recuerdos inolvidables.',
    features: [
      'Visualización 4D/5D',
      'Fotos y vídeos digitales',
      'Latido del corazón',
      'Acompañantes incluidos'
    ],
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20Básica%204D/5D%20(45€).'
  },
  {
    title: 'Eco para Conocer el Sexo',
    duration: 'Sesión rápida de 15 min',
    price: '30€',
    description: 'Confirmamos el sexo de tu bebé de forma segura, íntima y especial.',
    features: [
      'Confirmación del sexo',
      'Fotos digitales',
      'Latido del corazón',
      'Acompañantes incluidos'
    ],
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20para%20Conocer%20el%20Sexo%20(30€).'
  },
  {
    title: 'Eco + Revelación de Sexo',
    duration: 'Sesión especial en familia',
    price: '70€',
    description: 'Vive uno de los momentos más bonitos y emocionantes junto a tu familia.',
    features: [
      'Eco 4D/5D',
      'Revelación con globo',
      'Pequeño regalo',
      'Fotos y vídeos digitales'
    ],
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20+%20Revelación%20de%20Sexo%20(70€).'
  },
  {
    title: 'Experiencia Gafas Virtuales + Eco 4D/5D',
    duration: 'Sesión inmersiva VR',
    price: '75€',
    badge: '4D/5D VR',
    description: 'Siente a tu bebé como nunca antes con nuestra experiencia inmersiva con gafas virtuales.',
    features: [
      'Eco 4D/5D en directo',
      'Experiencia con gafas VR',
      'Fotos y vídeos digitales',
      'Acompañantes incluidos'
    ],
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Experiencia%20Gafas%20Virtuales%20+%20Eco%204D/5D%20(75€).'
  }
]

const packs: Pack[] = [
  {
    title: 'Pack 2 Ecos',
    price: '80€',
    save: 'Ahorra 10€',
    description: '2 sesiones para seguir cada etapa de tu embarazo y revivir la emoción.',
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20reservar%20el%20Pack%202%20Ecos%20(80€).'
  },
  {
    title: 'Pack 3 Ecos',
    price: '115€',
    save: 'Ahorra 20€',
    description: '3 momentos únicos para recordar la evolución completa para siempre.',
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20reservar%20el%20Pack%203%20Ecos%20(115€).'
  }
]

const generalIncludes = [
  'Espacio cálido y acogedor',
  'Acompañantes incluidos',
  'Fotos y vídeos digitales',
  'Recuerdo del latido',
  'Atención personalizada'
]
</script>

<template>
  <section id="ecografias" class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mx-auto mb-16 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase"
          >Nuestras Experiencias</span
        >
        <h2
          class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl"
        >
          Vive cada latido, guarda cada emoción
        </h2>
        <p class="text-brand-brown/75 mt-4 text-sm sm:text-base leading-relaxed">
          Sesiones de ecografías 4D y 5D en Villajoyosa con la última tecnología y un entorno pensado para ti y tu familia.
        </p>
      </div>

      <!-- Experiences Grid -->
      <div class="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4 items-stretch">
        <div
          v-for="exp in experiences"
          :key="exp.title"
          class="bg-brand-cream/40 border-brand-pink-light/30 group relative flex flex-col justify-between overflow-hidden rounded-3xl border p-7 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:border-brand-pink/50"
        >
          <div
            v-if="exp.badge"
            class="bg-brand-pink text-brand-cream absolute top-4 right-4 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider uppercase shadow-sm"
          >
            {{ exp.badge }}
          </div>

          <div>
            <div class="mb-4">
              <span
                v-if="exp.duration"
                class="text-brand-pink inline-flex items-center gap-1.5 text-xs font-semibold"
              >
                <Clock class="h-3.5 w-3.5" />
                {{ exp.duration }}
              </span>
              <h3 class="text-brand-brown-dark mt-1 font-serif text-xl font-bold leading-tight">
                {{ exp.title }}
              </h3>
            </div>

            <div class="mb-5 flex items-baseline gap-1">
              <span class="text-brand-brown-dark font-serif text-4xl font-extrabold tracking-tight">
                {{ exp.price }}
              </span>
            </div>

            <p class="text-brand-brown/80 mb-6 text-xs leading-relaxed sm:text-sm">
              {{ exp.description }}
            </p>

            <!-- Features List -->
            <ul class="mb-6 space-y-2.5 border-t border-brand-pink-light/30 pt-4 text-xs sm:text-sm text-brand-brown-dark">
              <li
                v-for="(feat, fIdx) in exp.features"
                :key="fIdx"
                class="flex items-center gap-2"
              >
                <Check class="h-4 w-4 shrink-0 text-brand-pink" />
                <span class="text-brand-brown/90">{{ feat }}</span>
              </li>
            </ul>
          </div>

          <div class="pt-2">
            <a
              :href="exp.link"
              target="_blank"
              class="btn-primary w-full text-center text-xs sm:text-sm font-bold py-3"
            >
              Pedir cita
            </a>
          </div>
        </div>
      </div>

      <!-- Packs Especiales -->
      <div class="mt-16">
        <div class="mb-8 text-center">
          <span class="text-brand-pink inline-flex items-center gap-1.5 text-xs font-semibold tracking-widest uppercase">
            <Heart class="h-3.5 w-3.5 fill-brand-pink" />
            Packs Especiales
          </span>
          <h3 class="text-brand-brown-dark mt-1 font-serif text-2xl font-bold sm:text-3xl">
            Acompaña cada etapa de tu embarazo
          </h3>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-2 max-w-4xl mx-auto">
          <div
            v-for="pack in packs"
            :key="pack.title"
            class="card-container relative flex flex-col justify-between p-8 border-brand-pink-light/40 bg-brand-cream/30 hover:border-brand-pink/60 transition-all duration-300 shadow-sm hover:shadow-lg"
          >
            <div class="bg-brand-pink/15 text-brand-brown-dark border border-brand-pink/30 absolute top-5 right-5 rounded-full px-3 py-1 text-xs font-bold uppercase">
              {{ pack.save }}
            </div>

            <div>
              <span class="text-brand-pink text-xs font-semibold uppercase tracking-wider">Pack Ahorro</span>
              <h4 class="text-brand-brown-dark mt-1 font-serif text-2xl font-bold">
                {{ pack.title }}
              </h4>

              <div class="my-4 flex items-baseline gap-1">
                <span class="text-brand-brown-dark font-serif text-4xl font-extrabold">
                  {{ pack.price }}
                </span>
              </div>

              <p class="text-brand-brown/80 mb-6 text-sm leading-relaxed">
                {{ pack.description }}
              </p>
            </div>

            <a
              :href="pack.link"
              target="_blank"
              class="btn-secondary w-full text-center text-sm font-bold py-3"
            >
              Reservar este pack
            </a>
          </div>
        </div>
      </div>

      <!-- Qué incluye siempre -->
      <div class="mt-16 rounded-3xl bg-brand-cream/80 border border-brand-pink-light/30 p-8 sm:p-10 shadow-sm max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="text-center md:text-left max-w-md">
            <span class="text-brand-pink text-xs font-bold tracking-wider uppercase">Garantía EcoNane</span>
            <h4 class="text-brand-brown-dark mt-1 font-serif text-xl sm:text-2xl font-bold">
              Incluye en todas nuestras sesiones
            </h4>
            <p class="text-brand-brown/75 mt-2 text-xs sm:text-sm">
              Queremos que tu experiencia sea inolvidable desde el primer minuto.
            </p>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full md:w-auto">
            <div
              v-for="(item, iIdx) in generalIncludes"
              :key="iIdx"
              class="flex items-center gap-2.5 bg-white/80 border border-brand-pink-light/30 rounded-xl px-4 py-2.5 shadow-2xs"
            >
              <Heart class="h-4 w-4 text-brand-pink fill-brand-pink shrink-0" />
              <span class="text-xs sm:text-sm font-semibold text-brand-brown-dark">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

