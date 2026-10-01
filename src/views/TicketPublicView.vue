<script setup lang="ts">
import { computed, ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import {
  Printer,
  ShieldCheck,
  AlertTriangle,
  ArrowLeft,
  Calendar,
  CreditCard,
  Building,
  CheckCircle2,
  Lock
} from '@lucide/vue'

const route = useRoute()
const router = useRouter()
const { getTicketByToken, businessInfo } = useSiteData()

const ticketNumber = computed(() => (route.params.ticketNumber as string) || '')
const token = computed(() => (route.query.token as string) || '')

const ticket = computed(() => {
  if (!ticketNumber.value || !token.value) return null
  return getTicketByToken(ticketNumber.value, token.value)
})

const isAuthorized = computed(() => Boolean(ticket.value))

function handlePrint() {
  window.print()
}

function handleGoHome() {
  router.push('/')
}
</script>

<template>
  <div class="min-h-screen bg-brand-cream/40 py-8 px-4 sm:px-6 lg:px-8 print:p-0 print:bg-white text-stone-800">
    <!-- IDOR / Unauthorized View -->
    <div v-if="!ticket" class="max-w-md mx-auto my-16 bg-white rounded-3xl p-8 shadow-sm border border-brand-pink-light/40 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600">
        <Lock class="w-8 h-8" />
      </div>
      <h1 class="text-xl font-bold font-serif text-brand-brown-dark mb-2">Comprobante no accesible</h1>
      <p class="text-sm text-stone-600 mb-6 leading-relaxed">
        El enlace es incorrecto, ha caducado o no dispone del token de seguridad para visualizar esta factura. Por motivos de privacidad y protección de datos (RGPD), el acceso directo sin acreditación criptográfica está protegido.
      </p>
      <button
        @click="handleGoHome"
        class="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-2xl bg-brand-brown text-white hover:bg-brand-brown-dark font-medium text-sm transition-colors shadow-sm cursor-pointer"
      >
        <ArrowLeft class="w-4 h-4" />
        Volver a la página principal
      </button>
    </div>

    <!-- Authorized Ticket Content -->
    <div v-else class="max-w-3xl mx-auto">
      <!-- Top Action Bar (hidden on print) -->
      <div class="flex items-center justify-between gap-4 mb-6 print:hidden">
        <button
          @click="handleGoHome"
          class="inline-flex items-center gap-2 text-sm text-brand-brown/80 hover:text-brand-brown-dark transition-colors font-semibold cursor-pointer"
        >
          <ArrowLeft class="w-4 h-4" />
          <span>Volver a EcoNane</span>
        </button>

        <div class="flex items-center gap-3">
          <button
            @click="handlePrint"
            class="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-brand-brown hover:bg-brand-brown-dark text-white text-sm font-bold shadow-md hover:shadow-lg transition-all active:scale-95 cursor-pointer"
          >
            <Printer class="w-4 h-4" />
            <span>Imprimir / Guardar en PDF</span>
          </button>
        </div>
      </div>

      <!-- Main Invoice Document -->
      <div class="bg-white rounded-3xl p-8 sm:p-12 shadow-sm border border-stone-200 print:border-none print:shadow-none print:p-0">
        <!-- Status Banner if Cancelled -->
        <div v-if="ticket.status === 'anulado'" class="mb-8 p-4 rounded-2xl bg-red-50 border border-red-200 text-red-700 flex items-center gap-3 text-sm">
          <AlertTriangle class="w-5 h-5 shrink-0" />
          <div>
            <strong class="font-bold">FACTURA ANULADA:</strong> Este comprobante fue anulado formalmente ({{ ticket.cancelledReason || 'Anulado' }}).
          </div>
        </div>

        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-start justify-between gap-6 pb-8 border-b border-stone-200">
          <div>
            <div class="flex items-center gap-2.5 mb-2">
              <span class="text-2xl font-bold font-serif tracking-tight text-brand-brown-dark">{{ businessInfo.name || 'EcoNane' }}</span>
              <span class="text-xs px-2.5 py-0.5 rounded-full bg-brand-pink-light/40 text-brand-brown-dark font-semibold uppercase tracking-wider">
                {{ ticket.isNominative ? 'Factura Nominativa' : 'Factura Simplificada' }}
              </span>
            </div>
            <p class="text-xs text-stone-500 max-w-sm leading-relaxed">
              Centro de Ecografía Emocional y Recuerdos del Bebé
            </p>
          </div>

          <div class="text-left sm:text-right">
            <div class="text-xl font-bold font-mono text-stone-900 tracking-tight mb-1">
              {{ ticket.ticketNumber }}
            </div>
            <div class="text-xs text-stone-500 flex items-center sm:justify-end gap-1.5 mb-1">
              <Calendar class="w-3.5 h-3.5" />
              <span>Fecha: {{ ticket.date }} · {{ ticket.time }}</span>
            </div>
            <div class="text-xs text-stone-500 flex items-center sm:justify-end gap-1.5">
              <CreditCard class="w-3.5 h-3.5" />
              <span>Pago: {{ ticket.paymentMethod.toUpperCase() }}</span>
            </div>
          </div>
        </div>

        <!-- Fiscal Details (Emisor & Cliente) -->
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 py-8 border-b border-stone-200 text-xs text-stone-600">
          <!-- Emisor -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Datos del Emisor</span>
            <p class="font-bold text-stone-900 text-sm">{{ businessInfo.legalName || 'EcoNane' }}</p>
            <p><span class="text-stone-400">NIF / CIF:</span> <strong class="text-stone-800">{{ businessInfo.nif || 'En trámite' }}</strong></p>
            <p>{{ businessInfo.address || 'Carrer Major, 12' }}</p>
            <p>{{ businessInfo.postalCode }} {{ businessInfo.city }}</p>
            <p v-if="businessInfo.phone"><span class="text-stone-400">Tel:</span> {{ businessInfo.phone }}</p>
            <p v-if="businessInfo.email"><span class="text-stone-400">Email:</span> {{ businessInfo.email }}</p>
          </div>

          <!-- Cliente / Destinatario -->
          <div class="space-y-1.5">
            <span class="text-[11px] font-bold text-stone-400 uppercase tracking-wider block mb-2">Cliente / Destinatario</span>
            <p class="font-bold text-stone-900 text-sm">{{ ticket.clientName }}</p>
            <p v-if="ticket.clientNif">
              <span class="text-stone-400">NIF / CIF:</span> <strong class="text-stone-800">{{ ticket.clientNif }}</strong>
            </p>
            <p v-if="ticket.clientAddress">
              <span class="text-stone-400">Domicilio Fiscal:</span> {{ ticket.clientAddress }}
            </p>
            <p v-if="ticket.clientPhone"><span class="text-stone-400">Teléfono:</span> {{ ticket.clientPhone }}</p>
            <p v-if="ticket.clientEmail"><span class="text-stone-400">Email:</span> {{ ticket.clientEmail }}</p>
          </div>
        </div>

        <!-- Items Table -->
        <div class="py-6">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-stone-200 text-stone-400 text-[11px] uppercase tracking-wider">
                <th class="pb-3 font-semibold">Concepto / Servicio</th>
                <th class="pb-3 text-center font-semibold w-16">Cant.</th>
                <th class="pb-3 text-right font-semibold w-24">Precio Unit.</th>
                <th class="pb-3 text-right font-semibold w-24">Total</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-stone-100">
              <tr v-for="item in ticket.items" :key="item.id" class="text-stone-700">
                <td class="py-3.5 pr-2 font-medium text-stone-900">
                  {{ item.title }}
                </td>
                <td class="py-3.5 text-center text-stone-500">
                  {{ item.quantity }}
                </td>
                <td class="py-3.5 text-right text-stone-500">
                  {{ item.unitPrice.toFixed(2) }} €
                </td>
                <td class="py-3.5 text-right font-semibold text-stone-900">
                  {{ item.totalPrice.toFixed(2) }} €
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Totals & Taxes Breakdown -->
        <div class="pt-4 border-t border-stone-200">
          <div class="sm:w-72 ml-auto space-y-2 text-xs">
            <div v-if="ticket.discountAmount && ticket.discountAmount > 0" class="flex justify-between text-emerald-600 font-medium">
              <span>Descuento aplicado {{ ticket.discountNote ? `(${ticket.discountNote})` : '' }}:</span>
              <span>-{{ ticket.discountAmount.toFixed(2) }} €</span>
            </div>

            <div class="flex justify-between text-stone-600">
              <span>Base Imponible:</span>
              <span class="font-mono font-medium">{{ ticket.subtotal.toFixed(2) }} €</span>
            </div>

            <div class="flex justify-between text-stone-600">
              <span>IVA ({{ ticket.ivaRate }}%):</span>
              <span class="font-mono font-medium">{{ ticket.ivaAmount.toFixed(2) }} €</span>
            </div>

            <div class="flex justify-between text-base font-bold text-stone-900 pt-3 border-t border-stone-200">
              <span>TOTAL FACTURA:</span>
              <span class="font-mono font-bold text-brand-brown text-lg">{{ ticket.total.toFixed(2) }} €</span>
            </div>
          </div>
        </div>

        <!-- Notes if any -->
        <div v-if="ticket.notes" class="mt-8 p-3.5 rounded-xl bg-stone-50 border border-stone-100 text-xs text-stone-600">
          <strong class="font-semibold text-stone-800">Observaciones:</strong> {{ ticket.notes }}
        </div>

        <!-- Legal Notices & RGPD & Non-diagnostic disclaimer -->
        <div class="mt-10 pt-6 border-t border-stone-200 space-y-3 text-[11px] leading-relaxed text-stone-500">
          <div class="p-3 rounded-xl bg-amber-50/60 border border-amber-100/80 text-amber-900">
            <p class="font-medium">
              <strong>Mención de Ecografía No Diagnóstica:</strong> Servicio de carácter lúdico y emocional; no sustituye ni tiene finalidad diagnóstica médica obstétrica.
            </p>
          </div>

          <p class="text-stone-400">
            <strong>Protección de Datos (RGPD):</strong> De conformidad con el RGPD y la LOPDGDD, EcoNane trata sus datos para la gestión contable y envío del comprobante de compra. No se cederán a terceros salvo obligación legal.
          </p>

          <p class="text-stone-400 text-center pt-2">
            Factura simplificada emitida de conformidad con el Real Decreto 1619/2012 por el que se aprueba el Reglamento de facturación.
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@page {
  margin: 0;
  size: auto;
}

@media print {
  body {
    margin: 0 !important;
    padding: 12mm 15mm !important;
    background: #ffffff !important;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
}
</style>
