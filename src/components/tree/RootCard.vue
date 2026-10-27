<script setup>
import { computed, ref } from 'vue'
import { ROOT_NODE_KEY } from '@/lib/aggregate'
import { formatCount, formatValue } from '@/lib/format'
import DeltaBadge from '../ui/DeltaBadge.vue'
import SplitButton from './SplitButton.vue'
import SplitMenu from './SplitMenu.vue'

const props = defineProps({
  measure: { type: Object, required: true },
  compare: { type: Object, default: null },
  totals: { type: Object, required: true },
  rowCount: { type: Number, default: 0 },
  isFiltered: { type: Boolean, default: false },
  isMenuOpen: { type: Boolean, default: false },
  unusedDims: { type: Array, default: () => [] },
  registerNode: { type: Function, default: null },
})

const emit = defineEmits(['toggle-menu', 'close-menu', 'pick', 'auto'])

const cardEl = ref(null)
const setCardEl = (element) => {
  cardEl.value = element
  props.registerNode?.(ROOT_NODE_KEY, element)
}

const isComparing = computed(() => !!props.compare)
const compact = (value, signed = false) => formatValue(value, props.measure.format, { compact: true, signed })

const valueClass = computed(() => {
  if (!isComparing.value) return 'text-brand-700'
  if (props.totals.value < 0) return 'text-neg-700'
  return props.totals.value > 0 ? 'text-pos-700' : 'text-ink-600'
})
</script>

<template>
  <div class="group relative">
    <div
      :ref="setCardEl"
      class="dt-shadow relative overflow-hidden rounded-lg border border-l-[3px] border-ink-200 border-l-brand-700 bg-paper px-3 py-2.5 pr-7"
    >
      <div class="text-[12.5px] text-ink-600">{{ isComparing ? 'Selisih P1 – P2' : 'Seluruh data' }}</div>

      <div class="mt-1 flex items-center justify-between gap-2">
        <span class="text-[18px] font-semibold tracking-[-0.015em]" :class="valueClass">
          {{ compact(totals.value, isComparing) }}
        </span>
        <DeltaBadge v-if="isComparing" :value="totals.value" :ratio="totals.pct" />
      </div>

      <div v-if="isComparing" class="mt-2 grid grid-cols-2 gap-x-2 border-t border-ink-200 pt-1.5 text-[11px]">
        <div>
          <div class="text-ink-500">P1</div>
          <div class="font-semibold text-ink-900">{{ compact(totals.p1) }}</div>
        </div>
        <div>
          <div class="text-ink-500">P2</div>
          <div class="font-semibold text-ink-600">{{ compact(totals.p2) }}</div>
        </div>
      </div>

      <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-ink-100">
        <div class="dt-fill h-full w-full rounded-full" />
      </div>

      <div class="mt-1.5 text-[11px] text-ink-500">
        {{ formatCount(rowCount) }} baris<template v-if="isFiltered">, tersaring</template>
      </div>
    </div>

    <SplitButton :is-open="isMenuOpen" label="Uraikan dari akar" @click="emit('toggle-menu')" />

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
