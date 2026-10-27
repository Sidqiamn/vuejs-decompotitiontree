<script setup>
import { computed, ref } from 'vue'
import { formatPercent, formatValue } from '@/lib/format'
import DeltaBadge from '../ui/DeltaBadge.vue'
import SplitButton from './SplitButton.vue'
import SplitMenu from './SplitMenu.vue'

const props = defineProps({
  node: { type: Object, required: true },
  nodeKey: { type: String, required: true },
  level: { type: Object, required: true },
  isSelected: { type: Boolean, default: false },
  isDimmed: { type: Boolean, default: false },
  measure: { type: Object, required: true },
  compare: { type: Object, default: null },
  shareMode: { type: String, default: 'parent' },
  grandTotal: { type: Number, default: 0 },
  isMenuOpen: { type: Boolean, default: false },
  unusedDims: { type: Array, default: () => [] },
  registerNode: { type: Function, default: null },
})

const emit = defineEmits(['select', 'toggle-menu', 'close-menu', 'pick', 'auto', 'hover'])

const cardEl = ref(null)
const setCardEl = (element) => {
  cardEl.value = element
  props.registerNode?.(props.nodeKey, element)
}

const isComparing = computed(() => !!props.compare)
const compact = (value, signed = false) => formatValue(value, props.measure.format, { compact: true, signed })

const valueClass = computed(() => {
  if (!isComparing.value) return 'text-ink-900'
  if (props.node.value < 0) return 'text-neg-700'
  return props.node.value > 0 ? 'text-pos-700' : 'text-ink-600'
})

const fillClass = computed(() => {
  if (isComparing.value) return props.node.value < 0 ? 'dt-fill-neg' : 'dt-fill-pos'
  return props.isSelected ? 'dt-fill' : 'dt-fill-mute'
})

const barPercent = computed(() => (props.level.max ? (Math.abs(props.node.value) / props.level.max) * 100 : 0))

/** Porsi dari induk/total. Dalam mode banding: porsi dari selisih induk/total (kontribusi perubahan). */
const footnote = computed(() => {
  const base = props.shareMode === 'total' ? props.grandTotal : props.level.total
  const share = base ? props.node.value / base : null
  const scope = props.shareMode === 'total' ? 'total' : 'induk'
  if (!isComparing.value) return `${formatPercent(share)} dari ${scope}`
  const text = `${formatPercent(share)} dari selisih ${scope}`
  return props.node.p2 === 0 && props.node.p1 !== 0 ? `${text} · baru di P1` : text
})

const title = computed(
  () => `${props.node.label} — ${formatValue(props.node.value, props.measure.format, { signed: isComparing.value })}`,
)
</script>

<template>
  <div class="group relative" @pointerenter="emit('hover', true)" @pointerleave="emit('hover', false)">
    <button
      :ref="setCardEl"
      type="button"
      class="dt-shadow dt-shadow-lift focus-ring relative block w-full scroll-mx-8 scroll-my-6 overflow-hidden rounded-lg border px-3 py-2.5 pr-7 text-left transition-[translate,opacity,border-color,background-color,box-shadow] duration-200 hover:-translate-y-px"
      :class="[
        isSelected ? 'border-brand-600 bg-brand-50' : 'border-ink-200 bg-paper hover:border-brand-300',
        isDimmed && 'opacity-55 hover:opacity-100 focus-visible:opacity-100',
      ]"
      :aria-pressed="isSelected"
      :title="title"
      @click="emit('select')"
      @focus="emit('hover', true)"
      @blur="emit('hover', false)"
    >
      <span
        class="absolute inset-y-2 left-0 w-[3px] rounded-r-full transition-colors"
        :class="isSelected ? 'bg-brand-700' : 'bg-transparent'"
      />

      <div class="truncate text-[12.5px] transition-colors" :class="isSelected ? 'font-medium text-brand-700' : 'text-ink-600'">
        {{ node.label }}
      </div>

      <div class="mt-1 flex items-center justify-between gap-2">
        <span class="truncate text-[17px] font-semibold tracking-[-0.015em]" :class="valueClass">
          {{ compact(node.value, isComparing) }}
        </span>
        <DeltaBadge v-if="isComparing" :value="node.value" :ratio="node.pct" />
      </div>

      <div v-if="isComparing" class="mt-2 grid grid-cols-2 gap-x-2 border-t border-ink-200 pt-1.5 text-[11px]">
        <div>
          <div class="text-ink-500">P1</div>
          <div class="font-semibold text-ink-900">{{ compact(node.p1) }}</div>
        </div>
        <div>
          <div class="text-ink-500">P2</div>
          <div class="font-semibold text-ink-600">{{ compact(node.p2) }}</div>
        </div>
      </div>

      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div
          class="h-full rounded-full transition-[width] duration-500 ease-out"
          :class="fillClass"
          :style="{ width: `${barPercent}%` }"
        />
      </div>

      <div class="mt-1.5 truncate text-[11px] text-ink-500">{{ footnote }}</div>
    </button>

    <SplitButton
      :is-open="isMenuOpen"
      :label="`Uraikan ${node.label}`"
      reveal-on-hover
      @click="emit('toggle-menu')"
    />

    <SplitMenu
      v-if="isMenuOpen"
      :anchor="cardEl"
      :dims="unusedDims"
      :compare="isComparing"
      @pick="(dimension) => emit('pick', dimension)"
      @auto="(mode) => emit('auto', mode)"
      @close="emit('close-menu')"
    />
  </div>
</template>
