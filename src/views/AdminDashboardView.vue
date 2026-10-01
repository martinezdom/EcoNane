<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import type { Promotion, Experience, Pack, ClientSession, PaymentMethod, TicketItem, SaleTicket, BusinessInfo } from '@/types'
import {
  Tag,
  CreditCard,
  Camera,
  Settings,
  LogOut,
  ExternalLink,
  Check,
  Copy,
  Trash2,
  Plus,
  RotateCcw,
  Sparkles,
  Calendar,
  Phone,
  User,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Clock,
  Send,
  UploadCloud,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  X,
  Calculator,
  FileSpreadsheet,
  Receipt,
  Download,
  Filter,
  Search,
  Building,
  Wallet,
  Smartphone,
  AlertTriangle,
  Printer,
  Mail,
  Share2,
  ShieldCheck,
  BadgePercent,
  DollarSign,
  ShoppingBag
} from '@lucide/vue'

const router = useRouter()
const {
  promotion,
  experiences,
  packs,
  products,
  sessions,
  businessInfo,
  salesTickets,
  isAdminLoggedIn,
  isCloudSynced,
  updatePromotion,
  resetPromotionToDefault,
  updateExperiences,
  resetExperiencesToDefault,
  updatePacks,
  resetPacksToDefault,
  updateProducts,
  resetProductsToDefault,
  addProduct,
  deleteProduct,
  createSession,
  deleteSession,
  logoutAdmin,
  setAdminPin,
  updateBusinessInfo,
  generateNextTicketNumber,
  createSaleTicket,
  cancelSaleTicket,
  deleteSaleTicket,
  resetSalesTickets,
  resetAllSessions,
  sendTicketEmail,
  getWhatsAppTicketShareUrl,
  exportTicketsToCSV,
  formatExperienceWhatsAppLink
} = useSiteData()

if (!isAdminLoggedIn.value) {
  router.push('/admin/login')
}

const activeTab = ref<'tpv' | 'accounting' | 'sessions' | 'prices' | 'promo' | 'settings'>('tpv')
const saveSuccessMessage = ref('')

function showSuccess(msg: string) {
  saveSuccessMessage.value = msg
  setTimeout(() => {
    saveSuccessMessage.value = ''
  }, 4000)
}

// 1. Promotion Local Form
const promoForm = ref<Promotion>({ ...promotion.value })

function savePromo() {
  updatePromotion(promoForm.value)
  showSuccess('¡Promoción y ofertas actualizadas correctamente!')
}

function handleResetPromo() {
  if (confirm('¿Seguro que deseas restaurar la promoción de apertura predeterminada?')) {
    resetPromotionToDefault()
    promoForm.value = { ...promotion.value }
    showSuccess('Promoción restaurada a los valores originales.')
  }
}

// 2. Experiences & Packs Local Form
const experiencesForm = ref<Experience[]>(JSON.parse(JSON.stringify(experiences.value)))
const packsForm = ref<Pack[]>(JSON.parse(JSON.stringify(packs.value)))

watch(
  experiences,
  (newVal) => {
    if (newVal && newVal.length > 0 && experiencesForm.value.length === 0) {
      experiencesForm.value = JSON.parse(JSON.stringify(newVal))
    }
  },
  { deep: true }
)

function addExperience() {
  const defaultTitle = 'Nueva Sesión'
  const defaultPrice = '50€'
  const newExp: Experience = {
    title: defaultTitle,
    duration: 'Sesión de 30-45 min',
    price: defaultPrice,
    badge: '',
    description: 'Describe aquí la nueva experiencia o ecografía.',
    features: [
      'Visualización 4D/5D',
      'Fotos y vídeos digitales',
      'Latido del corazón',
      'Acompañantes incluidos'
    ],
    link: formatExperienceWhatsAppLink(defaultTitle),
    active: true
  }
  experiencesForm.value.push(newExp)
  showSuccess('Nuevo servicio añadido. Recuerda pulsar "Guardar Todos los Precios" para publicarlo en la web.')
}

function removeExperience(index: number) {
  const exp = experiencesForm.value[index]
  if (!exp) return
  if (
    confirm(
      `¿Seguro que deseas eliminar definitivamente el servicio "${exp.title}"?\n\nTip: Si solo deseas ocultarlo temporalmente de la web sin perder sus datos, te recomendamos desactivar el interruptor verde "Visible en la web".`
    )
  ) {
    experiencesForm.value.splice(index, 1)
    showSuccess(`Servicio eliminado. Pulsa "Guardar Todos los Precios" para aplicar los cambios.`)
  }
}

function moveExperience(index: number, direction: 'up' | 'down') {
  const targetIndex = direction === 'up' ? index - 1 : index + 1
  if (targetIndex < 0 || targetIndex >= experiencesForm.value.length) return
  const item = experiencesForm.value.splice(index, 1)[0]
  if (item) {
    experiencesForm.value.splice(targetIndex, 0, item)
  }
}

function autoGenerateWhatsAppLink(expIndex: number) {
  const exp = experiencesForm.value[expIndex]
  if (!exp) return
  exp.link = formatExperienceWhatsAppLink(exp.title)
  showSuccess(`Enlace de WhatsApp actualizado para "${exp.title}".`)
}

function addFeature(expIndex: number) {
  const exp = experiencesForm.value[expIndex]
  if (exp) {
    exp.features.push('Nueva ventaja incluida')
  }
}

function removeFeature(expIndex: number, featIndex: number) {
  const exp = experiencesForm.value[expIndex]
  if (exp) {
    exp.features.splice(featIndex, 1)
  }
}

function savePrices() {
  updateExperiences(experiencesForm.value)
  updatePacks(packsForm.value)
  showSuccess('¡Precios y servicios actualizados en la web!')
}

function handleResetPrices() {
  if (confirm('¿Deseas restaurar todos los precios y packs originales?')) {
    resetExperiencesToDefault()
    resetPacksToDefault()
    experiencesForm.value = JSON.parse(JSON.stringify(experiences.value))
    packsForm.value = JSON.parse(JSON.stringify(packs.value))
    showSuccess('Precios restaurados a los valores originales.')
  }
}

// 3. Client Delivery Sessions
const newSession = ref({
  clientName: '',
  clientPhone: '',
  sessionDate: new Date().toISOString().slice(0, 10),
  serviceType: 'Eco Básica 4D / 5D',
  note: '',
  expiryDays: 120
})

const uploadedPhotos = ref<string[]>([])
const isDragging = ref(false)
const fileInputRef = ref<HTMLInputElement | null>(null)
const copiedSessionId = ref<string | null>(null)

function triggerFileInput() {
  fileInputRef.value?.click()
}

function handleFilesSelected(event: Event) {
  const target = event.target as HTMLInputElement
  if (target.files) {
    processFiles(Array.from(target.files))
  }
}

function handleDrop(event: DragEvent) {
  event.preventDefault()
  isDragging.value = false
  if (event.dataTransfer?.files) {
    processFiles(Array.from(event.dataTransfer.files))
  }
}

function processFiles(files: File[]) {
  const imageFiles = files.filter((f) => f.type.startsWith('image/'))
  if (imageFiles.length === 0) {
    alert('Por favor selecciona archivos de imagen válidos (.jpg, .png, etc.)')
    return
  }

  for (const file of imageFiles) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const res = e.target?.result as string
      if (res) {
        uploadedPhotos.value.push(res)
      }
    }
    reader.readAsDataURL(file)
  }
}

function removeUploadedPhoto(index: number) {
  uploadedPhotos.value.splice(index, 1)
}

function handleCreateSession() {
  if (!newSession.value.clientName.trim() || !newSession.value.clientPhone.trim()) {
    alert('Por favor, indica el nombre y teléfono de la madre.')
    return
  }

  const photos =
    uploadedPhotos.value.length > 0
      ? [...uploadedPhotos.value]
      : ['/gallery-4.webp', '/gallery-5.webp', '/gallery-6.webp', '/gallery-1.webp', '/gallery-2.webp', '/gallery-3.webp']

  const created = createSession({
    clientName: newSession.value.clientName,
    clientPhone: newSession.value.clientPhone,
    sessionDate: newSession.value.sessionDate || new Date().toISOString().slice(0, 10),
    serviceType: newSession.value.serviceType,
    photos,
    note: newSession.value.note,
    expiryDays: Number(newSession.value.expiryDays) || 120
  })

  // Reset form
  newSession.value.clientName = ''
  newSession.value.clientPhone = ''
  newSession.value.note = ''
  uploadedPhotos.value = []

  showSuccess(`¡Sesión para ${created.clientName} creada con éxito! Código: ${created.code}`)
}

function handleDeleteSession(id: string, name: string) {
  if (confirm(`¿Seguro que deseas eliminar la entrega de sesión de ${name}?`)) {
    deleteSession(id)
    showSuccess(`Sesión de ${name} eliminada.`)
  }
}

function getSessionUrl(code: string) {
  const origin = window.location.origin
  return `${origin}/sesion/${code}`
}

function copySessionLink(session: any) {
  const url = getSessionUrl(session.code)
  navigator.clipboard.writeText(url)
  copiedSessionId.value = session.id
  setTimeout(() => {
    copiedSessionId.value = null
  }, 2500)
}

function getWhatsAppShareUrl(session: any) {
  const url = getSessionUrl(session.code)
  const last4 = session.clientPhone.replace(/\D/g, '').slice(-4)
  const text = encodeURIComponent(
    `¡Hola ${session.clientName}! ❤️\n\nYa tienes listas las fotos y recuerdos de tu ecografía en EcoNane.\n\nPuedes verlas y descargarlas en alta calidad desde tu enlace privado:\n👉 ${url}\n\n🔒 Clave de acceso: Los 4 últimos dígitos de tu teléfono (${last4})\n\n¡Esperamos que te encante el recuerdo de tu bebé!`
  )
  const phone = session.clientPhone.replace(/\D/g, '')
  const fullPhone = phone.startsWith('34') ? phone : `34${phone}`
  return `https://wa.me/${fullPhone}?text=${text}`
}

// 4. Admin Settings
const newPin = ref('')
const confirmNewPin = ref('')
const pinSuccess = ref('')
const isSavingPin = ref(false)

async function handleSavePin() {
  pinSuccess.value = ''
  if (!newPin.value || newPin.value.length < 4) {
    alert('La clave debe tener al menos 4 caracteres.')
    return
  }
  if (newPin.value !== confirmNewPin.value) {
    alert('Las claves no coinciden.')
    return
  }

  isSavingPin.value = true
  try {
    await setAdminPin(newPin.value)
    newPin.value = ''
    confirmNewPin.value = ''
    pinSuccess.value = '¡Clave de acceso actualizada y protegida con cifrado SHA-256 en Supabase!'
  } finally {
    isSavingPin.value = false
  }
}

