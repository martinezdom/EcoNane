<script setup lang="ts">
import { ref } from 'vue'
import { MapPin, Calendar, Gift, Sparkles } from '@lucide/vue'
import type { Benefit } from '@/types'

const isAvisoOpen = ref(false)
const isPrivacidadOpen = ref(false)

const benefits: Benefit[] = [
  {
    icon: MapPin,
    title: 'Fácil Acceso',
    desc: 'Céntrico y bien comunicado'
  },
  {
    icon: Calendar,
    title: 'Cita Previa',
    desc: 'Atención personalizada sin esperas'
  },
  {
    icon: Gift,
    title: 'Regala Emociones',
    desc: 'Tarjetas de regalo disponibles'
  },
  {
    icon: Sparkles,
    title: 'Máxima Calidad',
    desc: 'Tecnología 3D, 4D y 5D de última generación'
  }
]
</script>

<template>
  <footer class="bg-brand-brown-dark text-brand-cream mt-auto">
    <div class="border-brand-cream/10 bg-brand-brown border-b py-8">
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="grid grid-cols-1 gap-6 text-center md:grid-cols-2 lg:grid-cols-4">
          <div
            v-for="benefit in benefits"
            :key="benefit.title"
            class="border-brand-cream/10 flex flex-col items-center justify-center gap-4 rounded-2xl border bg-white/5 p-4 sm:flex-row"
          >
            <div
              class="bg-brand-cream/10 text-brand-cream flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            >
              <component :is="benefit.icon" class="h-5 w-5" />
            </div>
            <div class="text-center sm:text-left">
              <h4 class="font-serif text-sm leading-tight font-bold tracking-wide uppercase">
                {{ benefit.title }}
              </h4>
              <p class="text-brand-pink-light/80 mt-0.5 text-[11px] leading-none">
                {{ benefit.desc }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div
        class="border-brand-cream/10 grid grid-cols-1 items-center gap-8 border-b pb-12 md:grid-cols-12"
      >
        <div class="text-center md:col-span-5 md:text-left">
          <div class="mb-4 flex items-center justify-center gap-3 md:justify-start">
            <img
              src="/logo.webp"
              alt="Logo EcoNane"
              class="border-brand-cream/20 shadow-xs h-10 w-10 rounded-full object-cover"
            />
            <span class="font-serif text-xl leading-none font-bold tracking-wider">ECONANE</span>
          </div>
          <p class="text-brand-pink-light/70 max-w-sm text-xs leading-relaxed">
            Tu clínica de confianza en ecografías 4D y 5D en Villajoyosa. Vive una experiencia única conectando emocionalmente con tu bebé antes de su llegada.
          </p>
        </div>

        <div class="flex flex-wrap justify-center gap-6 sm:gap-10 md:col-span-7 md:justify-end">
          <div class="flex gap-6">
            <a
              href="#inicio"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Inicio</a
            >
            <a
              href="#sobre-nosotros"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Sobre Nosotros</a
            >
            <a
              href="#ecografias"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Ecografías</a
            >
            <a
              href="#galeria"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Galería</a
            >
            <a
              href="#faq"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >FAQ</a
            >
            <a
              href="#contacto"
              class="text-brand-pink-light/80 hover:text-brand-cream text-xs transition-colors"
              >Contacto</a
            >
          </div>
        </div>
      </div>

      <div
        class="text-brand-pink-light/50 flex flex-col items-center justify-between gap-4 pt-8 text-xs sm:flex-row"
      >
        <p>
          © 2026 EcoNane. Todos los derechos reservados. Desarrollado por
          <a
            href="https://confitic.es"
            target="_blank"
            class="hover:text-brand-cream decoration-brand-pink-light/30 underline transition-colors"
            >ConfiTIC</a
          >
          <span class="mx-1 opacity-60">|</span>
          <a
            href="https://martinezdom.github.io/"
            target="_blank"
            class="hover:text-brand-cream decoration-brand-pink-light/30 underline transition-colors"
            >@martinezdom</a
          >.
        </p>
        <div class="flex gap-4">
          <button
            @click="isAvisoOpen = true"
            class="hover:text-brand-cream cursor-pointer transition-colors"
          >
            Aviso Legal
          </button>
          <button
            @click="isPrivacidadOpen = true"
            class="hover:text-brand-cream cursor-pointer transition-colors"
          >
            Política de Privacidad
          </button>
          <router-link to="/admin" class="hover:text-brand-cream transition-colors opacity-75 hover:opacity-100">
            Acceso Panel
          </router-link>
        </div>
      </div>
    </div>

    <!-- Modal: Aviso Legal -->
    <div v-if="isAvisoOpen" class="modal-overlay" @click.self="isAvisoOpen = false">
      <div class="modal-card text-brand-brown-dark flex flex-col gap-4">
        <div class="border-brand-pink-light/30 flex items-center justify-between border-b pb-4">
          <h3 class="text-brand-brown-dark font-serif text-xl font-bold">Aviso Legal</h3>
          <button
            @click="isAvisoOpen = false"
            class="text-brand-brown hover:text-brand-brown-dark cursor-pointer p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div class="space-y-4 text-sm leading-relaxed">
          <p>
            En cumplimiento del deber de información, se hace constar que este sitio web es una
            presentación informativa y comercial para el centro de ecografías emocionales <strong>EcoNane</strong>, ubicado en Villajoyosa (Alicante).
          </p>
          <p class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/60 p-3 text-xs italic text-brand-brown-dark">
            <strong>Aviso de carácter no diagnóstico:</strong> Las sesiones de ecografía emocional 4D y 5D realizadas en EcoNane tienen una finalidad exclusivamente afectiva, lúdica y de recuerdo familiar. En ningún caso sustituyen las ecografías médicas diagnósticas ni el seguimiento ginecológico y obstétrico oficial de la salud del embarazo.
          </p>
          <p>
            El desarrollo técnico y diseño web ha sido realizado por
            <a
              href="https://martinezdom.github.io/"
              target="_blank"
              class="text-brand-pink font-semibold hover:underline"
              >Miguel Ángel Martínez Domínguez (@martinezdom)</a
            > ·
            <a
              href="https://confitic.es"
              target="_blank"
              class="text-brand-pink font-semibold hover:underline"
              >ConfiTIC</a
            >.
          </p>
          <p>
            Todos los derechos sobre los contenidos, imágenes y código fuente de esta página web
            están protegidos por la normativa de propiedad intelectual.
          </p>
        </div>
        <div class="mt-6 flex justify-end">
          <button @click="isAvisoOpen = false" class="btn-pill-small">Cerrar</button>
        </div>
      </div>
    </div>

    <!-- Modal: Política de Privacidad -->
    <div v-if="isPrivacidadOpen" class="modal-overlay" @click.self="isPrivacidadOpen = false">
      <div class="modal-card text-brand-brown-dark flex flex-col gap-4 max-h-[85vh] overflow-y-auto">
        <div class="border-brand-pink-light/30 flex items-center justify-between border-b pb-4 sticky top-0 bg-white z-10">
          <h3 class="text-brand-brown-dark font-serif text-xl font-bold">Política de Privacidad</h3>
          <button
            @click="isPrivacidadOpen = false"
            class="text-brand-brown hover:text-brand-brown-dark cursor-pointer p-1 text-lg font-bold"
          >
            ✕
          </button>
        </div>
        <div class="space-y-4 text-xs sm:text-sm leading-relaxed text-brand-brown/90">
          <p>
            Esta Política de Privacidad describe cómo <strong>EcoNane</strong> recopila, utiliza y protege la información personal de sus usuarias y clientas, en estricto cumplimiento del Reglamento General de Protección de Datos (RGPD) y la Ley Orgánica de Protección de Datos (LOPDGDD).
          </p>

          <h4 class="font-bold text-brand-brown-dark text-sm">1. Responsable del Tratamiento</h4>
          <p>
            <strong>EcoNane</strong> (Centro de Ecografía Emocional)<br />
            Ubicación: Villajoyosa, Alicante · Correo: <a href="mailto:naneecografias@gmail.com" class="text-brand-pink underline">naneecografias@gmail.com</a> · Teléfono: +34 644 18 98 56.
          </p>

          <h4 class="font-bold text-brand-brown-dark text-sm">2. Datos Personales Recopilados</h4>
          <p>
            A través del formulario de reserva, contacto por WhatsApp y el portal de entrega digital, recopilamos los siguientes datos proporcionados voluntariamente:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Nombre y apellidos de la madre o familia.</li>
            <li>Número de teléfono móvil de contacto.</li>
            <li>Dirección de correo electrónico (si se facilita para notificaciones).</li>
            <li>Semana de gestación aproximada y servicio solicitado.</li>
            <li>Fotografías y vídeos de la ecografía emocional realizadas durante la sesión acordada.</li>
          </ul>

          <h4 class="font-bold text-brand-brown-dark text-sm">3. Finalidad y Base Legal</h4>
          <p>
            Tus datos son tratados exclusivamente con la base legal de tu consentimiento para:
          </p>
          <ul class="list-disc pl-5 space-y-1">
            <li>Gestionar y coordinar tu cita previa en el centro.</li>
            <li>Poner a tu disposición el portal privado y seguro para la visualización y descarga de tus fotografías y archivos ZIP.</li>
            <li>No se realizarán envíos publicitarios no solicitados ni se cederán datos a terceros bajo ninguna circunstancia.</li>
          </ul>

          <h4 class="font-bold text-brand-brown-dark text-sm">4. Seguridad y Privacidad de las Ecografías</h4>
          <p>
            Las fotografías y recuerdos de tu ecografía se almacenan en un entorno en la nube cifrado y solo son accesibles mediante el enlace único de tu sesión protegido por tu clave PIN personal (los 4 últimos dígitos de tu teléfono móvil).
          </p>

          <h4 class="font-bold text-brand-brown-dark text-sm">5. Ejercicio de Derechos (ARCO)</h4>
          <p>
            Puedes ejercer en cualquier momento tus derechos de acceso, rectificación, supresión (derecho al olvido) y limitación del tratamiento enviando un correo a <a href="mailto:naneecografias@gmail.com" class="text-brand-pink underline">naneecografias@gmail.com</a> indicando tu solicitud.
          </p>

          <h4 class="font-bold text-brand-brown-dark text-sm">6. Uso de Cookies</h4>
          <p>
            Este sitio web no utiliza cookies publicitarias, de rastreo de terceros ni herramientas de analítica invasiva. Únicamente se emplea almacenamiento técnico indispensable (como la memoria local de sesión) para garantizar el funcionamiento seguro del portal privado de ecografías y el acceso al panel de administración. Por esta razón, conforme a la normativa vigente (LSSI-CE y RGPD), no es necesaria la instalación de un banner de consentimiento de cookies.
          </p>
        </div>
        <div class="mt-4 flex justify-end border-t border-brand-pink-light/30 pt-3">
          <button @click="isPrivacidadOpen = false" class="btn-pill-small">Entendido y Cerrar</button>
        </div>
      </div>
    </div>
  </footer>
</template>
