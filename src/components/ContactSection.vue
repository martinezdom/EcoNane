<script setup lang="ts">
import { ref, computed } from 'vue'
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Calendar,
  Sparkles,
  Send,
  Heart,
  CheckCircle2,
  AlertCircle,
  Loader2
} from '@lucide/vue'
import { useSiteData } from '@/composables/useSiteData'

const { experiences, packs } = useSiteData()

const name = ref('')
const email = ref('')
const phone = ref('')
const selectedGestation = ref('')
const selectedService = ref('')
const message = ref('')

const emailStatus = ref<'idle' | 'loading' | 'success' | 'error'>('idle')
const emailErrorMessage = ref('')

const gestationOptions = [
  { label: 'Semana 12 - 16', hint: 'Ideal para conocer el sexo' },
  { label: 'Semana 17 - 23', hint: 'Cuerpo entero y movimiento' },
  { label: 'Semana 24 - 30', hint: 'Momento estrella para carita 5D' },
  { label: 'Semana 31 - 38', hint: 'Última etapa y mofletes' },
  { label: 'No estoy segura / Consulta', hint: 'Te asesoramos sin compromiso' }
]

function toggleGestation(g: { label: string; hint: string }) {
  const value = `${g.label} (${g.hint})`
  if (selectedGestation.value === value) {
    selectedGestation.value = ''
  } else {
    selectedGestation.value = value
  }
}

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
  if (!name.value || !phone.value) {
    alert('Por favor, indica al menos tu nombre y tu teléfono.')
    return
  }

  const text = `¡Hola Mireia! ❤️ Me gustaría reservar una cita en EcoNane:

🤰 *Mamá / Familia:* ${name.value}
📱 *Teléfono:* ${phone.value}${email.value ? `\n✉️ *Email:* ${email.value}` : ''}${selectedGestation.value ? `\n🗓️ *Semana de gestación:* ${selectedGestation.value}` : ''}
✨ *Servicio deseado:* ${selectedService.value || allServices.value[0]}${message.value ? `\n💬 *Comentario:* ${message.value}` : ''}

¿Qué disponibilidad tenéis para concertar la cita? ¡Muchas gracias!`

  const encodedText = encodeURIComponent(text)
  const url = `https://wa.me/34644189856?text=${encodedText}`
  window.open(url, '_blank')
}

const sendByEmail = async () => {
  if (!name.value || !phone.value) {
    emailStatus.value = 'error'
    emailErrorMessage.value = 'Por favor, rellena tu nombre y teléfono.'
    return
  }
  if (!email.value || !email.value.includes('@')) {
    emailStatus.value = 'error'
    emailErrorMessage.value = 'Por favor, introduce un correo electrónico válido.'
    return
  }

  emailStatus.value = 'loading'
  emailErrorMessage.value = ''

  try {
    const response = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre: name.value,
        email: email.value,
        telefono: phone.value,
        semana: selectedGestation.value || 'No especificada',
        servicio: selectedService.value || allServices.value[0],
        mensaje: message.value
      })
    })

    const result = await response.json()

    if (response.ok && (result.success || !result.error)) {
      emailStatus.value = 'success'
      name.value = ''
      email.value = ''
      phone.value = ''
      selectedGestation.value = ''
      message.value = ''
    } else {
      emailStatus.value = 'error'
      emailErrorMessage.value = result.error || 'No se pudo enviar el correo en este momento.'
    }
  } catch (err: any) {
    emailStatus.value = 'error'
    emailErrorMessage.value = 'Error al conectar con el servidor. Puedes contactarnos por WhatsApp.'
  }
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
          Elige tu semana de gestación y el servicio que prefieres. Te responderemos para confirmar tu día y hora.
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
            <span>Formulario de Cita</span>
          </div>

          <h3 class="text-brand-brown-dark mb-6 font-serif text-2xl font-bold">
            Personaliza tu cita
          </h3>

          <form @submit.prevent="sendWhatsApp" class="space-y-6">
            <!-- 1. Gestation Week Interactive Selector (No selection by default) -->
            <div>
              <label class="text-brand-brown-dark mb-2 block text-xs font-bold uppercase tracking-wider">
                1. ¿De cuántas semanas estás aproximadamente? (Opcional)
              </label>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  v-for="g in gestationOptions"
                  :key="g.label"
                  type="button"
                  @click="toggleGestation(g)"
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

            <!-- 3. Name, Phone & Email -->
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

            <div class="flex flex-col">
              <label for="email" class="text-brand-brown-dark mb-1.5 text-xs font-bold uppercase tracking-wider">
                Correo Electrónico (Para recibir confirmación o contactar por email)
              </label>
              <input
                id="email"
                v-model="email"
                type="email"
                placeholder="Ej: tu-email@ejemplo.com"
                class="form-input"
              />
            </div>

            <!-- 4. Optional Note -->
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

            <!-- Status Alerts for Email Sending -->
            <div v-if="emailStatus === 'success'" class="flex items-center gap-3 rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-xs font-semibold text-emerald-800">
              <CheckCircle2 class="h-5 w-5 shrink-0 text-emerald-600" />
              <span>¡Solicitud enviada correctamente! Nos pondremos en contacto contigo lo antes posible para confirmar tu cita.</span>
            </div>

            <div v-if="emailStatus === 'error'" class="flex items-center gap-3 rounded-2xl bg-rose-50 border border-rose-200 p-4 text-xs font-semibold text-rose-800">
              <AlertCircle class="h-5 w-5 shrink-0 text-rose-600" />
              <span>{{ emailErrorMessage }}</span>
            </div>

            <!-- Dual Action Buttons -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="submit"
                class="flex cursor-pointer items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-3.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-98"
              >
                <Send class="h-4 w-4" />
                <span>Solicitar por WhatsApp</span>
              </button>

              <button
                type="button"
                @click="sendByEmail"
                :disabled="emailStatus === 'loading'"
                class="flex cursor-pointer items-center justify-center gap-2 rounded-2xl border border-brand-brown bg-brand-brown px-4 py-3.5 text-center text-xs sm:text-sm font-bold text-white shadow-sm transition-all hover:bg-brand-brown-dark active:scale-98 disabled:opacity-50"
              >
                <Loader2 v-if="emailStatus === 'loading'" class="h-4 w-4 animate-spin text-white" />
                <Mail v-else class="h-4 w-4 text-white" />
                <span>{{ emailStatus === 'loading' ? 'Enviando...' : 'Enviar por Correo' }}</span>
              </button>
            </div>

            <p class="text-center text-[11px] text-brand-brown/70">
              Elige la opción que prefieras: te responderemos para coordinar tu cita lo antes posible.
            </p>
          </form>
        </div>
      </div>
    </div>
  </section>
</template>
