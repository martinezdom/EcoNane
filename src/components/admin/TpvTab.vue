<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type {
  SaleTicket,
  TicketItem,
  PaymentMethod,
  Appointment,
  ClientSession,
  CollaboratorPack
} from '@/types'
import {
  Plus,
  Trash2,
  Receipt,
  Sparkles,
  ShoppingBag,
  Wallet,
  CreditCard,
  Smartphone,
  Building,
  Check,
  X,
  Printer,
  Send,
  Star,
  ExternalLink,
  Coins,
  Camera
} from '@lucide/vue'

const props = defineProps<{
  prefilledAppointment?: Appointment | null
  prefilledClient?: { name: string; phone?: string; email?: string; serviceTitle?: string; servicePrice?: string } | null
}>()

const emit = defineEmits<{
  (e: 'ticket-created', ticket: SaleTicket): void
}>()

const {
  experiences,
  packs,
  collaboratorPacks,
  products,
  businessInfo,
  appointments,
  sessions,
  createSaleTicket,
  sendTicketEmail,
  addProduct,
  deleteProduct,
  generateNextTicketNumber,
  getWhatsAppTicketShareUrl
} = useSiteData()

// -------------------------------------------------------------
// TPV CART & DATA STATE
// -------------------------------------------------------------
interface CartItem {
  id: string
  title: string
  unitPrice: number
  quantity: number
  ivaPercent: number
  isCollaborator?: boolean
  collaboratorName?: string
  collaboratorShare?: number
  agencyCommission?: number
  ecoShare?: number
}

const tpvCart = ref<CartItem[]>([])
const tpvClientName = ref('')
const tpvClientEmail = ref('')
const tpvClientPhone = ref('')
const tpvClientNif = ref('')
const tpvClientAddress = ref('')
const tpvIsNominative = ref(false)
const tpvPaymentMethod = ref<PaymentMethod>('efectivo')
const tpvNotes = ref('')
const tpvSendEmail = ref(true)
const isSubmittingSale = ref(false)

// Cash change helper
const cashReceived = ref<number | null>(null)

// TPV Category Navigation Filter
const tpvCategoryFilter = ref<'all' | 'experiences' | 'packs' | 'collab' | 'products'>('all')

// TPV Discounts Engine
const tpvDiscountType = ref<'none' | 'percent' | 'fixed'>('none')
const tpvDiscountValue = ref<number>(0)
const tpvDiscountNote = ref('')

// Modals & Feedback
const showCustomItemForm = ref(false)
const customItemTitle = ref('')
const customItemPrice = ref<number | null>(null)

const showNewProductModal = ref(false)
const newProductForm = ref({
  title: '',
  price: '10€',
  category: 'Ropa y Bebé',
  description: '',
  active: true
})

const lastCompletedTicket = ref<SaleTicket | null>(null)
const emailStatusNotice = ref<{ success: boolean; simulated?: boolean; message: string } | null>(null)
const feedbackMessage = ref('')

function showFeedback(msg: string) {
  feedbackMessage.value = msg
  setTimeout(() => {
    feedbackMessage.value = ''
  }, 4000)
}

