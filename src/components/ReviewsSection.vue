<script setup lang="ts">
import { Star, CheckCircle2, ExternalLink, Heart, MessageSquare } from '@lucide/vue'
import { useI18n } from '@/composables/useI18n'

const { t } = useI18n()

interface ReviewItem {
  id: string
  name: string
  date: string
  rating: number
  text: string
  avatarColor: string
  initials: string
}

const reviews: ReviewItem[] = [
  {
    id: 'rev-1',
    name: 'Maite Llinares Sánchez',
    date: 'hace 2 días',
    rating: 5,
    text: 'Nos ha encantado la experiencia y sobretodo el trato de Mireia, es un encanto 😊 hemos salido super emocionados. Volveremos a repetir más adelante sin duda alguna. Animaros a hacer alguna visita 🥰🥰',
    avatarColor: 'bg-indigo-600',
    initials: 'ML'
  },
  {
    id: 'rev-2',
    name: 'Paula Alcalde',
    date: 'hace 4 días',
    rating: 5,
    text: 'Un centro precioso, nuevo y muy acogedor. El trato es excelente, muy profesionales, amables y atentos en todo momento. ¡Da gusto encontrar sitios así! Totalmente recomendable 🙈',
    avatarColor: 'bg-rose-600',
    initials: 'PA'
  },
  {
    id: 'rev-3',
    name: 'Ashlly Ramirez',
    date: 'hace 1 día',
    rating: 5,
    text: 'Un trato espectacular, te hacen sentir en casa, súper recomendados 💖',
    avatarColor: 'bg-amber-600',
    initials: 'AR'
  },
  {
    id: 'rev-4',
    name: 'Gema Artacho Sola',
    date: 'hace 2 días',
    rating: 5,
    text: 'Un sitio precioso, súper amplio y acogedor. La chica fue encantadora, muy amable y detallista. Aunque nuestro bebé no estaba bien colocado para poder verlo, tuvo toda la paciencia y cariño del mundo con nosotros.',
    avatarColor: 'bg-emerald-600',
    initials: 'GA'
  },
  {
    id: 'rev-5',
    name: 'Tatiana Martinez Nattero',
    date: 'hace 4 días',
    rating: 5,
    text: 'Muy buena experiencia, gracias!! 🤗',
    avatarColor: 'bg-purple-600',
    initials: 'TM'
  }
]

const googleMapsUrl = 'https://share.google/BXdcvYZWLOvxcCEIX'
</script>

<template>
  <section id="resenas" class="bg-brand-cream/40 py-20 border-t border-brand-pink-light/30">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <!-- Section Header -->
      <div class="mx-auto mb-12 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase">
          {{ t('reviews.tag', 'Opiniones Reales') }}
        </span>
        <h2 class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
          {{ t('reviews.title', 'Familias felices en EcoNane') }}
        </h2>
        <p class="text-brand-brown/75 mt-4 text-sm sm:text-base leading-relaxed">
          {{ t('reviews.subtitle', 'La satisfacción y el cariño de las mamás y papás que ya han vivido la emoción de ver a su bebé con nosotros.') }}
        </p>

        <!-- Google Score Pill -->
        <div class="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-white px-5 py-3 shadow-sm border border-brand-pink-light/40">
          <!-- Google G Logo SVG -->
          <div class="flex items-center gap-2">
            <svg class="h-6 w-6" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              />
            </svg>
            <span class="font-serif text-lg font-bold text-brand-brown-dark">5.0</span>
          </div>

          <!-- Stars -->
          <div class="flex items-center gap-1 text-amber-400">
            <Star v-for="i in 5" :key="i" class="h-4 w-4 fill-amber-400 text-amber-400" />
          </div>

          <span class="text-xs font-semibold text-brand-brown/70 hidden sm:inline">|</span>

          <span class="text-xs font-bold text-brand-brown-dark">
            {{ t('reviews.googleBadge', '100% valoraciones de 5 estrellas') }}
          </span>

          <a
            :href="googleMapsUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="text-brand-pink hover:text-brand-brown font-bold text-xs inline-flex items-center gap-1 transition-colors underline ml-1"
          >
            <span>{{ t('reviews.viewOnGoogle', 'Ver opiniones en Google') }}</span>
            <ExternalLink class="h-3 w-3" />
          </a>
        </div>
      </div>

      <!-- Reviews Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
        <div
          v-for="rev in reviews"
          :key="rev.id"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between"
        >
          <div>
            <!-- Review Author Header -->
            <div class="flex items-center justify-between mb-4">
              <div class="flex items-center gap-3">
                <div
                  :class="[
                    'h-11 w-11 rounded-2xl flex items-center justify-center text-white font-bold text-sm shadow-xs',
                    rev.avatarColor
                  ]"
                >
                  {{ rev.initials }}
                </div>
                <div>
                  <h4 class="font-bold text-sm text-brand-brown-dark leading-tight">{{ rev.name }}</h4>
                  <div class="flex items-center gap-1.5 mt-0.5">
                    <span class="text-[11px] font-medium text-brand-brown/60">Reseña de Google</span>
                    <span class="text-[10px] text-brand-brown/40">•</span>
                    <span class="text-[10px] text-brand-brown/50">{{ rev.date }}</span>
                  </div>
                </div>
              </div>

              <!-- Google Mini Icon -->
              <svg class="h-4 w-4 shrink-0 opacity-80" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.97 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                />
              </svg>
            </div>

            <!-- Stars Rating -->
            <div class="flex items-center gap-1 mb-3 text-amber-400">
              <Star v-for="s in rev.rating" :key="s" class="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            </div>

            <!-- Review Text -->
            <p class="text-xs sm:text-sm text-brand-brown/85 leading-relaxed italic">
              "{{ rev.text }}"
            </p>
          </div>

          <!-- Card Footer Badge -->
          <div class="mt-4 pt-3 border-t border-brand-pink-light/20 flex items-center justify-between text-[11px] text-brand-brown/60">
            <span class="inline-flex items-center gap-1 text-emerald-700 font-semibold">
              <CheckCircle2 class="h-3 w-3" />
              Visita Verificada
            </span>
            <Heart class="h-3.5 w-3.5 text-brand-pink fill-brand-pink/30" />
          </div>
        </div>
      </div>

      <!-- Bottom Google CTA Callout -->
      <div class="mt-12 text-center">
        <a
          :href="googleMapsUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-2 rounded-full border border-brand-pink-light/60 bg-white px-6 py-2.5 text-xs font-bold text-brand-brown shadow-xs hover:bg-brand-cream/80 hover:border-brand-pink transition-all cursor-pointer"
        >
          <MessageSquare class="h-3.5 w-3.5 text-brand-pink" />
          <span>{{ t('reviews.leaveReview', '¿Has visitado EcoNane? Déjanos tu reseña en Google') }}</span>
          <ExternalLink class="h-3 w-3 text-brand-pink" />
        </a>
      </div>
    </div>
  </section>
</template>
