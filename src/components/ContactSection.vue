<script setup>
import { ref } from 'vue'
import { MapPin, Phone, Mail, Clock } from '@lucide/vue'

const name = ref('')
const phone = ref('')
const selectedScan = ref('Ecografía 5D')
const message = ref('')

const scanOptions = ['Ecografía 3D', 'Ecografía 4D', 'Ecografía 5D', 'Pack Recuerdos']

const sendWhatsApp = () => {
  const baseText = `Hola, mi nombre es ${name.value} (Tlf: ${phone.value}). Me gustaría solicitar cita para la experiencia ${selectedScan.value}.`
  const optionalMsg = message.value ? ` Nota: ${message.value}` : ''
  const encodedText = encodeURIComponent(baseText + optionalMsg)
  const url = `https://wa.me/34600000000?text=${encodedText}`
  window.open(url, '_blank')
}
</script>

<template>
  <section id="contacto" class="bg-brand-cream/30 py-20">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="mx-auto mb-16 max-w-2xl text-center">
        <span class="text-brand-pink text-xs font-semibold tracking-widest uppercase"
          >Contacto</span
        >
        <h2
          class="text-brand-brown-dark mt-3 font-serif text-3xl font-bold sm:text-4xl lg:text-5xl"
        >
          Reserva tu momento especial
        </h2>
      </div>

      <div class="grid grid-cols-1 items-start gap-12 lg:grid-cols-12 lg:gap-16">
        <div class="space-y-8 lg:col-span-5">
          <div
            class="border-brand-pink-light/20 space-y-6 rounded-3xl border bg-white/60 p-8 shadow-sm"
          >
            <h3 class="text-brand-brown-dark mb-4 font-serif text-xl font-bold">
              Información de la clínica
            </h3>

            <div class="flex items-start gap-4">
              <div
                class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <MapPin class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Dirección</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">
                  Calle de la Maternidad, 12, Planta Baja, Madrid
                </p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Phone class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Teléfono / WhatsApp</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">+34 600 00 00 00</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Mail class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Correo Electrónico</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">contacto@econane.com</p>
              </div>
            </div>

            <div class="flex items-start gap-4">
              <div
                class="bg-brand-pink-light/40 text-brand-brown flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              >
                <Clock class="h-5 w-5" />
              </div>
              <div>
                <h4 class="text-brand-brown-dark text-sm font-semibold">Horario de Atención</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">Lunes a Sábado: 10:00 - 20:00</p>
              </div>
            </div>
          </div>
        </div>

        <div
          class="border-brand-pink-light/20 rounded-3xl border bg-white p-8 shadow-sm lg:col-span-7"
        >
          <h3 class="text-brand-brown-dark mb-6 font-serif text-xl font-bold">
            Escríbenos para concertar cita
          </h3>

          <form @submit.prevent="sendWhatsApp" class="space-y-6">
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div class="flex flex-col">
                <label for="name" class="text-brand-brown-dark/70 mb-2 text-xs font-bold uppercase"
                  >Nombre completo</label
                >
                <input
                  id="name"
                  v-model="name"
                  type="text"
                  required
                  placeholder="Tu nombre"
                  class="border-brand-pink-light/50 bg-brand-cream/10 focus:border-brand-pink rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none"
                />
              </div>

              <div class="flex flex-col">
                <label for="phone" class="text-brand-brown-dark/70 mb-2 text-xs font-bold uppercase"
                  >Teléfono móvil</label
                >
                <input
                  id="phone"
                  v-model="phone"
                  type="tel"
                  required
                  placeholder="Tu teléfono"
                  class="border-brand-pink-light/50 bg-brand-cream/10 focus:border-brand-pink rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none"
                />
              </div>
            </div>

            <div class="flex flex-col">
              <label for="scan" class="text-brand-brown-dark/70 mb-2 text-xs font-bold uppercase"
                >Tipo de ecografía</label
              >
              <select
                id="scan"
                v-model="selectedScan"
                class="border-brand-pink-light/50 bg-brand-cream/10 focus:border-brand-pink rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none"
              >
                <option v-for="opt in scanOptions" :key="opt" :value="opt">
                  {{ opt }}
                </option>
              </select>
            </div>

            <div class="flex flex-col">
              <label for="message" class="text-brand-brown-dark/70 mb-2 text-xs font-bold uppercase"
                >Mensaje o preferencia horaria (Opcional)</label
              >
              <textarea
                id="message"
                v-model="message"
                rows="4"
                placeholder="Cuéntanos qué día o rango de hora prefieres..."
                class="border-brand-pink-light/50 bg-brand-cream/10 focus:border-brand-pink resize-none rounded-xl border px-4 py-3 text-sm transition-colors focus:outline-none"
              ></textarea>
            </div>

            <button
              type="submit"
              class="bg-brand-brown text-brand-cream hover:bg-brand-brown-dark inline-flex w-full cursor-pointer items-center justify-center rounded-full py-4 text-center text-sm font-bold shadow-md transition-all duration-300 hover:shadow-lg"
            >
              Enviar solicitud por WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
