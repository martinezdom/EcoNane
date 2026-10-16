<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles, Heart, ShieldCheck, Camera } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

const features = computed(() => [
  {
    icon: Sparkles,
    title: t('features.items.vr.title', 'Gafas de Realidad Virtual VR'),
    description: t('features.items.vr.description', 'Pioneros en la Marina Baixa: sumérgete en una experiencia inmersiva única sintiendo a tu bebé más cerca que nunca.')
  },
  {
    icon: Heart,
    title: t('features.items.repetition.title', 'Garantía de Repetición'),
    description: t('features.items.repetition.description', '¿Tu bebé se esconde o no se deja ver? Repetimos la sesión sin ningún coste adicional para que te vayas con el mejor recuerdo.')
  },
  {
    icon: ShieldCheck,
    title: t('features.items.companions.title', 'Acompañantes Ilimitados'),
    description: t('features.items.companions.description', 'Sala espaciosa y acogedora para que compartas esta emoción con tu pareja, abuelos, tíos, hermanos o quien tú elijas.')
  },
  {
    icon: Camera,
    title: t('features.items.digital.title', 'Fotos y Vídeos al Instante'),
    description: t('features.items.digital.description', 'Acceso a tu bóveda digital privada para descargar todas las fotos y vídeos de tu sesión en alta resolución desde el móvil.')
  }
])
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
