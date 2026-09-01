<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useSiteData } from '@/composables/useSiteData'
import { Lock, Eye, EyeOff, ArrowLeft, ShieldCheck } from '@lucide/vue'

const router = useRouter()
const { loginAdmin, isAdminLoggedIn } = useSiteData()

const pin = ref('')
const showPassword = ref(false)
const errorMessage = ref('')
const isLoading = ref(false)

if (isAdminLoggedIn.value) {
  router.push('/admin')
}

async function handleLogin() {
  errorMessage.value = ''
  if (!pin.value) {
    errorMessage.value = 'Por favor, introduce la clave de acceso.'
    return
  }

  isLoading.value = true
  try {
    const success = await loginAdmin(pin.value)
    isLoading.value = false

    if (success) {
      router.push('/admin')
    } else {
      errorMessage.value = 'Clave incorrecta. Inténtalo de nuevo.'
    }
  } catch (err) {
    isLoading.value = false
    errorMessage.value = 'Error al verificar la clave.'
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-cream via-white to-brand-beige px-4 py-12">
    <div class="w-full max-w-md">
      <!-- Back link -->
      <div class="mb-6">
        <router-link
          to="/"
          class="inline-flex items-center gap-2 text-sm font-medium text-brand-brown transition-colors hover:text-brand-brown-dark"
        >
          <ArrowLeft class="h-4 w-4" />
          Volver a la web pública
        </router-link>
      </div>

      <!-- Login Card -->
      <div class="overflow-hidden rounded-3xl border border-brand-pink-light/50 bg-white p-8 shadow-xl shadow-brand-brown/5">
        <!-- Logo & Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-pink/20 text-brand-brown shadow-inner">
            <Lock class="h-8 w-8" />
          </div>
          <h1 class="font-serif text-2xl font-bold text-brand-brown-dark">Panel EcoNane</h1>
          <p class="mt-1 text-sm text-brand-brown/80">Acceso exclusivo para Mireia y Ezan</p>
        </div>

        <!-- Form -->
        <form @submit.prevent="handleLogin" class="space-y-6">
          <div>
            <label for="pin" class="block text-sm font-medium text-brand-brown-dark">
              Clave de Acceso / PIN
            </label>
            <div class="relative mt-2">
              <input
                id="pin"
                v-model="pin"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Introduce tu clave..."
                autofocus
                class="w-full rounded-2xl border border-brand-pink-light/60 bg-brand-cream/30 px-4 py-3.5 pr-12 text-brand-brown-dark placeholder-brand-brown/40 transition-all focus:border-brand-pink focus:bg-white focus:outline-none focus:ring-4 focus:ring-brand-pink/20"
              />
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="absolute inset-y-0 right-0 flex items-center pr-4 text-brand-brown/60 transition-colors hover:text-brand-brown-dark cursor-pointer"
              >
                <EyeOff v-if="showPassword" class="h-5 w-5" />
                <Eye v-else class="h-5 w-5" />
              </button>
            </div>
          </div>

          <!-- Error Alert -->
          <div
            v-if="errorMessage"
            class="rounded-xl border border-rose-200 bg-rose-50 p-3 text-center text-sm font-medium text-rose-700 animate-in fade-in"
          >
            {{ errorMessage }}
          </div>

          <button
            type="submit"
            :disabled="isLoading"
            class="w-full cursor-pointer rounded-2xl bg-brand-brown py-3.5 text-center font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-[0.99] disabled:opacity-50"
          >
            <span v-if="isLoading">Verificando...</span>
            <span v-else>Entrar al Panel</span>
          </button>
        </form>

        <div class="mt-8 border-t border-brand-pink-light/30 pt-6 text-center">
          <div class="flex items-center justify-center gap-2 text-xs text-brand-brown/70">
            <ShieldCheck class="h-4 w-4 text-emerald-600" />
            <span>Acceso protegido y seguro</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>