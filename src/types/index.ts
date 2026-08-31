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
  title: string
  duration?: string
  description: string
  price: string
  features: string[]
  badge?: string
  link: string
}

export type Pack = {
  title: string
  price: string
  save: string
  description: string
  link: string
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
