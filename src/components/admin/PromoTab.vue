<script setup lang="ts">
import { ref } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { Promotion } from '@/types'
import { RotateCcw, Check, Sparkles, Tag } from '@lucide/vue'

const emit = defineEmits<{
  (e: 'notify', message: string): void
}>()

const { promotion, updatePromotion, resetPromotionToDefault } = useSiteData()

const promoForm = ref<Promotion>({ ...promotion.value })

async function savePromo() {
  await updatePromotion(promoForm.value)
  emit('notify', '¡Promoción y ofertas actualizadas correctamente en la web!')
}

function handleResetPromo() {
  if (confirm('¿Restaurar los textos originales de la oferta de apertura?')) {
    resetPromotionToDefault()
    promoForm.value = { ...promotion.value }
    emit('notify', 'Promoción restaurada a los valores iniciales.')
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Gestión de Promoción y Ofertas</h2>
        <p class="text-sm text-brand-brown/80">
          Modifica los textos, el mes de la oferta o activa/desactiva el banner destacado de la web.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="handleResetPromo"
          class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-cream"
        >
          <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
          <span>Restaurar Original</span>
        </button>

        <button
          type="button"
          @click="savePromo"
          class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
        >
          <Check class="h-4 w-4" />
          <span>Guardar Cambios</span>
        </button>
      </div>
    </div>

    <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
      <!-- Form Card -->
      <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
        <div class="space-y-6">
          <!-- Switch Active -->
          <div class="flex items-center justify-between rounded-2xl border border-brand-pink-light/30 bg-brand-cream/40 p-4">
            <div>
              <h4 class="font-semibold text-brand-brown-dark">Banner de Promoción Activo</h4>
              <p class="text-xs text-brand-brown/80">
                Si lo desactivas, el bloque de oferta desaparecerá de la web pública.
              </p>
            </div>
            <label class="relative inline-flex cursor-pointer items-center">
              <input type="checkbox" v-model="promoForm.active" class="peer sr-only" />
              <div
                class="peer h-7 w-12 rounded-full bg-stone-300 transition-colors after:absolute after:top-0.5 after:left-[3px] after:h-6 after:w-6 after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"
              ></div>
            </label>
          </div>

          <!-- Badge text -->
          <div>
            <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
              Etiqueta Superior (Badge)
            </label>
            <input
              v-model="promoForm.badge"
              type="text"
              placeholder="Ej: OFERTA DE APERTURA"
              class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <!-- Title -->
          <div>
            <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
              Título de la Oferta
            </label>
            <input
              v-model="promoForm.title"
              type="text"
              placeholder="Ej: ¡Gran Promoción de Apertura en Octubre!"
              class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-4 py-3 text-sm font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <!-- Description -->
          <div>
            <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
              Descripción Detallada
            </label>
            <textarea
              v-model="promoForm.description"
              rows="3"
              placeholder="Texto descriptivo de la promoción..."
              class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <!-- WhatsApp Text -->
          <div>
            <label class="block text-xs font-bold tracking-wider text-brand-brown-dark/80 uppercase">
              Mensaje que recibirá Mireia por WhatsApp al pulsar el botón
            </label>
            <input
              v-model="promoForm.whatsappText"
              type="text"
              placeholder="Ej: Hola, me gustaría reservar mi ecografía..."
              class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Live Preview Card -->
      <div class="space-y-4 lg:col-span-5">
        <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
          Vista previa en tiempo real
        </h3>

        <div
          v-if="promoForm.active"
          class="relative overflow-hidden rounded-3xl border border-brand-pink-light/60 bg-gradient-to-br from-brand-cream via-white to-brand-pink-light/30 p-6 shadow-sm"
        >
          <div class="inline-flex items-center gap-1.5 rounded-full bg-brand-pink px-3.5 py-1 text-xs font-bold text-white shadow-sm">
            <Sparkles class="h-3.5 w-3.5 fill-white" />
            <span>{{ promoForm.badge || 'PROMOCIÓN' }}</span>
          </div>

          <h4 class="mt-4 font-serif text-xl font-bold text-brand-brown-dark">
            {{ promoForm.title || 'Título de ejemplo' }}
          </h4>

          <p class="mt-2 text-xs leading-relaxed text-brand-brown/90">
            {{ promoForm.description || 'Descripción de la promoción...' }}
          </p>

          <div class="mt-6">
            <div class="inline-flex w-full items-center justify-center rounded-2xl bg-brand-pink py-3 text-center text-xs font-bold text-white shadow-md">
              Reservar promoción
            </div>
          </div>
        </div>

        <div
          v-else
          class="flex flex-col items-center justify-center rounded-3xl border border-dashed border-brand-pink-light/60 bg-white/60 p-12 text-center text-brand-brown/60"
        >
          <Tag class="h-8 w-8 text-brand-pink" />
          <p class="mt-2 text-sm font-medium">El banner de promoción está oculto</p>
        </div>
      </div>
    </div>
  </div>
</template>
