<script setup lang="ts">
import { ref, computed } from 'vue'
import { MapPin, Phone, Mail, Clock, Calendar, Sparkles, Send, Heart, CheckCircle2 } from '@lucide/vue'
import { useSiteData } from '@/composables/useSiteData'

const { experiences, packs } = useSiteData()

const name = ref('')
const phone = ref('')
const selectedGestation = ref('Semana 24 - 30 (Momento ideal 5D)')
const selectedService = ref('')
const preferredTime = ref('Tardes (16:00 - 20:00)')
const message = ref('')

const gestationOptions = [
  { label: 'Semana 12 - 16', hint: 'Ideal para conocer el sexo' },
  { label: 'Semana 17 - 23', hint: 'Cuerpo entero y movimiento' },
  { label: 'Semana 24 - 30', hint: 'Momento estrella para carita 5D' },
  { label: 'Semana 31 - 38', hint: 'Última etapa y mofletes' },
  { label: 'No estoy segura / Consulta', hint: 'Te asesoramos por WhatsApp' }
]

const timeOptions = [
  'Tardes (16:00 - 20:00)',
  'Mañanas (10:00 - 14:00)',
  'Sábados',
  'Cualquier horario disponible'
]

// All available services
const allServices = computed(() => {
  const list: string[] = []
  experiences.value.forEach((exp) => list.push(`${exp.title} (${exp.price})`))
  packs.value.forEach((p) => list.push(`${p.title} (${p.price})`))
  return list
})

// Set initial selected service
if (allServices.value.length > 0 && !selectedService.value) {
  selectedService.value = allServices.value[0] || 'Eco Básica 4D/5D'
}

const sendWhatsApp = () => {
  if (!name.value || !phone.value) return

  const text = `¡Hola Mireia! ❤️ Me gustaría reservar una cita en EcoNane:

🤰 *Mamá / Familia:* ${name.value}
📱 *Teléfono:* ${phone.value}
🗓️ *Semana de gestación:* ${selectedGestation.value}
✨ *Servicio deseado:* ${selectedService.value || allServices.value[0]}
⏰ *Horario preferido:* ${preferredTime.value}${message.value ? `\n💬 *Comentario:* ${message.value}` : ''}

¿Qué disponibilidad tenéis para concertar la cita? ¡Muchas gracias!`

  const encodedText = encodeURIComponent(text)
  const url = `https://wa.me/34644189856?text=${encodedText}`
  window.open(url, '_blank')
}
</script>

