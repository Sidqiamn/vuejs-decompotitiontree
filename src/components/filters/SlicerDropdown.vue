<script setup>
import { computed, nextTick, ref } from 'vue'
import { useClickOutside } from '@/composables/useClickOutside'
import AppIcon from '../ui/AppIcon.vue'

const POPOVER_WIDTH = 264

const props = defineProps({
  label: { type: String, required: true },
  options: { type: Array, default: () => [] },
  /** Set nilai yang dipilih. Set kosong = semua. */
  selected: { type: Set, required: true },
})

const emit = defineEmits(['change'])

const root = ref(null)
const trigger = ref(null)
const searchInput = ref(null)
const isOpen = ref(false)
const alignRight = ref(false)
const query = ref('')

const hasSelection = computed(() => props.selected.size > 0)
const summary = computed(() => {
  if (props.selected.size === 0) return 'Semua'
  if (props.selected.size === 1) return Array.from(props.selected)[0]
  return `${props.selected.size} dipilih`
})

const visibleOptions = computed(() => {
  const needle = query.value.trim().toLowerCase()
  return needle ? props.options.filter((option) => option.toLowerCase().includes(needle)) : props.options
})

function close({ restoreFocus = false } = {}) {
  if (!isOpen.value) return
  isOpen.value = false
  query.value = ''
  if (restoreFocus) trigger.value?.focus()
}

async function toggle() {
  if (isOpen.value) return close()
  const rect = root.value.getBoundingClientRect()
  alignRight.value = rect.left + POPOVER_WIDTH > window.innerWidth - 12
  isOpen.value = true
  await nextTick()
  searchInput.value?.focus()
}

useClickOutside(root, (event) => close({ restoreFocus: event.type === 'keydown' }), { active: isOpen })

function toggleOption(option) {
  const next = new Set(props.selected)
  if (next.has(option)) next.delete(option)
  else next.add(option)
  emit('change', next)
}

/** Saat sedang mencari, "Pilih semua" hanya menambahkan yang tampil. */
function selectVisible() {
  emit('change', new Set([...props.selected, ...visibleOptions.value]))
}
</script>

<template>
  <div ref="root" class="relative">
    <button
      ref="trigger"
      type="button"
      class="dt-shadow focus-ring flex h-[30px] max-w-[260px] items-center gap-1.5 rounded-full border px-3 transition-colors"
      :class="hasSelection ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-paper hover:border-brand-300'"
      :aria-expanded="isOpen"
      aria-haspopup="true"
      @click="toggle"
    >
      <span class="text-[12.5px] font-semibold" :class="hasSelection ? 'text-brand-700' : 'text-ink-900'">
        {{ label }}
      </span>
      <span class="truncate text-[12.5px]" :class="hasSelection ? 'text-brand-600' : 'text-ink-500'">{{ summary }}</span>
      <AppIcon
        name="chevron-down"
        :size="13"
        :stroke-width="2"
        class="transition-transform duration-200"
        :class="[isOpen && 'rotate-180', hasSelection ? 'text-brand-500' : 'text-ink-400']"
      />
    </button>

    <div
      v-if="isOpen"
      class="dt-menu dt-pop absolute top-[calc(100%+6px)] z-40 flex max-h-80 flex-col"
      :class="alignRight ? 'right-0 origin-top-right' : 'left-0 origin-top-left'"
      :style="{ width: `${POPOVER_WIDTH}px` }"
      role="dialog"
      :aria-label="`Saring ${label}`"
    >
      <input
        ref="searchInput"
        v-model="query"
        type="search"
        class="m-1 rounded-lg border border-ink-200 bg-ink-50 px-2.5 py-2 text-[12.5px] text-ink-900 transition-colors placeholder:text-ink-400 focus:border-brand-400 focus:bg-paper focus:ring-2 focus:ring-brand-100 focus:outline-none"
        :placeholder="`Cari ${label.toLowerCase()}…`"
        :aria-label="`Cari ${label.toLowerCase()}`"
      />

      <div class="dt-scroll min-h-0 overflow-auto px-1 pb-1">
        <button
          v-for="option in visibleOptions"
          :key="option"
          type="button"
          class="dt-menu-item"
          :class="selected.has(option) && 'text-brand-700'"
          role="checkbox"
          :aria-checked="selected.has(option)"
          @click="toggleOption(option)"
        >
          <span
            class="grid size-4 flex-none place-items-center rounded border transition-colors"
            :class="selected.has(option) ? 'border-brand-700 bg-brand-700 text-white' : 'border-ink-300 bg-paper'"
          >
            <AppIcon v-if="selected.has(option)" name="check" :size="11" :stroke-width="2.6" />
          </span>
          <span class="min-w-0 flex-1 truncate">{{ option }}</span>
        </button>
        <p v-if="!visibleOptions.length" class="px-2.5 py-3 text-[12px] text-ink-500">Tidak ada yang cocok</p>
      </div>

      <div class="flex items-center gap-1 border-t border-ink-200 p-1">
        <button type="button" class="dt-btn-quiet text-[12px]" @click="selectVisible">Pilih semua</button>
        <button
          type="button"
          class="dt-btn-quiet text-[12px]"
          :disabled="!hasSelection"
          @click="emit('change', new Set())"
        >
          Bersihkan
        </button>
        <span v-if="hasSelection" class="ml-auto pr-2 text-[11px] text-ink-500">{{ selected.size }} dari {{ options.length }}</span>
      </div>
    </div>
  </div>
</template>
