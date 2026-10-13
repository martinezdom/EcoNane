<script setup lang="ts">
import { ref } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import { Lock, X, CheckCircle2, Eye, EyeOff } from '@lucide/vue'

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'saved', message: string): void
}>()

const { setAdminPin } = useSiteData()

const newPin = ref('')
const confirmNewPin = ref('')
const showPin = ref(false)
const isSavingPin = ref(false)
const errorMessage = ref('')

async function handleSavePin() {
  errorMessage.value = ''
  if (!newPin.value || newPin.value.length < 4) {
    errorMessage.value = 'La clave debe tener al menos 4 caracteres.'
    return
  }
  if (newPin.value !== confirmNewPin.value) {
    errorMessage.value = 'Las dos claves no coinciden.'
    return
  }

  isSavingPin.value = true
  try {
    await setAdminPin(newPin.value)
    emit('saved', '¡Clave de acceso actualizada y cifrada correctamente!')
    emit('close')
  } catch (err: any) {
    errorMessage.value = 'Error al actualizar la clave: ' + (err?.message || err)
  } finally {
    isSavingPin.value = false
  }
}
</script>

<template>
  <div
    @click.self="emit('close')"
    class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
  >
    <div class="relative w-full max-w-sm rounded-3xl border border-brand-pink-light/40 bg-white p-6 shadow-2xl space-y-4">
      <div class="flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
        <div class="flex items-center gap-2">
          <div class="rounded-full bg-brand-cream p-2 text-brand-brown">
            <Lock class="h-4 w-4" />
          </div>
          <div>
            <h3 class="font-serif text-base font-bold text-brand-brown-dark">Cambiar Clave de Acceso</h3>
            <p class="text-[11px] text-brand-brown/70">Protege el panel de administración</p>
          </div>
        </div>
        <button
          type="button"
          @click="emit('close')"
          class="rounded-full p-1.5 text-brand-brown/50 hover:bg-brand-cream hover:text-brand-brown transition-colors cursor-pointer"
        >
          <X class="h-4 w-4" />
        </button>
      </div>

      <div v-if="errorMessage" class="rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-800">
        {{ errorMessage }}
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="block font-bold text-brand-brown-dark mb-1">Nueva Clave:</label>
          <div class="relative">
            <input
              v-model="newPin"
              :type="showPin ? 'text' : 'password'"
              placeholder="Introduce la nueva clave (mín. 4 caracteres)"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 pr-10 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
            <button
              type="button"
              @click="showPin = !showPin"
              class="absolute right-3 top-2 text-brand-brown/50 hover:text-brand-brown cursor-pointer"
            >
              <component :is="showPin ? EyeOff : Eye" class="h-4 w-4" />
            </button>
          </div>
        </div>

        <div>
          <label class="block font-bold text-brand-brown-dark mb-1">Repite la Nueva Clave:</label>
          <input
            v-model="confirmNewPin"
            :type="showPin ? 'text' : 'password'"
            placeholder="Confirma la clave"
            class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-medium text-brand-brown-dark focus:border-brand-pink focus:outline-none"
          />
        </div>
      </div>

      <div class="flex items-center justify-end gap-2 border-t border-brand-pink-light/30 pt-3">
        <button
          type="button"
          @click="emit('close')"
          class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown/80 hover:bg-brand-cream cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="button"
          @click="handleSavePin"
          :disabled="isSavingPin"
          class="flex items-center gap-1.5 rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-brown-dark active:scale-95 disabled:opacity-50 cursor-pointer"
        >
          <CheckCircle2 class="h-3.5 w-3.5" />
          <span>{{ isSavingPin ? 'Guardando...' : 'Actualizar Clave' }}</span>
        </button>
      </div>
    </div>
  </div>
</template>
