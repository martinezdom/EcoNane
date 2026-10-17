import { ref, computed } from 'vue'
import es from '@/locales/es.json'
import en from '@/locales/en.json'
import va from '@/locales/va.json'

export type SupportedLanguage = 'es' | 'en' | 'va'

const messages: Record<SupportedLanguage, Record<string, any>> = {
  es,
  en,
  va
}

const savedLang = (typeof localStorage !== 'undefined'
  ? localStorage.getItem('econane_lang')
  : null) as SupportedLanguage | null

const currentLanguage = ref<SupportedLanguage>(
  savedLang === 'en' || savedLang === 'es' || savedLang === 'va' ? savedLang : 'es'
)

function getHtmlLangAttr(lang: SupportedLanguage): string {
  if (lang === 'va') return 'ca-ES'
  return lang
}

// Sincronizar atributo lang del <html>
if (typeof document !== 'undefined') {
  document.documentElement.lang = getHtmlLangAttr(currentLanguage.value)
}

export function useI18n() {
  function setLanguage(lang: SupportedLanguage) {
    currentLanguage.value = lang
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('econane_lang', lang)
    }
    if (typeof document !== 'undefined') {
      document.documentElement.lang = getHtmlLangAttr(lang)
    }
  }

  function t(path: string, fallback?: string): string {
    const keys = path.split('.')
    let val: any = messages[currentLanguage.value]

    for (const key of keys) {
      if (val && typeof val === 'object' && key in val) {
        val = val[key]
      } else {
        // Intentar fallback en español si la clave no existe en el idioma actual
        let esVal: any = messages['es']
        for (const k of keys) {
          if (esVal && typeof esVal === 'object' && k in esVal) {
            esVal = esVal[k]
          } else {
            esVal = null
            break
          }
        }
        return typeof esVal === 'string' ? esVal : (fallback || path)
      }
    }

    return typeof val === 'string' ? val : (fallback || path)
  }

  function tArray(path: string): string[] {
    const keys = path.split('.')
    let val: any = messages[currentLanguage.value]

    for (const key of keys) {
      if (val && typeof val === 'object' && key in val) {
        val = val[key]
      } else {
        let esVal: any = messages['es']
        for (const k of keys) {
          if (esVal && typeof esVal === 'object' && k in esVal) {
            esVal = esVal[k]
          } else {
            esVal = null
            break
          }
        }
        return Array.isArray(esVal) ? esVal : []
      }
    }

    return Array.isArray(val) ? val : []
  }

  const isSpanish = computed(() => currentLanguage.value === 'es')
  const isEnglish = computed(() => currentLanguage.value === 'en')
  const isValencian = computed(() => currentLanguage.value === 'va')

  return {
    currentLanguage,
    setLanguage,
    t,
    tArray,
    isSpanish,
    isEnglish,
    isValencian
  }
}
