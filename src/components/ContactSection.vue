<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Phone, Mail, Clock } from '@lucide/vue'

const name = ref('')
const phone = ref('')
const selectedScan = ref('Eco Básica 4D/5D (45€)')
const message = ref('')

const scanOptions: string[] = [
  'Eco Básica 4D/5D (45€)',
  'Eco para Conocer el Sexo (30€)',
  'Eco + Revelación de Sexo (70€)',
  'Experiencia Gafas Virtuales + Eco 4D/5D (75€)',
  'Pack 2 Ecos (80€)',
  'Pack 3 Ecos (115€)',
  'Consulta general'
]

const sendWhatsApp = () => {
  const baseText = `Hola, mi nombre es ${name.value} (Tlf: ${phone.value}). Me gustaría solicitar cita para: ${selectedScan.value}.`
  const optionalMsg = message.value ? ` Nota: ${message.value}` : ''
  const encodedText = encodeURIComponent(baseText + optionalMsg)
  const url = `https://wa.me/34644189856?text=${encodedText}`
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
          <div class="card-container space-y-6">
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
                <h4 class="text-brand-brown-dark text-sm font-semibold">Ubicación</h4>
                <p class="text-brand-brown/80 mt-1 text-sm">
                  Villajoyosa, Alicante
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
                <p class="text-brand-brown/80 mt-1 text-sm">+34 644 18 98 56</p>
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
                <p class="text-brand-brown/80 mt-1 text-sm">info@econane.es</p>
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
                  class="form-input"
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
                  class="form-input"
                />
              </div>
            </div>

            <div class="flex flex-col">
              <label for="scan" class="text-brand-brown-dark/70 mb-2 text-xs font-bold uppercase"
                >Tipo de ecografía</label
              >
              <select id="scan" v-model="selectedScan" class="form-select">
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
                class="form-textarea"
              ></textarea>
            </div>

            <button type="submit" class="btn-primary w-full py-4 text-sm font-bold">
              Enviar solicitud por WhatsApp
            </button>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
