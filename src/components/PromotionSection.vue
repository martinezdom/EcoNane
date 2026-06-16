<script setup>
import { ref, onMounted } from 'vue'
import { Sparkles, Gift } from '@lucide/vue'

const promo = ref(null)

onMounted(async () => {
  try {
    const res = await fetch('/promo.json')
    if (res.ok) {
      const data = await res.json()
      if (data && data.active) {
        promo.value = data
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
            class="bg-brand-pink hover:bg-brand-pink/90 inline-flex w-full cursor-pointer items-center justify-center rounded-full px-8 py-3.5 text-sm font-bold text-white shadow-md transition-all duration-300 hover:shadow-lg md:w-auto"
          >
            Reservar promoción
          </a>
        </div>
      </div>
    </div>
  </section>
</template>
