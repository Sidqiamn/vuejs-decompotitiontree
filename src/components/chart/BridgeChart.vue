<script setup>
import { computed, ref } from 'vue'
import { formatSignedPercent, formatValue, truncateText } from '@/lib/format'
import { getExtent, getNiceScale } from '@/lib/scale'
import ChartTooltip from './ChartTooltip.vue'
import TooltipRow from './TooltipRow.vue'

const MARGIN = { top: 16, right: 16, bottom: 34, left: 74 }

const props = defineProps({
  steps: { type: Array, required: true },
  startValue: { type: Number, required: true },
  endValue: { type: Number, required: true },
  measure: { type: Object, required: true },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
})

const hoverIndex = ref(null)

const plotWidth = computed(() => Math.max(60, props.width - MARGIN.left - MARGIN.right))
const plotHeight = computed(() => Math.max(60, props.height - MARGIN.top - MARGIN.bottom))

const columns = computed(() => {
  const result = [{ label: 'Total P2', kind: 'total', from: 0, to: props.startValue, value: props.startValue }]
  let runningTotal = props.startValue
  for (const step of props.steps) {
    result.push({ label: step.label, kind: 'step', from: runningTotal, to: runningTotal + step.value, value: step.value })
    runningTotal += step.value
  }
  result.push({ label: 'Total P1', kind: 'total', from: 0, to: props.endValue, value: props.endValue })
  return result
})

const scale = computed(() => {
  const { min, max } = getExtent(columns.value.flatMap((column) => [column.from, column.to]))
  return getNiceScale(min, max)
})

const bandWidth = computed(() => plotWidth.value / columns.value.length)
const barWidth = computed(() => Math.max(6, bandWidth.value * 0.58))
const centerX = (index) => MARGIN.left + bandWidth.value * (index + 0.5)
const yAt = (value) =>
  MARGIN.top + plotHeight.value - ((value - scale.value.min) / (scale.value.max - scale.value.min || 1)) * plotHeight.value

function fillFor(column, index) {
  if (column.kind === 'total') return index === 0 ? 'var(--p2-500)' : 'var(--brand-700)'
  return column.value < 0 ? 'var(--neg-700)' : 'var(--pos-700)'
}

function valueColor(column) {
  if (column.kind === 'total') return 'var(--ink-600)'
  return column.value < 0 ? 'var(--neg-700)' : 'var(--pos-700)'
}

const hovered = computed(() => (hoverIndex.value == null ? null : columns.value[hoverIndex.value]))

const clearHover = (index) => {
  if (hoverIndex.value === index) hoverIndex.value = null
}

const compact = (value, signed = false) => formatValue(value, props.measure.format, { compact: true, signed })
</script>

<template>
  <svg :width="width" :height="height" role="img" aria-label="Jembatan selisih" class="block">
    <g v-for="tick in scale.ticks" :key="tick">
      <line
        :x1="MARGIN.left"
        :x2="MARGIN.left + plotWidth"
        :y1="yAt(tick)"
        :y2="yAt(tick)"
        stroke="var(--ink-100)"
        stroke-width="1"
      />
      <text :x="MARGIN.left - 10" :y="yAt(tick) + 3.5" text-anchor="end" font-size="10" fill="var(--ink-500)">
        {{ compact(tick) }}
      </text>
    </g>

    <line
      v-for="(column, index) in columns.slice(0, -1)"
      :key="`link-${index}`"
      :x1="centerX(index) - barWidth / 2"
      :x2="centerX(index + 1) + barWidth / 2"
      :y1="yAt(column.to)"
      :y2="yAt(column.to)"
      stroke="var(--ink-300)"
      stroke-width="1"
      stroke-dasharray="3 3"
    />

    <g
      v-for="(column, index) in columns"
      :key="`${column.label}-${index}`"
      @pointerenter="hoverIndex = index"
      @pointerleave="clearHover(index)"
    >
      <rect
        :x="centerX(index) - barWidth / 2"
        :y="Math.min(yAt(column.from), yAt(column.to))"
        :width="barWidth"
        :height="Math.max(2, Math.abs(yAt(column.to) - yAt(column.from)))"
        rx="2"
        :fill="fillFor(column, index)"
        :opacity="hoverIndex == null || hoverIndex === index ? 1 : 0.42"
        style="transition: opacity 0.18s ease"
      />
      <text
        :x="centerX(index)"
        :y="height - 20"
        text-anchor="middle"
        font-size="10"
        :fill="hoverIndex === index ? 'var(--brand-700)' : 'var(--ink-500)'"
      >
        {{ truncateText(column.label, Math.max(4, Math.floor(bandWidth / 6.6))) }}
      </text>
      <text :x="centerX(index)" :y="height - 7" text-anchor="middle" font-size="10" :fill="valueColor(column)">
        {{ compact(column.value, column.kind === 'step') }}
      </text>
    </g>
  </svg>

  <ChartTooltip
    v-if="hovered"
    :x="centerX(hoverIndex)"
    :y="yAt(Math.max(hovered.from, hovered.to))"
    :width="width"
  >
    <div class="font-medium text-ink-900">{{ hovered.label }}</div>
    <TooltipRow
      :name="hovered.kind === 'total' ? measure.label : 'Sumbangan'"
      :value="compact(hovered.value, hovered.kind === 'step')"
    />
    <TooltipRow
      v-if="hovered.kind === 'step' && startValue !== 0"
      name="Dari total P2"
      :value="formatSignedPercent(hovered.value / startValue)"
      muted
    />
  </ChartTooltip>
</template>
