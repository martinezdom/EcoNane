import { ref, watch } from 'vue'
import type {
  Promotion,
  Experience,
  Pack,
  CollaboratorPack,
  Product,
  ClientSession,
  SaleTicket,
  TicketItem,
  BusinessInfo,
  PaymentMethod,
  Appointment,
  AppointmentStatus,
  BookingSettings,
  DaySchedule
} from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const STORAGE_KEY_PROMO = 'econane_promotion'
const STORAGE_KEY_EXPERIENCES = 'econane_experiences'
const STORAGE_KEY_PACKS = 'econane_packs'
const STORAGE_KEY_COLLAB_PACKS = 'econane_collab_packs'
const STORAGE_KEY_PRODUCTS = 'econane_products'
const STORAGE_KEY_SESSIONS = 'econane_client_sessions'
const STORAGE_KEY_AUTH = 'econane_admin_auth'
const STORAGE_KEY_COLLAB_AUTH = 'econane_collab_auth'
const STORAGE_KEY_PIN = 'econane_admin_pin'
const STORAGE_KEY_TICKETS = 'econane_sales_tickets'
const STORAGE_KEY_BIZ = 'econane_business_info'
const STORAGE_KEY_APPOINTMENTS = 'econane_appointments'
const STORAGE_KEY_BOOKING_SETTINGS = 'econane_booking_settings'

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

