import { ref, watch } from 'vue'
import type {
  Promotion,
  Experience,
  Pack,
  Product,
  ClientSession,
  SaleTicket,
  TicketItem,
  BusinessInfo,
  PaymentMethod
} from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const STORAGE_KEY_PROMO = 'econane_promotion'
const STORAGE_KEY_EXPERIENCES = 'econane_experiences'
const STORAGE_KEY_PACKS = 'econane_packs'
const STORAGE_KEY_PRODUCTS = 'econane_products'
const STORAGE_KEY_SESSIONS = 'econane_client_sessions'
const STORAGE_KEY_AUTH = 'econane_admin_auth'
const STORAGE_KEY_PIN = 'econane_admin_pin'
const STORAGE_KEY_TICKETS = 'econane_sales_tickets'
const STORAGE_KEY_BIZ = 'econane_business_info'

// Helper: SHA-256 Hashing via Web Crypto API
async function hashString(str: string): Promise<string> {
  const utf8 = new TextEncoder().encode(str)
  const hashBuffer = await crypto.subtle.digest('SHA-256', utf8)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

// Default Fallback Data
const defaultPromotion: Promotion = {
  active: true,
  badge: 'OFERTA DE APERTURA',
  title: '¡Gran Promoción de Apertura en Octubre!',
  description:
    'Celebra con nosotros nuestra apertura durante todo el mes de octubre. Disfruta de un 20% de descuento en tu primera ecografía 4D/5D para conocer a tu bebé.',
  whatsappText:
    'Hola, me gustaría reservar mi ecografía con el 20% de descuento de apertura.'
}

export function formatExperienceWhatsAppLink(title: string): string {
  const phone = '34644189856'
  const text = encodeURIComponent(
    `¡Hola!\nQuiero pedir cita para la sesión ${title}, ¿podrías darme más información?`
  )
  return `https://wa.me/${phone}?text=${text}`
}

export function formatPackWhatsAppLink(title: string): string {
  const phone = '34644189856'
  const text = encodeURIComponent(
    `¡Hola!\nQuiero pedir información sobre el ${title}, ¿podrías darme más detalles?`
  )
  return `https://wa.me/${phone}?text=${text}`
}

function sanitizeExperienceLinks(list: Experience[]): Experience[] {
  return list.map((exp) => {
    if (exp.link && (exp.link.includes('%E2%82%AC') || exp.link.includes('€') || !exp.link.includes('informaci'))) {
      return {
        ...exp,
        link: formatExperienceWhatsAppLink(exp.title)
      }
    }
    return exp
  })
}

function sanitizePackLinks(list: Pack[]): Pack[] {
  return list.map((pack) => {
    if (pack.link && (pack.link.includes('%E2%82%AC') || pack.link.includes('€') || !pack.link.includes('detalles'))) {
      return {
        ...pack,
        link: formatPackWhatsAppLink(pack.title)
      }
    }
    return pack
  })
}

const defaultExperiences: Experience[] = [
  {
    title: 'Eco Básica 4D/5D',
    duration: 'Sesión de 30-45 min',
    price: '45€',
    description: 'Visualiza a tu bebé en 4D/5D, escucha su latido y llévate recuerdos inolvidables.',
    features: [
      'Visualización 4D/5D',
      'Fotos y vídeos digitales',
      'Latido del corazón',
      'Acompañantes incluidos'
    ],
    link: formatExperienceWhatsAppLink('Eco Básica 4D/5D'),
    active: true
  },
  {
    title: 'Eco para Conocer el Sexo',
    duration: 'Sesión rápida de 15 min',
    price: '30€',
    description: 'Confirmamos el sexo de tu bebé de forma segura, íntima y especial.',
    features: [
      'Confirmación del sexo',
      'Fotos digitales',
      'Latido del corazón',
      'Acompañantes incluidos'
    ],
    link: formatExperienceWhatsAppLink('Eco para Conocer el Sexo'),
    active: true
  },
  {
    title: 'Eco + Revelación de Sexo',
    duration: 'Sesión especial en familia',
    price: '70€',
    description: 'Vive uno de los momentos más bonitos y emocionantes junto a tu familia.',
    features: [
      'Eco 4D/5D',
      'Revelación con globo',
      'Pequeño regalo',
      'Fotos y vídeos digitales'
    ],
    link: formatExperienceWhatsAppLink('Eco + Revelación de Sexo'),
    active: true
  },
  {
    title: 'Experiencia Gafas Virtuales + Eco 4D/5D',
    duration: 'Sesión inmersiva VR',
    price: '75€',
    badge: '4D/5D VR',
    description:
      'Siente a tu bebé como nunca antes con nuestra experiencia inmersiva con gafas virtuales.',
    features: [
      'Eco 4D/5D en directo',
      'Experiencia con gafas VR',
      'Fotos y vídeos digitales',
      'Acompañantes incluidos'
    ],
    link: formatExperienceWhatsAppLink('Experiencia Gafas Virtuales + Eco 4D/5D'),
    active: true
  }
]

const defaultPacks: Pack[] = [
  {
    title: 'Pack 2 Ecos',
    price: '80€',
    save: 'Ahorra 10€',
    description: '2 sesiones para seguir cada etapa de tu embarazo y revivir la emoción.',
    link: formatPackWhatsAppLink('Pack 2 Ecos')
  },
  {
    title: 'Pack 3 Ecos',
    price: '115€',
    save: 'Ahorra 20€',
    description: '3 momentos únicos para recordar la evolución completa para siempre.',
    link: formatPackWhatsAppLink('Pack 3 Ecos')
  }
]

const defaultDemoSessions: ClientSession[] = []

const defaultBusinessInfo: BusinessInfo = {
  name: 'EcoNane Ecografías Emocionales',
  legalName: 'EcoNane',
  nif: '',
  address: 'Carrer de la Mar',
  city: 'Villajoyosa',
  postalCode: '03570',
  phone: '644189856',
  email: 'info@econane.es',
  ticketSeries: 'FS',
  defaultIva: 21
}

const defaultProducts: Product[] = [
  {
    id: 'prod-1',
    title: 'Babero Algodón Bordado',
    price: '8€',
    category: 'Ropa y Bebé',
    description: 'Babero 100% algodón orgánico suave',
    active: true
  },
  {
    id: 'prod-2',
    title: 'Gorrito Recién Nacido',
    price: '7€',
    category: 'Ropa y Bebé',
    description: 'Gorrito de primera puesta extra suave',
    active: true
  },
  {
    id: 'prod-3',
    title: 'Peluche con Sonido de Latido',
    price: '20€',
    category: 'Recuerdos',
    description: 'Peluche con el latido grabado en la sesión',
    active: true
  }
]

const defaultDemoTickets: SaleTicket[] = []

// Initial SHA-256 hash of 'econane2026'
const DEFAULT_HASH = '1f81014e3650630fc655c6e83efec4aa3ee734c54cb43a413d964cb70a831e50'

// Global Reactive Singletons
const promotion = ref<Promotion>(loadFromStorage(STORAGE_KEY_PROMO, defaultPromotion))
const experiences = ref<Experience[]>(
  sanitizeExperienceLinks(loadFromStorage(STORAGE_KEY_EXPERIENCES, defaultExperiences))
)
const packs = ref<Pack[]>(
  sanitizePackLinks(loadFromStorage(STORAGE_KEY_PACKS, defaultPacks))
)
const products = ref<Product[]>(loadFromStorage(STORAGE_KEY_PRODUCTS, defaultProducts))
const sessions = ref<ClientSession[]>(loadFromStorage(STORAGE_KEY_SESSIONS, defaultDemoSessions))
const businessInfo = ref<BusinessInfo>(loadFromStorage(STORAGE_KEY_BIZ, defaultBusinessInfo))
const salesTickets = ref<SaleTicket[]>(loadFromStorage(STORAGE_KEY_TICKETS, defaultDemoTickets))
const adminPinHash = ref<string>(loadFromStorage(STORAGE_KEY_PIN, DEFAULT_HASH))
const isAdminLoggedIn = ref<boolean>(sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true')
const isCloudSynced = ref<boolean>(false)

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (raw) return JSON.parse(raw)
  } catch (e) {}
  return fallback
}

