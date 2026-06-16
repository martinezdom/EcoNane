<script setup lang="ts">
import { Heart } from '@lucide/vue'

const galleryImages: string[] = [
  '/ultrasound-baby.png',
  '/ultrasound-baby.png',
  '/ultrasound-baby.png',
  '/ultrasound-baby.png',
  '/ultrasound-baby.png',
  '/ultrasound-baby.png'
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
              Sobre Nosotros
            </div>
            <h2 class="text-brand-brown-dark mb-4 font-serif text-3xl font-bold sm:text-4xl">
              Cuidamos cada detalle para ti y tu bebé
            </h2>
            <p class="text-brand-brown/80 mb-6 text-sm leading-relaxed sm:text-base">
              En EcoNane te ofrecemos una experiencia cercana, profesional y emocionante en un
              entorno pensado para tu comodidad y bienestar. Contamos con tecnología de vanguardia y
              un equipo humano que te guiará en este viaje emocional.
            </p>
            <a
              href="https://wa.me/34600000000?text=Hola,%20quiero%20conocer%20más%20sobre%20EcoNane%20y%20vuestras%20instalaciones."
              target="_blank"
              class="btn-pill-small mb-8"
            >
              Conócenos
            </a>
          </div>

          <div
            class="border-brand-pink-light/10 aspect-16/10 overflow-hidden rounded-2xl border shadow-inner"
          >
            <img
              src="/clinic-room.png"
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
              Galería
            </div>
            <h2 class="text-brand-brown-dark mb-6 font-serif text-3xl font-bold sm:text-4xl">
              Momentos que enamoran
            </h2>

            <div class="mb-8 grid grid-cols-3 gap-4">
              <div
                v-for="(img, idx) in galleryImages"
                :key="idx"
                class="bg-brand-beige aspect-square overflow-hidden rounded-xl border-2 border-white shadow-sm transition-all duration-300 hover:scale-105 hover:shadow-md"
              >
                <img :src="img" alt="Galería Ecografía" class="h-full w-full object-cover" />
              </div>
            </div>
          </div>

          <a
            href="https://wa.me/34600000000?text=Hola,%20me%20gustaría%20ver%20más%20fotos%20de%20ecografías%20reales."
            target="_blank"
            class="btn-outline w-full py-3 text-sm"
          >
            Ver Galería Completa
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