const defaultCollaboratorPacks: CollaboratorPack[] = [
  {
    id: 'collab-1',
    title: 'Latidos que llenan + La gran noticia',
    subtitle: 'Eco Básica 4D/5D + 5 Fotos Digitales',
    ecoTitle: 'Latidos que llenan (Eco Básica)',
    photoTitle: 'La gran noticia (Sesión Fotográfica)',
    price: '58€',
    ecoPrice: 20,
    photoPrice: 38,
    econaneCommissionPercent: 20,
    penelopeShare: 30.40,
    econaneShare: 27.60,
    duration: '15 min',
    badge: 'Novedad',
    description: 'Sesión para escuchar el latido de tu bebé y disfrutar de un reportaje fotográfico profesional de 5 fotos.',
    features: [
      'Ecografía 4D/5D de 15 min',
      'Escucha y grabación del latido',
      'Reportaje fotográfico profesional (5 fotos en HD)',
      'Entrega directa por Penélope Photograph',
      'Acompañantes ilimitados'
    ],
    active: true,
    link: formatPackWhatsAppLink('Pack Latidos que llenan + La gran noticia')
  },
  {
    id: 'collab-2',
    title: 'Eco Revelación de Sexo + Niño o niña',
    subtitle: 'Eco Especial Familia + Revelación Fotográfica',
    ecoTitle: 'Eco + Revelación de Sexo',
    photoTitle: 'Niño o niña (Sesión Fotográfica)',
    price: '128€',
    ecoPrice: 70,
    photoPrice: 58,
    econaneCommissionPercent: 20,
    penelopeShare: 46.40,
    econaneShare: 81.60,
    duration: '15 min',
    badge: 'Más Popular',
    description: 'Descubre si es niño o niña con revelación en globo y una sesión fotográfica profesional de 5 fotos.',
    features: [
      'Eco 4D/5D con revelación en globo',
      'Pequeño regalo sorpresa',
      'Sesión de fotos profesional (5 fotos en HD)',
      'Vestuario de estudio disponible',
      'Fotos y vídeos digitales de la eco'
    ],
    active: true,
    link: formatPackWhatsAppLink('Pack Eco Revelación + Niño o niña')
  },
  {
    id: 'collab-3',
    title: 'Experiencia Gafas VR + A punto de conocerte',
    subtitle: 'Eco Inmersiva VR 4D/5D + Sesión Fotográfica Premamá',
    ecoTitle: 'Experiencia Gafas Virtuales VR + Eco 4D/5D',
    photoTitle: 'A punto de conocerte (Sesión Fotográfica)',
    price: '143€',
    ecoPrice: 75,
    photoPrice: 68,
    econaneCommissionPercent: 20,
    penelopeShare: 54.40,
    econaneShare: 88.60,
    duration: '25 min',
    badge: 'Experiencia VIP',
    description: 'La máxima inmersión con gafas VR sintiendo a tu bebé más cerca, con sesión de fotos y 1 cambio de vestuario incluido.',
    features: [
      'Experiencia inmersiva con Gafas VR',
      'Eco 4D/5D completa (25 min)',
      'Sesión de fotos profesional (5 fotos en HD)',
      '1 cambio de vestuario incluido',
      'Todas las fotos y vídeos digitales'
    ],
    active: true,
    link: formatPackWhatsAppLink('Pack Experiencia VR + A punto de conocerte')
  },
  {
    id: 'collab-4',
    title: 'Seguimiento Completo: 3 Ecos + 3 Momentos Especiales',
    subtitle: 'Seguimiento Trimestral + 3 Sesiones Fotográficas',
    ecoTitle: 'Pack 3 Ecos (Evolución Completa)',
    photoTitle: '3 Momentos Especiales (3 Sesiones Fotos)',
    price: '249€',
    ecoPrice: 115,
    photoPrice: 134,
    econaneCommissionPercent: 20,
    penelopeShare: 107.20,
    econaneShare: 141.80,
    duration: '3 Sesiones',
    badge: 'Ahorro 30€',
    description: 'El recuerdo definitivo de tu embarazo en 3 etapas únicas con un descuento especial de 30€ ya aplicado.',
    features: [
      '3 Sesiones completas de ecografía 4D/5D',
      '3 Sesiones de fotos profesionales (15 fotos en HD)',
      '30€ de descuento ya aplicado en el total',
      'Seguimiento de la evolución de tu bebé',
      'Prioridad de reserva en viernes'
    ],
    active: true,
    link: formatPackWhatsAppLink('Pack Seguimiento 3 Ecos + 3 Momentos Especiales')
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

const defaultBookingSettings: BookingSettings = {
  slotIntervalMinutes: 45,
  bufferMinutes: 15,
  minNoticeHours: 2,
  maxFutureDays: 60,
  schedule: {
    0: { isOpen: false, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    1: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    2: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    3: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    4: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    5: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' },
    6: { isOpen: true, morningStart: '09:45', morningEnd: '14:00', afternoonStart: '16:30', afternoonEnd: '20:30' }
  },
  blockedDates: []
}

const defaultAppointments: Appointment[] = [
  {
    id: 'appt-tata-1',
    bookingCode: 'ECO-1318',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-13',
    time: '18:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-2',
    bookingCode: 'ECO-1411',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco para Conocer el Sexo',
    serviceDuration: 30,
    servicePrice: '30€',
    date: '2026-10-14',
    time: '11:00',
    notes: 'Reserva por WhatsApp (Latidos)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-3',
    bookingCode: 'ECO-1417',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-14',
    time: '17:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-4',
    bookingCode: 'ECO-1619',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-16',
    time: '19:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-5',
    bookingCode: 'ECO-1711',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-17',
    time: '11:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-6',
    bookingCode: 'ECO-2417',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-24',
    time: '17:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:42:00.000Z'
  },
  {
    id: 'appt-tata-7',
    bookingCode: 'ECO-2718',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Eco Básica 4D/5D',
    serviceDuration: 45,
    servicePrice: '45€',
    date: '2026-10-27',
    time: '18:00',
    notes: 'Reserva por WhatsApp (5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  },
  {
    id: 'appt-tata-8',
    bookingCode: 'ECO-0210',
    clientName: 'Reserva WhatsApp',
    clientPhone: '644189856',
    clientEmail: '',
    gestationWeek: '',
    serviceTitle: 'Experiencia Gafas Virtuales + Eco 4D/5D',
    serviceDuration: 45,
    servicePrice: '75€',
    date: '2026-11-02',
    time: '10:00',
    notes: 'Reserva por WhatsApp (Gafas VR + Eco 5D)',
    status: 'confirmed',
    createdAt: '2026-10-12T18:40:00.000Z'
  }
]

function getInitialAppointments(): Appointment[] {
  const stored = loadFromStorage<Appointment[]>(STORAGE_KEY_APPOINTMENTS, [])
  if (!stored || stored.length === 0) {
    return defaultAppointments
  }
  const updatedStored = stored.map(s => {
    if (s.clientName === 'Reserva WhatsApp (Tata)') {
      return {
        ...s,
        clientName: 'Reserva WhatsApp',
        notes: s.notes ? s.notes.replace(' (Tata)', '').replace('Anotada por Tata', 'Reserva por WhatsApp') : s.notes
      }
    }
    return s
  })
  const existingIds = new Set(updatedStored.map(a => a.id))
  const missing = defaultAppointments.filter(d => !existingIds.has(d.id))
  if (missing.length > 0) {
    return [...updatedStored, ...missing]
  }
  return updatedStored
}

// Global Reactive Singletons
const promotion = ref<Promotion>(loadFromStorage(STORAGE_KEY_PROMO, defaultPromotion))
const experiences = ref<Experience[]>(
  sanitizeExperienceLinks(loadFromStorage(STORAGE_KEY_EXPERIENCES, defaultExperiences))
)
const packs = ref<Pack[]>(
  sanitizePackLinks(loadFromStorage(STORAGE_KEY_PACKS, defaultPacks))
)
const collaboratorPacks = ref<CollaboratorPack[]>(
  loadFromStorage(STORAGE_KEY_COLLAB_PACKS, defaultCollaboratorPacks)
)
const products = ref<Product[]>(loadFromStorage(STORAGE_KEY_PRODUCTS, defaultProducts))
const sessions = ref<ClientSession[]>(loadFromStorage(STORAGE_KEY_SESSIONS, defaultDemoSessions))
const businessInfo = ref<BusinessInfo>(loadFromStorage(STORAGE_KEY_BIZ, defaultBusinessInfo))
const salesTickets = ref<SaleTicket[]>(loadFromStorage(STORAGE_KEY_TICKETS, defaultDemoTickets))
const appointments = ref<Appointment[]>(getInitialAppointments())
const bookingSettings = ref<BookingSettings>(loadFromStorage(STORAGE_KEY_BOOKING_SETTINGS, defaultBookingSettings))
const adminPinHash = ref<string>(loadFromStorage(STORAGE_KEY_PIN, DEFAULT_HASH))
const isAdminLoggedIn = ref<boolean>(sessionStorage.getItem(STORAGE_KEY_AUTH) === 'true')
const isCollaboratorLoggedIn = ref<boolean>(sessionStorage.getItem(STORAGE_KEY_COLLAB_AUTH) === 'true')
const isCloudSynced = ref<boolean>(false)

// Entorno y Aislamiento de Base de Datos Local vs Producción
export const isDevEnvironment = typeof window !== 'undefined' && (
  window.location.hostname === 'localhost' ||
  window.location.hostname === '127.0.0.1' ||
  Boolean((import.meta as any).env?.DEV)
)

// Modo de Datos: 'local' (pruebas aisladas en localStorage) o 'cloud' (Supabase producción)
// En localhost arranca en 'local' para que ninguna prueba contamine la clínica.
// En producción (web publicada) siempre está en 'cloud'.
const savedDataSource = typeof window !== 'undefined'
  ? (localStorage.getItem('econane_data_source_mode') as 'local' | 'cloud')
  : null

export const activeDataSource = ref<'local' | 'cloud'>(
  isDevEnvironment ? (savedDataSource || 'local') : 'cloud'
)

export function isCloudActive(): boolean {
  return Boolean(supabase && isSupabaseConfigured && activeDataSource.value === 'cloud')
}

export async function setDataSourceMode(mode: 'local' | 'cloud') {
  activeDataSource.value = mode
  if (typeof window !== 'undefined') {
    localStorage.setItem('econane_data_source_mode', mode)
  }
  if (mode === 'cloud') {
    await syncFromSupabase()
  } else {
    isCloudSynced.value = false
  }
}

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
watch(collaboratorPacks, (val) => localStorage.setItem(STORAGE_KEY_COLLAB_PACKS, JSON.stringify(val)), { deep: true })
watch(products, (val) => localStorage.setItem(STORAGE_KEY_PRODUCTS, JSON.stringify(val)), { deep: true })
watch(sessions, (val) => localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(val)), { deep: true })
watch(businessInfo, (val) => localStorage.setItem(STORAGE_KEY_BIZ, JSON.stringify(val)), { deep: true })
watch(salesTickets, (val) => localStorage.setItem(STORAGE_KEY_TICKETS, JSON.stringify(val)), { deep: true })
watch(appointments, (val) => localStorage.setItem(STORAGE_KEY_APPOINTMENTS, JSON.stringify(val)), { deep: true })
watch(bookingSettings, (val) => localStorage.setItem(STORAGE_KEY_BOOKING_SETTINGS, JSON.stringify(val)), { deep: true })
watch(adminPinHash, (val) => localStorage.setItem(STORAGE_KEY_PIN, JSON.stringify(val)))

// Supabase Cloud Sync Engine
async function syncFromSupabase() {
  if (!supabase || !isSupabaseConfigured || !isCloudActive()) return

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

    // 2. Fetch Client Sessions with safe bidirectional merge
    const { data: sessionsData, error: sessionsError } = await supabase
      .from('client_sessions')
      .select('*')
      .order('created_at', { ascending: false })

    if (!sessionsError && sessionsData) {
      const cloudSessions: ClientSession[] = sessionsData.map((row: any) => ({
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

      if (cloudSessions.length > 0) {
        sessions.value = cloudSessions.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      } else {
        // Initial setup only: If cloud is completely empty, seed initial sessions
        if (sessions.value.length > 0) {
          try {
            const rowsToInsert = sessions.value.map(s => ({
              id: s.id,
              code: s.code,
              client_name: s.clientName,
              client_phone: s.clientPhone,
              session_date: s.sessionDate,
              service_type: s.serviceType,
              expiry_days: s.expiryDays,
              note: s.note,
              photos: s.photos,
              zip_url: s.zipUrl,
              created_at: s.createdAt
            }))
            await supabase.from('client_sessions').upsert(rowsToInsert)
          } catch (e) {
            console.warn('Could not auto-seed sessions to Supabase:', e)
          }
        }
      }
    }

    // 3. Fetch Sales Tickets (TPV / Facturación) from Cloud
    const { data: ticketsData, error: ticketsError } = await supabase
      .from('sales_tickets')
      .select('*')
      .order('created_at', { ascending: false })

    if (!ticketsError && ticketsData) {
      const cloudTickets: SaleTicket[] = ticketsData.map((row: any) => ({
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

      if (cloudTickets.length > 0) {
        salesTickets.value = cloudTickets.sort((a, b) => {
          if (b.year !== a.year) return b.year - a.year
          return (b.sequence || 0) - (a.sequence || 0)
        })
      }
    }

    if (settingsData && settingsData.booking_settings) {
      bookingSettings.value = { ...defaultBookingSettings, ...settingsData.booking_settings }
    }

    // 4. Fetch Appointments (Agenda de Citas) from Cloud
    try {
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .order('date', { ascending: true })

      if (!apptError && apptData) {
        const cloudAppts: Appointment[] = apptData.map((row: any) => ({
          id: row.id,
          bookingCode: row.booking_code,
          clientName: row.client_name,
          clientPhone: row.client_phone,
          clientEmail: row.client_email || '',
          gestationWeek: row.gestation_week || '',
          serviceTitle: row.service_title,
          serviceDuration: Number(row.duration_minutes) || 45,
          servicePrice: row.service_price || '',
          date: row.date,
          time: row.time,
          notes: row.notes || '',
          status: (row.status as AppointmentStatus) || 'confirmed',
          createdAt: row.created_at,
          cancelledReason: row.cancelled_reason || '',
          reminderSent: Boolean(row.reminder_sent)
        }))

        if (cloudAppts.length > 0) {
          // Cloud has canonical appointments (including the 9 real production ones)
          appointments.value = cloudAppts.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date)
            return a.time.localeCompare(b.time)
          })
        }
      }
    } catch (e) {
      // Fallback si la tabla aún no se ha creado
    }

    isCloudSynced.value = true
  } catch (err) {
    console.warn('Supabase sync warning:', err)
  }
}

// Auto-run cloud sync if cloud mode is active
if (isCloudActive()) {
  syncFromSupabase()
}

export function useSiteData() {
  function generateSecureToken(): string {
    const chars = 'abcdefghjkmnpqrstuvwxyz23456789'
    const randPart1 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    const randPart2 = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `nane-${randPart1}-${randPart2}`
  }

  async function updatePromotion(newPromo: Promotion) {
    promotion.value = { ...newPromo }
    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
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
    if (!supabase || !isCloudActive()) return photos

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
    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
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
    if (cleanInput.length < 4 || cleanRegistered.length < 4) return false
    const last4Registered = cleanRegistered.slice(-4)
    const last4Input = cleanInput.slice(-4)
    return last4Registered === last4Input || cleanRegistered.endsWith(cleanInput) || cleanInput.endsWith(cleanRegistered)
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

  function loginCollaborator(enteredPin: string): boolean {
    const clean = enteredPin.trim().toLowerCase()
    if (clean === 'agenda2026' || clean === 'foto2026' || clean === 'penelope2026' || clean === 'econane2026') {
      isCollaboratorLoggedIn.value = true
      sessionStorage.setItem(STORAGE_KEY_COLLAB_AUTH, 'true')
      return true
    }
    return false
  }

  function logoutCollaborator() {
    isCollaboratorLoggedIn.value = false
    sessionStorage.removeItem(STORAGE_KEY_COLLAB_AUTH)
  }

  async function setAdminPin(newPin: string) {
    const hashed = await hashString(newPin.trim())
    adminPinHash.value = hashed
    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
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
    customSequence?: number
    customTicketNumber?: string
  }): Promise<SaleTicket> {
    const now = new Date()
    const dateStr = payload.customDate || now.toISOString().slice(0, 10)
    const timeStr = payload.customTime || now.toTimeString().slice(0, 5)
    const year = new Date(dateStr).getFullYear() || now.getFullYear()
    const sequence = payload.customSequence !== undefined ? payload.customSequence : getNextTicketSequence(year)
    const series = businessInfo.value.ticketSeries || 'FS'
    const ticketNumber = payload.customTicketNumber || `${series}-${year}-${String(sequence).padStart(4, '0')}`
    const id = `ticket-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const viewToken = generateTicketViewToken()

    const ivaRate = payload.ivaRate ?? businessInfo.value.defaultIva ?? 21
    const itemsTotal = payload.items.reduce((sum, item) => sum + item.totalPrice, 0)
    const discountAmount = Math.max(0, Math.min(itemsTotal, Number(payload.discountAmount) || 0))
    const total = Math.max(0, Math.round((itemsTotal - discountAmount) * 100) / 100)
    const subtotal = Math.round((total / (1 + (ivaRate / 100))) * 100) / 100
    const ivaAmount = Math.round((total - subtotal) * 100) / 100

    const hasCollaboratorItems = payload.items.some(it => it.isCollaborator)
    const thirdPartyAmount = Math.round(
      payload.items
        .filter(it => it.isCollaborator)
        .reduce((sum, it) => sum + ((it.collaboratorShare || 0) * it.quantity), 0) * 100
    ) / 100
    const econaneNetRevenue = Math.max(0, Math.round((total - thirdPartyAmount) * 100) / 100)

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
      viewToken,
      hasCollaboratorItems,
      thirdPartyAmount,
      econaneNetRevenue
    }

    salesTickets.value.unshift(newTicket)
    salesTickets.value.sort((a, b) => {
      if (b.year !== a.year) return b.year - a.year
      return (b.sequence || 0) - (a.sequence || 0)
    })

    if (supabase && isCloudActive()) {
      await supabase.from('sales_tickets').upsert({
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

    if (supabase && isCloudActive()) {
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
    if (supabase && isCloudActive()) {
      await supabase.from('sales_tickets').delete().eq('id', ticketId)
    }
    return true
  }

  async function resetSalesTickets(): Promise<void> {
    salesTickets.value = []
    localStorage.removeItem(STORAGE_KEY_TICKETS)
    if (supabase && isCloudActive()) {
      await supabase.from('sales_tickets').delete().neq('id', 'keep_table_structure_none')
    }
  }

  async function resetAllSessions(): Promise<void> {
    sessions.value = []
    localStorage.removeItem(STORAGE_KEY_SESSIONS)
    if (supabase && isCloudActive()) {
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
      if (supabase && isCloudActive()) {
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

  function exportAppointmentsToCSV(apptsToExport: Appointment[], filename = 'agenda-citas-econane.csv') {
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
      'Código Cita',
      'Fecha',
      'Hora',
      'Duración (min)',
      'Clienta / Familia',
      'Teléfono',
      'Email',
      'Semana Gestación',
      'Servicio',
      'Importe',
      'Estado',
      'Observaciones / Notas',
      'Fecha Creación'
    ]

    const rows = apptsToExport.map(a => {
      return [
        sanitizeCell(a.bookingCode),
        sanitizeCell(a.date),
        sanitizeCell(a.time),
        sanitizeCell(a.serviceDuration),
        sanitizeCell(a.clientName),
        sanitizeCell(a.clientPhone),
        sanitizeCell(a.clientEmail || ''),
        sanitizeCell(a.gestationWeek || ''),
        sanitizeCell(a.serviceTitle),
        sanitizeCell(a.servicePrice),
        sanitizeCell(a.status.toUpperCase()),
        sanitizeCell(a.notes || ''),
        sanitizeCell(a.createdAt)
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

  function generateBookingCode(): string {
    const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'
    const code = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
    return `ECO-${code}`
  }

  function getAvailableSlots(dateStr: string, sessionDuration = 45): string[] {
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return []

    const dateObj = new Date(`${dateStr}T00:00:00`)
    if (isNaN(dateObj.getTime())) return []

    if (bookingSettings.value.blockedDates?.includes(dateStr)) return []

    const dayOfWeek = dateObj.getDay()
    const daySched = bookingSettings.value.schedule?.[dayOfWeek]
    if (!daySched || !daySched.isOpen) return []

    const toMins = (time: string) => {
      const [h, m] = time.split(':').map(Number)
      return (h || 0) * 60 + (m || 0)
    }

    const toTimeStr = (mins: number) => {
      const h = Math.floor(mins / 60).toString().padStart(2, '0')
      const m = (mins % 60).toString().padStart(2, '0')
      return `${h}:${m}`
    }

    const interval = bookingSettings.value.slotIntervalMinutes || 45
    const step = Math.max(interval, 30)
    const rawSlots: string[] = []

    if (daySched.morningStart && daySched.morningEnd) {
      let cur = toMins(daySched.morningStart)
      const end = toMins(daySched.morningEnd)
      while (cur + sessionDuration <= end) {
        rawSlots.push(toTimeStr(cur))
        cur += step
      }
    }

    if (daySched.afternoonStart && daySched.afternoonEnd) {
      let cur = toMins(daySched.afternoonStart)
      const end = toMins(daySched.afternoonEnd)
      while (cur + sessionDuration <= end) {
        rawSlots.push(toTimeStr(cur))
        cur += step
      }
    }

    const now = new Date()
    const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    const currentMinutesToday = now.getHours() * 60 + now.getMinutes()
    const minNoticeMinutes = (bookingSettings.value.minNoticeHours || 2) * 60

    const dayAppointments = appointments.value.filter(
      (a) => a.date === dateStr && a.status === 'confirmed'
    )

    return rawSlots.filter((slotTime) => {
      const slotMins = toMins(slotTime)

      if (dateStr === todayStr && slotMins < currentMinutesToday + minNoticeMinutes) {
        return false
      }

      for (const appt of dayAppointments) {
        const apptMins = toMins(appt.time)
        const apptDuration = appt.serviceDuration || 45
        const slotEnd = slotMins + sessionDuration
        const apptEnd = apptMins + apptDuration
        if (slotMins < apptEnd && apptMins < slotEnd) {
          return false
        }
      }

      return true
    })
  }

  async function createAppointment(data: {
    clientName: string
    clientPhone: string
    clientEmail?: string
    gestationWeek?: string
    serviceTitle: string
    serviceDuration?: number
    servicePrice?: string
    date: string
    time: string
    notes?: string
  }): Promise<Appointment> {
    const id = `appt-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
    const bookingCode = generateBookingCode()
    const duration = data.serviceDuration || 45

    const newAppt: Appointment = {
      id,
      bookingCode,
      clientName: data.clientName.trim(),
      clientPhone: data.clientPhone.trim(),
      clientEmail: (data.clientEmail || '').trim(),
      gestationWeek: (data.gestationWeek || '').trim(),
      serviceTitle: data.serviceTitle.trim(),
      serviceDuration: duration,
      servicePrice: (data.servicePrice || '').trim(),
      date: data.date,
      time: data.time,
      notes: (data.notes || '').trim(),
      status: 'confirmed',
      createdAt: new Date().toISOString()
    }

    appointments.value = [newAppt, ...appointments.value]

    if (supabase && isCloudActive()) {
      try {
        await supabase.from('appointments').insert({
          id: newAppt.id,
          booking_code: newAppt.bookingCode,
          client_name: newAppt.clientName,
          client_phone: newAppt.clientPhone,
          client_email: newAppt.clientEmail,
          gestation_week: newAppt.gestationWeek,
          service_title: newAppt.serviceTitle,
          duration_minutes: newAppt.serviceDuration,
          service_price: newAppt.servicePrice,
          date: newAppt.date,
          time: newAppt.time,
          notes: newAppt.notes,
          status: newAppt.status,
          created_at: newAppt.createdAt
        })
      } catch (err) {
        console.warn('Could not insert appointment in Supabase:', err)
      }
    }

    sendBookingConfirmationEmail(newAppt).catch(() => {})

    return newAppt
  }

  async function updateAppointmentStatus(id: string, status: AppointmentStatus, cancelledReason?: string) {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      appointments.value[idx]!.status = status
      if (cancelledReason) {
        appointments.value[idx]!.cancelledReason = cancelledReason
      }
    }

    if (supabase && isCloudActive()) {
      try {
        await supabase.from('appointments').update({
          status,
          cancelled_reason: cancelledReason || ''
        }).eq('id', id)
      } catch (err) {
        console.warn('Could not update appointment status in Supabase:', err)
      }
    }
  }

  async function updateAppointment(id: string, updates: Partial<Appointment>) {
    const idx = appointments.value.findIndex(a => a.id === id)
    if (idx !== -1) {
      appointments.value[idx] = { ...appointments.value[idx]!, ...updates }
    }

    if (supabase && isCloudActive()) {
      try {
        const payload: any = {}
        if (updates.date) payload.date = updates.date
        if (updates.time) payload.time = updates.time
        if (updates.clientName) payload.client_name = updates.clientName
        if (updates.clientPhone) payload.client_phone = updates.clientPhone
        if (updates.clientEmail !== undefined) payload.client_email = updates.clientEmail
        if (updates.notes !== undefined) payload.notes = updates.notes
        if (updates.status) payload.status = updates.status

        await supabase.from('appointments').update(payload).eq('id', id)
      } catch (err) {
        console.warn('Could not update appointment in Supabase:', err)
      }
    }
  }

  async function deleteAppointment(id: string) {
    appointments.value = appointments.value.filter(a => a.id !== id)
    if (supabase && isCloudActive()) {
      try {
        await supabase.from('appointments').delete().eq('id', id)
      } catch (err) {
        console.warn('Could not delete appointment in Supabase:', err)
      }
    }
  }

  async function saveBookingSettings(newSettings: BookingSettings) {
    bookingSettings.value = { ...newSettings }
    if (supabase && isCloudActive()) {
      try {
        await supabase.from('site_settings').upsert({
          id: 'main',
          booking_settings: newSettings
        })
      } catch (err) {
        console.warn('Could not save booking settings in Supabase:', err)
      }
    }
  }

  function generateGoogleCalendarUrl(appt: Appointment): string {
    if (!appt || !appt.date || !appt.time) return '#'
    const title = encodeURIComponent(`Ecografía en EcoNane - ${appt.serviceTitle || ''}`)
    const details = encodeURIComponent(
      `Cita en EcoNane para ${appt.clientName || 'Mamá'} (Código: ${appt.bookingCode || ''}).\nServicio: ${appt.serviceTitle || ''}\nTeléfono: +34 644 18 98 56\nUbicación: Carrer Colón, 114, 03570 La Vila Joiosa`
    )
    const location = encodeURIComponent('Carrer Colón, 114, 03570 La Vila Joiosa, Alicante')

    const [year, month, day] = appt.date.split('-')
    const [hour, min] = appt.time.split(':')
    const startStr = `${year}${month}${day}T${hour}${min}00`

    const dur = appt.serviceDuration || 45
    const endMinutes = Number(hour) * 60 + Number(min) + dur
    const endH = Math.floor(endMinutes / 60).toString().padStart(2, '0')
    const endM = (endMinutes % 60).toString().padStart(2, '0')
    const endStr = `${year}${month}${day}T${endH}${endM}00`

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startStr}/${endStr}&details=${details}&location=${location}`
  }

  function generateWhatsAppBookingUrl(appt: Appointment): string {
    const text = encodeURIComponent(
      `¡Hola Mireia! ❤️ He reservado mi cita en EcoNane:\n\n` +
      `🤰 Mamá: ${appt.clientName}\n` +
      `📅 Fecha: ${appt.date} a las ${appt.time} h\n` +
      `✨ Servicio: ${appt.serviceTitle}\n` +
      `🔖 Código: ${appt.bookingCode}\n\n` +
      `¡Muchas gracias!`
    )
    return `https://wa.me/34644189856?text=${text}`
  }

  async function sendBookingConfirmationEmail(appt: Appointment): Promise<{ success: boolean; message?: string }> {
    try {
      const res = await fetch('/api/send-booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          appointment: appt,
          businessInfo: businessInfo.value
        })
      })
      if (res.ok) {
        return { success: true }
      }
      return { success: false, message: 'No se pudo enviar el correo de confirmación' }
    } catch (err: any) {
      return { success: false, message: err?.message || 'Error de conexión' }
    }
  }

  return {
    promotion,
    experiences,
    packs,
    products,
    sessions,
    businessInfo,
    salesTickets,
    appointments,
    bookingSettings,
    isAdminLoggedIn,
    isCloudSynced,
    isSupabaseConfigured,
    isDevEnvironment,
    activeDataSource,
    setDataSourceMode,
    isCloudActive,
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
    exportAppointmentsToCSV,
    syncFromSupabase,
    formatExperienceWhatsAppLink,
    formatPackWhatsAppLink,
    getAvailableSlots,
    collaboratorPacks,
    isCollaboratorLoggedIn,
    loginCollaborator,
    logoutCollaborator,
    createAppointment,
    updateAppointmentStatus,
    updateAppointment,
    deleteAppointment,
    saveBookingSettings,
    generateGoogleCalendarUrl,
    generateWhatsAppBookingUrl,
    sendBookingConfirmationEmail
  }
}
