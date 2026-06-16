<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import type { FAQ } from '@/types'

const faqs: FAQ[] = [
  {
    question: '¿Cuál es la mejor semana para hacerse una ecografía 5D?',
    answer:
      'La mejor etapa es entre las semanas 24 y 30 de embarazo, ya que el bebé está completamente formado y cuenta con suficiente líquido amniótico para obtener una imagen nítida.'
  },
  {
    question: '¿Pueden venir acompañantes a la sesión?',
    answer:
      '¡Por supuesto! Animamos a que vengas acompañada de tu pareja, familiares o amigos más cercanos. Disponemos de una sala amplia y cómoda para que todos disfruten del momento.'
  },
  {
    question: '¿Qué ocurre si el bebé no se deja ver?',
    answer:
      'Si el bebé está en una posición difícil y no podemos obtener imágenes claras, no te preocupes. Repetiremos la sesión en otro momento sin ningún coste adicional para ti.'
  },
  {
    question: '¿Es seguro el ultrasonido para mi bebé?',
    answer:
      'Sí, es 100% seguro. Los equipos utilizados emiten ultrasonidos de baja intensidad homologados y certificados por las normativas de salud materno-fetal vigentes.'
  }
]

const activeIndex = ref<number | null>(null)

const toggleFaq = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index
}
</script>

<template>
  <section id="faq" class="bg-white py-20">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="mb-16 text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase"
          >Preguntas Frecuentes</span
        >
        <h2 class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl">
          Resolvemos tus dudas
        </h2>
      </div>

      <div class="space-y-4">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="border-brand-pink-light/30 bg-brand-cream/10 hover:bg-brand-cream/30 overflow-hidden rounded-2xl border transition-all duration-300"
        >
          <button
            @click="toggleFaq(idx)"
            class="flex w-full items-center justify-between p-6 text-left focus:outline-none"
          >
            <span class="text-brand-brown-dark font-serif text-base font-bold sm:text-lg">
              {{ faq.question }}
            </span>
            <ChevronDown
              class="text-brand-brown h-5 w-5 shrink-0 transition-transform duration-300"
              :class="{ 'rotate-180': activeIndex === idx }"
            />
          </button>

          <div
            v-show="activeIndex === idx"
            class="text-brand-brown/85 px-6 pb-6 text-sm leading-relaxed sm:text-base"
          >
            {{ faq.answer }}
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
