<script setup lang="ts">
import { computed } from 'vue'
import { Sparkles } from '@lucide/vue'
import { useSiteData } from '@/composables/useSiteData'
import { useI18n } from '@/composables/useI18n'

const { promotion } = useSiteData()
const { t, currentLanguage } = useI18n()

const promoBadge = computed(() => {
  if (currentLanguage.value !== 'es') {
    return t('promotion.badge', promotion.value.badge)
  }
  return promotion.value.badge || t('promotion.badge')
})

const promoTitle = computed(() => {
  if (currentLanguage.value !== 'es') {
    return t('promotion.title', promotion.value.title)
  }
  return promotion.value.title || t('promotion.title')
})

const promoDescription = computed(() => {
  if (currentLanguage.value !== 'es') {
    return t('promotion.description', promotion.value.description)
  }
  return promotion.value.description || t('promotion.description')
})

const promoWhatsappText = computed(() => {
  if (currentLanguage.value !== 'es') {
    return t('promotion.whatsappText', promotion.value.whatsappText)
  }
  return promotion.value.whatsappText || t('promotion.whatsappText')
})

const promoBtn = computed(() => {
  return t('promotion.btn', 'Reservar promoción')
})
</script>

<template>
  <section v-if="promotion.active" class="bg-brand-pink-light/20 border-brand-pink-light/35 border-y py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        class="border-brand-pink-light/25 flex flex-col items-center justify-between gap-8 rounded-3xl border bg-white p-8 shadow-sm md:flex-row"
      >
        <div class="flex max-w-2xl flex-col items-center text-center md:items-start md:text-left">
          <span
            class="bg-brand-pink mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
          >
            <Sparkles class="h-3 w-3 fill-white" />
            {{ promoBadge }}
          </span>
          <h3 class="text-brand-brown-dark mb-3 font-serif text-2xl font-bold sm:text-3xl">
            {{ promoTitle }}
          </h3>
          <p class="text-brand-brown/85 text-sm leading-relaxed sm:text-base">
            {{ promoDescription }}
          </p>
        </div>

        <div class="w-full shrink-0 md:w-auto">
          <a
            :href="`https://wa.me/34644189856?text=${encodeURIComponent(promoWhatsappText)}`"
            target="_blank"
            class="btn-pink w-full md:w-auto"
          >
            {{ promoBtn }}
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
