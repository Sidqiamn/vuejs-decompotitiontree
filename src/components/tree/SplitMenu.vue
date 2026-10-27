<script setup>
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { getDimensionLabel } from '@/config/dataset'
import { useClickOutside } from '@/composables/useClickOutside'
import AppIcon from '../ui/AppIcon.vue'

const VIEWPORT_PADDING = 12
const GAP = 12

const props = defineProps({
  anchor: { type: Object, default: null },
  dims: { type: Array, default: () => [] },
  compare: { type: Boolean, default: false },
})

const emit = defineEmits(['pick', 'auto', 'close'])

const menu = ref(null)
const position = ref(null)

function updatePosition() {
  const element = menu.value
  if (!element || !props.anchor) return

  const rect = props.anchor.getBoundingClientRect()
  const width = element.offsetWidth
  const height = element.offsetHeight

  let left = rect.right + GAP
  if (left + width > window.innerWidth - VIEWPORT_PADDING) left = rect.left - width - GAP
  if (left < VIEWPORT_PADDING) {
    left = Math.max(VIEWPORT_PADDING, Math.min(rect.left + 14, window.innerWidth - width - VIEWPORT_PADDING))
  }

  let top = rect.top - 4
  if (top + height > window.innerHeight - VIEWPORT_PADDING) top = window.innerHeight - height - VIEWPORT_PADDING
  if (top < VIEWPORT_PADDING) top = VIEWPORT_PADDING

  position.value = { top, left }
}

function focusItem(offset) {
  const items = Array.from(menu.value?.querySelectorAll('[role="menuitem"]') || [])
  if (!items.length) return
  const current = items.indexOf(document.activeElement)
  const next = offset === 'first' ? 0 : offset === 'last' ? items.length - 1 : (current + offset + items.length) % items.length
  items[next].focus()
}

function handleKeyDown(event) {
  const actions = { ArrowDown: 1, ArrowUp: -1, Home: 'first', End: 'last' }
  if (!(event.key in actions)) return
  event.preventDefault()
  focusItem(actions[event.key])
}

useClickOutside(menu, () => emit('close'), { ignore: '[data-dt-split]' })

onMounted(async () => {
  updatePosition()
  window.addEventListener('scroll', updatePosition, true)
  window.addEventListener('resize', updatePosition)
  await nextTick()
  focusItem('first')
})

onBeforeUnmount(() => {
  window.removeEventListener('scroll', updatePosition, true)
  window.removeEventListener('resize', updatePosition)
})
</script>

<template>
  <Teleport to="body">
    <div
      ref="menu"
      class="dt-menu dt-pop dt-scroll fixed z-[60] max-h-[min(70vh,520px)] w-[248px] origin-top-left overflow-auto text-[13px] text-ink-900"
      :style="{
        top: `${position?.top ?? 0}px`,
        left: `${position?.left ?? 0}px`,
        visibility: position ? 'visible' : 'hidden',
      }"
      role="menu"
      aria-label="Uraikan kartu"
      @keydown="handleKeyDown"
    >
      <p class="flex items-center gap-1.5 px-2.5 pt-1.5 pb-1 text-[11px] text-ink-500">
        <AppIcon name="sparkle" :size="12" /> Cari otomatis
      </p>
      <button type="button" class="dt-menu-item" role="menuitem" @click="emit('auto', 'high')">
        <span class="size-1.5 shrink-0 rounded-full bg-pos-700" />
        {{ compare ? 'Kenaikan terbesar' : 'Dimensi dengan nilai tertinggi' }}
      </button>
      <button type="button" class="dt-menu-item" role="menuitem" @click="emit('auto', 'low')">
        <span class="size-1.5 shrink-0 rounded-full bg-neg-700" />
        {{ compare ? 'Penurunan terbesar' : 'Dimensi dengan nilai terendah' }}
      </button>

      <template v-if="dims.length">
        <div class="mx-1 my-1 h-px bg-ink-200" />
        <p class="px-2.5 pt-1.5 pb-1 text-[11px] text-ink-500">Uraikan berdasarkan</p>
        <button
          v-for="dimension in dims"
          :key="dimension"
          type="button"
          class="dt-menu-item"
          role="menuitem"
          @click="emit('pick', dimension)"
        >
          {{ getDimensionLabel(dimension) }}
        </button>
      </template>
      <p v-else class="px-2.5 py-2 text-[12px] text-ink-500">Semua dimensi sudah dipakai</p>
    </div>
  </Teleport>
</template>