function escapeHtml(text?: string | null): string {
  if (!text) return ''
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  }
  return text.replace(/[&<>"']/g, m => map[m] || m)
}

// -------------------------------------------------------------
// CART OPERATIONS
// -------------------------------------------------------------
function addToCart(title: string, priceStrOrNum: string | number) {
  const numPrice = typeof priceStrOrNum === 'number'
    ? priceStrOrNum
    : parseFloat(priceStrOrNum.replace(/[^\d.,]/g, '').replace(',', '.')) || 0

  const existing = tpvCart.value.find(i => i.title.toLowerCase() === title.toLowerCase())
  if (existing) {
    existing.quantity++
  } else {
    tpvCart.value.push({
      id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title,
      unitPrice: numPrice,
      quantity: 1,
      ivaPercent: businessInfo.value.defaultIva || 21
    })
  }
}

function updateCartQty(index: number, delta: number) {
  const item = tpvCart.value[index]
  if (!item) return
  item.quantity += delta
  if (item.quantity <= 0) {
    tpvCart.value.splice(index, 1)
  }
}

function removeFromCart(index: number) {
  tpvCart.value.splice(index, 1)
}

function clearCart() {
  tpvCart.value = []
  cashReceived.value = null
}

function addCollaboratorPackToCart(cPack: CollaboratorPack) {
  const existing = tpvCart.value.find(i => i.title.toLowerCase() === cPack.title.toLowerCase())
  if (existing) {
    existing.quantity++
  } else {
    tpvCart.value.push({
      id: 'cart-' + Date.now() + '-' + Math.random().toString(36).substring(2, 5),
      title: `[Eco+Foto] ${cPack.title}`,
      unitPrice: typeof cPack.price === 'number' ? cPack.price : parseFloat(cPack.price.replace(/[^\d.,]/g, '').replace(',', '.')) || 0,
      quantity: 1,
      ivaPercent: businessInfo.value.defaultIva || 21,
      isCollaborator: true,
      collaboratorName: 'Penélope Photograph',
      collaboratorShare: cPack.penelopeShare,
      agencyCommission: Math.round((cPack.econaneShare - cPack.ecoPrice) * 100) / 100,
      ecoShare: cPack.ecoPrice
    })
  }
  showFeedback(`Pack de Fotografía añadido: ${cPack.title}`)
}

function addCustomItem() {
  if (!customItemTitle.value.trim() || customItemPrice.value === null || customItemPrice.value < 0) return
  addToCart(customItemTitle.value.trim(), customItemPrice.value)
  customItemTitle.value = ''
  customItemPrice.value = null
  showCustomItemForm.value = false
  showFeedback('Concepto personalizado añadido a la cuenta.')
}

// Discount setter
function setTpvDiscountType(type: 'none' | 'percent' | 'fixed') {
  tpvDiscountType.value = type
  if (type === 'none') {
    tpvDiscountValue.value = 0
    tpvDiscountNote.value = ''
  } else if (type === 'percent') {
    if (!tpvDiscountValue.value || tpvDiscountValue.value > 100) {
      tpvDiscountValue.value = 10
    }
  } else if (type === 'fixed') {
    if (!tpvDiscountValue.value) {
      tpvDiscountValue.value = 5
    }
  }
}

// -------------------------------------------------------------
// TOTALS COMPUTATIONS
// -------------------------------------------------------------
const tpvGrossTotal = computed(() => {
  return Math.round(tpvCart.value.reduce((sum, item) => sum + (item.unitPrice * item.quantity), 0) * 100) / 100
})

const tpvDiscountAmount = computed(() => {
  const gross = tpvGrossTotal.value
  if (gross <= 0) return 0
  if (tpvDiscountType.value === 'percent') {
    const pct = Math.min(100, Math.max(0, Number(tpvDiscountValue.value) || 0))
    return Math.round((gross * (pct / 100)) * 100) / 100
  }
  if (tpvDiscountType.value === 'fixed') {
    const fixedVal = Math.max(0, Number(tpvDiscountValue.value) || 0)
    return Math.min(gross, Math.round(fixedVal * 100) / 100)
  }
  return 0
})

const tpvTotal = computed(() => {
  return Math.max(0, Math.round((tpvGrossTotal.value - tpvDiscountAmount.value) * 100) / 100)
})

const tpvSubtotal = computed(() => {
  const ivaRate = businessInfo.value.defaultIva || 21
  return Math.round((tpvTotal.value / (1 + (ivaRate / 100))) * 100) / 100
})

const tpvIvaAmount = computed(() => {
  return Math.round((tpvTotal.value - tpvSubtotal.value) * 100) / 100
})

// Opción B: Suplidos recaudados por cuenta de terceros (Penélope Photograph)
const tpvThirdPartySuplidoTotal = computed(() => {
  return Math.round(
    tpvCart.value
      .filter(i => i.isCollaborator)
      .reduce((sum, item) => sum + ((item.collaboratorShare || 0) * item.quantity), 0) * 100
  ) / 100
})

const tpvEconaneNetRevenue = computed(() => {
  return Math.max(0, Math.round((tpvTotal.value - tpvThirdPartySuplidoTotal.value) * 100) / 100)
})

// Cash change calculation
const cashChange = computed(() => {
  if (cashReceived.value === null || cashReceived.value === undefined) return null
  return Math.max(0, Math.round((cashReceived.value - tpvTotal.value) * 100) / 100)
})

// -------------------------------------------------------------
// QUICK CLIENT LOADERS
// -------------------------------------------------------------
function loadFromAppointment(appt: Appointment) {
  tpvClientName.value = appt.clientName || ''
  tpvClientPhone.value = appt.clientPhone || ''
  tpvClientEmail.value = appt.clientEmail || ''
  tpvNotes.value = `Cita Ref: ${appt.bookingCode}${appt.notes ? ' · ' + appt.notes : ''}`
  addToCart(appt.serviceTitle, appt.servicePrice)
  showFeedback(`Cita ${appt.bookingCode} de ${appt.clientName} cargada en el TPV.`)
}

function loadFromSession(session: ClientSession) {
  tpvClientName.value = session.clientName || ''
  tpvClientPhone.value = session.clientPhone || ''
  if (!tpvCart.value.length && session.serviceType) {
    addToCart(session.serviceType, 50)
  }
  showFeedback(`Entrega de ${session.clientName} cargada en el TPV.`)
}

// Watchers for incoming prefill props
watch(
  () => props.prefilledAppointment,
  (newAppt) => {
    if (newAppt) {
      loadFromAppointment(newAppt)
    }
  },
  { immediate: true }
)

watch(
  () => props.prefilledClient,
  (newClient) => {
    if (newClient) {
      if (newClient.name) tpvClientName.value = newClient.name
      if (newClient.phone) tpvClientPhone.value = newClient.phone
      if (newClient.email) tpvClientEmail.value = newClient.email
      if (newClient.serviceTitle) {
        addToCart(newClient.serviceTitle, newClient.servicePrice || 45)
      }
    }
  },
  { immediate: true }
)

// -------------------------------------------------------------
// PRODUCT CATALOG MANAGEMENT
// -------------------------------------------------------------
async function handleCreateProduct() {
  if (!newProductForm.value.title.trim()) {
    alert('Introduce el nombre del producto.')
    return
  }
  let cleanPrice = newProductForm.value.price.trim()
  if (!cleanPrice.includes('€')) {
    cleanPrice = cleanPrice + '€'
  }
  await addProduct({
    title: newProductForm.value.title.trim(),
    price: cleanPrice,
    category: newProductForm.value.category.trim() || 'Ropa y Bebé',
    description: newProductForm.value.description.trim(),
    active: true
  })
  newProductForm.value = {
    title: '',
    price: '10€',
    category: 'Ropa y Bebé',
    description: '',
    active: true
  }
  showNewProductModal.value = false
  showFeedback('¡Nuevo producto añadido al catálogo!')
}

async function handleDeleteProduct(id: string, title: string) {
  if (confirm(`¿Seguro que deseas eliminar el producto "${title}" del catálogo?`)) {
    await deleteProduct(id)
    showFeedback(`Producto "${title}" eliminado.`)
  }
}

// -------------------------------------------------------------
// PROCESS SALE & ISSUE TICKET
// -------------------------------------------------------------
async function handleProcessSale() {
  if (tpvCart.value.length === 0) {
    alert('Añade al menos un servicio o producto a la cuenta.')
    return
  }
  if (!tpvClientName.value.trim()) {
    alert('Introduce el nombre de la clienta.')
    return
  }

  isSubmittingSale.value = true
  emailStatusNotice.value = null

  try {
    const items: TicketItem[] = tpvCart.value.map(it => ({
      id: it.id,
      title: it.title,
      quantity: it.quantity,
      unitPrice: it.unitPrice,
      totalPrice: Math.round(it.unitPrice * it.quantity * 100) / 100,
      ivaPercent: it.ivaPercent,
      isCollaborator: it.isCollaborator,
      collaboratorName: it.collaboratorName,
      collaboratorShare: it.collaboratorShare,
      agencyCommission: it.agencyCommission,
      ecoShare: it.ecoShare
    }))

    const isNominativeInvoice = tpvIsNominative.value || Boolean(tpvClientAddress.value.trim() || tpvClientNif.value.trim())

    const computedDiscountNote = tpvDiscountAmount.value > 0
      ? (tpvDiscountNote.value.trim() || (tpvDiscountType.value === 'percent' ? `${tpvDiscountValue.value}% de descuento` : `${tpvDiscountValue.value}€ de descuento`))
      : undefined

    const newTicket = await createSaleTicket({
      clientName: tpvClientName.value,
      clientEmail: tpvClientEmail.value,
      clientPhone: tpvClientPhone.value,
      clientNif: tpvClientNif.value,
      clientAddress: tpvClientAddress.value,
      isNominative: isNominativeInvoice,
      items,
      paymentMethod: tpvPaymentMethod.value,
      discountAmount: tpvDiscountAmount.value,
      discountNote: computedDiscountNote,
      notes: tpvNotes.value,
      ivaRate: businessInfo.value.defaultIva || 21
    })

    lastCompletedTicket.value = newTicket
    emit('ticket-created', newTicket)

    if (tpvSendEmail.value && newTicket.clientEmail) {
      try {
        const emailRes = await sendTicketEmail(newTicket)
        if (emailRes.success) {
          emailStatusNotice.value = {
            success: true,
            message: `Factura enviada por email a ${newTicket.clientEmail}`
          }
        } else {
          emailStatusNotice.value = {
            success: false,
            simulated: emailRes.simulated,
            message: emailRes.message || 'No se pudo enviar el correo de la factura.'
          }
        }
      } catch (e: any) {
        emailStatusNotice.value = {
          success: false,
          message: e?.message || 'Error al conectar con el servidor de correo.'
        }
      }
    }

    // Reset current sale form
    clearCart()
    tpvClientName.value = ''
    tpvClientEmail.value = ''
    tpvClientPhone.value = ''
    tpvClientNif.value = ''
    tpvClientAddress.value = ''
    tpvIsNominative.value = false
    setTpvDiscountType('none')
    tpvNotes.value = ''
    tpvPaymentMethod.value = 'efectivo'
    cashReceived.value = null

    showFeedback(`¡Venta completada! Ticket ${newTicket.ticketNumber} registrado correctamente.`)
  } catch (err: any) {
    alert('Error al registrar la venta: ' + (err?.message || err))
  } finally {
    isSubmittingSale.value = false
  }
}

// -------------------------------------------------------------
// POST-SALE ACTIONS (PRINT, WHATSAPP, REVIEW)
// -------------------------------------------------------------
function handlePrintTicket(ticket: SaleTicket) {
  const printWindow = window.open('', '_blank', 'width=600,height=750')
  if (!printWindow) return

  const biz = businessInfo.value
  const itemsHtml = ticket.items.map((it: TicketItem) => `
    <tr>
      <td style="padding: 7px 0; border-bottom: 1px dashed #e2d9d2;">${Number(it.quantity || 1)}x ${escapeHtml(it.title)}</td>
      <td style="padding: 7px 0; text-align: right; border-bottom: 1px dashed #e2d9d2; font-weight: bold;">${it.totalPrice.toFixed(2)} €</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Ticket ${escapeHtml(ticket.ticketNumber)}</title>
        <style>
          body {
            font-family: 'Courier New', Courier, monospace;
            width: 300px;
            margin: 0 auto;
            padding: 18px;
            color: #2b221e;
            font-size: 12px;
            line-height: 1.35;
          }
          .header { text-align: center; margin-bottom: 14px; border-bottom: 2px solid #2b221e; padding-bottom: 10px; }
          .header h1 { margin: 0; font-size: 17px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; }
          .header p { margin: 2px 0; font-size: 11px; }
          table { width: 100%; border-collapse: collapse; margin: 12px 0; }
          .totals { margin-top: 10px; border-top: 1px solid #2b221e; padding-top: 8px; }
          .row { display: flex; justify-content: space-between; margin: 3px 0; }
          .total-big { font-size: 15px; font-weight: bold; border-top: 2px solid #2b221e; padding-top: 6px; margin-top: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 10px; border-top: 1px dashed #ccc; padding-top: 10px; }
          @media print {
            body { padding: 0; width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${escapeHtml(biz.name || 'EcoNane')}</h1>
          <p>${escapeHtml(biz.legalName || 'EcoNane Ecografías Emocionales')}</p>
          <p>NIF/CIF: ${escapeHtml(biz.nif || '')}</p>
          <p>${escapeHtml(biz.address || '')}</p>
          <p>${escapeHtml(biz.postalCode || '')} ${escapeHtml(biz.city || '')}</p>
          <p>Tel: ${escapeHtml(biz.phone || '')}</p>
        </div>

        <div style="margin-bottom: 10px;">
          <div class="row"><span><strong>FACTURA SIMPLIFICADA:</strong></span><span style="font-weight: bold;">${escapeHtml(ticket.ticketNumber)}</span></div>
          <div class="row"><span>Fecha:</span><span>${escapeHtml(ticket.date)} ${escapeHtml(ticket.time)}</span></div>
          <div class="row"><span>Clienta:</span><span>${escapeHtml(ticket.clientName)}</span></div>
          ${ticket.clientNif ? `<div class="row"><span>NIF:</span><span>${escapeHtml(ticket.clientNif)}</span></div>` : ''}
          ${ticket.clientAddress ? `<div class="row"><span>Dir:</span><span>${escapeHtml(ticket.clientAddress)}</span></div>` : ''}
          <div class="row"><span>Forma de pago:</span><span style="text-transform: uppercase;">${escapeHtml(ticket.paymentMethod)}</span></div>
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1px solid #2b221e;">
              <th style="text-align: left; padding-bottom: 4px;">Concepto</th>
              <th style="text-align: right; padding-bottom: 4px;">Importe</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          ${ticket.discountAmount && ticket.discountAmount > 0 ? `
            <div class="row" style="color: #047857; font-weight: bold;">
              <span>Descuento aplicado:</span>
              <span>-${ticket.discountAmount.toFixed(2)} €</span>
            </div>
          ` : ''}
          <div class="row"><span>Base Imponible:</span><span>${ticket.subtotal.toFixed(2)} €</span></div>
          <div class="row"><span>IVA (${ticket.ivaRate}%):</span><span>${ticket.ivaAmount.toFixed(2)} €</span></div>
          <div class="row total-big">
            <span>TOTAL:</span>
            <span>${ticket.total.toFixed(2)} €</span>
          </div>
        </div>

        <div class="footer">
          <p>¡Gracias por confiar en EcoNane para ver a tu bebé!</p>
          <p>Documento expedido conforme al R.D. 1619/2012</p>
        </div>
      </body>
    </html>
  `)
  printWindow.document.close()
  setTimeout(() => {
    try {
      printWindow.focus()
      printWindow.print()
    } catch (e) {}
  }, 250)
}

function getWhatsAppReviewShareUrl(ticket?: SaleTicket | null) {
  const phone = ticket?.clientPhone ? ticket.clientPhone.replace(/\D/g, '') : ''
  const fullPhone = phone ? (phone.startsWith('34') ? phone : `34${phone}`) : ''
  const name = ticket?.clientName || 'mamá'
  const text = encodeURIComponent(
    `¡Hola ${name}! ❤️ Muchísimas gracias por visitarnos en EcoNane y compartir tu experiencia con nosotros.\n\n` +
    `¿Qué te ha parecido la atención y la ecografía? Nos ayudarías de corazón con tus 5 estrellas dejando una breve reseña en Google (¡solo lleva medio minuto!): ⭐\n\n` +
    `👉 https://share.google/BXdcvYZWLOvxcCEIX\n\n` +
    `¡Mil gracias y un abrazo enorme para toda la familia!`
  )
  return fullPhone ? `https://wa.me/${fullPhone}?text=${text}` : `https://wa.me/?text=${text}`
}
</script>

<template>
  <div class="space-y-6">
    <!-- Feedback Toast -->
    <div
      v-if="feedbackMessage"
      class="rounded-2xl bg-emerald-500 text-white px-4 py-3 text-xs font-bold shadow-lg flex items-center justify-between animate-in fade-in"
    >
      <div class="flex items-center gap-2">
        <Check class="h-4 w-4" />
        <span>{{ feedbackMessage }}</span>
      </div>
      <button @click="feedbackMessage = ''" class="text-white/80 hover:text-white">
        <X class="h-4 w-4" />
      </button>
    </div>

    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <div class="flex items-center gap-2">
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">TPV / Cobro Rápido</h2>
          <span class="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-semibold text-emerald-800">
            Serie {{ businessInfo.ticketSeries || 'FS' }}-{{ new Date().getFullYear() }}
          </span>
        </div>
        <p class="text-sm text-brand-brown/80">
          Selecciona los servicios realizados, introduce los datos de la clienta y emite el ticket digital al instante.
        </p>
      </div>

      <div class="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
        <!-- Quick client loader from appointments -->
        <div v-if="appointments.length > 0" class="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full sm:w-auto">
          <span class="text-xs font-semibold text-brand-brown/80 shrink-0">📅 De Agenda:</span>
          <select
            @change="(e) => {
              const a = appointments.find(item => item.id === (e.target as HTMLSelectElement).value)
              if (a) loadFromAppointment(a)
              ;(e.target as HTMLSelectElement).value = ''
            }"
            class="w-full sm:w-auto rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark shadow-xs focus:border-brand-pink focus:outline-none cursor-pointer"
          >
            <option value="" disabled selected>Seleccionar cita agendada...</option>
            <option v-for="a in appointments" :key="a.id" :value="a.id">
              {{ a.date }} {{ a.time }} · {{ a.clientName }} ({{ a.serviceTitle }})
            </option>
          </select>
        </div>

        <!-- Quick client loader from photo sessions -->
        <div v-if="sessions.length > 0" class="flex flex-col sm:flex-row sm:items-center gap-1.5 w-full sm:w-auto">
          <span class="text-xs font-semibold text-brand-brown/80 shrink-0">📸 De Entrega:</span>
          <select
            @change="(e) => {
              const s = sessions.find(item => item.id === (e.target as HTMLSelectElement).value)
              if (s) loadFromSession(s)
              ;(e.target as HTMLSelectElement).value = ''
            }"
            class="w-full sm:w-auto rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark shadow-xs focus:border-brand-pink focus:outline-none cursor-pointer"
          >
            <option value="" disabled selected>Seleccionar entrega...</option>
            <option v-for="s in sessions" :key="s.id" :value="s.id">
              {{ s.clientName }} ({{ s.serviceType }})
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Main Grid: Catalog (7 cols) + Cart & Checkout (5 cols) -->
    <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <!-- Left: Catalog of Experiences, Packs, Products -->
      <div class="space-y-6 lg:col-span-7">
        <!-- Category Filter Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            type="button"
            @click="tpvCategoryFilter = 'all'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              tpvCategoryFilter === 'all'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            Todas las Categorías
          </button>
          <button
            type="button"
            @click="tpvCategoryFilter = 'experiences'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              tpvCategoryFilter === 'experiences'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            ✨ Ecografías y Experiencias
          </button>
          <button
            type="button"
            @click="tpvCategoryFilter = 'packs'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              tpvCategoryFilter === 'packs'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            📦 Packs de Sesiones
          </button>
          <button
            type="button"
            @click="tpvCategoryFilter = 'collab'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              tpvCategoryFilter === 'collab'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            📷 Eco + Fotos (Penélope)
          </button>
          <button
            type="button"
            @click="tpvCategoryFilter = 'products'"
            :class="[
              'px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap',
              tpvCategoryFilter === 'products'
                ? 'bg-brand-brown text-white shadow-xs'
                : 'bg-brand-cream/60 text-brand-brown-dark hover:bg-brand-pink-light/30'
            ]"
          >
            🛍️ Ropa y Productos
          </button>
        </div>

        <!-- Experiences Grid -->
        <div
          v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'experiences'"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs"
        >
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <Sparkles class="h-5 w-5 text-brand-pink" />
              <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Ecografías y Experiencias</h3>
            </div>
            <button
              @click="showCustomItemForm = true"
              class="flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30 cursor-pointer"
            >
              <Plus class="h-3.5 w-3.5 text-brand-brown" />
              <span>Concepto Personalizado</span>
            </button>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="(exp, idx) in experiences.filter(e => e.active !== false)"
              :key="'exp-' + idx"
              @click="addToCart(exp.title, exp.price)"
              class="group flex cursor-pointer flex-col justify-between rounded-2xl border border-brand-pink-light/30 bg-brand-cream/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-pink hover:bg-brand-pink-light/10 hover:shadow-md"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <span class="font-serif text-sm font-bold text-brand-brown-dark group-hover:text-brand-brown">
                    {{ exp.title }}
                  </span>
                  <span
                    v-if="exp.badge"
                    class="rounded-full bg-brand-pink-light/50 px-2 py-0.5 text-[10px] font-bold text-brand-brown-dark"
                  >
                    {{ exp.badge }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-brand-brown/70 line-clamp-1">
                  {{ exp.duration || 'Sesión emocional' }}
                </p>
              </div>

              <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-2">
                <span class="font-serif text-lg font-bold text-brand-brown-dark">
                  {{ exp.price }}
                </span>
                <span class="flex items-center gap-1 text-xs font-semibold text-brand-brown group-hover:underline">
                  <Plus class="h-3.5 w-3.5" /> Añadir
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Packs Section -->
        <div
          v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'packs'"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs"
        >
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <span class="text-base">📦</span>
              <h4 class="font-serif text-lg font-bold text-brand-brown-dark">Packs de Sesiones</h4>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="(p, idx) in packs"
              :key="'pack-' + idx"
              @click="addToCart(p.title, p.price)"
              class="group flex cursor-pointer flex-col justify-between rounded-2xl border border-brand-pink-light/30 bg-brand-beige/20 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-pink hover:shadow-md"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <span class="font-serif text-sm font-bold text-brand-brown-dark">{{ p.title }}</span>
                  <span v-if="p.save" class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800">
                    {{ p.save }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-brand-brown/70 line-clamp-1">{{ p.description }}</p>
              </div>

              <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-2">
                <span class="font-serif text-lg font-bold text-brand-brown-dark">{{ p.price }}</span>
                <span class="flex items-center gap-1 text-xs font-semibold text-brand-brown group-hover:underline">
                  <Plus class="h-3.5 w-3.5" /> Añadir
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Collaborator Packs Section (Eco + Foto) -->
        <div
          v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'collab'"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs"
        >
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <Camera class="h-5 w-5 text-brand-pink" />
              <div>
                <h4 class="font-serif text-lg font-bold text-brand-brown-dark">Packs Eco + Recuerdo Fotográfico</h4>
                <p class="text-xs text-brand-brown/70">En colaboración con Penélope Photograph (Desglose automático 80/20 Opción B)</p>
              </div>
            </div>
          </div>

          <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div
              v-for="cp in collaboratorPacks"
              :key="cp.id"
              @click="addCollaboratorPackToCart(cp)"
              class="group flex cursor-pointer flex-col justify-between rounded-2xl border border-brand-pink-light/40 bg-gradient-to-b from-brand-pink/5 to-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-pink hover:shadow-md"
            >
              <div>
                <div class="flex items-start justify-between gap-2">
                  <span class="font-serif text-sm font-bold text-brand-brown-dark group-hover:text-brand-brown">
                    {{ cp.title }}
                  </span>
                  <span v-if="cp.badge" class="rounded-full bg-brand-pink text-white px-2 py-0.5 text-[10px] font-bold">
                    {{ cp.badge }}
                  </span>
                </div>
                <p class="mt-1 text-xs text-brand-brown/70 line-clamp-1">{{ cp.subtitle }}</p>
                <div class="mt-2 flex items-center gap-2 text-[10px] text-brand-brown/60">
                  <span>Eco: {{ cp.ecoPrice }}€</span>
                  <span>·</span>
                  <span>Fotos: {{ cp.photoPrice }}€ (80%: {{ cp.penelopeShare.toFixed(2) }}€)</span>
                </div>
              </div>

              <div class="mt-4 flex items-center justify-between border-t border-brand-pink-light/20 pt-2">
                <span class="font-serif text-lg font-bold text-brand-brown-dark">{{ cp.price }}</span>
                <span class="flex items-center gap-1 text-xs font-semibold text-brand-brown group-hover:underline">
                  <Plus class="h-3.5 w-3.5" /> Añadir
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Products Section -->
        <div
          v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'products'"
          class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-xs"
        >
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <ShoppingBag class="h-5 w-5 text-brand-pink" />
              <h4 class="font-serif text-lg font-bold text-brand-brown-dark">
                Ropa y Productos (Babys, Gorritos...)
              </h4>
            </div>
            <button
              @click="showNewProductModal = true"
              class="flex items-center gap-1 text-xs font-semibold text-brand-brown hover:underline cursor-pointer"
            >
              <Plus class="h-3.5 w-3.5" />
              <span>+ Añadir Producto</span>
            </button>
          </div>

          <div v-if="products.length === 0" class="mt-4 rounded-2xl border border-dashed border-brand-pink-light/60 p-6 text-center text-xs text-brand-brown/70">
            No hay productos registrados aún en esta categoría.<br>Pulsa en "+ Añadir Producto" para crear ropa, babys, gorritos, etc.
          </div>

          <div v-else class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div
              v-for="prod in products.filter(p => p.active !== false)"
              :key="prod.id"
              @click="addToCart(prod.title, prod.price)"
              class="group flex cursor-pointer flex-col justify-between rounded-2xl border border-brand-pink-light/30 bg-white p-3.5 shadow-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-pink hover:shadow-md"
            >
              <div>
                <div class="flex items-start justify-between gap-1">
                  <span class="font-serif text-xs font-bold text-brand-brown-dark group-hover:text-brand-brown line-clamp-2">
                    {{ prod.title }}
                  </span>
                  <button
                    @click.stop="handleDeleteProduct(prod.id, prod.title)"
                    class="text-brand-brown/40 hover:text-rose-600 p-0.5 cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Eliminar producto"
                  >
                    <Trash2 class="h-3 w-3" />
                  </button>
                </div>
                <span class="mt-0.5 inline-block text-[10px] text-brand-brown/60">
                  {{ prod.category || 'Ropa y Bebé' }}
                </span>
              </div>

              <div class="mt-3 flex items-center justify-between border-t border-brand-pink-light/20 pt-1.5">
                <span class="font-serif text-sm font-bold text-brand-brown-dark">{{ prod.price }}</span>
                <span class="flex items-center gap-0.5 text-[11px] font-semibold text-brand-brown group-hover:underline">
                  <Plus class="h-3 w-3" /> Añadir
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Right: POS Terminal, Cart & Totals (5 cols) -->
      <div class="space-y-6 lg:col-span-5">
        <div class="sticky top-24 rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-7">
          <!-- Terminal Header -->
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <Receipt class="h-5 w-5 text-brand-brown" />
              <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Ticket en Curso</h3>
            </div>
            <div class="text-right">
              <span class="rounded-lg bg-brand-cream px-2.5 py-1 font-mono text-xs font-bold text-brand-brown">
                {{ generateNextTicketNumber() }}
              </span>
            </div>
          </div>

          <!-- Client Details Form -->
          <div class="mt-4 space-y-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Nombre de la Clienta <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="tpvClientName"
                type="text"
                required
                placeholder="Ej: Laura Domínguez"
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Correo Electrónico
                </label>
                <input
                  v-model="tpvClientEmail"
                  type="email"
                  placeholder="Para enviar el ticket"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Teléfono (WhatsApp)
                </label>
                <input
                  v-model="tpvClientPhone"
                  type="tel"
                  placeholder="644123456"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <!-- Nominative Invoicing Options -->
            <div>
              <div class="flex items-center justify-between">
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  NIF / CIF (Opcional)
                </label>
                <label class="flex items-center gap-1.5 text-[11px] font-semibold text-brand-brown cursor-pointer">
                  <input
                    v-model="tpvIsNominative"
                    type="checkbox"
                    class="rounded text-brand-brown focus:ring-brand-pink cursor-pointer"
                  />
                  <span>Factura Empresa / Autónomo</span>
                </label>
              </div>
              <input
                v-model="tpvClientNif"
                type="text"
                placeholder="Ej: 12345678Z o B-12345678"
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div v-if="tpvIsNominative || tpvClientNif.trim()">
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Domicilio Fiscal de la Clienta / Empresa
              </label>
              <input
                v-model="tpvClientAddress"
                type="text"
                placeholder="Ej: Calle Gran Vía 15, 46005 Valencia"
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
              <p class="mt-0.5 text-[10px] text-brand-brown/70">
                Requisito legal para que la empresa o autónomo pueda deducirse el gasto.
              </p>
            </div>
          </div>

          <!-- Cart Items List -->
          <div class="mt-5 border-t border-brand-pink-light/20 pt-4">
            <div class="flex items-center justify-between mb-2">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Conceptos a Cobrar</span>
              <button
                v-if="tpvCart.length > 0"
                @click="clearCart"
                class="text-xs text-rose-600 hover:underline cursor-pointer"
              >
                Vaciar cuenta
              </button>
            </div>

            <div v-if="tpvCart.length === 0" class="rounded-2xl border border-dashed border-brand-pink-light/60 bg-brand-cream/20 p-5 text-center">
              <p class="text-xs text-brand-brown/70">
                La cuenta está vacía.<br>Pulsa en cualquier servicio de la izquierda para agregarlo.
              </p>
            </div>

            <div v-else class="max-h-56 space-y-2 overflow-y-auto pr-1">
              <div
                v-for="(item, idx) in tpvCart"
                :key="item.id"
                class="flex items-center justify-between rounded-xl border border-brand-pink-light/30 bg-brand-cream/20 p-2.5"
              >
                <div class="flex-1 min-w-0 pr-2">
                  <div class="font-medium text-xs text-brand-brown-dark truncate">{{ item.title }}</div>
                  <div class="text-[11px] text-brand-brown/70">{{ item.unitPrice.toFixed(2) }} €/ud</div>
                  <div v-if="item.isCollaborator" class="mt-0.5 inline-flex items-center gap-1 rounded bg-brand-pink/20 px-1.5 py-0.5 text-[9px] font-bold text-brand-brown">
                    <Camera class="h-2.5 w-2.5 text-brand-pink" />
                    <span>Penélope (Suplido 80%: {{ ((item.collaboratorShare || 0) * item.quantity).toFixed(2) }}€)</span>
                  </div>
                </div>

                <div class="flex items-center gap-1.5">
                  <button
                    @click="updateCartQty(idx, -1)"
                    class="h-6 w-6 rounded-lg border border-brand-pink-light/60 bg-white text-xs font-bold text-brand-brown hover:bg-brand-pink-light/20 flex items-center justify-center cursor-pointer"
                  >
                    -
                  </button>
                  <span class="w-5 text-center text-xs font-bold text-brand-brown-dark">{{ item.quantity }}</span>
                  <button
                    @click="updateCartQty(idx, 1)"
                    class="h-6 w-6 rounded-lg border border-brand-pink-light/60 bg-white text-xs font-bold text-brand-brown hover:bg-brand-pink-light/20 flex items-center justify-center cursor-pointer"
                  >
                    +
                  </button>
                </div>

                <div class="w-16 text-right font-serif text-xs font-bold text-brand-brown-dark">
                  {{ (item.unitPrice * item.quantity).toFixed(2) }} €
                </div>

                <button
                  @click="removeFromCart(idx)"
                  class="ml-1 text-rose-500 hover:text-rose-700 cursor-pointer p-1"
                  title="Eliminar línea"
                >
                  <Trash2 class="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- Discounts Engine -->
          <div v-if="tpvCart.length > 0" class="mt-4 border-t border-brand-pink-light/20 pt-3 space-y-2.5">
            <div class="flex items-center justify-between">
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Descuento o Promoción
              </label>
              <span v-if="tpvDiscountAmount > 0" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Ahorro: -{{ tpvDiscountAmount.toFixed(2) }} €
              </span>
            </div>

            <!-- Type Selector Tabs -->
            <div class="grid grid-cols-3 gap-1 rounded-xl bg-brand-cream/60 p-1 text-xs font-bold">
              <button
                type="button"
                @click="setTpvDiscountType('none')"
                :class="[
                  'py-1.5 rounded-lg transition-all cursor-pointer',
                  tpvDiscountType === 'none'
                    ? 'bg-white text-brand-brown-dark shadow-xs'
                    : 'text-brand-brown/70 hover:text-brand-brown-dark'
                ]"
              >
                Sin Dto.
              </button>
              <button
                type="button"
                @click="setTpvDiscountType('percent')"
                :class="[
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  tpvDiscountType === 'percent'
                    ? 'bg-brand-brown text-white shadow-xs'
                    : 'text-brand-brown/70 hover:text-brand-brown-dark'
                ]"
              >
                <span>Porcentaje (%)</span>
              </button>
              <button
                type="button"
                @click="setTpvDiscountType('fixed')"
                :class="[
                  'py-1.5 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1',
                  tpvDiscountType === 'fixed'
                    ? 'bg-brand-brown text-white shadow-xs'
                    : 'text-brand-brown/70 hover:text-brand-brown-dark'
                ]"
              >
                <span>Importe (€)</span>
              </button>
            </div>

            <!-- Percent input -->
            <div v-if="tpvDiscountType === 'percent'" class="space-y-2 bg-brand-cream/20 p-3 rounded-2xl border border-brand-pink-light/40 animate-in fade-in">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-bold text-brand-brown/80 mb-1">
                    Porcentaje a descontar (%)
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="tpvDiscountValue"
                      type="number"
                      min="0"
                      max="100"
                      step="1"
                      placeholder="Ej: 20"
                      class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-1.5 pr-8 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                    />
                    <span class="absolute right-3 top-2 text-xs font-bold text-brand-brown/60">%</span>
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-brand-brown/80 mb-1">
                    Motivo / Concepto (Opcional)
                  </label>
                  <input
                    v-model="tpvDiscountNote"
                    type="text"
                    placeholder="Ej: Promo Apertura, Amiga..."
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                  />
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[10px] uppercase font-bold text-brand-brown/60 mr-1">Rápidos:</span>
                <button
                  v-for="pct in [5, 10, 15, 20, 25, 50]"
                  :key="'pct-' + pct"
                  type="button"
                  @click="tpvDiscountValue = pct"
                  :class="[
                    'px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer',
                    tpvDiscountValue === pct
                      ? 'bg-brand-brown text-white'
                      : 'bg-white border border-brand-pink-light/50 text-brand-brown hover:bg-brand-pink-light/20'
                  ]"
                >
                  {{ pct }}%
                </button>
              </div>
            </div>

            <!-- Fixed amount input -->
            <div v-if="tpvDiscountType === 'fixed'" class="space-y-2 bg-brand-cream/20 p-3 rounded-2xl border border-brand-pink-light/40 animate-in fade-in">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label class="block text-[11px] font-bold text-brand-brown/80 mb-1">
                    Dinero a descontar (€)
                  </label>
                  <div class="relative">
                    <input
                      v-model.number="tpvDiscountValue"
                      type="number"
                      min="0"
                      :max="tpvGrossTotal"
                      step="0.5"
                      placeholder="Ej: 10"
                      class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-1.5 pr-8 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                    />
                    <span class="absolute right-3 top-2 text-xs font-bold text-brand-brown/60">€</span>
                  </div>
                </div>
                <div>
                  <label class="block text-[11px] font-bold text-brand-brown/80 mb-1">
                    Motivo / Concepto (Opcional)
                  </label>
                  <input
                    v-model="tpvDiscountNote"
                    type="text"
                    placeholder="Ej: Bono regalo, Promo..."
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                  />
                </div>
              </div>
              <div class="flex flex-wrap items-center gap-1.5 pt-1">
                <span class="text-[10px] uppercase font-bold text-brand-brown/60 mr-1">Rápidos:</span>
                <button
                  v-for="amt in [5, 10, 15, 20, 30]"
                  :key="'amt-' + amt"
                  type="button"
                  @click="tpvDiscountValue = amt"
                  :class="[
                    'px-2 py-0.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer',
                    tpvDiscountValue === amt
                      ? 'bg-brand-brown text-white'
                      : 'bg-white border border-brand-pink-light/50 text-brand-brown hover:bg-brand-pink-light/20'
                  ]"
                >
                  {{ amt }}€
                </button>
              </div>
            </div>
          </div>

          <!-- Payment Method Selection -->
          <div class="mt-5 border-t border-brand-pink-light/20 pt-4">
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-2">
              Forma de Cobro
            </label>
            <div class="grid grid-cols-2 gap-2">
              <button
                type="button"
                @click="tpvPaymentMethod = 'efectivo'"
                :class="[
                  'flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer',
                  tpvPaymentMethod === 'efectivo'
                    ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                    : 'border-brand-pink-light/60 bg-white text-brand-brown-dark hover:bg-brand-cream/30'
                ]"
              >
                <Wallet class="h-4 w-4" />
                <span>Efectivo</span>
              </button>

              <button
                type="button"
                @click="tpvPaymentMethod = 'tarjeta'"
                :class="[
                  'flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer',
                  tpvPaymentMethod === 'tarjeta'
                    ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                    : 'border-brand-pink-light/60 bg-white text-brand-brown-dark hover:bg-brand-cream/30'
                ]"
              >
                <CreditCard class="h-4 w-4" />
                <span>Tarjeta</span>
              </button>

              <button
                type="button"
                @click="tpvPaymentMethod = 'bizum'"
                :class="[
                  'flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer',
                  tpvPaymentMethod === 'bizum'
                    ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                    : 'border-brand-pink-light/60 bg-white text-brand-brown-dark hover:bg-brand-cream/30'
                ]"
              >
                <Smartphone class="h-4 w-4" />
                <span>Bizum</span>
              </button>

              <button
                type="button"
                @click="tpvPaymentMethod = 'transferencia'"
                :class="[
                  'flex items-center justify-center gap-2 rounded-xl border p-2.5 text-xs font-bold transition-all cursor-pointer',
                  tpvPaymentMethod === 'transferencia'
                    ? 'border-brand-brown bg-brand-brown text-white shadow-sm'
                    : 'border-brand-pink-light/60 bg-white text-brand-brown-dark hover:bg-brand-cream/30'
                ]"
              >
                <Building class="h-4 w-4" />
                <span>Transferencia</span>
              </button>
            </div>

            <!-- Cash Change Calculator helper -->
            <div
              v-if="tpvPaymentMethod === 'efectivo' && tpvTotal > 0"
              class="mt-3 rounded-2xl bg-amber-50/60 border border-amber-200/80 p-3 space-y-2 animate-in fade-in"
            >
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Coins class="h-3.5 w-3.5 text-amber-700" />
                  <span>Calculadora de Cambio en Mano</span>
                </div>
                <span v-if="cashChange !== null && cashReceived && cashReceived >= tpvTotal" class="text-xs font-bold text-emerald-700">
                  Cambio: {{ cashChange.toFixed(2) }} €
                </span>
              </div>

              <div class="flex items-center gap-2">
                <input
                  v-model.number="cashReceived"
                  type="number"
                  step="0.5"
                  placeholder="Importe entregado..."
                  class="flex-1 rounded-xl border border-amber-300 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 focus:outline-none"
                />
                <button
                  v-for="preset in [20, 50, 100]"
                  :key="'bill-' + preset"
                  type="button"
                  @click="cashReceived = preset"
                  class="rounded-xl border border-amber-200 bg-white px-2.5 py-1 text-[11px] font-bold text-amber-900 hover:bg-amber-100/50 cursor-pointer"
                >
                  {{ preset }}€
                </button>
              </div>
            </div>
          </div>

          <!-- Breakdown and Totals -->
          <div class="mt-5 rounded-2xl bg-brand-cream/40 p-4 space-y-1.5 text-xs">
            <div v-if="tpvDiscountAmount > 0" class="flex justify-between text-emerald-700 font-semibold">
              <span>Descuento aplicado:</span>
              <span>-{{ tpvDiscountAmount.toFixed(2) }} €</span>
            </div>
            <div class="flex justify-between text-brand-brown/80">
              <span>Base Imponible:</span>
              <span class="font-mono font-semibold">{{ tpvSubtotal.toFixed(2) }} €</span>
            </div>
            <div class="flex justify-between text-brand-brown/80">
              <span>IVA Incluido ({{ businessInfo.defaultIva || 21 }}%):</span>
              <span class="font-mono font-semibold">{{ tpvIvaAmount.toFixed(2) }} €</span>
            </div>
            <div class="border-t border-brand-pink-light/30 pt-2 flex justify-between items-baseline">
              <span class="font-serif text-sm font-bold text-brand-brown-dark">TOTAL A COBRAR:</span>
              <span class="font-serif text-2xl font-bold text-brand-brown-dark">{{ tpvTotal.toFixed(2) }} €</span>
            </div>

            <!-- Opción B: Desglose Colaborador Penélope Photograph -->
            <div
              v-if="tpvThirdPartySuplidoTotal > 0"
              class="mt-3 pt-3 border-t border-brand-pink-light/30 bg-brand-pink/10 -mx-4 -mb-4 p-3 rounded-b-2xl space-y-1.5"
            >
              <div class="flex items-center gap-1.5 text-[11px] font-bold text-brand-brown-dark">
                <Camera class="h-3.5 w-3.5 text-brand-pink" />
                <span>Desglose Legal (Opción B - Colaboradora):</span>
              </div>
              <div class="flex justify-between text-[11px] text-brand-brown/85">
                <span>Cobro por cta. Penélope (80% Fotos - Suplido):</span>
                <span class="font-mono font-bold text-emerald-800">{{ tpvThirdPartySuplidoTotal.toFixed(2) }} €</span>
              </div>
              <div class="flex justify-between text-[11px] text-brand-brown/85">
                <span>Ingreso Neto EcoNane (Eco + 20% Comisión):</span>
                <span class="font-mono font-bold text-brand-brown-dark">{{ tpvEconaneNetRevenue.toFixed(2) }} €</span>
              </div>
            </div>
          </div>

          <!-- Email delivery toggle -->
          <div class="mt-4 flex items-center gap-2 text-xs">
            <input
              v-model="tpvSendEmail"
              type="checkbox"
              id="tpvSendEmailCheck"
              class="rounded text-brand-brown focus:ring-brand-pink cursor-pointer"
            />
            <label for="tpvSendEmailCheck" class="text-brand-brown cursor-pointer">
              Enviar ticket oficial por email al completar el cobro
            </label>
          </div>

          <!-- Main Charge Button -->
          <button
            @click="handleProcessSale"
            :disabled="isSubmittingSale || tpvCart.length === 0 || !tpvClientName.trim()"
            class="mt-4 w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3.5 px-4 text-sm font-bold text-white shadow-lg transition-all hover:bg-brand-brown-dark active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            <Receipt class="h-4 w-4" />
            <span v-if="isSubmittingSale">Procesando y emitiendo ticket...</span>
            <span v-else>COBRAR {{ tpvTotal.toFixed(2) }} € Y EMITIR TICKET</span>
          </button>
        </div>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL: CONCEPTO PERSONALIZADO                  -->
    <!-- ============================================== -->
    <div
      v-if="showCustomItemForm"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div class="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-brand-pink-light/40">
        <button
          type="button"
          @click="showCustomItemForm = false"
          class="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>

        <h3 class="font-serif text-lg font-bold text-brand-brown-dark mb-1">Añadir Concepto Personalizado</h3>
        <p class="text-xs text-brand-brown/70 mb-4">
          Para servicios especiales, suplementos o productos no listados habitualmente.
        </p>

        <form @submit.prevent="addCustomItem" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Descripción del Concepto *</label>
            <input
              v-model="customItemTitle"
              type="text"
              required
              placeholder="Ej: Suplemento Gemelar, Marco Ecografía..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Precio con IVA (€) *</label>
            <input
              v-model.number="customItemPrice"
              type="number"
              step="0.5"
              min="0"
              required
              placeholder="Ej: 15"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="showCustomItemForm = false"
              class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white hover:bg-brand-brown-dark transition-colors cursor-pointer shadow-xs"
            >
              Añadir a la Cuenta
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL: AÑADIR PRODUCTO A CATÁLOGO             -->
    <!-- ============================================== -->
    <div
      v-if="showNewProductModal"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div class="relative w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl border border-brand-pink-light/40">
        <button
          type="button"
          @click="showNewProductModal = false"
          class="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>

        <h3 class="font-serif text-lg font-bold text-brand-brown-dark mb-1">Nuevo Producto de Catálogo</h3>
        <p class="text-xs text-brand-brown/70 mb-4">
          Añade un producto físico (baby, gorrito, regalo) para que esté siempre disponible en el TPV.
        </p>

        <form @submit.prevent="handleCreateProduct" class="space-y-4">
          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Nombre del Producto *</label>
            <input
              v-model="newProductForm.title"
              type="text"
              required
              placeholder="Ej: Gorrito Recién Nacido EcoNane"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Precio *</label>
              <input
                v-model="newProductForm.price"
                type="text"
                required
                placeholder="10€"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Categoría</label>
              <input
                v-model="newProductForm.category"
                type="text"
                placeholder="Ropa y Bebé"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label class="block text-xs font-bold text-brand-brown-dark uppercase mb-1">Descripción (Opcional)</label>
            <textarea
              v-model="newProductForm.description"
              rows="2"
              placeholder="Algodón orgánico 100%..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <button
              type="button"
              @click="showNewProductModal = false"
              class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-cream transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white hover:bg-brand-brown-dark transition-colors cursor-pointer shadow-xs"
            >
              Guardar en Catálogo
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- ============================================== -->
    <!-- MODAL: VENTA COMPLETADA Y REPARTO DE TICKET    -->
    <!-- ============================================== -->
    <div
      v-if="lastCompletedTicket"
      @click.self="lastCompletedTicket = null"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in"
    >
      <div class="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-8 shadow-2xl border border-brand-pink-light/40 text-center">
        <button
          type="button"
          @click="lastCompletedTicket = null"
          class="absolute right-5 top-5 rounded-full p-2 text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors"
        >
          <X class="h-5 w-5" />
        </button>

        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-emerald-100 text-emerald-700 mb-4">
          <Check class="h-8 w-8" />
        </div>

        <h3 class="font-serif text-2xl font-bold text-brand-brown-dark">¡Venta Registrada con Éxito!</h3>
        <p class="mt-1 text-xs text-brand-brown/80">
          Ticket <strong class="font-mono text-sm text-brand-brown-dark">{{ lastCompletedTicket.ticketNumber }}</strong> emitido correctamente.
        </p>

        <!-- Ticket Card Overview -->
        <div class="mt-5 rounded-2xl bg-brand-cream/30 p-4 border border-brand-pink-light/40 text-left space-y-2 text-xs">
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Clienta:</span>
            <span class="font-bold text-brand-brown-dark">{{ lastCompletedTicket.clientName }}</span>
          </div>
          <div class="flex justify-between">
            <span class="text-brand-brown/70">Forma de Pago:</span>
            <span class="font-bold uppercase text-brand-brown">{{ lastCompletedTicket.paymentMethod }}</span>
          </div>
          <div v-if="lastCompletedTicket.discountAmount && lastCompletedTicket.discountAmount > 0" class="flex justify-between text-emerald-700 font-semibold">
            <span>Descuento aplicado:</span>
            <span>-{{ lastCompletedTicket.discountAmount.toFixed(2) }} €</span>
          </div>
          <div class="flex justify-between border-t border-brand-pink-light/30 pt-2 font-bold">
            <span class="font-serif text-sm text-brand-brown-dark">Importe Total:</span>
            <span class="font-serif text-base text-brand-brown-dark">{{ lastCompletedTicket.total.toFixed(2) }} €</span>
          </div>
        </div>

        <!-- Email status notice if sent -->
        <div v-if="emailStatusNotice" class="mt-3 text-xs">
          <div
            :class="[
              'rounded-xl p-2.5 text-left flex items-start gap-2',
              emailStatusNotice.success ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
            ]"
          >
            <Check v-if="emailStatusNotice.success" class="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
            <span>{{ emailStatusNotice.message }}</span>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="mt-6 flex flex-col gap-2.5">
          <!-- WhatsApp ticket share -->
          <a
            :href="getWhatsAppTicketShareUrl(lastCompletedTicket)"
            target="_blank"
            class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
          >
            <Send class="h-3.5 w-3.5" />
            <span>Enviar Resumen por WhatsApp</span>
          </a>

          <!-- Google 5-star review request button -->
          <a
            :href="getWhatsAppReviewShareUrl(lastCompletedTicket)"
            target="_blank"
            class="flex items-center justify-center gap-2 rounded-xl bg-amber-50 border border-amber-300 px-4 py-2.5 text-xs font-bold text-amber-900 hover:bg-amber-100 transition-colors"
          >
            <Star class="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span>Pedir Reseña en Google (5★) por WhatsApp</span>
          </a>

          <!-- Online Link if token exists -->
          <a
            v-if="lastCompletedTicket.viewToken"
            :href="'/ticket/' + lastCompletedTicket.ticketNumber + '?token=' + lastCompletedTicket.viewToken"
            target="_blank"
            class="flex items-center justify-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2 text-xs font-semibold text-brand-brown hover:bg-brand-cream transition-colors"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            <span>Abrir Comprobante Digital Online</span>
          </a>

          <div class="flex items-center justify-center gap-2 pt-2">
            <button
              type="button"
              @click="handlePrintTicket(lastCompletedTicket)"
              class="flex items-center gap-1.5 rounded-xl border border-brand-brown/40 bg-white px-4 py-2 text-xs font-bold text-brand-brown hover:bg-brand-cream/40 transition-colors cursor-pointer"
            >
              <Printer class="h-3.5 w-3.5" />
              <span>Imprimir Ticket</span>
            </button>
            <button
              type="button"
              @click="lastCompletedTicket = null"
              class="rounded-xl bg-brand-brown px-5 py-2 text-xs font-bold text-white hover:bg-brand-brown-dark transition-colors cursor-pointer"
            >
              Listo / Siguiente Venta
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
