<script setup lang="ts">
import { ref, computed } from 'vue'
import { Check, Clock, Heart, Sparkles, Camera, ArrowRight } from '@lucide/vue'
import { useSiteData } from '@/composables/useSiteData'
import { useI18n } from '@/composables/useI18n'

const { experiences, packs, collaboratorPacks } = useSiteData()
const { t } = useI18n()

const activeCategory = ref<'ecos' | 'packs' | 'collab'>('ecos')

const generalIncludes = [
  'Espacio cálido y acogedor',
  'Acompañantes incluidos',
  'Fotos y vídeos digitales',
  'Recuerdo del latido',
  'Atención personalizada'
]

// Filtrar solo las experiencias activas
const activeExperiences = computed(() => {
  return experiences.value.filter((exp) => exp.active !== false)
})
</script>

<template>
  <section id="ecografias" class="bg-white py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mx-auto mb-10 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase">
          {{ t('experiences.tag') }}
        </span>
        <h2 class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
          {{ t('experiences.title') }}
        </h2>
        <p class="text-brand-brown/75 mt-4 text-sm sm:text-base leading-relaxed">
          {{ t('experiences.subtitle') }}
        </p>
      </div>

      <!-- Segmented Category Filter Tabs -->
      <div class="flex justify-center mb-12">
        <div class="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-2xl sm:rounded-full bg-brand-cream border border-brand-pink-light/40 shadow-xs">
          <button
            @click="activeCategory = 'ecos'"
            type="button"
            :class="[
              'px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2',
              activeCategory === 'ecos'
                ? 'bg-brand-brown text-white shadow-sm'
                : 'text-brand-brown-dark/75 hover:text-brand-brown hover:bg-brand-pink-light/20'
            ]"
          >
            <Sparkles class="h-4 w-4" />
            <span>{{ t('experiences.tabEcos', 'Ecografías 4D/5D') }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                activeCategory === 'ecos' ? 'bg-white/20 text-white' : 'bg-brand-pink-light/30 text-brand-brown'
              ]"
            >
              {{ activeExperiences.length }}
            </span>
          </button>

          <button
            @click="activeCategory = 'packs'"
            type="button"
            :class="[
              'px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2',
              activeCategory === 'packs'
                ? 'bg-brand-brown text-white shadow-sm'
                : 'text-brand-brown-dark/75 hover:text-brand-brown hover:bg-brand-pink-light/20'
            ]"
          >
            <Heart class="h-4 w-4" />
            <span>{{ t('experiences.tabPacks', 'Packs Ecografías') }}</span>
            <span
              :class="[
                'rounded-full px-2 py-0.5 text-[10px] font-bold',
                activeCategory === 'packs' ? 'bg-white/20 text-white' : 'bg-brand-pink-light/30 text-brand-brown'
              ]"
            >
              {{ packs.length }}
            </span>
          </button>

          <button
            @click="activeCategory = 'collab'"
            type="button"
            :class="[
              'px-5 py-2.5 rounded-xl sm:rounded-full text-xs sm:text-sm font-bold transition-all duration-300 cursor-pointer flex items-center gap-2 relative',
              activeCategory === 'collab'
                ? 'bg-brand-pink text-white shadow-sm'
                : 'text-brand-brown-dark/75 hover:text-brand-brown hover:bg-brand-pink-light/20'
            ]"
          >
            <Camera class="h-4 w-4" />
            <span>{{ t('experiences.tabCollab', 'Packs Eco + Fotos') }}</span>
            <span class="rounded-full bg-white/25 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-white">
              {{ t('experiences.tabCollabBadge', 'Novedad') }}
            </span>
          </button>
        </div>
      </div>

      <!-- VIEW 1: ECOGRAFÍAS 4D/5D INDIVIDUALES -->
      <div v-show="activeCategory === 'ecos'">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          <div
            v-for="(exp, idx) in activeExperiences"
            :key="exp.title + idx"
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
      </div>

      <!-- VIEW 2: PACKS SEGUIMIENTO (SOLO ECOS) -->
      <div v-show="activeCategory === 'packs'">
        <div class="mb-10 text-center max-w-2xl mx-auto">
          <h3 class="text-brand-brown-dark font-serif text-2xl font-bold sm:text-3xl">
            Acompaña cada etapa de tu embarazo
          </h3>
          <p class="text-brand-brown/75 mt-2 text-xs sm:text-sm">
            {{ t('experiences.packsSubtitle', 'Sesiones combinadas a lo largo de los trimestres con precio cerrado reducido.') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 max-w-4xl mx-auto gap-8 items-stretch">
          <div
            v-for="pack in packs"
            :key="pack.title"
            class="card-container relative flex flex-col justify-between p-8 border-brand-pink-light/40 bg-brand-cream/30 hover:border-brand-pink/60 transition-all duration-300 shadow-sm hover:shadow-lg rounded-3xl"
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
              {{ t('experiences.bookPack', 'Reservar este pack') }}
            </a>
          </div>
        </div>
      </div>

      <!-- VIEW 3: PACKS COMBINADOS ECO + FOTOGRAFÍA (PENÉLOPE) -->
      <div v-show="activeCategory === 'collab'">
        <div class="mb-10 text-center max-w-3xl mx-auto">
          <div class="inline-flex items-center gap-2 rounded-full bg-brand-pink/15 px-3.5 py-1 text-xs font-bold text-brand-brown border border-brand-pink/30 mb-3">
            <Camera class="h-3.5 w-3.5 text-brand-pink" />
            <span>{{ t('experiences.collabBadge', 'Colaboración Especial') }}</span>
          </div>
          <h3 class="text-brand-brown-dark font-serif text-2xl sm:text-3xl lg:text-4xl font-bold">
            {{ t('experiences.collabTitle', 'Packs Ecografía + Recuerdo Fotográfico') }}
          </h3>
          <p class="text-brand-brown/75 mt-3 text-xs sm:text-sm sm:leading-relaxed">
            {{ t('experiences.collabSubtitle', 'En exclusiva con Penélope Photograph. La emoción de ver a tu bebé en directo combinada con un reportaje fotográfico profesional de premamá o en familia.') }}
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-stretch">
          <div
            v-for="cPack in collaboratorPacks"
            :key="cPack.id"
            class="rounded-3xl border border-brand-pink-light/40 bg-gradient-to-b from-brand-cream/60 to-white p-7 shadow-sm hover:shadow-xl hover:border-brand-pink/60 transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
          >
            <div
              v-if="cPack.badge"
              class="absolute top-4 right-4 rounded-full bg-brand-pink text-white px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider shadow-xs"
            >
              {{ cPack.badge }}
            </div>

            <div>
              <div class="mb-4">
                <span class="inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-brand-pink">
                  <Camera class="h-3 w-3" />
                  Eco + Foto
                </span>
                <h4 class="text-brand-brown-dark font-serif text-lg font-bold leading-snug mt-1">
                  {{ cPack.title }}
                </h4>
                <p class="text-[11px] text-brand-brown/65 mt-0.5 font-medium">{{ cPack.subtitle }}</p>
              </div>

              <div class="my-4 flex items-baseline gap-1">
                <span class="text-brand-brown-dark font-serif text-3xl font-extrabold">
                  {{ cPack.price }}
                </span>
                <span class="text-xs text-brand-brown/60">/ pack completo</span>
              </div>

              <p class="text-brand-brown/80 mb-5 text-xs leading-relaxed">
                {{ cPack.description }}
              </p>

              <ul class="mb-6 space-y-2 border-t border-brand-pink-light/30 pt-3.5 text-xs text-brand-brown-dark">
                <li
                  v-for="(feat, fIdx) in cPack.features"
                  :key="fIdx"
                  class="flex items-start gap-1.5"
                >
                  <Check class="h-3.5 w-3.5 shrink-0 text-brand-pink mt-0.5" />
                  <span class="text-brand-brown/90 leading-tight">{{ feat }}</span>
                </li>
              </ul>
            </div>

            <div class="pt-2">
              <a
                :href="cPack.link"
                target="_blank"
                class="btn-primary w-full text-center text-xs font-bold py-2.5 shadow-sm inline-flex items-center justify-center gap-1.5"
              >
                <span>{{ t('experiences.bookPack', 'Reservar este pack') }}</span>
                <ArrowRight class="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- QUÉ INCLUYE SIEMPRE (GARANTÍA ECONANE) -->
      <div class="mt-20 rounded-3xl bg-brand-cream/80 border border-brand-pink-light/30 p-8 sm:p-10 shadow-sm max-w-5xl mx-auto">
        <div class="flex flex-col md:flex-row items-center justify-between gap-8">
          <div class="text-center md:text-left max-w-md">
            <span class="text-brand-pink text-xs font-bold tracking-wider uppercase">
              {{ t('experiences.guaranteeTag', 'Garantía EcoNane') }}
            </span>
            <h4 class="text-brand-brown-dark mt-1 font-serif text-xl sm:text-2xl font-bold">
              {{ t('experiences.guaranteeTitle', 'Incluye en todas nuestras sesiones') }}
            </h4>
            <p class="text-brand-brown/75 mt-2 text-xs sm:text-sm">
              {{ t('experiences.guaranteeSubtitle', 'Queremos que tu experiencia sea inolvidable desde el primer minuto.') }}
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
