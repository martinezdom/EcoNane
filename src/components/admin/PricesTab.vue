<script setup lang="ts">
import { ref, watch } from 'vue'
import { useSiteData } from '@/composables/useSiteData'
import type { Experience, Pack } from '@/types'
import {
  RotateCcw,
  Check,
  Plus,
  Trash2,
  ChevronUp,
  ChevronDown,
  EyeOff,
  ShoppingBag,
  X,
  Package
} from '@lucide/vue'

const emit = defineEmits<{
  (e: 'notify', message: string): void
}>()

const {
  experiences,
  packs,
  products,
  updateExperiences,
  updatePacks,
  addProduct,
  deleteProduct,
  resetExperiencesToDefault,
  resetPacksToDefault,
  formatExperienceWhatsAppLink
} = useSiteData()

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
  emit('notify', 'Nuevo servicio añadido. Recuerda pulsar "Guardar Todos los Precios" para publicarlo en la web.')
}

function removeExperience(index: number) {
  const exp = experiencesForm.value[index]
  if (!exp) return
  if (
    confirm(
      `¿Seguro que deseas eliminar definitivamente el servicio "${exp.title}"?\n\nTip: Si solo deseas ocultarlo temporalmente de la web sin perder sus datos, desactiva el interruptor verde "Visible en la web".`
    )
  ) {
    experiencesForm.value.splice(index, 1)
    emit('notify', 'Servicio eliminado. Pulsa "Guardar Todos los Precios" para aplicar los cambios.')
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
  emit('notify', `Enlace de WhatsApp actualizado para "${exp.title}".`)
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

async function savePrices() {
  await updateExperiences(experiencesForm.value)
  await updatePacks(packsForm.value)
  emit('notify', '¡Precios y servicios actualizados correctamente en la web!')
}

function handleResetPrices() {
  if (confirm('¿Deseas restaurar todos los precios y packs originales?')) {
    resetExperiencesToDefault()
    resetPacksToDefault()
    experiencesForm.value = JSON.parse(JSON.stringify(experiences.value))
    packsForm.value = JSON.parse(JSON.stringify(packs.value))
    emit('notify', 'Precios restaurados a los valores iniciales.')
  }
}

// Product Management
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
  emit('notify', '¡Nuevo producto añadido al catálogo!')
}

async function handleDeleteProduct(id: string, title: string) {
  if (confirm(`¿Seguro que deseas eliminar el producto "${title}" del catálogo?`)) {
    await deleteProduct(id)
    emit('notify', `Producto "${title}" eliminado.`)
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div class="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
      <div>
        <h2 class="font-serif text-2xl font-bold text-brand-brown-dark">Catálogo de Servicios y Precios</h2>
        <p class="text-sm text-brand-brown/80">
          Ajusta los precios de las ecografías individuales, los packs de seguimiento y productos de venta.
        </p>
      </div>

      <div class="flex items-center gap-3">
        <button
          type="button"
          @click="handleResetPrices"
          class="flex cursor-pointer items-center gap-1.5 rounded-xl border border-brand-pink-light/60 bg-white px-4 py-2.5 text-xs font-semibold text-brand-brown-dark transition-all hover:bg-brand-cream"
        >
          <RotateCcw class="h-3.5 w-3.5 text-brand-brown" />
          <span>Restaurar Originales</span>
        </button>

        <button
          type="button"
          @click="savePrices"
          class="flex cursor-pointer items-center gap-2 rounded-xl bg-brand-brown px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:bg-brand-brown-dark active:scale-95"
        >
          <Check class="h-4 w-4" />
          <span>Guardar Todos los Precios</span>
        </button>
      </div>
    </div>

    <!-- 1. EXPERIENCES SECTION -->
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
          class="flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-pink px-4 py-2 text-xs font-bold text-white shadow-xs transition-all hover:bg-brand-pink-dark active:scale-95 sm:w-auto"
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
            <!-- Top Toolbar -->
            <div class="mb-4 flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
              <!-- Active Switch -->
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
                  class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-brand-cream hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-20"
                >
                  <ChevronUp class="h-4 w-4" />
                </button>
                <button
                  type="button"
                  @click="moveExperience(expIdx, 'down')"
                  :disabled="expIdx === experiencesForm.length - 1"
                  title="Bajar posición"
                  class="cursor-pointer rounded-lg p-1.5 text-stone-400 hover:bg-brand-cream hover:text-brand-brown-dark disabled:cursor-not-allowed disabled:opacity-20"
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
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-sm font-bold text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
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
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Etiqueta Destacada</label>
                <input
                  v-model="exp.badge"
                  type="text"
                  placeholder="Opcional (ej: MÁS POPULAR)"
                  class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div class="mt-4">
              <label class="block text-xs font-bold text-brand-brown-dark/70 uppercase">Descripción</label>
              <textarea
                v-model="exp.description"
                rows="2"
                placeholder="Descripción que verán las familias..."
                class="mt-1 w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:bg-white focus:outline-none"
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
                  <span>Añadir ventaja</span>
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

            <!-- WhatsApp Link -->
            <div class="mt-4 border-t border-brand-pink-light/20 pt-3">
              <div class="flex items-center justify-between">
                <label class="block text-[11px] font-bold text-brand-brown-dark/70 uppercase">
                  Enlace de Cita (WhatsApp)
                </label>
                <button
                  type="button"
                  @click="autoGenerateWhatsAppLink(expIdx)"
                  title="Generar enlace de WhatsApp con el título actual"
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
    </div>

    <!-- 2. PACKS SECTION -->
    <div class="pt-6 border-t border-brand-pink-light/30">
      <h3 class="mb-4 text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
        Packs de Ahorro y Seguimiento ({{ packsForm.length }})
      </h3>

      <div class="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div
          v-for="(pack, packIdx) in packsForm"
          :key="packIdx"
          class="rounded-3xl border border-brand-gold/40 bg-gradient-to-br from-white via-brand-cream/30 to-brand-gold/15 p-6 shadow-sm"
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

    <!-- 3. PHYSICAL PRODUCTS CATALOG -->
    <div class="pt-6 border-t border-brand-pink-light/30">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="text-xs font-bold tracking-wider text-brand-brown-dark/70 uppercase">
            Productos Físicos en Clínica ({{ products.length }})
          </h3>
          <p class="text-xs text-brand-brown/70 mt-0.5">
            Peluches con latido, canastillas y recuerdos para cobrar en el TPV
          </p>
        </div>

        <button
          type="button"
          @click="showNewProductModal = true"
          class="flex cursor-pointer items-center gap-1.5 rounded-xl bg-brand-brown px-3.5 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-brown-dark transition-all active:scale-95"
        >
          <Plus class="h-3.5 w-3.5" />
          <span>Añadir Producto</span>
        </button>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div
          v-for="p in products"
          :key="p.id"
          class="rounded-2xl border border-brand-pink-light/40 bg-white p-4 shadow-xs flex items-center justify-between gap-3"
        >
          <div class="flex items-center gap-3">
            <div class="rounded-xl bg-brand-cream p-2 text-brand-brown">
              <Package class="h-5 w-5" />
            </div>
            <div>
              <h4 class="font-bold text-xs text-brand-brown-dark">{{ p.title }}</h4>
              <p class="text-[11px] text-brand-brown/70">{{ p.category }} · {{ p.price }}</p>
            </div>
          </div>

          <button
            type="button"
            @click="handleDeleteProduct(p.id, p.title)"
            class="rounded-lg p-1.5 text-stone-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
            title="Eliminar producto"
          >
            <Trash2 class="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Añadir Nuevo Producto -->
    <div
      v-if="showNewProductModal"
      @click.self="showNewProductModal = false"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-in fade-in"
    >
      <div class="w-full max-w-sm rounded-3xl border border-brand-pink-light/40 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
        <div class="flex items-center justify-between border-b border-brand-pink-light/30 pb-3">
          <div class="flex items-center gap-2">
            <ShoppingBag class="h-5 w-5 text-brand-pink" />
            <h3 class="font-serif text-base font-bold text-brand-brown-dark">Nuevo Producto</h3>
          </div>
          <button @click="showNewProductModal = false" class="text-brand-brown/60 hover:text-brand-brown cursor-pointer">
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="space-y-3 text-xs">
          <div>
            <label class="block font-bold text-brand-brown-dark mb-1">Nombre del Producto *:</label>
            <input
              v-model="newProductForm.title"
              type="text"
              placeholder="Ej: Peluche con Sonido de Latido"
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
          </div>

          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Precio *:</label>
              <input
                v-model="newProductForm.price"
                type="text"
                placeholder="20€"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs font-bold text-brand-brown-dark focus:border-brand-pink focus:outline-none"
              />
            </div>
            <div>
              <label class="block font-bold text-brand-brown-dark mb-1">Categoría:</label>
              <select
                v-model="newProductForm.category"
                class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none cursor-pointer"
              >
                <option value="Recuerdos">Recuerdos</option>
                <option value="Ropa y Bebé">Ropa y Bebé</option>
                <option value="Regalos">Regalos</option>
                <option value="Otros">Otros</option>
              </select>
            </div>
          </div>

          <div>
            <label class="block font-bold text-brand-brown-dark mb-1">Descripción (opcional):</label>
            <input
              v-model="newProductForm.description"
              type="text"
              placeholder="Breve descripción..."
              class="w-full rounded-xl border border-brand-pink-light/60 bg-brand-cream/20 px-3 py-2 text-xs text-brand-brown-dark focus:border-brand-pink focus:outline-none"
            />
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 border-t border-brand-pink-light/30 pt-3">
          <button
            type="button"
            @click="showNewProductModal = false"
            class="rounded-xl px-4 py-2 text-xs font-semibold text-brand-brown/80 hover:bg-brand-cream cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            @click="handleCreateProduct"
            class="rounded-xl bg-brand-brown px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-brand-brown-dark cursor-pointer active:scale-95"
          >
            Guardar Producto
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