// -------------------------------------------------------------
// 5. TPV / CAJA RÁPIDA (Venta Directa y Emisión de Tickets)
// -------------------------------------------------------------
interface CartItem {
  id: string
  title: string
  unitPrice: number
  quantity: number
  ivaPercent: number
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

// TPV Category Navigation Tab Filter
const tpvCategoryFilter = ref<'all' | 'experiences' | 'packs' | 'products'>('all')

// TPV Discounts Engine
const tpvDiscountType = ref<'none' | 'percent' | 'fixed'>('none')
const tpvDiscountValue = ref<number>(0)
const tpvDiscountNote = ref('')

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

function applyPresetDiscount(type: 'percent' | 'fixed', val: number, note?: string) {
  tpvDiscountType.value = type
  tpvDiscountValue.value = val
  if (note !== undefined) {
    tpvDiscountNote.value = note
  }
}

const lastCompletedTicket = ref<SaleTicket | null>(null)
const emailStatusNotice = ref<{ success: boolean; simulated?: boolean; message: string } | null>(null)

const showCustomItemForm = ref(false)
const customItemTitle = ref('')
const customItemPrice = ref<number | null>(null)

function addToCart(title: string, priceStrOrNum: string | number) {
  let numPrice = typeof priceStrOrNum === 'number'
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
}

function addCustomItem() {
  if (!customItemTitle.value.trim() || customItemPrice.value === null || customItemPrice.value < 0) return
  addToCart(customItemTitle.value.trim(), customItemPrice.value)
  customItemTitle.value = ''
  customItemPrice.value = null
  showCustomItemForm.value = false
}

// Products management state & modal
const showNewProductModal = ref(false)
const newProductForm = ref({
  title: '',
  price: '10€',
  category: 'Ropa y Bebé',
  description: '',
  active: true
})

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
  showSuccess('¡Nuevo producto añadido al catálogo!')
}

async function handleDeleteProduct(id: string, title: string) {
  if (confirm(`¿Seguro que deseas eliminar el producto "${title}" del catálogo?`)) {
    await deleteProduct(id)
    showSuccess(`Producto "${title}" eliminado.`)
  }
}

async function handleResetTestTickets() {
  const confirmed = confirm(
    '¿Estás seguro de que deseas vaciar todas las facturas y tickets de prueba?\n\n' +
    'Esta acción borrará el historial de pruebas para que la tienda quede completamente a cero y el próximo ticket sea el FS-2026-0001.'
  )
  if (confirmed) {
    await resetSalesTickets()
    showSuccess('¡Historial de prueba borrado! El contador se ha reiniciado a FS-2026-0001.')
  }
}

async function handleDeleteSingleTicket(ticket: SaleTicket) {
  const confirmed = confirm(
    `¿Estás segura de eliminar permanentemente la factura ${ticket.ticketNumber} de ${ticket.clientName}?\n\n` +
    'Esta acción no se puede deshacer y se recomienda para borrar tickets de prueba.'
  )
  if (confirmed) {
    await deleteSaleTicket(ticket.id)
    showSuccess(`Factura ${ticket.ticketNumber} eliminada correctamente.`)
  }
}

async function handleResetAllSessions() {
  const confirmed = confirm(
    '¿Estás segura de que deseas vaciar todas las sesiones de prueba de clientas?\n\n' +
    'Esta acción dejará la lista de entregas completamente limpia y a cero.'
  )
  if (confirmed) {
    await resetAllSessions()
    showSuccess('¡Sesiones de prueba vaciadas con éxito!')
  }
}

function selectClientFromSession(session: ClientSession) {
  tpvClientName.value = session.clientName
  tpvClientPhone.value = session.clientPhone
  if (!tpvCart.value.length && session.serviceType) {
    addToCart(session.serviceType, 50)
  }
  showSuccess(`Clienta "${session.clientName}" cargada en el TPV.`)
}

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

async function handleProcessSale() {
  if (tpvCart.value.length === 0) {
    alert('Añade al menos un servicio o concepto a la cuenta.')
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
      ivaPercent: it.ivaPercent
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

    showSuccess(`¡Venta completada! Ticket ${newTicket.ticketNumber} registrado correctamente.`)
  } catch (err: any) {
    alert('Error al registrar la venta: ' + (err?.message || err))
  } finally {
    isSubmittingSale.value = false
  }
}

// -------------------------------------------------------------
// 6. CONTABILIDAD E INFORMES FISCALES (HACIENDA & ASESOR)
// -------------------------------------------------------------
const accountingPeriod = ref<'today' | 'month' | 't1' | 't2' | 't3' | 't4' | 'year' | 'custom'>('today')
const customDateFrom = ref('')
const customDateTo = ref('')
const accountingSearch = ref('')
const selectedPaymentMethodFilter = ref<'all' | PaymentMethod>('all')

const ticketToCancel = ref<SaleTicket | null>(null)
const cancellationReason = ref('')
const isCancelling = ref(false)

const resendingTicketId = ref<string | null>(null)
const selectedTicketForDetail = ref<SaleTicket | null>(null)

const filteredTickets = computed(() => {
  const now = new Date()
  const currentYear = now.getFullYear()
  const todayStr = now.toISOString().slice(0, 10)
  const currentMonthStr = todayStr.slice(0, 7)

  return salesTickets.value.filter(ticket => {
    const ticketDate = ticket.date
    if (accountingPeriod.value === 'today') {
      if (ticketDate !== todayStr) return false
    } else if (accountingPeriod.value === 'month') {
      if (!ticketDate.startsWith(currentMonthStr)) return false
    } else if (accountingPeriod.value === 't1') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['01', '02', '03'].includes(m)) return false
    } else if (accountingPeriod.value === 't2') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['04', '05', '06'].includes(m)) return false
    } else if (accountingPeriod.value === 't3') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['07', '08', '09'].includes(m)) return false
    } else if (accountingPeriod.value === 't4') {
      if (ticket.year !== currentYear) return false
      const m = ticketDate.slice(5, 7)
      if (!['10', '11', '12'].includes(m)) return false
    } else if (accountingPeriod.value === 'year') {
      if (ticket.year !== currentYear) return false
    } else if (accountingPeriod.value === 'custom') {
      if (customDateFrom.value && ticketDate < customDateFrom.value) return false
      if (customDateTo.value && ticketDate > customDateTo.value) return false
    }

    if (selectedPaymentMethodFilter.value !== 'all') {
      if (ticket.paymentMethod !== selectedPaymentMethodFilter.value) return false
    }

    if (accountingSearch.value.trim()) {
      const q = accountingSearch.value.toLowerCase()
      const matchNumber = ticket.ticketNumber.toLowerCase().includes(q)
      const matchClient = ticket.clientName.toLowerCase().includes(q)
      const matchEmail = (ticket.clientEmail || '').toLowerCase().includes(q)
      const matchPhone = (ticket.clientPhone || '').includes(q)
      if (!matchNumber && !matchClient && !matchEmail && !matchPhone) return false
    }

    return true
  })
})

const validFilteredTickets = computed(() => {
  return filteredTickets.value.filter(t => t.status === 'valido')
})

const totalRevenue = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.total, 0)
})

const totalSubtotal = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.subtotal, 0)
})

const totalIva = computed(() => {
  return validFilteredTickets.value.reduce((sum, t) => sum + t.ivaAmount, 0)
})

const revenueByPaymentMethod = computed(() => {
  const result: Record<PaymentMethod, number> = {
    efectivo: 0,
    tarjeta: 0,
    bizum: 0,
    transferencia: 0
  }
  for (const t of validFilteredTickets.value) {
    if (result[t.paymentMethod] !== undefined) {
      result[t.paymentMethod] += t.total
    }
  }
  return result
})

function promptCancelTicket(ticket: SaleTicket) {
  ticketToCancel.value = ticket
  cancellationReason.value = ''
}

async function confirmCancelTicket() {
  if (!ticketToCancel.value) return
  if (!cancellationReason.value.trim()) {
    alert('Por normativa de Hacienda (R.D. 1619/2012), es obligatorio indicar el motivo de la anulación.')
    return
  }

  isCancelling.value = true
  try {
    await cancelSaleTicket(ticketToCancel.value.id, cancellationReason.value)
    showSuccess(`Ticket ${ticketToCancel.value.ticketNumber} marcado como ANULADO.`)
    ticketToCancel.value = null
  } catch (err: any) {
    alert('Error al anular ticket: ' + (err?.message || err))
  } finally {
    isCancelling.value = false
  }
}

async function handleResendEmail(ticket: SaleTicket) {
  if (!ticket.clientEmail) {
    alert('Este ticket no tiene un email de clienta registrado.')
    return
  }
  resendingTicketId.value = ticket.id
  try {
    const res = await sendTicketEmail(ticket)
    if (res.success) {
      showSuccess(`Ticket reenviado exitosamente a ${ticket.clientEmail}`)
    } else {
      alert(`No se pudo enviar el correo: ${res.message}`)
    }
  } finally {
    resendingTicketId.value = null
  }
}

function handleExportCSV() {
  const periodLabel = accountingPeriod.value
  const filename = `econane-facturas-${periodLabel}-${new Date().toISOString().slice(0, 10)}.csv`
  exportTicketsToCSV(filteredTickets.value, filename)
  showSuccess('Archivo CSV descargado correctamente.')
}

