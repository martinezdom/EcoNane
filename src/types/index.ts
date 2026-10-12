export type Promotion = {
  active: boolean
  badge: string
  title: string
  description: string
  discountCode?: string
  whatsappText: string
}

export type Feature = {
  icon: any
  title: string
  description: string
}

export type Experience = {
  id?: string
  title: string
  duration?: string
  description: string
  price: string
  features: string[]
  badge?: string
  link: string
  active?: boolean
}

export type Pack = {
  title: string
  price: string
  save: string
  description: string
  link: string
}

export type Product = {
  id: string
  title: string
  price: string
  category?: string
  description?: string
  active?: boolean
}

export type FAQ = {
  question: string
  answer: string
}

export type Benefit = {
  icon: any
  title: string
  desc: string
}

export type ClientSession = {
  id: string
  code: string
  clientName: string
  clientPhone: string
  sessionDate: string
  serviceType: string
  expiryDays: number
  createdAt: string
  note?: string
  photos: string[]
  zipUrl?: string
}

export type PaymentMethod = 'efectivo' | 'tarjeta' | 'bizum' | 'transferencia'

export type TicketItem = {
  id: string
  title: string
  quantity: number
  unitPrice: number
  totalPrice: number
  ivaPercent: number
}

export type SaleTicket = {
  id: string
  ticketNumber: string
  sequence: number
  year: number
  date: string
  time: string
  createdAt: string
  clientName: string
  clientEmail?: string
  clientPhone?: string
  clientNif?: string
  clientAddress?: string
  isNominative?: boolean
  items: TicketItem[]
  subtotal: number
  ivaRate: number
  ivaAmount: number
  discountAmount?: number
  discountNote?: string
  total: number
  paymentMethod: PaymentMethod
  status: 'valido' | 'anulado'
  cancelledReason?: string
  cancelledAt?: string
  notes?: string
  emailSent?: boolean
  viewToken: string
}

export type BusinessInfo = {
  name: string
  legalName: string
  nif: string
  address: string
  city: string
  postalCode: string
  phone: string
  email: string
  ticketSeries: string
  defaultIva: number
}

export type AppointmentStatus = 'confirmed' | 'completed' | 'cancelled' | 'no_show'

export type Appointment = {
  id: string
  bookingCode: string
  clientName: string
  clientPhone: string
  clientEmail?: string
  gestationWeek?: string
  serviceTitle: string
  serviceDuration: number
  servicePrice: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  notes?: string
  status: AppointmentStatus
  createdAt: string
  cancelledReason?: string
  reminderSent?: boolean
}

export type DaySchedule = {
  isOpen: boolean
  morningStart: string
  morningEnd: string
  afternoonStart: string
  afternoonEnd: string
}

export type BookingSettings = {
  slotIntervalMinutes: number
  bufferMinutes: number
  minNoticeHours: number
  maxFutureDays: number
  schedule: Record<number, DaySchedule> // 0: Sunday, 1: Monday, ... 6: Saturday
  blockedDates: string[] // Array of 'YYYY-MM-DD'
}

