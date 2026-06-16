<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { Sparkles, Gift } from '@lucide/vue'
import type { Promotion } from '@/types'

const promo = ref<Promotion | null>(null)

onMounted(async () => {
  try {
    const res = await fetch('/promo.txt')
    if (res.ok) {
      const text = await res.text()
      const lines = text.split('\n')
      const getValue = (key: string): string => {
        const line = lines.find((l) =>
          l
            .trim()
            .toUpperCase()
            .startsWith(key.toUpperCase() + ':')
        )
        if (!line) return ''
        const index = line.indexOf(':')
        return line.substring(index + 1).trim()
      }
      const activeText = getValue('ACTIVA').toUpperCase()
      const active = activeText === 'SI' || activeText === 'YES' || activeText === 'TRUE'
      if (active) {
        promo.value = {
          active,
          badge: getValue('ETIQUETA'),
          title: getValue('TITULO'),
          description: getValue('DESCRIPCION'),
          discountCode: getValue('CODIGO'),
          whatsappText: getValue('WHATSAPP')
        }
      }
    }
  } catch (err) {}
})
</script>

<template>
  <section v-if="promo" class="bg-brand-pink-light/20 border-brand-pink-light/35 border-y py-12">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div
        class="border-brand-pink-light/25 flex flex-col items-center justify-between gap-8 rounded-3xl border bg-white p-8 shadow-sm md:flex-row"
      >
        <div class="flex max-w-2xl flex-col items-center text-center md:items-start md:text-left">
          <span
            class="bg-brand-pink mb-4 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[10px] font-bold tracking-wider text-white uppercase"
          >
            <Sparkles class="h-3 w-3 fill-white" />
            {{ promo.badge }}
          </span>
          <h3 class="text-brand-brown-dark mb-3 font-serif text-2xl font-bold sm:text-3xl">
            {{ promo.title }}
          </h3>
          <p class="text-brand-brown/85 text-sm leading-relaxed sm:text-base">
            {{ promo.description }}
          </p>
          <div
            v-if="promo.discountCode"
            class="text-brand-pink mt-4 flex items-center gap-2 text-xs font-semibold"
          >
            <Gift class="h-4 w-4" />
            Código:
            <span
              class="bg-brand-pink/10 border-brand-pink/20 rounded-lg border px-2.5 py-1 font-mono tracking-wider uppercase"
            >
              {{ promo.discountCode }}
            </span>
          </div>
        </div>

        <div class="w-full shrink-0 md:w-auto">
          <a
            :href="`https://wa.me/34600000000?text=${encodeURIComponent(promo.whatsappText)}`"
            target="_blank"
            class="btn-pink w-full md:w-auto"
          >
            Reservar promoción
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