<template>
  <section id="contacto" class="bg-brand-cream/30 py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-14 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase">
          Cita Previa
        </span>
        <h2 class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl">
          Reserva tu momento especial
        </h2>
        <p class="text-brand-brown/80 mt-3 text-sm sm:text-base">
          Elige tu semana de gestación y el servicio que prefieres. Te responderemos al instante por WhatsApp para confirmar tu día y hora.
        </p>
      </div>

      <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <!-- Clinic Info Left Column -->
        <div class="space-y-8 lg:col-span-5">
          <div class="card-container space-y-6">
            <h3 class="text-brand-brown-dark font-serif text-xl font-bold">
              Información de la clínica
            </h3>

            <div class="flex items-start gap-4">
              <div class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <MapPin class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Ubicación</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">Villajoyosa, Alicante</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Phone class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Teléfono / WhatsApp</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">+34 644 18 98 56</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Mail class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Correo Electrónico</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">info@econane.es</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl">
                <Clock class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Horario de Atención</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">Lunes a Sábado: 10:00 - 20:00</p>
              </div>
            </div>

            <!-- Guarantee Card -->
            <div class="rounded-2xl border border-brand-pink-light/50 bg-brand-cream/60 p-4">
              <div class="flex items-center gap-2 text-xs font-bold text-brand-brown">
                <Heart class="h-4 w-4 fill-brand-pink text-brand-pink" />
                <span>Garantía EcoNane</span>
              </div>
              <p class="mt-1.5 text-xs leading-relaxed text-brand-brown/80">
                Si tu bebé no se deja ver el día de la ecografía, ¡repetimos la sesión sin ningún coste adicional para ti!
              </p>
            </div>
          </div>
        </div>

        <!-- Interactive Booking Form Right Column -->
        <div class="border-brand-pink-light/40 rounded-3xl border bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
          <div class="flex items-center gap-2 text-xs font-bold text-brand-pink uppercase tracking-wider mb-2">
            <Sparkles class="h-3.5 w-3.5 fill-brand-pink" />
            <span>Formulario de Cita Rápida</span>
          </div>

          <h3 class="text-brand-brown-dark mb-6 font-serif text-2xl font-bold">
            Personaliza tu cita
          </h3>

          <form @submit.prevent="sendWhatsApp" class="space-y-6">
            <!-- 1. Gestation Week Interactive Selector -->
            <div>
              <label class="text-brand-brown-dark mb-2 block text-xs font-bold uppercase tracking-wider">
                1. ¿De cuántas semanas estás aproximadamente? *
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  v-for="g in gestationOptions"
                  :key="g.label"
                  type="button"
                  @click="selectedGestation = `${g.label} (${g.hint})`"
                  :class="[
                    'flex flex-col text-left p-3 rounded-2xl border transition-all cursor-pointer',
                    selectedGestation.startsWith(g.label)
                      ? 'border-brand-brown bg-brand-brown text-white shadow-md'
                      : 'border-brand-pink-light/60 bg-brand-cream/30 text-brand-brown-dark hover:border-brand-pink hover:bg-brand-beige/50'
                  ]"
                >
                  <span class="text-xs font-bold">{{ g.label }}</span>
                  <span
                    :class="[
                      'text-[11px] mt-0.5',
                      selectedGestation.startsWith(g.label) ? 'text-white/80' : 'text-brand-brown/70'
                    ]"
                  >
                    {{ g.hint }}
                  </span>
                </button>
              </div>
            </div>

            <!-- 2. Service Selector -->
            <div>
              <label for="scan" class="text-brand-brown-dark mb-2 block text-xs font-bold uppercase tracking-wider">
                2. Servicio o Experiencia que deseas *
              </label>
              <select id="scan" v-model="selectedService" class="form-select font-semibold text-brand-brown-dark">
                <option v-for="opt in allServices" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>

            <!-- 3. Name & Phone -->
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div class="flex flex-col">
                <label for="name" class="text-brand-brown-dark mb-1.5 text-xs font-bold uppercase tracking-wider">
                  Tu nombre completo *
                </label>
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  required
                  placeholder="Ej: Laura Domínguez"
                  class="form-input"
                />
              </div>

              <div class="flex flex-col">
                <label for="phone" class="text-brand-brown-dark mb-1.5 text-xs font-bold uppercase tracking-wider">
                  Teléfono móvil *
                </label>
                <input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  required
                  placeholder="Ej: 644189856"
                  class="form-input"
                />
              </div>
            </div>

            <!-- 4. Preferred Time -->
            <div>
              <label for="time" class="text-brand-brown-dark mb-2 block text-xs font-bold uppercase tracking-wider">
                3. Preferencia horaria
              </label>
              <select id="time" v-model="preferredTime" class="form-select text-sm text-brand-brown-dark">
                <option v-for="t in timeOptions" :key="t" :value="t">
                  {{ t }}
                </option>
              </select>
            </div>

            <!-- 5. Optional Note -->
            <div class="flex flex-col">
              <label for="message" class="text-brand-brown-dark mb-1.5 text-xs font-bold uppercase tracking-wider">
                ¿Quieres indicarnos algo más? (Opcional)
              </label>
              <textarea
                id="message"
                v-model="message"
                rows="2"
                placeholder="Acompañantes que vendrán, alguna duda o fecha especial..."
                class="form-textarea text-xs"
              ></textarea>
            </div>

            <!-- Submit WhatsApp Button -->
            <button
              type="submit"
              class="w-full flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 py-4 text-center font-bold text-white shadow-lg transition-all hover:bg-emerald-700 active:scale-98"
            >
              <Send class="h-4 w-4" />
              <span>Solicitar Cita por WhatsApp</span>
            </button>
            <p class="text-center text-[11px] text-brand-brown/70">
              Al pulsar se abrirá tu WhatsApp con el mensaje estructurado para Mireia (+34 644 18 98 56).
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
