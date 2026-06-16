<script setup>
import { Heart } from '@lucide/vue'
</script>

<template>
  <section id="inicio" class="bg-brand-cream relative overflow-hidden pt-28 pb-16">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="grid grid-cols-1 items-center gap-12 lg:grid-cols-12 lg:gap-8">
        <div
          class="flex flex-col items-center justify-center text-center lg:col-span-6 lg:items-start lg:text-left"
        >
          <div
            class="bg-brand-pink-light/35 border-brand-pink/20 text-brand-brown-dark mb-6 inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold tracking-wider uppercase"
          >
            <Heart class="fill-brand-pink text-brand-pink h-3 w-3" />
            Ecografías Emocionales
          </div>

          <h1
            class="text-brand-brown-dark mb-6 font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            Vive la magia de <br class="hidden sm:inline" />
            ver a tu bebé
            <span class="text-brand-pink mt-2 block font-serif font-light italic">3D, 4D y 5D</span>
          </h1>

          <p class="text-brand-brown/80 mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
            Imágenes de alta definición para que disfrutes de los primeros momentos de conexión con
            tu bebé en un ambiente cálido e inolvidable.
          </p>

          <div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <a
              href="https://wa.me/34600000000?text=Hola,%20quiero%20pedir%20cita%20para%20una%20ecografía%20en%20EcoNane."
              target="_blank"
              class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark inline-flex items-center justify-center rounded-full px-8 py-3.5 text-base font-semibold shadow-md transition-all duration-300 hover:shadow-lg"
            >
              Pide tu cita
            </a>
            <a
              href="https://wa.me/34600000000?text=Hola,%20tengo%20una%20consulta%20sobre%20las%20ecografías."
              target="_blank"
              class="border-brand-brown/30 text-brand-brown-dark hover:bg-brand-pink-light/20 inline-flex items-center justify-center rounded-full border bg-white/50 px-8 py-3.5 text-base font-semibold backdrop-blur-sm transition-all duration-300"
            >
              WhatsApp
            </a>
          </div>
        </div>

        <div class="relative flex items-center justify-center lg:col-span-6">
          <div class="relative w-full max-w-[450px] sm:max-w-[500px]">
            <div
              class="bg-brand-beige ml-auto aspect-square w-[85%] overflow-hidden rounded-tl-[40px] rounded-tr-[120px] rounded-br-[40px] rounded-bl-[120px] border-[6px] border-white shadow-xl"
            >
              <img
                src="/hero-woman.png"
                alt="Madre embarazada"
                class="h-full w-full object-cover"
              />
            </div>

            <div
              class="absolute bottom-4 left-0 aspect-square w-[55%] overflow-hidden rounded-full border-[6px] border-white bg-black shadow-2xl"
            >
              <img
                src="/ultrasound-baby.png"
                alt="Ecografía 3D de bebé"
                class="h-full w-full object-cover"
              />
            </div>

            <div
              class="bg-brand-pink-light absolute bottom-[40%] left-[2%] flex max-w-[130px] -rotate-6 transform flex-col items-center justify-center rounded-full border border-white px-4 py-2.5 text-center shadow-lg"
            >
              <span
                class="text-brand-brown text-[10px] leading-none font-bold tracking-wider uppercase"
                >Recuerdos</span
              >
              <span class="text-brand-brown-dark mt-1 text-[8px] leading-none font-medium"
                >que duran para siempre</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