function escapeHtml(str: any): string {
  if (str === null || str === undefined) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

function handlePrintTicket(ticket: SaleTicket) {
  const printWindow = window.open('', '_blank', 'width=600,height=750')
  if (!printWindow) return

  const biz = businessInfo.value
  const itemsHtml = ticket.items.map(it => `
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
        <title>Factura-${escapeHtml(ticket.ticketNumber)}</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            color: #3b2c28;
            margin: 0;
            padding: 15mm 20mm;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #5a3e36; padding-bottom: 15px; }
          .logo { font-size: 22px; font-weight: bold; color: #5a3e36; letter-spacing: -0.5px; }
          .sub { font-size: 11px; color: #7a635d; margin-top: 4px; }
          .meta-box { background: #faf7f5; border: 1px solid #ebdcd5; border-radius: 8px; padding: 12px; margin-bottom: 15px; }
          .meta-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .totals { margin-top: 15px; border-top: 2px solid #5a3e36; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .grand-total { font-size: 17px; font-weight: bold; color: #5a3e36; border-top: 1px dashed #ccc; padding-top: 6px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; color: #9c8a84; border-top: 1px solid #e2d9d2; padding-top: 12px; }
          .badge-anulado { display: inline-block; background: #fee2e2; color: #991b1b; padding: 4px 10px; border-radius: 6px; font-weight: bold; margin-bottom: 10px; }
          .badge-type { display: inline-block; background: #f5ebe6; color: #5a3e36; padding: 2px 8px; border-radius: 4px; font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; }
          @media print {
            body {
              margin: 0 !important;
              padding: 15mm 20mm !important;
            }
            button, .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${escapeHtml(biz.name || 'EcoNane Ecografías Emocionales')}</div>
          <div style="margin-top: 4px;">
            <span class="badge-type">${ticket.isNominative ? 'Factura Nominativa' : 'Factura Simplificada'}</span>
          </div>
          <div class="sub">
            ${biz.legalName ? escapeHtml(biz.legalName) + '<br>' : ''}
            ${biz.nif ? 'NIF/CIF: ' + escapeHtml(biz.nif) + '<br>' : ''}
            ${biz.address ? escapeHtml(biz.address) + ', ' + escapeHtml(biz.postalCode) + ' ' + escapeHtml(biz.city) + '<br>' : ''}
            ${biz.phone ? 'Tel: ' + escapeHtml(biz.phone) + ' | ' : ''}${biz.email ? escapeHtml(biz.email) : ''}
          </div>
        </div>

        ${ticket.status === 'anulado' ? '<div style="text-align: center;"><span class="badge-anulado">TICKET ANULADO - ' + escapeHtml(ticket.cancelledReason || '') + '</span></div>' : ''}

        <div class="meta-box">
          <div class="meta-row"><span><strong>Nº ${ticket.isNominative ? 'Factura' : 'Ticket'}:</strong></span><span>${escapeHtml(ticket.ticketNumber)}</span></div>
          <div class="meta-row"><span><strong>Fecha y Hora:</strong></span><span>${escapeHtml(ticket.date)} - ${escapeHtml(ticket.time)}</span></div>
          <div class="meta-row"><span><strong>Clienta / Receptor:</strong></span><span>${escapeHtml(ticket.clientName)}</span></div>
          ${ticket.clientNif ? '<div class="meta-row"><span><strong>NIF/CIF:</strong></span><span>' + escapeHtml(ticket.clientNif) + '</span></div>' : ''}
          ${ticket.clientAddress ? '<div class="meta-row"><span><strong>Domicilio Fiscal:</strong></span><span>' + escapeHtml(ticket.clientAddress) + '</span></div>' : ''}
          <div class="meta-row"><span><strong>Forma de Pago:</strong></span><span style="text-transform: uppercase; font-weight: bold;">${escapeHtml(ticket.paymentMethod)}</span></div>
        </div>

        <table>
          <thead>
            <tr style="border-bottom: 1.5px solid #5a3e36; text-align: left; font-size: 11px; color: #7a635d;">
              <th style="padding-bottom: 6px;">CONCEPTO</th>
              <th style="text-align: right; padding-bottom: 6px;">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
          </tbody>
        </table>

        <div class="totals">
          ${ticket.discountAmount && ticket.discountAmount > 0 ? '<div class="total-row" style="color: #059669; font-weight: 500;"><span>Descuento aplicado (' + escapeHtml(ticket.discountNote || 'Promoción') + '):</span><span>-' + ticket.discountAmount.toFixed(2) + ' €</span></div>' : ''}
          <div class="total-row"><span>Base Imponible:</span><span>${ticket.subtotal.toFixed(2)} €</span></div>
          <div class="total-row"><span>IVA (${ticket.ivaRate}%):</span><span>${ticket.ivaAmount.toFixed(2)} €</span></div>
          <div class="total-row grand-total"><span>TOTAL PAGADO:</span><span>${ticket.total.toFixed(2)} €</span></div>
        </div>

        <div style="margin-top: 15px; padding: 8px 12px; background: #fffbeb; border: 1px solid #fef3c7; border-radius: 6px; font-size: 10px; color: #92400e; text-align: center; line-height: 1.4;">
          <strong>Mención de Ecografía No Diagnóstica:</strong> Servicio de carácter lúdico y emocional; no sustituye ni tiene finalidad diagnóstica médica obstétrica.
        </div>

        <div style="margin-top: 8px; font-size: 10px; color: #78716c; text-align: center; line-height: 1.3;">
          <strong>RGPD / LOPDGDD:</strong> EcoNane trata sus datos para la gestión contable y emisión del comprobante. No se cederán a terceros salvo obligación legal.
        </div>

        <div class="footer">
          Factura simplificada emitida de conformidad con el Real Decreto 1619/2012.<br>
          ${escapeHtml(biz.name || 'EcoNane')} ${biz.nif ? '· CIF/NIF: ' + escapeHtml(biz.nif) : ''}<br>
          ¡Muchísimas gracias por confiar en EcoNane para un momento tan mágico!
        </div>

        <div style="text-align: center; margin-top: 20px;">
          <button onclick="window.print()" style="padding: 10px 22px; font-weight: bold; background: #5a3e36; color: #fff; border: none; border-radius: 10px; cursor: pointer; font-size: 14px;">🖨️ Imprimir / Guardar en PDF</button>
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
  }, 300)
}

function handlePrintDailyClose() {
  const printWindow = window.open('', '_blank', 'width=650,height=800')
  if (!printWindow) return

  const biz = businessInfo.value
  const todayStr = new Date().toISOString().slice(0, 10)
  const todayTickets = salesTickets.value.filter(t => t.date === todayStr && t.status === 'valido')
  
  const totalDay = todayTickets.reduce((sum, t) => sum + t.total, 0)
  const totalSubtotal = todayTickets.reduce((sum, t) => sum + t.subtotal, 0)
  const totalIva = todayTickets.reduce((sum, t) => sum + t.ivaAmount, 0)
  
  const cashTotal = todayTickets.filter(t => t.paymentMethod === 'efectivo').reduce((sum, t) => sum + t.total, 0)
  const cardTotal = todayTickets.filter(t => t.paymentMethod === 'tarjeta').reduce((sum, t) => sum + t.total, 0)
  const bizumTotal = todayTickets.filter(t => t.paymentMethod === 'bizum').reduce((sum, t) => sum + t.total, 0)
  const transferTotal = todayTickets.filter(t => t.paymentMethod === 'transferencia').reduce((sum, t) => sum + t.total, 0)

  const cashCount = todayTickets.filter(t => t.paymentMethod === 'efectivo').length
  const cardCount = todayTickets.filter(t => t.paymentMethod === 'tarjeta').length
  const bizumCount = todayTickets.filter(t => t.paymentMethod === 'bizum').length
  const transferCount = todayTickets.filter(t => t.paymentMethod === 'transferencia').length

  const rowsHtml = todayTickets.map(t => `
    <tr>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(t.time)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; font-family: monospace; font-weight: bold;">${escapeHtml(t.ticketNumber)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee;">${escapeHtml(t.clientName)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-transform: uppercase;">${escapeHtml(t.paymentMethod)}</td>
      <td style="padding: 6px 8px; border-bottom: 1px solid #eee; text-align: right; font-weight: bold;">${t.total.toFixed(2)} €</td>
    </tr>
  `).join('')

  printWindow.document.write(`
    <!DOCTYPE html>
    <html lang="es">
      <head>
        <meta charset="utf-8">
        <title>Cierre-Caja-${escapeHtml(todayStr)}</title>
        <style>
          @page {
            size: auto;
            margin: 0;
          }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            font-size: 13px;
            color: #292524;
            margin: 0;
            padding: 15mm 20mm;
            line-height: 1.5;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .header { text-align: center; border-bottom: 2px solid #5a3e36; padding-bottom: 12px; margin-bottom: 20px; }
          .logo { font-size: 22px; font-weight: bold; color: #5a3e36; }
          .date { font-size: 14px; font-weight: 600; color: #78716c; margin-top: 4px; }
          .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; }
          .card { background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 12px; }
          .card-title { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #78716c; margin-bottom: 8px; }
          .row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .highlight { font-size: 16px; font-weight: bold; color: #5a3e36; border-top: 1px dashed #d6d3d1; padding-top: 6px; margin-top: 6px; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 12px; }
          th { text-align: left; background: #f5f5f4; padding: 6px 8px; font-size: 11px; text-transform: uppercase; color: #57534e; }
          .signature-box { margin-top: 35px; border-top: 1px solid #d6d3d1; padding-top: 15px; display: flex; justify-content: space-between; font-size: 11px; color: #78716c; }
          .signature-line { width: 220px; border-top: 1px solid #78716c; margin-top: 40px; text-align: center; padding-top: 4px; }
          @media print {
            body {
              margin: 0 !important;
              padding: 15mm 20mm !important;
            }
            button, .no-print {
              display: none !important;
            }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">${escapeHtml(biz.name || 'EcoNane')} - Cierre de Caja Diario (Arqueo)</div>
          <div class="date">Fecha: ${escapeHtml(todayStr)} · Hora de cierre: ${new Date().toTimeString().slice(0, 5)}</div>
          <div style="font-size: 11px; color: #78716c; margin-top: 4px;">${escapeHtml(biz.legalName || 'EcoNane')} · NIF: ${escapeHtml(biz.nif || 'En trámite')}</div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Desglose por Forma de Cobro</div>
            <div class="row"><span>Efectivo en metálico (${cashCount} op.):</span><strong>${cashTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Tarjeta / Datáfono (${cardCount} op.):</span><strong>${cardTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Bizum (${bizumCount} op.):</span><strong>${bizumTotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Transferencia (${transferCount} op.):</span><strong>${transferTotal.toFixed(2)} €</strong></div>
            <div class="row highlight"><span>TOTAL RECAUDADO:</span><span>${totalDay.toFixed(2)} €</span></div>
          </div>

          <div class="card">
            <div class="card-title">Resumen Fiscal (IVA 21%)</div>
            <div class="row"><span>Tickets válidos emitidos:</span><strong>${todayTickets.length}</strong></div>
            <div class="row"><span>Base Imponible total:</span><strong>${totalSubtotal.toFixed(2)} €</strong></div>
            <div class="row"><span>Cuota IVA (21%):</span><strong>${totalIva.toFixed(2)} €</strong></div>
            <div class="row highlight"><span>TOTAL FACTURADO:</span><span>${totalDay.toFixed(2)} €</span></div>
          </div>
        </div>

        <div style="margin-top: 15px;">
          <div style="font-size: 12px; font-weight: bold; text-transform: uppercase; color: #57534e; margin-bottom: 6px;">
            Operaciones del Día (${todayTickets.length} ventas)
          </div>
          <table>
            <thead>
              <tr>
                <th>Hora</th>
                <th>Nº Ticket</th>
                <th>Clienta</th>
                <th>Cobro</th>
                <th style="text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${rowsHtml || '<tr><td colspan="5" style="text-align: center; padding: 15px; color: #999;">No hay operaciones registradas en el día de hoy.</td></tr>'}
            </tbody>
          </table>
        </div>

        <div class="signature-box">
          <div>
            <p><strong>Control de Efectivo en Cajón:</strong></p>
            <p>Efectivo teórico del día: ${cashTotal.toFixed(2)} €</p>
            <p>Efectivo real contado físicamente: ____________ €</p>
            <p>Diferencia de caja (+ / -): ____________ €</p>
          </div>
          <div>
            <div class="signature-line">Firma del Responsable de Caja</div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px;">
          <button onclick="window.print()" style="padding: 10px 22px; font-weight: bold; background: #5a3e36; color: #fff; border: none; border-radius: 8px; cursor: pointer;">🖨️ Imprimir Hoja de Arqueo</button>
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
  }, 300)
}

// -------------------------------------------------------------
// 7. DATOS FISCALES DEL NEGOCIO (EMISIÓN LEGAL DE FACTURAS)
// -------------------------------------------------------------
const businessForm = ref<BusinessInfo>({ ...businessInfo.value })

watch(businessInfo, (val) => {
  businessForm.value = { ...val }
}, { deep: true })

async function saveBusinessSettings() {
  await updateBusinessInfo(businessForm.value)
  showSuccess('Datos fiscales y de facturación guardados correctamente.')
}

function handleLogout() {
  logoutAdmin()
  router.push('/admin/login')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    if (lastCompletedTicket.value) {
      lastCompletedTicket.value = null
    } else if (showCustomItemForm.value) {
      showCustomItemForm.value = false
    } else if (showNewProductModal.value) {
      showNewProductModal.value = false
    } else if (ticketToCancel.value) {
      ticketToCancel.value = null
    }
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div class="min-h-screen bg-brand-cream/60 pb-20 text-brand-brown-dark">
    <!-- Top Navigation Bar -->
    <header class="sticky top-0 z-30 border-b border-brand-pink-light/40 bg-white/95 shadow-sm backdrop-blur-md">
      <div class="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
        <div class="flex items-center gap-3">
          <img src="/logo.webp" alt="EcoNane" class="h-10 w-auto" />
          <div>
            <h1 class="font-serif text-lg font-bold leading-tight text-brand-brown-dark">Panel EcoNane</h1>
            <p class="text-xs text-brand-brown/80">TPV, Facturación, Sesiones y Precios</p>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <router-link
            to="/"
            target="_blank"
            class="flex items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-beige/50 px-3.5 py-2 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
          >
            <ExternalLink class="h-3.5 w-3.5 text-brand-brown" />
            <span class="hidden md:inline">Ver</span> Web Pública
          </router-link>

          <button
            @click="handleLogout"
            class="flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2 text-xs font-semibold text-rose-700 transition-all hover:bg-rose-100 cursor-pointer"
          >
            <LogOut class="h-3.5 w-3.5" />
            <span>Salir</span>
          </button>
        </div>
      </div>

      <!-- Navigation Tabs -->
      <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div class="flex gap-2 overflow-x-auto border-t border-brand-pink-light/20 pt-2 pb-1.5 scrollbar-none">
          <button
            @click="activeTab = 'tpv'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'tpv'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Calculator class="h-4 w-4" />
            <span>TPV / Cobrar</span>
          </button>

          <button
            @click="activeTab = 'accounting'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'accounting'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <FileSpreadsheet class="h-4 w-4" />
            <span>Contabilidad e IVA</span>
          </button>

          <button
            @click="activeTab = 'sessions'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'sessions'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Camera class="h-4 w-4" />
            <span>Entrega de Fotos</span>
            <span
              v-if="sessions.length > 0"
              class="ml-1 rounded-full bg-brand-pink-light/40 px-2 py-0.5 text-xs text-brand-brown-dark"
              :class="{ 'bg-white/25 text-white': activeTab === 'sessions' }"
            >
              {{ sessions.length }}
            </span>
          </button>

          <button
            @click="activeTab = 'prices'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'prices'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <CreditCard class="h-4 w-4" />
            <span>Precios y Servicios</span>
          </button>

          <button
            @click="activeTab = 'promo'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'promo'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Tag class="h-4 w-4" />
            <span>Ofertas y Promoción</span>
          </button>

          <button
            @click="activeTab = 'settings'"
            :class="[
              'flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200',
              activeTab === 'settings'
                ? 'bg-brand-brown text-white shadow-md'
                : 'text-brand-brown-dark/75 hover:bg-brand-beige hover:text-brand-brown-dark'
            ]"
          >
            <Building class="h-4 w-4" />
            <span>Fiscalidad y Clave</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Global Success Toast Banner -->
    <div
      v-if="saveSuccessMessage"
      class="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl border border-emerald-300 bg-emerald-600 px-5 py-4 text-sm font-medium text-white shadow-2xl animate-in slide-in-from-bottom"
    >
      <CheckCircle2 class="h-5 w-5" />
      <span>{{ saveSuccessMessage }}</span>
    </div>

    <!-- Main Content Area -->
    <main class="mx-auto max-w-7xl px-4 pt-8 sm:px-6 lg:px-8">
      <!-- ========================================== -->
      <!-- TAB: TPV / CAJA RÁPIDA (Ventas y Facturación) -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'tpv'" class="space-y-6">
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

          <!-- Quick client loader from photo sessions -->
          <div v-if="sessions.length > 0" class="flex items-center gap-2">
            <span class="text-xs font-semibold text-brand-brown/80">⚡ Cargar clienta de cita:</span>
            <select
              @change="(e) => {
                const s = sessions.find(item => item.id === (e.target as HTMLSelectElement).value)
                if (s) selectClientFromSession(s)
                ;(e.target as HTMLSelectElement).value = ''
              }"
              class="rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark shadow-sm focus:border-brand-pink focus:outline-none cursor-pointer"
            >
              <option value="" disabled selected>Seleccionar cita reciente...</option>
              <option v-for="s in sessions" :key="s.id" :value="s.id">
                {{ s.clientName }} ({{ s.serviceType }})
              </option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <!-- Left: Catalog of Experiences & Packs (7 cols) -->
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

            <!-- Services / Experiences Grid -->
            <div
              v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'experiences'"
              class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm"
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
                  v-for="(exp, idx) in experiencesForm.filter(e => e.active !== false)"
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
              class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm"
            >
              <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-4">
                <div class="flex items-center gap-2">
                  <span class="text-base">📦</span>
                  <h4 class="font-serif text-lg font-bold text-brand-brown-dark">Packs de Sesiones</h4>
                </div>
              </div>

              <div class="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div
                  v-for="(p, idx) in packsForm"
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

            <!-- Products & Clothes Section -->
            <div
              v-show="tpvCategoryFilter === 'all' || tpvCategoryFilter === 'products'"
              class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm"
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

          <!-- Right: POS Terminal & Cart (5 cols) -->
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

              <!-- Discounts Selector & Custom Inputs -->
              <div v-if="tpvCart.length > 0" class="mt-4 border-t border-brand-pink-light/20 pt-3 space-y-2.5">
                <div class="flex items-center justify-between">
                  <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                    Descuento o Promoción
                  </label>
                  <span v-if="tpvDiscountAmount > 0" class="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Ahorro: -{{ tpvDiscountAmount.toFixed(2) }} €
                  </span>
                </div>

                <!-- Type Selector (Tabs: Sin Dto / Porcentaje % / Importe Fijo €) -->
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

                <!-- Input when Percent (%) is active -->
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
                  <!-- Quick Preset Chips -->
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

                <!-- Input when Fixed Amount (€) is active -->
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
                  <!-- Quick Preset Chips -->
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
      </div>

      <!-- ========================================== -->
      <!-- TAB: CONTABILIDAD E INFORMES FISCALES      -->
      <!-- ========================================== -->
      <div v-if="activeTab === 'accounting'" class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Contabilidad, Caja e IVA</h2>
            <p class="text-sm text-brand-brown/80">
              Arqueos de caja, desglose de IVA (21%) para la gestoría/Hacienda y registro de ventas según RD 1619/2012.
            </p>
          </div>

          <div class="flex flex-wrap items-center gap-2">
            <button
              @click="handlePrintDailyClose"
              class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-brand-brown/20 bg-brand-brown px-4 py-2.5 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-brown-dark active:scale-95"
              title="Imprimir resumen de cierre de caja (arqueo) del día para cuadrar efectivo, datáfono y Bizum"
            >
              <Printer class="h-3.5 w-3.5" />
              <span>Imprimir Cierre Diario (Arqueo)</span>
            </button>

            <button
              @click="handleResetTestTickets"
              class="flex cursor-pointer items-center gap-1.5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2.5 text-xs font-bold text-rose-700 shadow-xs transition-all hover:bg-rose-100 active:scale-95"
              title="Borrar las ventas de prueba para dejar la caja limpia y empezar en FS-2026-0001"
            >
              <RotateCcw class="h-3.5 w-3.5" />
              <span>Reiniciar a Ticket 0001</span>
            </button>

            <button
              @click="handleExportCSV"
              class="flex cursor-pointer items-center gap-2 rounded-2xl bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-emerald-800 active:scale-95"
            >
              <Download class="h-4 w-4" />
              <span>Descargar Excel / CSV para el Asesor</span>
            </button>
          </div>
        </div>

        <!-- Period Selector Toolbar -->
        <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-4 shadow-sm sm:p-5">
          <div class="flex flex-wrap items-center gap-2">
            <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70 mr-1">Período:</span>

            <button
              v-for="p in [
                { id: 'today', label: 'Hoy (Cierre)' },
                { id: 'month', label: 'Este Mes' },
                { id: 't1', label: '1º Trimestre (T1)' },
                { id: 't2', label: '2º Trimestre (T2)' },
                { id: 't3', label: '3º Trimestre (T3)' },
                { id: 't4', label: '4º Trimestre (T4)' },
                { id: 'year', label: 'Año Completo' },
                { id: 'custom', label: 'Personalizado' }
              ]"
              :key="p.id"
              @click="accountingPeriod = (p.id as any)"
              :class="[
                'rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all cursor-pointer',
                accountingPeriod === p.id
                  ? 'bg-brand-brown text-white shadow-sm'
                  : 'bg-brand-cream/40 text-brand-brown-dark hover:bg-brand-pink-light/30'
              ]"
            >
              {{ p.label }}
            </button>
          </div>

          <!-- Custom Date Range Pickers -->
          <div v-if="accountingPeriod === 'custom'" class="mt-4 flex flex-wrap items-center gap-3 border-t border-brand-pink-light/20 pt-3">
            <div class="flex items-center gap-2">
              <span class="text-xs text-brand-brown/80 font-medium">Desde:</span>
              <input
                v-model="customDateFrom"
                type="date"
                class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-brand-brown/80 font-medium">Hasta:</span>
              <input
                v-model="customDateTo"
                type="date"
                class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <!-- Filters Row: Payment Method & Search -->
          <div class="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-brand-pink-light/20 pt-3">
            <div class="flex items-center gap-2">
              <span class="text-xs font-semibold text-brand-brown/70">Cobro:</span>
              <select
                v-model="selectedPaymentMethodFilter"
                class="rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-1.5 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
              >
                <option value="all">Todas las formas</option>
                <option value="efectivo">Solo Efectivo</option>
                <option value="tarjeta">Solo Tarjeta</option>
                <option value="bizum">Solo Bizum</option>
                <option value="transferencia">Solo Transferencia</option>
              </select>
            </div>

            <div class="relative w-full sm:w-72">
              <Search class="absolute left-3 top-2.5 h-3.5 w-3.5 text-brand-brown/60" />
              <input
                v-model="accountingSearch"
                type="text"
                placeholder="Buscar ticket, clienta, teléfono..."
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 pl-8 pr-3 py-1.5 text-xs text-brand-brown-dark placeholder:text-brand-brown/50 focus:border-brand-pink focus:bg-white focus:outline-none"
              />
            </div>
          </div>
        </div>

        <!-- KPI Metrics Cards -->
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <!-- Total Cobrado -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Total Facturado</span>
              <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
                <Receipt class="h-4 w-4" />
              </span>
            </div>
            <div class="mt-3 font-serif text-2xl font-bold text-brand-brown-dark">
              {{ totalRevenue.toFixed(2) }} €
            </div>
            <div class="mt-1 text-xs text-brand-brown/70">
              {{ validFilteredTickets.length }} tickets válidos
            </div>
          </div>

          <!-- Base Imponible -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Base Imponible</span>
              <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
                <DollarSign class="h-4 w-4" />
              </span>
            </div>
            <div class="mt-3 font-serif text-2xl font-bold text-brand-brown-dark">
              {{ totalSubtotal.toFixed(2) }} €
            </div>
            <div class="mt-1 text-xs text-brand-brown/70">
              Ingresos netos de la actividad
            </div>
          </div>

          <!-- Cuota IVA (21%) -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Cuota IVA (21%)</span>
              <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
                <BadgePercent class="h-4 w-4" />
              </span>
            </div>
            <div class="mt-3 font-serif text-2xl font-bold text-brand-brown-dark">
              {{ totalIva.toFixed(2) }} €
            </div>
            <div class="mt-1 text-xs text-brand-brown/70">
              IVA devengado (Modelo 303)
            </div>
          </div>

          <!-- Arqueo de Caja / Métodos -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-5 shadow-sm">
            <div class="flex items-center justify-between">
              <span class="text-xs font-bold uppercase tracking-wider text-brand-brown/70">Arqueo por Canal</span>
              <span class="rounded-full bg-brand-cream p-2 text-brand-brown">
                <Wallet class="h-4 w-4" />
              </span>
            </div>
            <div class="mt-2 space-y-1 text-xs">
              <div class="flex justify-between">
                <span class="text-brand-brown/80 font-medium">💶 Efectivo:</span>
                <span class="font-mono font-bold">{{ revenueByPaymentMethod.efectivo.toFixed(2) }} €</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-brown/80 font-medium">💳 Tarjeta:</span>
                <span class="font-mono font-bold">{{ revenueByPaymentMethod.tarjeta.toFixed(2) }} €</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-brown/80 font-medium">📱 Bizum:</span>
                <span class="font-mono font-bold">{{ revenueByPaymentMethod.bizum.toFixed(2) }} €</span>
              </div>
              <div class="flex justify-between">
                <span class="text-brand-brown/80 font-medium">🏦 Transf:</span>
                <span class="font-mono font-bold">{{ revenueByPaymentMethod.transferencia.toFixed(2) }} €</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Sales Tickets Table -->
        <div class="rounded-3xl border border-brand-pink-light/40 bg-white shadow-sm overflow-hidden">
          <div class="border-b border-brand-pink-light/20 p-5 flex items-center justify-between">
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Historial de Facturación Simplificada</h3>
            <span class="text-xs font-semibold text-brand-brown/70">
              Mostrando {{ filteredTickets.length }} ticket(s)
            </span>
          </div>

          <div v-if="filteredTickets.length === 0" class="p-12 text-center">
            <p class="text-sm text-brand-brown/70">No se encontraron tickets en este período o con los filtros seleccionados.</p>
          </div>

          <div v-else class="overflow-x-auto">
            <table class="w-full text-left text-xs">
              <thead class="bg-brand-cream/30 text-[11px] uppercase tracking-wider text-brand-brown-dark font-bold border-b border-brand-pink-light/20">
                <tr>
                  <th class="py-3 px-4">Nº Ticket</th>
                  <th class="py-3 px-4">Fecha / Hora</th>
                  <th class="py-3 px-4">Clienta</th>
                  <th class="py-3 px-4">Servicios</th>
                  <th class="py-3 px-4">Pago</th>
                  <th class="py-3 px-4 text-right">Base</th>
                  <th class="py-3 px-4 text-right">IVA (21%)</th>
                  <th class="py-3 px-4 text-right">Total</th>
                  <th class="py-3 px-4 text-center">Estado</th>
                  <th class="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-brand-pink-light/20">
                <tr
                  v-for="t in filteredTickets"
                  :key="t.id"
                  :class="[
                    'hover:bg-brand-cream/20 transition-colors',
                    t.status === 'anulado' ? 'opacity-60 bg-rose-50/30' : ''
                  ]"
                >
                  <td class="py-3.5 px-4 font-mono font-bold text-brand-brown-dark whitespace-nowrap">
                    {{ t.ticketNumber }}
                  </td>
                  <td class="py-3.5 px-4 whitespace-nowrap text-brand-brown">
                    <div>{{ t.date }}</div>
                    <div class="text-[10px] text-brand-brown/60">{{ t.time }}</div>
                  </td>
                  <td class="py-3.5 px-4">
                    <div class="font-bold text-brand-brown-dark">{{ t.clientName }}</div>
                    <div v-if="t.clientEmail" class="text-[11px] text-brand-brown/70 truncate max-w-xs">{{ t.clientEmail }}</div>
                    <div v-if="t.clientPhone" class="text-[10px] text-brand-brown/60">{{ t.clientPhone }}</div>
                  </td>
                  <td class="py-3.5 px-4 max-w-xs truncate text-brand-brown-dark">
                    <span v-for="(it, iIdx) in t.items" :key="it.id">
                      {{ it.quantity }}x {{ it.title }}<span v-if="iIdx < t.items.length - 1">, </span>
                    </span>
                  </td>
                  <td class="py-3.5 px-4 uppercase font-semibold text-brand-brown whitespace-nowrap">
                    <span class="rounded-lg bg-brand-cream/60 px-2 py-1 text-[11px]">
                      {{ t.paymentMethod }}
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono text-brand-brown whitespace-nowrap">
                    {{ t.subtotal.toFixed(2) }} €
                  </td>
                  <td class="py-3.5 px-4 text-right font-mono text-brand-brown whitespace-nowrap">
                    {{ t.ivaAmount.toFixed(2) }} €
                  </td>
                  <td class="py-3.5 px-4 text-right font-serif font-bold text-sm text-brand-brown-dark whitespace-nowrap">
                    {{ t.total.toFixed(2) }} €
                  </td>
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <span
                      v-if="t.status === 'valido'"
                      class="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800"
                    >
                      Válido
                    </span>
                    <span
                      v-else
                      class="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-800"
                      :title="t.cancelledReason"
                    >
                      Anulado
                    </span>
                  </td>
                  <td class="py-3.5 px-4 text-center whitespace-nowrap">
                    <div class="flex items-center justify-center gap-1.5">
                      <!-- Print / View -->
                      <button
                        @click="handlePrintTicket(t)"
                        class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer"
                        title="Imprimir / Ver Ticket"
                      >
                        <Printer class="h-3.5 w-3.5" />
                      </button>

                      <!-- Re-send Email -->
                      <button
                        v-if="t.clientEmail"
                        @click="handleResendEmail(t)"
                        :disabled="resendingTicketId === t.id"
                        class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer disabled:opacity-50"
                        title="Reenviar por Email"
                      >
                        <Mail class="h-3.5 w-3.5" />
                      </button>

                      <!-- WhatsApp -->
                      <a
                        :href="getWhatsAppTicketShareUrl(t)"
                        target="_blank"
                        class="rounded-lg border border-emerald-200 bg-emerald-50 p-1.5 text-emerald-700 hover:bg-emerald-100 cursor-pointer"
                        title="Enviar por WhatsApp"
                      >
                        <Send class="h-3.5 w-3.5" />
                      </a>

                      <!-- Online Link -->
                      <a
                        v-if="t.viewToken"
                        :href="'/ticket/' + t.ticketNumber + '?token=' + t.viewToken"
                        target="_blank"
                        class="rounded-lg border border-brand-pink-light/60 p-1.5 text-brand-brown hover:bg-brand-cream cursor-pointer"
                        title="Ver Comprobante Online"
                      >
                        <Eye class="h-3.5 w-3.5" />
                      </a>

                      <!-- Cancel Ticket -->
                      <button
                        v-if="t.status === 'valido'"
                        @click="promptCancelTicket(t)"
                        class="rounded-lg border border-amber-200 p-1.5 text-amber-700 hover:bg-amber-50 cursor-pointer"
                        title="Anular Ticket"
                      >
                        <AlertTriangle class="h-3.5 w-3.5" />
                      </button>

                      <!-- Delete Ticket (for test tickets) -->
                      <button
                        @click="handleDeleteSingleTicket(t)"
                        class="rounded-lg border border-brand-pink-light/40 p-1.5 text-brand-brown/40 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                        title="Eliminar Factura de Prueba"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: COBRO Y TICKET COMPLETADO CON ÉXITO -->
      <!-- ========================================== -->
      <div
        v-if="lastCompletedTicket"
        @click.self="lastCompletedTicket = null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
      >
        <div class="relative w-full max-w-md rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-2xl text-center space-y-4">
          <!-- Close (X) button at top-right -->
          <button
            type="button"
            @click="lastCompletedTicket = null"
            class="absolute top-4 right-4 rounded-full p-2 text-brand-brown/50 hover:text-brand-brown hover:bg-brand-cream/60 transition-colors cursor-pointer"
            title="Cerrar ventana"
          >
            <X class="h-5 w-5" />
          </button>

          <div class="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
            <CheckCircle2 class="h-8 w-8" />
          </div>

          <div>
            <h3 class="font-serif text-xl font-bold text-brand-brown-dark">¡Cobro Registrado con Éxito!</h3>
            <p class="text-xs text-brand-brown/80 mt-1">
              Ticket <strong class="font-mono">{{ lastCompletedTicket.ticketNumber }}</strong> emitido correctamente.
            </p>
          </div>

          <div class="rounded-2xl bg-brand-cream/40 p-4 text-xs space-y-1.5 text-left">
            <div class="flex justify-between">
              <span class="text-brand-brown/70">Clienta:</span>
              <span class="font-bold text-brand-brown-dark">{{ lastCompletedTicket.clientName }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-brand-brown/70">Forma de pago:</span>
              <span class="font-bold uppercase text-brand-brown">{{ lastCompletedTicket.paymentMethod }}</span>
            </div>
            <div v-if="lastCompletedTicket.discountAmount && lastCompletedTicket.discountAmount > 0" class="flex justify-between text-emerald-700 font-semibold">
              <span>Descuento aplicado:</span>
              <span>-{{ lastCompletedTicket.discountAmount.toFixed(2) }} €</span>
            </div>
            <div class="flex justify-between border-t border-brand-pink-light/30 pt-1.5 font-bold">
              <span class="text-brand-brown-dark">Total cobrado:</span>
              <span class="font-serif text-base text-brand-brown-dark">{{ lastCompletedTicket.total.toFixed(2) }} €</span>
            </div>
          </div>

          <div v-if="emailStatusNotice" :class="[
            'rounded-xl p-3 text-xs flex items-start gap-2 text-left',
            emailStatusNotice.success ? 'bg-blue-50 text-blue-800' : (emailStatusNotice.simulated ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-rose-50 text-rose-800')
          ]">
            <Mail class="h-4 w-4 shrink-0 mt-0.5 text-current" />
            <div>
              <p class="font-bold">{{ emailStatusNotice.success ? 'Factura enviada por email' : (emailStatusNotice.simulated ? 'Modo desarrollo / Configuración Cloudflare' : 'Error en envío de email') }}</p>
              <p class="text-[11px] mt-0.5 leading-snug">{{ emailStatusNotice.message }}</p>
            </div>
          </div>
          <div v-else-if="lastCompletedTicket.clientEmail" class="rounded-xl bg-stone-50 p-2.5 text-xs text-stone-600 text-left">
            <span>Email registrado: <strong>{{ lastCompletedTicket.clientEmail }}</strong></span>
          </div>
          <div v-else class="rounded-xl bg-amber-50 p-3 text-xs text-amber-800 text-left">
            ℹ️ Sin email configurado. Puedes enviarle el ticket por WhatsApp o imprimirlo.
          </div>

          <div class="flex flex-col gap-2 pt-2">
            <a
              :href="getWhatsAppTicketShareUrl(lastCompletedTicket)"
              target="_blank"
              class="flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition-colors"
            >
              <Send class="h-3.5 w-3.5" />
              <span>Enviar Resumen por WhatsApp</span>
            </a>

            <a
              v-if="lastCompletedTicket.viewToken"
              :href="'/ticket/' + lastCompletedTicket.ticketNumber + '?token=' + lastCompletedTicket.viewToken"
              target="_blank"
              class="flex items-center justify-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-pink-light/20 transition-colors"
            >
              <Eye class="h-3.5 w-3.5" />
              <span>Ver Comprobante Online</span>
            </a>

            <div class="grid grid-cols-2 gap-2">
              <button
                @click="handlePrintTicket(lastCompletedTicket)"
                class="flex items-center justify-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-brand-cream/40 px-3 py-2 text-xs font-bold text-brand-brown-dark hover:bg-brand-pink-light/30 cursor-pointer"
              >
                <Printer class="h-3.5 w-3.5" />
                <span>Imprimir / PDF</span>
              </button>

              <button
                @click="lastCompletedTicket = null"
                class="flex items-center justify-center rounded-xl bg-brand-brown px-3 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark cursor-pointer"
              >
                <span>Nueva Venta</span>
              </button>
            </div>

            <!-- Botón directo para cerrar el modal -->
            <button
              type="button"
              @click="lastCompletedTicket = null"
              class="w-full py-2 rounded-xl border border-stone-200 bg-stone-50 text-xs font-semibold text-stone-700 hover:bg-stone-100 hover:text-stone-900 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <X class="h-3.5 w-3.5" />
              <span>Cerrar esta ventana</span>
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: AÑADIR CONCEPTO PERSONALIZADO AL TPV -->
      <!-- ========================================== -->
      <div
        v-if="showCustomItemForm"
        @click.self="showCustomItemForm = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      >
        <div class="w-full max-w-sm rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-3">
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Concepto Personalizado</h3>
            <button @click="showCustomItemForm = false" class="text-brand-brown/60 hover:text-brand-brown cursor-pointer">
              <X class="h-4 w-4" />
            </button>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Descripción o Servicio
              </label>
              <input
                v-model="customItemTitle"
                type="text"
                placeholder="Ej: Suplemento lámina extra, Gafas VR..."
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Precio (€ con IVA)
              </label>
              <input
                v-model.number="customItemPrice"
                type="number"
                step="0.01"
                min="0"
                placeholder="Ej: 15.00"
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-brand-pink-light/20">
            <button
              @click="showCustomItemForm = false"
              class="rounded-xl px-3 py-2 text-xs font-semibold text-brand-brown-dark hover:bg-brand-cream cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="addCustomItem"
              :disabled="!customItemTitle.trim() || customItemPrice === null"
              class="rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark disabled:opacity-50 cursor-pointer"
            >
              Añadir al Ticket
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: ANULAR TICKET (NORMATIVA FISCAL RD 1619/2012) -->
      <!-- ========================================== -->
      <div
        v-if="ticketToCancel"
        @click.self="ticketToCancel = null"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      >
        <div class="w-full max-w-md rounded-3xl border border-rose-200 bg-white p-6 shadow-2xl space-y-4">
          <div class="flex items-center gap-3 text-rose-600">
            <AlertTriangle class="h-6 w-6" />
            <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
              Anular Ticket {{ ticketToCancel.ticketNumber }}
            </h3>
          </div>

          <p class="text-xs text-brand-brown/80">
            Por imperativo legal de la normativa de facturación de Hacienda (R.D. 1619/2012), los tickets correlativos no se pueden borrar físicamente. Se marcarán como <strong>ANULADOS</strong> en el registro contable y no sumarán en los totales de caja e IVA.
          </p>

          <div>
            <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark mb-1">
              Motivo de la Anulación (Obligatorio) <span class="text-rose-500">*</span>
            </label>
            <textarea
              v-model="cancellationReason"
              rows="3"
              required
              placeholder="Ej: Cobro duplicado por error, devolución de importe al cliente, error en los datos..."
              class="w-full rounded-xl border border-rose-200 bg-rose-50/20 p-3 text-xs text-brand-brown-dark focus:border-rose-400 focus:outline-none"
            ></textarea>
          </div>

          <div class="flex justify-end gap-2 pt-2 border-t border-brand-pink-light/20">
            <button
              @click="ticketToCancel = null"
              :disabled="isCancelling"
              class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown-dark hover:bg-brand-cream cursor-pointer"
            >
              Cancelar
            </button>
            <button
              @click="confirmCancelTicket"
              :disabled="isCancelling || !cancellationReason.trim()"
              class="rounded-xl bg-rose-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-rose-700 disabled:opacity-50 cursor-pointer"
            >
              {{ isCancelling ? 'Anulando...' : 'Confirmar Anulación' }}
            </button>
          </div>
        </div>
      </div>

      <!-- ========================================== -->
      <!-- MODAL: AÑADIR NUEVO PRODUCTO AL CATÁLOGO   -->
      <!-- ========================================== -->
      <div
        v-if="showNewProductModal"
        @click.self="showNewProductModal = false"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm animate-in fade-in"
      >
        <div class="w-full max-w-sm rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-2xl space-y-4">
          <div class="flex items-center justify-between border-b border-brand-pink-light/20 pb-3">
            <div class="flex items-center gap-2">
              <ShoppingBag class="h-5 w-5 text-brand-pink" />
              <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Nuevo Producto</h3>
            </div>
            <button @click="showNewProductModal = false" class="text-brand-brown/60 hover:text-brand-brown cursor-pointer">
              <X class="h-4 w-4" />
            </button>
          </div>

          <form @submit.prevent="handleCreateProduct" class="space-y-3">
            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Nombre del Producto <span class="text-rose-500">*</span>
              </label>
              <input
                v-model="newProductForm.title"
                type="text"
                required
                placeholder="Ej: Babero bordado, Gorrito..."
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>

            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Precio (€ con IVA) <span class="text-rose-500">*</span>
                </label>
                <input
                  v-model="newProductForm.price"
                  type="text"
                  required
                  placeholder="Ej: 10€"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Categoría
                </label>
                <select
                  v-model="newProductForm.category"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
                >
                  <option value="Ropa y Bebé">Ropa y Bebé</option>
                  <option value="Recuerdos">Recuerdos</option>
                  <option value="Canastillas">Canastillas</option>
                  <option value="Accesorios">Accesorios</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
            </div>

            <div>
              <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                Descripción (Opcional)
              </label>
              <input
                v-model="newProductForm.description"
                type="text"
                placeholder="Ej: 100% algodón orgánico..."
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>

            <div class="flex justify-end gap-2 pt-3 border-t border-brand-pink-light/20">
              <button
                type="button"
                @click="showNewProductModal = false"
                class="rounded-xl px-3 py-2 text-xs font-semibold text-brand-brown-dark hover:bg-brand-cream cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                :disabled="!newProductForm.title.trim()"
                class="rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-brown-dark disabled:opacity-50 cursor-pointer"
              >
                Guardar Producto
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- 1. TAB: PROMO & OFFERS -->
      <div v-if="activeTab === 'promo'" class="space-y-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Gestión de Promociones</h2>
            <p class="text-sm text-brand-brown/80">
              Modifica los textos, el mes de la oferta o activa/desactiva el banner de la web.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="handleResetPromo"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-beige"
            >
              <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
              Restaurar Original
            </button>
            <button
              @click="savePromo"
              class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Check class="h-4 w-4" />
              Guardar Cambios
            </button>
          </div>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Form Card -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-7">
            <div class="space-y-6">
              <!-- Switch Active -->
              <div class="flex items-center justify-between rounded-2xl border border-brand-pink-light/30 bg-brand-beige/40 p-4">
                <div>
                  <h4 class="font-semibold text-brand-brown-dark">Banner de Promoción Activo</h4>
                  <p class="text-xs text-brand-brown/80">
                    Si lo desactivas, el bloque de oferta desaparecerá de la web.
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
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
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
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm font-semibold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
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
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
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
                  class="mt-1.5 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
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
              class="relative overflow-hidden rounded-3xl border border-brand-pink-light/60 bg-gradient-to-br from-brand-beige via-white to-brand-pink-light/40 p-6 shadow-sm"
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

      <!-- 2. TAB: PRICES & SERVICES -->
      <div v-if="activeTab === 'prices'" class="space-y-8">
        <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Precios y Experiencias</h2>
            <p class="text-sm text-brand-brown/80">
              Ajusta los precios de las ecografías individuales y de los packs de seguimiento.
            </p>
          </div>

          <div class="flex items-center gap-3">
            <button
              @click="handleResetPrices"
              class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-beige"
            >
              <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
              Restaurar Originales
            </button>
            <button
              @click="savePrices"
              class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Check class="h-4 w-4" />
              Guardar Todos los Precios
            </button>
          </div>
        </div>

        <!-- Experiences Grid -->
        <div class="space-y-6">
          <div class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
                Sesiones y Ecografías ({{ experiencesForm.length }})
              </h3>
              <p class="text-xs text-brand-brown/70 mt-0.5">
                <span class="font-semibold text-emerald-700">
                  {{ experiencesForm.filter((e) => e.active !== false).length }} activas en la web
                </span>
                <span v-if="experiencesForm.filter((e) => e.active === false).length > 0" class="text-stone-500">
                  · {{ experiencesForm.filter((e) => e.active === false).length }} ocultas
                </span>
              </p>
            </div>

            <button
              type="button"
              @click="addExperience"
              class="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-pink px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-pink-dark active:scale-95 sm:w-auto"
            >
              <Plus class="h-4 w-4" />
              <span>Añadir Nuevo Servicio o Sesión</span>
            </button>
          </div>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              v-for="(exp, expIdx) in experiencesForm"
              :key="expIdx"
              :class="[
                'relative flex flex-col justify-between rounded-3xl border p-6 shadow-sm transition-all duration-200',
                exp.active !== false
                  ? 'border-brand-pink-light/40 bg-white'
                  : 'border-dashed border-stone-300 bg-stone-50/80 opacity-90'
              ]"
            >
              <div>
                <!-- Top Toolbar: Active Switch & Actions -->
                <div class="mb-4 flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
                  <!-- Active / Inactive Switch -->
                  <div class="flex items-center gap-2.5">
                    <label class="relative inline-flex cursor-pointer items-center">
                      <input
                        type="checkbox"
                        :checked="exp.active !== false"
                        @change="exp.active = ($event.target as HTMLInputElement).checked"
                        class="peer sr-only"
                      />
                      <div
                        class="peer h-6 w-11 rounded-full bg-stone-300 transition-colors after:absolute after:top-0.5 after:left-[2px] after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-md after:transition-all after:content-[''] peer-checked:bg-emerald-500 peer-checked:after:translate-x-full peer-checked:after:border-white"
                      ></div>
                    </label>
                    <span
                      :class="[
                        'text-xs font-bold tracking-wider uppercase',
                        exp.active !== false ? 'text-emerald-700' : 'text-stone-400'
                      ]"
                    >
                      {{ exp.active !== false ? 'Visible en web' : 'Oculto en web' }}
                    </span>
                  </div>

                  <!-- Reorder & Delete -->
                  <div class="flex items-center gap-1">
                    <button
                      type="button"
                      @click="moveExperience(expIdx, 'up')"
                      :disabled="expIdx === 0"
                      title="Subir posición"
                      class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-brand-beige hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      <ChevronUp class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      @click="moveExperience(expIdx, 'down')"
                      :disabled="expIdx === experiencesForm.length - 1"
                      title="Bajar posición"
                      class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-brand-beige hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-20"
                    >
                      <ChevronDown class="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      @click="removeExperience(expIdx)"
                      title="Eliminar este servicio"
                      class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 ml-1"
                    >
                      <Trash2 class="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <!-- Inactive Warning Notice -->
                <div
                  v-if="exp.active === false"
                  class="mb-4 flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2 text-xs font-medium text-amber-800"
                >
                  <EyeOff class="h-4 w-4 shrink-0 text-amber-600" />
                  <span>Este servicio está desactivado. No aparecerá en la web pública.</span>
                </div>

                <!-- Title & Price -->
                <div class="flex items-start justify-between gap-4">
                  <div class="flex-1">
                    <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Título</label>
                    <input
                      v-model="exp.title"
                      type="text"
                      class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div class="w-28">
                    <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Precio</label>
                    <input
                      v-model="exp.price"
                      type="text"
                      class="mt-1 w-full rounded-xl border border-brand-pink/40 bg-brand-pink/15 px-3 py-2 text-center text-sm font-extrabold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div class="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Duración</label>
                    <input
                      v-model="exp.duration"
                      type="text"
                      placeholder="Ej: Sesión de 30-45 min"
                      class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Etiqueta Destacada</label>
                    <input
                      v-model="exp.badge"
                      type="text"
                      placeholder="Opcional (ej: MÁS POPULAR)"
                      class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                <div class="mt-4">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Descripción</label>
                  <textarea
                    v-model="exp.description"
                    rows="2"
                    placeholder="Descripción que verán las mamás..."
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  ></textarea>
                </div>

                <!-- Features list -->
                <div class="mt-4">
                  <div class="flex items-center justify-between">
                    <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Incluye</label>
                    <button
                      type="button"
                      @click="addFeature(expIdx)"
                      class="flex cursor-pointer items-center gap-1 text-xs font-bold text-brand-brown hover:text-brand-brown-dark"
                    >
                      <Plus class="h-3.5 w-3.5" />
                      Añadir ventaja
                    </button>
                  </div>

                  <div class="mt-2 space-y-2">
                    <div
                      v-for="(_, featIdx) in exp.features"
                      :key="featIdx"
                      class="flex items-center gap-2"
                    >
                      <input
                        v-model="exp.features[featIdx]"
                        type="text"
                        class="flex-1 rounded-lg border border-brand-pink-light/50 bg-brand-cream/20 px-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                      />
                      <button
                        type="button"
                        @click="removeFeature(expIdx, featIdx)"
                        class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- WhatsApp Link & Auto-generate button -->
                <div class="mt-4 border-t border-brand-pink-light/20 pt-3">
                  <div class="flex items-center justify-between">
                    <label class="block text-[11px] font-bold text-brand-brown-dark/70 uppercase">
                      Enlace de Cita (WhatsApp)
                    </label>
                    <button
                      type="button"
                      @click="autoGenerateWhatsAppLink(expIdx)"
                      title="Generar enlace de WhatsApp con el título y precio actuales"
                      class="cursor-pointer text-[11px] font-bold text-brand-brown underline hover:text-brand-brown-dark"
                    >
                      Autocompletar mensaje
                    </button>
                  </div>
                  <input
                    v-model="exp.link"
                    type="text"
                    placeholder="https://wa.me/34644189856?text=..."
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-1.5 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- Bottom Add Experience Button -->
          <button
            type="button"
            @click="addExperience"
            class="flex w-full cursor-pointer items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-brand-pink-light/60 bg-white/50 p-5 text-xs font-bold text-brand-brown transition-all hover:border-brand-pink hover:bg-brand-pink-light/20 hover:text-brand-brown-dark active:scale-98"
          >
            <Plus class="h-4 w-4" />
            <span>Añadir otra sesión o servicio</span>
          </button>
        </div>

        <!-- 2 Packs Grid -->
        <div class="pt-6">
          <h3 class="mb-4 text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
            Packs de Ahorro y Seguimiento (2)
          </h3>

          <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div
              v-for="(pack, packIdx) in packsForm"
              :key="packIdx"
              class="rounded-3xl border border-brand-gold/40 bg-gradient-to-br from-white via-brand-beige/40 to-brand-gold/15 p-6 shadow-sm"
            >
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Título del Pack</label>
                  <input
                    v-model="pack.title"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                  />
                </div>

                <div class="w-28">
                  <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Precio</label>
                  <input
                    v-model="pack.price"
                    type="text"
                    class="mt-1 w-full rounded-xl border border-brand-gold/50 bg-brand-gold/20 px-3 py-2 text-center text-sm font-extrabold text-amber-950 focus:border-brand-gold focus:outline-none"
                  />
                </div>
              </div>

              <div class="mt-4">
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Etiqueta de Ahorro</label>
                <input
                  v-model="pack.save"
                  type="text"
                  placeholder="Ej: Ahorra 10€"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs font-semibold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                />
              </div>

              <div class="mt-4">
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Descripción</label>
                <textarea
                  v-model="pack.description"
                  rows="2"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-white px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
                ></textarea>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 3. TAB: CLIENT PHOTO SESSIONS -->
      <div v-if="activeTab === 'sessions'" class="space-y-8">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Entrega de Fotos y Recuerdos a Madres</h2>
            <p class="text-sm text-brand-brown/80">
              Arrastra las fotos de la ecografía o selecciónalas de tu ordenador. Se generará un enlace privado protegido para la clienta.
            </p>
          </div>
          <button
            v-if="sessions.length > 0"
            @click="handleResetAllSessions"
            class="self-start sm:self-auto flex items-center gap-1.5 rounded-xl border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition-colors cursor-pointer"
            title="Borrar todas las sesiones de prueba para empezar de cero"
          >
            <RotateCcw class="h-3.5 w-3.5" />
            <span>Vaciar Sesiones de Prueba</span>
          </button>
        </div>

        <div class="grid grid-cols-1 gap-8 lg:grid-cols-12">
          <!-- Create Session Form -->
          <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 lg:col-span-6">
            <div class="flex items-center gap-3 border-b border-brand-pink-light/30 pb-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-pink/20 text-brand-brown">
                <Camera class="h-5 w-5" />
              </div>
              <div>
                <h3 class="font-serif text-lg font-bold text-brand-brown-dark">Nueva Entrega</h3>
                <p class="text-xs text-brand-brown/80">Selecciona las fotos y rellena los datos</p>
              </div>
            </div>

            <form @submit.prevent="handleCreateSession" class="mt-6 space-y-4">
              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Nombre de la Madre / Clienta *
                </label>
                <div class="relative mt-1">
                  <input
                    v-model="newSession.clientName"
                    type="text"
                    required
                    placeholder="Ej: Laura Domínguez"
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 pl-10 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                  />
                  <User class="absolute top-3 left-3 h-4 w-4 text-brand-brown/60" />
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Teléfono Móvil (Servirá como PIN de seguridad) *
                </label>
                <div class="relative mt-1">
                  <input
                    v-model="newSession.clientPhone"
                    type="tel"
                    required
                    placeholder="Ej: 644189856"
                    class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 pl-10 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-pink/20"
                  />
                  <Phone class="absolute top-3 left-3 h-4 w-4 text-brand-brown/60" />
                </div>
                <p class="mt-1 text-[11px] text-brand-brown/70">
                  La madre usará los últimos 4 dígitos para desbloquear sus fotos.
                </p>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark uppercase">Fecha Sesión</label>
                  <input
                    v-model="newSession.sessionDate"
                    type="date"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label class="block text-xs font-bold text-brand-brown-dark uppercase">Caducidad</label>
                  <select
                    v-model="newSession.expiryDays"
                    class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                  >
                    <option :value="120">120 días (Recomendado)</option>
                    <option :value="180">180 días (6 meses)</option>
                    <option :value="365">1 año</option>
                    <option :value="9999">Sin caducidad</option>
                  </select>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">Tipo de Sesión</label>
                <select
                  v-model="newSession.serviceType"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                >
                  <option
                    v-for="exp in experiences"
                    :key="exp.title"
                    :value="exp.title"
                  >
                    {{ exp.title }}
                  </option>
                  <option
                    v-for="pack in packs"
                    :key="pack.title"
                    :value="pack.title"
                  >
                    {{ pack.title }}
                  </option>
                  <option value="Otra sesión personalizada">Otra sesión personalizada</option>
                </select>
              </div>

              <!-- DRAG & DROP PHOTO UPLOADER -->
              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Subir Fotografías de la Ecografía
                </label>

                <!-- Hidden Input -->
                <input
                  ref="fileInputRef"
                  type="file"
                  multiple
                  accept="image/*"
                  class="hidden"
                  @change="handleFilesSelected"
                />

                <div
                  @dragover.prevent="isDragging = true"
                  @dragleave.prevent="isDragging = false"
                  @drop="handleDrop"
                  @click="triggerFileInput"
                  :class="[
                    'mt-2 flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-6 text-center transition-all',
                    isDragging
                      ? 'border-brand-pink bg-brand-pink/10'
                      : 'border-brand-pink-light/80 bg-brand-beige/30 hover:border-brand-pink hover:bg-brand-beige/50'
                  ]"
                >
                  <UploadCloud class="h-8 w-8 text-brand-brown" />
                  <p class="mt-2 text-xs font-bold text-brand-brown-dark">
                    Arrastra aquí las fotos o pulsa para buscar en el PC / Pendrive
                  </p>
                  <p class="mt-1 text-[11px] text-brand-brown/70">
                    Puedes seleccionar varias fotos a la vez (.jpg, .png)
                  </p>
                </div>

                <!-- Uploaded Photos Thumbnails -->
                <div v-if="uploadedPhotos.length > 0" class="mt-4 space-y-2">
                  <div class="flex items-center justify-between text-xs font-bold text-brand-brown">
                    <span>{{ uploadedPhotos.length }} fotos preparadas</span>
                    <button
                      type="button"
                      @click="uploadedPhotos = []"
                      class="text-rose-600 hover:underline cursor-pointer text-[11px]"
                    >
                      Quitar todas
                    </button>
                  </div>

                  <div class="grid grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1 border border-brand-pink-light/30 rounded-xl bg-brand-cream/20">
                    <div
                      v-for="(photo, pIdx) in uploadedPhotos"
                      :key="pIdx"
                      class="group relative aspect-square overflow-hidden rounded-lg border border-brand-pink-light/50 bg-stone-900"
                    >
                      <img :src="photo" class="h-full w-full object-cover" />
                      <button
                        type="button"
                        @click.stop="removeUploadedPhoto(pIdx)"
                        class="absolute top-1 right-1 rounded-full bg-rose-600 p-1 text-white shadow-md hover:bg-rose-700 cursor-pointer"
                        title="Quitar foto"
                      >
                        <X class="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">
                  Nota o Dedicatoria para la Madre (Opcional)
                </label>
                <input
                  v-model="newSession.note"
                  type="text"
                  placeholder="Ej: Sesión maravillosa, el bebé se dejó ver genial..."
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <button
                type="submit"
                class="mt-4 flex w-full cursor-pointer items-center justify-center gap-2 rounded-2xl bg-brand-brown py-3.5 text-center font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
              >
                <Sparkles class="h-4 w-4" />
                Crear Entrega y Generar Enlace
              </button>
            </form>
          </div>

          <!-- Sessions List -->
          <div class="space-y-4 lg:col-span-6">
            <div class="flex items-center justify-between">
              <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
                Sesiones Entregadas ({{ sessions.length }})
              </h3>
            </div>

            <div v-if="sessions.length === 0" class="rounded-3xl border border-brand-pink-light/40 bg-white p-12 text-center text-brand-brown/60">
              <Camera class="mx-auto h-8 w-8 text-brand-pink-light" />
              <p class="mt-2 text-sm font-medium">Aún no hay entregas de sesiones registradas.</p>
            </div>

            <div v-else class="space-y-4">
              <div
                v-for="s in sessions"
                :key="s.id"
                class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm transition-all hover:border-brand-pink hover:shadow-md"
              >
                <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                  <div>
                    <div class="flex items-center gap-2">
                      <h4 class="font-serif text-lg font-bold text-brand-brown-dark">{{ s.clientName }}</h4>
                      <span class="rounded-full bg-brand-beige px-2.5 py-0.5 text-[11px] font-semibold text-brand-brown-dark">
                        {{ s.serviceType }}
                      </span>
                    </div>

                    <div class="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-brand-brown/80">
                      <span class="flex items-center gap-1">
                        <Phone class="h-3.5 w-3.5 text-brand-brown" />
                        {{ s.clientPhone }}
                      </span>
                      <span class="flex items-center gap-1">
                        <Calendar class="h-3.5 w-3.5 text-brand-brown" />
                        {{ s.sessionDate }}
                      </span>
                      <span class="flex items-center gap-1">
                        <ImageIcon class="h-3.5 w-3.5 text-brand-brown" />
                        {{ s.photos ? s.photos.length : 0 }} fotos
                      </span>
                    </div>

                    <div class="mt-3 flex items-center gap-2">
                      <span class="text-xs font-bold text-brand-brown/60 uppercase">Token Privado:</span>
                      <span class="rounded-lg bg-brand-beige px-2 py-0.5 font-mono text-xs font-bold text-brand-brown-dark">
                        {{ s.code }}
                      </span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="flex flex-wrap items-center gap-2 sm:flex-col sm:items-end">
                    <a
                      :href="getWhatsAppShareUrl(s)"
                      target="_blank"
                      class="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
                    >
                      <Send class="h-3.5 w-3.5" />
                      Enviar por WhatsApp
                    </a>

                    <div class="flex items-center gap-2">
                      <button
                        @click="copySessionLink(s)"
                        class="flex cursor-pointer items-center gap-1 rounded-xl border border-brand-pink-light/60 bg-brand-beige/50 px-3 py-1.5 text-xs font-medium text-brand-brown-dark transition-all hover:bg-brand-pink-light/30"
                      >
                        <Check v-if="copiedSessionId === s.id" class="h-3.5 w-3.5 text-emerald-600" />
                        <Copy v-else class="h-3.5 w-3.5" />
                        <span>{{ copiedSessionId === s.id ? '¡Copiado!' : 'Copiar Enlace' }}</span>
                      </button>

                      <router-link
                        :to="'/sesion/' + s.code"
                        target="_blank"
                        class="rounded-xl border border-brand-pink-light/60 p-2 text-brand-brown-dark hover:bg-brand-beige"
                        title="Ver como clienta"
                      >
                        <Eye class="h-3.5 w-3.5" />
                      </router-link>

                      <button
                        @click="handleDeleteSession(s.id, s.clientName)"
                        class="cursor-pointer rounded-xl border border-rose-200 p-2 text-rose-600 hover:bg-rose-50"
                        title="Eliminar sesión"
                      >
                        <Trash2 class="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 4. TAB: SETTINGS & FISCAL -->
      <div v-if="activeTab === 'settings'" class="max-w-3xl space-y-8">
        <div>
          <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Datos Fiscales y Seguridad</h2>
          <p class="text-sm text-brand-brown/80">
            Configura los datos legales para la emisión de facturas simplificadas y gestiona la clave de acceso.
          </p>
        </div>

        <!-- 1. DATOS FISCALES DEL COMERCIO -->
        <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div class="border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <Building class="h-5 w-5 text-brand-brown" />
              <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
                Datos Fiscales de Facturación (EcoNane)
              </h3>
            </div>
            <p class="mt-1 text-xs text-brand-brown/70">
              Estos datos aparecerán en los tickets oficiales y facturas simplificadas expedidas según el R.D. 1619/2012.
            </p>
          </div>

          <form @submit.prevent="saveBusinessSettings" class="space-y-4">
            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Nombre Comercial
                </label>
                <input
                  v-model="businessForm.name"
                  type="text"
                  required
                  placeholder="EcoNane Ecografías Emocionales"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Razón Social o Titular Autónomo
                </label>
                <input
                  v-model="businessForm.legalName"
                  type="text"
                  placeholder="Nombre de la persona o SL"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  NIF / CIF
                </label>
                <input
                  v-model="businessForm.nif"
                  type="text"
                  placeholder="Ej: 12345678Z o B-12345678"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div class="sm:col-span-2">
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Dirección Fiscal
                </label>
                <input
                  v-model="businessForm.address"
                  type="text"
                  placeholder="Carrer de la Mar..."
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Código Postal
                </label>
                <input
                  v-model="businessForm.postalCode"
                  type="text"
                  placeholder="03570"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Ciudad
                </label>
                <input
                  v-model="businessForm.city"
                  type="text"
                  placeholder="Villajoyosa"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Teléfono
                </label>
                <input
                  v-model="businessForm.phone"
                  type="tel"
                  placeholder="644189856"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Email Emisor
                </label>
                <input
                  v-model="businessForm.email"
                  type="email"
                  placeholder="info@econane.es"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-brand-pink-light/20 pt-4">
              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Serie de Facturación Simplificada
                </label>
                <input
                  v-model="businessForm.ticketSeries"
                  type="text"
                  placeholder="FS"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark font-mono uppercase focus:border-brand-pink focus:bg-white focus:outline-none"
                />
                <p class="mt-1 text-[11px] text-brand-brown/60">Ejemplo: FS generará tickets como FS-2026-0001</p>
              </div>

              <div>
                <label class="block text-xs font-bold uppercase tracking-wider text-brand-brown-dark">
                  Tipo de IVA por Defecto (%)
                </label>
                <input
                  v-model.number="businessForm.defaultIva"
                  type="number"
                  min="0"
                  max="100"
                  placeholder="21"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-3.5 py-2 text-xs text-brand-brown-dark font-mono focus:border-brand-pink focus:bg-white focus:outline-none"
                />
                <p class="mt-1 text-[11px] text-brand-brown/60">21% aplicable a ecografía emocional y comercial</p>
              </div>
            </div>

            <div class="flex justify-end pt-2">
              <button
                type="submit"
                class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-2.5 text-xs font-bold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
              >
                <Check class="h-4 w-4" />
                <span>Guardar Datos Fiscales</span>
              </button>
            </div>
          </form>
        </div>

        <!-- 2. SEGURIDAD Y ACCESO (PIN) -->
        <div class="rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-sm sm:p-8 space-y-6">
          <div class="border-b border-brand-pink-light/20 pb-4">
            <div class="flex items-center gap-2">
              <Lock class="h-5 w-5 text-brand-brown" />
              <h3 class="font-serif text-lg font-bold text-brand-brown-dark">
                Seguridad y Clave de Acceso
              </h3>
            </div>
            <p class="mt-1 text-xs text-brand-brown/70">
              Modifica la clave de acceso de 4 o más caracteres que utilizáis para entrar a este panel.
            </p>
          </div>

          <form @submit.prevent="handleSavePin" class="space-y-4">
            <div class="rounded-2xl border border-brand-pink-light/40 bg-brand-cream/30 p-4">
              <div class="flex items-center gap-2 text-xs font-bold text-brand-brown">
                <ShieldCheck class="h-4 w-4 text-emerald-600" />
                <span>Estado de Acceso: Protegido con Cifrado SHA-256</span>
              </div>
              <p class="mt-1 text-[11px] text-brand-brown/70">
                La contraseña se almacena de forma encriptada e irreversible en la base de datos de Supabase.
              </p>
            </div>

            <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">Nueva Clave de Acceso</label>
                <input
                  v-model="newPin"
                  type="password"
                  required
                  placeholder="Mínimo 4 caracteres..."
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark uppercase">Confirmar Nueva Clave</label>
                <input
                  v-model="confirmNewPin"
                  type="password"
                  required
                  placeholder="Repite la nueva clave..."
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-2.5 text-sm text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div v-if="pinSuccess" class="rounded-xl bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {{ pinSuccess }}
            </div>

            <button
              type="submit"
              class="flex cursor-pointer items-center gap-2 rounded-2xl bg-brand-brown px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
            >
              <Lock class="h-4 w-4" />
              Guardar Nueva Clave
            </button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>
