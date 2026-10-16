<script setup lang="ts">
import { ref, computed } from 'vue'
import { ChevronDown, MessageCircle, Calendar } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const activeIndex = ref<number | null>(0)

const faqs = computed(() => [
  {
    question: t('faq.q1', '¿En qué semana de embarazo es mejor realizar la ecografía 5D?'),
    answer: t('faq.a1', 'Se puede realizar a partir de la semana 12 para conocer el sexo o escuchar latidos, pero las mejores semanas para apreciar la carita y facciones con gran realismo suelen ser entre la 24 y la 30.')
  },
  {
    question: t('faq.q2', '¿Qué ocurre si mi bebé no se deja ver el día de la cita?'),
    answer: t('faq.a2', '¡No te preocupes en absoluto! En EcoNane disponemos de Garantía de Repetición: si el bebé está de espaldas o tapándose la carita, pausamos o reprogramamos la sesión sin coste para que te lleves las mejores imágenes.')
  },
  {
    question: t('faq.q3', '¿Pueden venir familiares o niños conmigo a la sesión?'),
    answer: t('faq.a3', '¡Por supuesto! Nuestras instalaciones están adaptadas con pantalla gigante y sofás cómodos para que vengas acompañada de toda la familia.')
  },
  {
    question: t('faq.q4', '¿Cómo funcionan los packs combinados de ecografía y fotografía?'),
    answer: t('faq.a4', 'En colaboración con Penélope Photograph, realizamos la ecografía y la sesión de fotos el mismo día (generalmente los viernes). Pagas cómodamente un único importe en el centro y Penélope te entrega las fotos digitales profesionales.')
  }
])

const toggleFaq = (index: number) => {
  activeIndex.value = activeIndex.value === index ? null : index
}

function scrollToBooking() {
  const el = document.getElementById('contacto')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <section id="faq" class="bg-white py-20">
    <div class="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
      <div class="mb-14 text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase">
          {{ t('faq.tag') }}
        </span>
        <h2 class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl">
          {{ t('faq.title') }}
        </h2>
        <p class="text-brand-brown/75 mt-3 text-sm sm:text-base leading-relaxed">
          {{ t('faq.subtitle') }}
        </p>
      </div>

      <div class="space-y-4">
        <div
          v-for="(faq, idx) in faqs"
          :key="idx"
          class="border-brand-pink-light/30 bg-brand-cream/15 hover:bg-brand-cream/35 overflow-hidden rounded-2xl border transition-all duration-300"
        >
          <button
            @click="toggleFaq(idx)"
            class="flex w-full items-center justify-between p-6 text-left focus:outline-none cursor-pointer"
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

      <!-- Quick Action Box at bottom of FAQ -->
      <div class="mt-12 rounded-3xl bg-brand-cream/60 border border-brand-pink-light/30 p-6 text-center flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="text-center sm:text-left">
          <h4 class="font-bold text-sm text-brand-brown-dark">¿Tienes alguna pregunta especial?</h4>
          <p class="text-xs text-brand-brown/70 mt-0.5">Estamos encantados de atenderte y resolver cualquier duda.</p>
        </div>
        <div class="flex items-center gap-3">
          <a
            href="https://wa.me/34644189856"
            target="_blank"
            class="btn-secondary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5"
          >
            <MessageCircle class="h-4 w-4 text-emerald-600" />
            WhatsApp
          </a>
          <button
            @click="scrollToBooking"
            type="button"
            class="btn-primary py-2.5 px-4 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Calendar class="h-4 w-4" />
            Pide tu cita
          </button>
        </div>
      </div>
    </div>
  </section>
</template>
