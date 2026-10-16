<script setup lang="ts">
import { Heart } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

function scrollToSection(href: string) {
  const targetId = href.replace(/^#/, '')
  const el = document.getElementById(targetId)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    if (window.history.pushState) {
      window.history.pushState(null, '', href)
    }
  }
}
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
            {{ t('hero.badge') }}
          </div>

          <h1
            class="text-brand-brown-dark mb-6 font-serif text-4xl leading-tight font-bold tracking-tight sm:text-5xl lg:text-6xl"
          >
            {{ t('hero.titlePrefix') }} <br class="hidden sm:inline" />
            {{ t('hero.titleHighlight') }}
            <span class="text-brand-pink mt-2 block font-serif font-light italic">{{ t('hero.titleSuffix') }}</span>
          </h1>

          <p class="text-brand-brown/80 mb-8 max-w-xl text-base leading-relaxed sm:text-lg">
            {{ t('hero.description') }}
          </p>

          <div class="flex w-full flex-col gap-4 sm:w-auto sm:flex-row">
            <a
              href="#contacto"
              @click.prevent="scrollToSection('#contacto')"
              class="btn-primary flex items-center justify-center text-center cursor-pointer"
            >
              {{ t('hero.ctaBook') }}
            </a>
            <a
              href="#ecografias"
              @click.prevent="scrollToSection('#ecografias')"
              class="btn-secondary flex items-center justify-center text-center cursor-pointer"
            >
              {{ t('hero.ctaExperiences') }}
            </a>
          </div>
        </div>

        <div class="relative flex items-center justify-center lg:col-span-6">
          <div class="relative w-full max-w-[450px] sm:max-w-[500px]">
            <div
              class="bg-brand-beige ml-auto aspect-square w-[85%] overflow-hidden rounded-tl-[40px] rounded-tr-[120px] rounded-br-[40px] rounded-bl-[120px] border-[6px] border-white shadow-xl"
            >
              <img
                src="/hero-woman.webp"
                alt="Madre embarazada"
                class="h-full w-full object-cover"
              />
            </div>

            <div
              class="absolute bottom-4 left-0 aspect-square w-[55%] overflow-hidden rounded-full border-[6px] border-white bg-black shadow-2xl"
            >
              <img
                src="/ultrasound-baby.webp"
                alt="Ecografía 3D de bebé"
                class="h-full w-full object-cover"
              />
            </div>

            <div
              class="bg-brand-pink-light absolute bottom-[40%] left-[2%] flex max-w-[130px] -rotate-6 transform flex-col items-center justify-center rounded-full border border-white px-4 py-2.5 text-center shadow-lg"
            >
              <span
                class="text-brand-brown text-[10px] leading-none font-bold tracking-wider uppercase"
                >{{ t('hero.badgeMemories') }}</span
              >
              <span class="text-brand-brown-dark mt-1 text-[8px] leading-none font-medium"
                >{{ t('hero.badgeForever') }}</span
              >
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