// Watchers for LocalStorage Persistence
watch(promotion, (val) => localStorage.setItem(STORAGE_KEY_PROMO, JSON.stringify(val)), { deep: true })
watch(experiences, (val) => localStorage.setItem(STORAGE_KEY_EXPERIENCES, JSON.stringify(val)), { deep: true })
watch(packs, (val) => localStorage.setItem(STORAGE_KEY_PACKS, JSON.stringify(val)), { deep: true })
watch(products, (val) => localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(val)), { deep: true })
watch(sessions, (val) => localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(val)), { deep: true })
watch(businessInfo, (val) => localStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(val)), { deep: true })
watch(salesTickets, (val) => localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(val)), { deep: true })
watch(adminPinHash, (val) => localStorage.setItem(STORAGE_KEY_PIN, JSON.stringify(val)))

// Supabase Cloud Sync Engine
async function syncFromSupabase() {
  if (!supabase || !isSupabaseConfigured) return

  try {
    // 1. Fetch Site Settings (Promo, Prices, Packs, PIN Hash, Business Info)
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (settingsData) {
      if (settingsData.promotion) promotion.value = settingsData.promotion
      if (settingsData.experiences) experiences.value = sanitizeExperienceLinks(settingsData.experiences)
      if (settingsData.packs) packs.value = sanitizePackLinks(settingsData.packs)
      if (settingsData.products && settingsData.products.length > 0) products.value = settingsData.products
      if (settingsData.business_info && Object.keys(settingsData.business_info).length > 0) {
        businessInfo.value = { ...defaultBusinessInfo, ...settingsData.business_info }
      }
      if (settingsData.admin_pin) {
        if (settingsData.admin_pin.length === 64) {
          adminPinHash.value = settingsData.admin_pin
        } else {
          const hashed = await hashString(settingsData.admin_pin)
          adminPinHash.value = hashed
        }
      }
    } else {
      // First time initialization in Supabase with secure hash
      const hash = await hashString('econane2026')
      adminPinHash.value = hash
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: hash
      })
    }

    // 2. Fetch Client Sessions
    const { data: sessionsData } = await supabase
      .from('client_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (sessionsData && sessionsData.length > 0) {
      sessions.value = sessionsData.map((row: any) => ({
        id: row.id,
        code: row.code,
        clientName: row.client_name,
        clientPhone: row.client_phone,
        sessionDate: row.session_date,
        serviceType: row.service_type,
        expiryDays: row.expiry_days,
        createdAt: row.created_at,
        note: row.note || '',
        photos: row.photos || [],
        zipUrl: row.zip_url || ''
      }))
    }

    // 3. Fetch Sales Tickets (TPV / Facturación)
    const { data: ticketsData } = await supabase
      .from('sales_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (ticketsData && ticketsData.length > 0) {
      salesTickets.value = ticketsData.map((row: any) => ({
        id: row.id,
        ticketNumber: row.ticket_number,
        sequence: Number(row.sequence) || 1,
        year: Number(row.year) || new Date().getFullYear(),
        date: row.date,
        time: row.time,
        createdAt: row.created_at,
        clientName: row.client_name,
        clientEmail: row.client_email || '',
        clientPhone: row.client_phone || '',
        clientNif: row.client_nif || '',
        clientAddress: row.client_address || '',
        isNominative: Boolean(row.is_nominative),
        items: row.items || [],
        subtotal: Number(row.subtotal) || 0,
        ivaRate: Number(row.iva_rate) || 21,
        ivaAmount: Number(row.iva_amount) || 0,
        discountAmount: Number(row.discount_amount) || 0,
        discountNote: row.discount_note || '',
        total: Number(row.total) || 0,
        paymentMethod: row.payment_method || 'efectivo',
        status: row.status || 'valido',
        cancelledReason: row.cancelled_reason || '',
        cancelledAt: row.cancelled_at || '',
        notes: row.notes || '',
        emailSent: Boolean(row.email_sent),
        viewToken: row.view_token || ''
      }))
    }

    isCloudSynced.value = true
  } catch (err) {
    console.warn('Supabase sync warning:', err)
  }
}

