<script setup lang="ts">
import { Heart } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const galleryImages: string[] = [
  '/gallery-1.webp',
  '/gallery-2.webp',
  '/gallery-3.webp',
  '/gallery-4.webp',
  '/gallery-5.webp',
  '/gallery-6.webp'
]
</script>

<template>
  <section id="sobre-nosotros" class="bg-brand-cream/30 py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
        <div class="card-container flex flex-col justify-between lg:col-span-6">
          <div>
            <div
              class="text-brand-pink mb-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
            >
              <Heart class="fill-brand-pink text-brand-pink h-3.5 w-3.5" />
              {{ t('about.tag', 'Nuestra Esencia') }}
            </div>
            <h2 class="text-brand-brown-dark mb-4 font-serif text-3xl font-bold sm:text-4xl">
              {{ t('about.title', 'Te acompañamos en el momento más bonito de tu vida') }}
            </h2>
            <p class="text-brand-brown/80 mb-4 text-sm leading-relaxed sm:text-base">
              {{ t('about.p1', 'En EcoNane te ofrecemos una experiencia cercana, profesional y emocionante en un entorno pensado para tu comodidad y bienestar.') }}
            </p>
            <p class="text-brand-brown/80 mb-6 text-sm leading-relaxed sm:text-base">
              {{ t('about.p2', 'Con la mejor tecnología 5D y unas gafas de realidad virtual pioneras en la zona, cuidamos cada segundo para que guardes en el corazón el recuerdo más dulce de tu embarazo.') }}
            </p>
            <a
              href="https://wa.me/34644189856?text=Hola,%20quiero%20conocer%20más%20sobre%20EcoNane%20y%20vuestras%20instalaciones."
              target="_blank"
              class="btn-pill-small mb-6 inline-flex"
            >
              Conócenos
            </a>
          </div>

          <div
            class="border-brand-pink-light/10 aspect-16/9 overflow-hidden rounded-2xl border shadow-inner"
          >
            <img
              src="/clinic-room.webp"
              alt="Instalaciones EcoNane"
              class="h-full w-full object-cover"
            />
          </div>
        </div>

        <div id="galeria" class="card-container flex flex-col justify-between lg:col-span-6">
          <div>
            <div
              class="text-brand-pink mb-4 inline-flex items-center gap-1.5 text-xs font-semibold tracking-wider uppercase"
            >
              <Heart class="fill-brand-pink text-brand-pink h-3.5 w-3.5" />
              {{ t('gallery.tag', 'Galería de Momentos') }}
            </div>
            <h2 class="text-brand-brown-dark mb-4 font-serif text-3xl font-bold sm:text-4xl">
              {{ t('gallery.title', 'La emoción que se siente') }}
            </h2>
            <p class="text-brand-brown/80 mb-6 text-sm leading-relaxed sm:text-base">
              {{ t('gallery.subtitle', 'Sonrisas, bostezos y miradas que enamoran desde el primer instante en nuestra sala de Villajoyosa.') }}
            </p>

            <div class="grid grid-cols-3 gap-3.5 sm:gap-4">
              <div
                v-for="(img, idx) in galleryImages"
                :key="idx"
                class="bg-brand-beige aspect-[4/5] overflow-hidden rounded-2xl border-2 border-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <img :src="img" alt="Galería Ecografía" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/34644189856?text=Hola,%20me%20gustaría%20ver%20más%20fotos%20de%20ecografías%20reales."
            target="_blank"
            class="btn-outline mt-6 w-full py-3.5 text-sm"
          >
            Ver Galería Completa
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
