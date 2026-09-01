import { ref, watch } from 'vue'
import type { Promotion, Experience, Pack, ClientSession } from '@/types'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'

const STORAGE_KEY_PROMO = 'econane_promotion'
const STORAGE_KEY_EXPERIENCES = 'econane_experiences'
const STORAGE_KEY_PACKS = 'econane_packs'
const STORAGE_KEY_SESSIONS = 'econane_client_sessions'
const STORAGE_KEY_AUTH = 'econane_admin_auth'
const STORAGE_KEY_PIN = 'econane_admin_pin'

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
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20Básica%204D/5D%20(45€).'
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
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20para%20Conocer%20el%20Sexo%20(30€).'
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
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Eco%20+%20Revelación%20de%20Sexo%20(70€).'
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
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20pedir%20cita%20para%20la%20Experiencia%20Gafas%20Virtuales%20+%20Eco%204D/5D%20(75€).'
  }
]

const defaultPacks: Pack[] = [
  {
    title: 'Pack 2 Ecos',
    price: '80€',
    save: 'Ahorra 10€',
    description: '2 sesiones para seguir cada etapa de tu embarazo y revivir la emoción.',
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20reservar%20el%20Pack%202%20Ecos%20(80€).'
  },
  {
    title: 'Pack 3 Ecos',
    price: '115€',
    save: 'Ahorra 20€',
    description: '3 momentos únicos para recordar la evolución completa para siempre.',
    link: 'https://wa.me/34644189856?text=Hola,%20quiero%20reservar%20el%20Pack%203%20Ecos%20(115€).'
  }
]

const defaultDemoSessions: ClientSession[] = [
  {
    id: 'session-demo-1',
    code: 'nane-8k92-v4p1',
    clientName: 'Laura Domínguez',
    clientPhone: '644189856',
    sessionDate: '2026-09-01',
    serviceType: 'Experiencia Gafas Virtuales + Eco 5D',
    expiryDays: 120,
    createdAt: new Date().toISOString(),
    note: 'Sesión inolvidable, el bebé se tapaba la carita al inicio pero luego pudimos ver su sonrisa con claridad.',
    photos: ['/gallery-4.webp', '/gallery-5.webp', '/gallery-6.webp', '/gallery-1.webp', '/gallery-2.webp', '/gallery-3.webp']
  }
]

// Initial SHA-256 hash of 'econane2026'
const DEFAULT_HASH = '1f81014e3650630fc655c6e83efec4aa3ee734c54cb43a413d964cb70a831e50'

// Global Reactive Singletons
const promotion = ref<Promotion>(loadFromStorage(STORAGE_KEY_PROMO, defaultPromotion))
const experiences = ref<Experience[]>(loadFromStorage(STORAGE_KEY_EXPERIENCES, defaultExperiences))
const packs = ref<Pack[]>(loadFromStorage(STORAGE_KEY_PACKS, defaultPacks))
const sessions = ref<ClientSession[]>(loadFromStorage(STORAGE_KEY_SESSIONS, defaultDemoSessions))
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
watch(sessions, (val) => localStorage.setItem(STORAGE_KEY_SESSIONS, JSON.stringify(val)), { deep: true })
watch(adminPinHash, (val) => localStorage.setItem(STORAGE_KEY_PIN, JSON.stringify(val)))

// Supabase Cloud Sync Engine
async function syncFromSupabase() {
  if (!supabase || !isSupabaseConfigured) return

  try {
    // 1. Fetch Site Settings (Promo, Prices, Packs, PIN Hash)
    const { data: settingsData } = await supabase
      .from('site_settings')
      .select('*')
      .eq('id', 'main')
      .single()

    if (settingsData) {
      if (settingsData.promotion) promotion.value = settingsData.promotion
      if (settingsData.experiences) experiences.value = settingsData.experiences
      if (settingsData.packs) packs.value = settingsData.packs
      if (settingsData.admin_pin) {
        // If it's a 64 char hex hash or raw string
        if (settingsData.admin_pin.length === 64) {
          adminPinHash.value = settingsData.admin_pin
        } else {
          // Convert legacy plaintext to hash
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
        admin_pin: adminPinHash.value
      })
    }
  }

  async function resetPacksToDefault() {
    await updatePacks(defaultPacks)
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
        admin_pin: hashed
      })
    }
  }

  return {
    promotion,
    experiences,
    packs,
    sessions,
    isAdminLoggedIn,
    isCloudSynced,
    isSupabaseConfigured,
    updatePromotion,
    resetPromotionToDefault,
    updateExperiences,
    resetExperiencesToDefault,
    updatePacks,
    resetPacksToDefault,
    createSession,
    deleteSession,
    getSessionByCode,
    verifySessionPhone,
    loginAdmin,
    logoutAdmin,
    setAdminPin,
    syncFromSupabase
  }
}