// Auto-run cloud sync
syncFromSupabase()

export function useSiteData() {
  function generateSecureToken(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    const randPart1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const randPart2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `nane-${randPart1}-${randPart2}`
  }

  async function updatePromotion(newPromo: Promotion) {
    promotion.value = { ...newPromo }
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: adminPinHash.value
      })
    }
  }

  async function resetPromotionToDefault() {
    await updatePromotion(defaultPromotion)
  }

  async function updateExperiences(newExperiences: Experience[]) {
    experiences.value = [...newExperiences]
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: adminPinHash.value
      })
    }
  }

  async function resetExperiencesToDefault() {
    await updateExperiences(defaultExperiences)
  }

  async function updatePacks(newPacks: Pack[]) {
    packs.value = [...newPacks]
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: adminPinHash.value
      })
    }
  }

  async function resetPacksToDefault() {
    await updatePacks(defaultPacks)
  }

  async function updateProducts(newProducts: Product[]) {
    products.value = [...newProducts]
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: adminPinHash.value
      })
    }
  }

  async function resetProductsToDefault() {
    await updateProducts(defaultProducts)
  }

  async function addProduct(prod: Omit<Product, 'id'>) {
    const newProd: Product = {
      ...prod,
      id: 'prod-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6)
    }
    products.value.push(newProd)
    await updateProducts(products.value)
    return newProd
  }

  async function deleteProduct(id: string) {
    products.value = products.value.filter(p => p.id !== id)
    await updateProducts(products.value)
  }

  async function uploadPhotosToCloud(sessionId: string, code: string, photos: string[]): Promise<string[]> {
    if (!supabase || !isSupabaseConfigured) return photos

    const uploadedUrls: string[] = []

    for (let i = 0; i < photos.length; i++) {
      const photo = photos[i]!
      if (photo.startsWith('data:image/')) {
        try {
          const base64Data = photo.split(',')[1]
          const mime = photo.substring(photo.indexOf(':') + 1, photo.indexOf(';'))
          const ext = mime.split('/')[1] || 'jpg'
          const byteCharacters = atob(base64Data!)
          const byteNumbers = new Array(byteCharacters.length)
          for (let j = 0; j < byteCharacters.length; j++) {
            byteNumbers[j] = byteCharacters.charCodeAt(j)
          }
          const byteArray = new Uint8Array(byteNumbers)
          const blob = new Blob([byteArray], { type: mime })

          const filePath = `${code}/${Date.now()}_${i + 1}.${ext}`
          const { error: uploadError } = await supabase.storage
            .from('ultrasound-photos')
            .upload(filePath, blob, { contentType: mime, upsert: true })

          if (!uploadError) {
            const { data: publicData } = supabase.storage
              .from('ultrasound-photos')
              .getPublicUrl(filePath)
            uploadedUrls.push(publicData.publicUrl)
          } else {
            uploadedUrls.push(photo)
          }
        } catch (e) {
          uploadedUrls.push(photo)
        }
      } else {
        uploadedUrls.push(photo)
      }
    }

    return uploadedUrls
  }

  function createSession(data: {
    clientName: string
    clientPhone: string
    sessionDate: string
    serviceType: string
    photos: string[]
    note?: string
    expiryDays?: number
  }): ClientSession {
    const code = generateSecureToken()
    const id = 'session-' + Date.now()

    const newSession: ClientSession = {
      id,
      code,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone.replace(/\s+/g, ''),
      sessionDate: data.sessionDate || new Date().toISOString().slice(0, 10),
      serviceType: data.serviceType || 'Eco 4D / 5D',
      expiryDays: data.expiryDays ?? 120,
      createdAt: new Date().toISOString(),
      note: data.note || '',
      photos: data.photos && data.photos.length > 0 ? data.photos : ['/gallery-4.webp', '/gallery-5.webp', '/gallery-6.webp']
    }

    sessions.value.unshift(newSession)

    // Asynchronously upload to Supabase Storage & Database if configured
    if (supabase && isSupabaseConfigured) {
      uploadPhotosToCloud(id, code, newSession.photos).then(async (cloudPhotos) => {
        newSession.photos = cloudPhotos
        await supabase!.from('client_sessions').insert({
          id: newSession.id,
          code: newSession.code,
          client_name: newSession.clientName,
          client_phone: newSession.clientPhone,
          session_date: newSession.sessionDate,
          service_type: newSession.serviceType,
          expiry_days: newSession.expiryDays,
          created_at: newSession.createdAt,
          note: newSession.note,
          photos: cloudPhotos
        })
      })
    }

    return newSession
  }

  async function deleteSession(id: string) {
    sessions.value = sessions.value.filter((s) => s.id !== id)
    if (supabase && isSupabaseConfigured) {
      await supabase.from('client_sessions').delete().eq('id', id)
    }
  }

  function getSessionByCode(code: string): { session: ClientSession | null; isExpired: boolean } {
    const found = sessions.value.find((s) => s.code.toLowerCase() === code.trim().toLowerCase())
    if (!found) return { session: null, isExpired: false }

    const created = new Date(found.createdAt).getTime()
    const now = Date.now()
    const maxAgeMs = (found.expiryDays || 120) * 24 * 60 * 60 * 1000
    const isExpired = now - created > maxAgeMs

    return { session: found, isExpired }
  }

  function verifySessionPhone(session: ClientSession, inputDigits: string): boolean {
    const cleanRegistered = session.clientPhone.replace(/\D/g, '')
    const cleanInput = inputDigits.replace(/\D/g, '')
    if (cleanInput.length < 4) return false
    return cleanRegistered.endsWith(cleanInput)
  }

  async function loginAdmin(enteredPin: string): Promise<boolean> {
    const inputHash = await hashString(enteredPin.trim())
    // Match hashed PIN or fallback to plain default
    if (inputHash === adminPinHash.value || enteredPin.trim() === 'econane2026') {
      isAdminLoggedIn.value = true
      sessionStorage.setItem(STORAGE_KEY_AUTH, 'true')
      return true
    }
    return false
  }

  function logoutAdmin() {
    isAdminLoggedIn.value = false
    sessionStorage.removeItem(STORAGE_KEY_AUTH)
  }

  async function setAdminPin(newPin: string) {
    const hashed = await hashString(newPin.trim())
    adminPinHash.value = hashed
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: hashed
      })
    }
  }

  async function updateBusinessInfo(newInfo: BusinessInfo) {
    businessInfo.value = { ...newInfo }
    if (supabase && isSupabaseConfigured) {
      await supabase.from('site_settings').upsert({
        id: 'main',
        promotion: promotion.value,
        experiences: experiences.value,
        packs: packs.value,
        products: products.value,
        business_info: businessInfo.value,
        admin_pin: adminPinHash.value
      })
    }
  }

  function getNextTicketSequence(year: number): number {
    const yearTickets = salesTickets.value.filter(t => t.year === year)
    if (yearTickets.length === 0) return 1
    const maxSeq = Math.max(...yearTickets.map(t => t.sequence || 0))
    return maxSeq + 1
  }

  function generateNextTicketNumber(year: number = new Date().getFullYear()): string {
    const series = businessInfo.value.ticketSeries || 'FS'
    const seq = getNextTicketSequence(year)
    return `${series}-${year}-${String(seq).padStart(4, '0')}`
  }

  function generateTicketViewToken(): string {
    const bytes = new Uint8Array(16)
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes)
    } else {
      for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
    }
    return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  }

  async function createSaleTicket(payload: {
    clientName: string
    clientEmail?: string
    clientPhone?: string
    clientNif?: string
    clientAddress?: string
    isNominative?: boolean
    items: TicketItem[]
    paymentMethod: PaymentMethod
    discountAmount?: number
    discountNote?: string
    notes?: string
    customDate?: string
    customTime?: string
    ivaRate?: number
  }): Promise<SaleTicket> {
    const now = new Date()
    const dateStr = payload.customDate || now.toISOString().slice(0, 10)
    const timeStr = payload.customTime || now.toTimeString().slice(0, 5)
    const year = new Date(dateStr).getFullYear() || now.getFullYear()
    const sequence = getNextTicketSequence(year)
    const series = businessInfo.value.ticketSeries || 'FS'
    const ticketNumber = `${series}-${year}-${String(sequence).padStart(4, '0')}`
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const viewToken = generateTicketViewToken()

    const ivaRate = payload.ivaRate ?? businessInfo.value.defaultIva ?? 21
    const itemsTotal = payload.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const discountAmount = Math.max(0, Math.min(itemsTotal, Number(payload.discountAmount) || 0))
    const total = Math.max(0, Math.round((itemsTotal - discountAmount) * 100) / 100)
    const subtotal = Math.round((total / (1 + (ivaRate / 100))) * 100) / 100
    const ivaAmount = Math.round((total - subtotal) * 100) / 100

    const newTicket: SaleTicket = {
      id,
      ticketNumber,
      sequence,
      year,
      date: dateStr,
      time: timeStr,
      createdAt: now.toISOString(),
      clientName: payload.clientName.trim(),
      clientEmail: (payload.clientEmail || '').trim(),
      clientPhone: (payload.clientPhone || '').trim(),
      clientNif: (payload.clientNif || '').trim(),
      clientAddress: (payload.clientAddress || '').trim(),
      isNominative: Boolean(payload.isNominative),
      items: payload.items,
      subtotal,
      ivaRate,
      ivaAmount,
      discountAmount,
      discountNote: payload.discountNote || '',
      total,
      paymentMethod: payload.paymentMethod,
      status: 'valido',
      notes: payload.notes || '',
      emailSent: false,
      viewToken
    }

    salesTickets.value.unshift(newTicket)

    if (supabase && isSupabaseConfigured) {
      await supabase.from('sales_tickets').insert({
        id: newTicket.id,
        ticket_number: newTicket.ticketNumber,
        sequence: newTicket.sequence,
        year: newTicket.year,
        date: newTicket.date,
        time: newTicket.time,
        client_name: newTicket.clientName,
        client_email: newTicket.clientEmail,
        client_phone: newTicket.clientPhone,
        client_nif: newTicket.clientNif,
        client_address: newTicket.clientAddress,
        is_nominative: newTicket.isNominative,
        items: newTicket.items,
        subtotal: newTicket.subtotal,
        iva_rate: newTicket.ivaRate,
        iva_amount: newTicket.ivaAmount,
        discount_amount: newTicket.discountAmount,
        discount_note: newTicket.discountNote,
        total: newTicket.total,
        payment_method: newTicket.paymentMethod,
        status: newTicket.status,
        notes: newTicket.notes,
        email_sent: newTicket.emailSent,
        view_token: newTicket.viewToken,
        created_at: newTicket.createdAt
      })
    }

    return newTicket
  }

  function getTicketByToken(ticketNumber: string, token: string): SaleTicket | null {
    if (!ticketNumber || !token) return null
    const cleanNum = ticketNumber.trim().toUpperCase()
    const cleanToken = token.trim()
    const found = salesTickets.value.find(t => 
      t.ticketNumber.toUpperCase() === cleanNum && 
      Boolean(t.viewToken) && 
      t.viewToken === cleanToken
    )
    return found || null
  }

  async function cancelSaleTicket(ticketId: string, reason: string): Promise<boolean> {
    const ticket = salesTickets.value.find(t => t.id === ticketId)
    if (!ticket) return false

    ticket.status = 'anulado'
    ticket.cancelledReason = reason || 'Anulación a petición del comercio'
    ticket.cancelledAt = new Date().toISOString()

    if (supabase && isSupabaseConfigured) {
      await supabase.from('sales_tickets').update({
        status: 'anulado',
        cancelled_reason: ticket.cancelledReason,
        cancelled_at: ticket.cancelledAt
      }).eq('id', ticketId)
    }

    return true
  }

  async function deleteSaleTicket(ticketId: string): Promise<boolean> {
    salesTickets.value = salesTickets.value.filter(t => t.id !== ticketId)
    if (supabase && isSupabaseConfigured) {
      await supabase.from('sales_tickets').delete().eq('id', ticketId)
    }
    return true
  }

  async function resetSalesTickets(): Promise<void> {
    salesTickets.value = []
    localStorage.removeItem(STORAGE_KEY_TICKETS)
    if (supabase && isSupabaseConfigured) {
      await supabase.from('sales_tickets').delete().neq('id', 'keep_table_structure_none')
    }
  }

  async function resetAllSessions(): Promise<void> {
    sessions.value = []
    localStorage.removeItem(STORAGE_KEY_SESSIONS)
    if (supabase && isSupabaseConfigured) {
      await supabase.from('client_sessions').delete().neq('id', 'keep_table_structure_none')
    }
  }

  async function sendTicketEmail(ticket: SaleTicket): Promise<{ success: boolean; simulated?: boolean; message?: string }> {
    if (!ticket.clientEmail) {
      return { success: false, message: 'No hay correo electrónico configurado para este ticket.' }
    }

    try {
      const response = await fetch('/api/send-ticket', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticket,
          businessInfo: businessInfo.value
        })
      })

      const contentType = response.headers.get('content-type') || ''
      if (!contentType.includes('application/json')) {
        // In local development (Vite dev server), /api/send-ticket returns index.html fallback
        return {
          success: false,
          simulated: true,
          message: 'Estás en modo de desarrollo local (npm run dev). El servidor de correo solo funciona en la versión publicada en Cloudflare Pages con RESEND_API_KEY configurada. Puedes compartir la factura oficial directamente por WhatsApp o mediante el botón de Ver Comprobante Online.'
        }
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data.error || 'Error al conectar con el servidor de correo.')
      }

      if (data.simulated) {
        return {
          success: false,
          simulated: true,
          message: data.warning || 'RESEND_API_KEY no configurada aún en Cloudflare Pages.'
        }
      }

      ticket.emailSent = true
      if (supabase && isSupabaseConfigured) {
        await supabase.from('sales_tickets').update({
          email_sent: true
        }).eq('id', ticket.id)
      }

      return { success: true }
    } catch (err: any) {
      console.warn('Error enviando ticket por email:', err)
      return { success: false, message: err?.message || 'Error desconocido' }
    }
  }

  function getWhatsAppTicketShareUrl(ticket: SaleTicket): string {
    const biz = businessInfo.value
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : ''
    const viewUrl = ticket.viewToken ? `${baseUrl}/ticket/${ticket.ticketNumber}?token=${ticket.viewToken}` : ''

    const lines = [
      `*TICKET DE COMPRA - ${biz.name || 'EcoNane'}*`,
      `*Nº Factura Simplificada:* ${ticket.ticketNumber}`,
      `*Fecha:* ${ticket.date} - ${ticket.time}`,
      `*Clienta:* ${ticket.clientName}`,
      ...(ticket.clientNif ? [`*NIF/CIF:* ${ticket.clientNif}`] : []),
      ``,
      `*Detalle:*`,
      ...ticket.items.map(it => `- ${it.quantity}x ${it.title}: ${it.totalPrice.toFixed(2)} €`),
      ...(ticket.discountAmount && ticket.discountAmount > 0 ? [`*Descuento:* -${ticket.discountAmount.toFixed(2)} €${ticket.discountNote ? ` (${ticket.discountNote})` : ''}`] : []),
      ``,
      `*Base Imponible:* ${ticket.subtotal.toFixed(2)} €`,
      `*IVA (${ticket.ivaRate}%):* ${ticket.ivaAmount.toFixed(2)} €`,
      `*TOTAL PAGADO:* ${ticket.total.toFixed(2)} € (${ticket.paymentMethod.toUpperCase()})`,
      ...(viewUrl ? [``, `📄 *Ver o descargar tu factura oficial:*`, viewUrl] : []),
      ``,
      `¡Muchísimas gracias por confiar en EcoNane para un momento tan mágico!`
    ]

    const text = encodeURIComponent(lines.join('\n'))
    const phone = (ticket.clientPhone || '').replace(/\D/g, '')
    if (phone.length >= 9) {
      const fullPhone = phone.startsWith('34') ? phone : `34${phone}`
      return `https://wa.me/${fullPhone}?text=${text}`
    }
    return `https://wa.me/?text=${text}`
  }

  function exportTicketsToCSV(ticketsToExport: SaleTicket[], filename = 'facturacion-econane.csv') {
    const sanitizeCell = (val: string | number | undefined | null): string => {
      if (val === undefined || val === null) return ''
      let str = String(val).trim()
      if (/^[=+\-@]/.test(str)) {
        str = `'${str}`
      }
      if (str.includes(';') || str.includes('"') || str.includes('\n')) {
        str = `"${str.replace(/"/g, '""')}"`
      }
      return str
    }

    const headers = [
      'Número Ticket',
      'Fecha',
      'Hora',
      'Cliente',
      'NIF / CIF',
      'Dirección Fiscal',
      'Nominativa',
      'Email',
      'Teléfono',
      'Servicios / Detalle',
      'Forma de Pago',
      'Descuento (€)',
      'Base Imponible (€)',
      'Tipo IVA (%)',
      'Cuota IVA (€)',
      'Total (€)',
      'Estado',
      'Motivo Anulación'
    ]

    const rows = ticketsToExport.map(t => {
      const itemsSummary = t.items.map(i => `${i.quantity}x ${i.title} (${i.totalPrice.toFixed(2)}€)`).join(' + ')
      return [
        sanitizeCell(t.ticketNumber),
        sanitizeCell(t.date),
        sanitizeCell(t.time),
        sanitizeCell(t.clientName),
        sanitizeCell(t.clientNif || ''),
        sanitizeCell(t.clientAddress || ''),
        sanitizeCell(t.isNominative ? 'SÍ' : 'NO'),
        sanitizeCell(t.clientEmail || ''),
        sanitizeCell(t.clientPhone || ''),
        sanitizeCell(itemsSummary),
        sanitizeCell(t.paymentMethod.toUpperCase()),
        sanitizeCell((t.discountAmount || 0).toFixed(2).replace('.', ',')),
        sanitizeCell(t.subtotal.toFixed(2).replace('.', ',')),
        sanitizeCell(t.ivaRate),
        sanitizeCell(t.ivaAmount.toFixed(2).replace('.', ',')),
        sanitizeCell(t.total.toFixed(2).replace('.', ',')),
        sanitizeCell(t.status.toUpperCase()),
        sanitizeCell(t.cancelledReason || '')
      ].join(';')
    })

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows].join('\r\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return {
    promotion,
    experiences,
    packs,
    products,
    sessions,
    businessInfo,
    salesTickets,
    isAdminLoggedIn,
    isCloudSynced,
    isSupabaseConfigured,
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
    getSessionByCode,
    verifySessionPhone,
    loginAdmin,
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
    getTicketByToken,
    exportTicketsToCSV,
    syncFromSupabase,
    formatExperienceWhatsAppLink,
    formatPackWhatsAppLink
  }
}
