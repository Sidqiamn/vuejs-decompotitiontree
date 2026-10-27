<script setup>
import { computed, ref } from 'vue'
import { formatSignedPercent, formatValue, truncateText } from '@/lib/format'
import { getExtent, getNiceScale } from '@/lib/scale'
import ChartTooltip from './ChartTooltip.vue'
import TooltipRow from './TooltipRow.vue'

const MARGIN = { top: 6, right: 104, bottom: 6, left: 148 }

const props = defineProps({
  nodes: { type: Array, required: true },
  measure: { type: Object, required: true },
  compare: { type: Object, default: null },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
})

const hoverIndex = ref(null)

const plotWidth = computed(() => Math.max(60, props.width - MARGIN.left - MARGIN.right))
const plotHeight = computed(() => Math.max(40, props.height - MARGIN.top - MARGIN.bottom))
const rowHeight = computed(() => Math.max(16, Math.min(34, plotHeight.value / Math.max(1, props.nodes.length))))
const usedHeight = computed(() => rowHeight.value * props.nodes.length)

const scale = computed(() => {
  const { min, max } = getExtent(props.nodes.map((node) => node.value))
  return getNiceScale(min, max)
})

const xAt = (value) =>
  MARGIN.left + ((value - scale.value.min) / (scale.value.max - scale.value.min || 1)) * plotWidth.value
const zeroX = computed(() => xAt(0))
const rowTop = (index) => MARGIN.top + (plotHeight.value - usedHeight.value) / 2 + index * rowHeight.value

const rows = computed(() =>
  props.nodes.map((node, index) => {
    const isNegative = node.value < 0
    const barWidth = Math.max(1.5, Math.abs(xAt(node.value) - zeroX.value))
    return {
      node,
      top: rowTop(index),
      textY: rowTop(index) + rowHeight.value / 2 + 3.5,
      barX: isNegative ? zeroX.value - barWidth : zeroX.value,
      barWidth,
      color: props.compare ? (isNegative ? 'var(--neg-700)' : 'var(--pos-700)') : 'var(--brand-700)',
    }
  }),
)

const hovered = computed(() => (hoverIndex.value == null ? null : props.nodes[hoverIndex.value]))

const clearHover = (index) => {
  if (hoverIndex.value === index) hoverIndex.value = null
}

const compact = (value, signed = false) => formatValue(value, props.measure.format, { compact: true, signed })
</script>

<template>
  <svg :width="width" :height="height" role="img" :aria-label="`Kontribusi ${measure.label}`" class="block">
    <line
      :x1="zeroX"
      :x2="zeroX"
      :y1="MARGIN.top"
      :y2="MARGIN.top + plotHeight"
      stroke="var(--ink-300)"
      stroke-width="1"
    />

    <g
      v-for="(row, index) in rows"
      :key="row.node.label"
      @pointerenter="hoverIndex = index"
      @pointerleave="clearHover(index)"
    >
      <rect
        x="0"
        :y="row.top"
        :width="width"
        :height="rowHeight"
        :fill="hoverIndex === index ? 'var(--brand-50)' : 'transparent'"
      />
      <text
        :x="MARGIN.left - 12"
        :y="row.textY"
        text-anchor="end"
        font-size="11"
        :fill="hoverIndex === index ? 'var(--brand-700)' : 'var(--ink-700)'"
      >
        {{ truncateText(row.node.label, 22) }}
      </text>
      <rect
        :x="row.barX"
        :y="row.top + rowHeight * 0.22"
        :width="row.barWidth"
        :height="rowHeight * 0.56"
        rx="2"
        :fill="row.color"
        :opacity="hoverIndex != null && hoverIndex !== index ? 0.38 : 1"
        style="transition: opacity 0.18s ease"
      />
      <text
        :x="width - 12"
        :y="row.textY"
        text-anchor="end"
        font-size="11"
        :fill="compare ? row.color : 'var(--ink-900)'"
      >
        {{ compact(row.node.value, !!compare) }}
      </text>
    </g>
  </svg>

  <ChartTooltip
    v-if="hovered"
    :x="Math.min(xAt(hovered.value), width - 190)"
    :y="rowTop(hoverIndex) + rowHeight"
    :width="width"
  >
    <div class="font-medium text-ink-900">{{ hovered.label }}</div>
    <template v-if="compare">
      <TooltipRow name="P1" marker="p1" :value="compact(hovered.p1)" />
      <TooltipRow name="P2" marker="p2" :value="compact(hovered.p2)" muted />
      <TooltipRow
        name="Selisih"
        :value="`${compact(hovered.value, true)}${hovered.pct == null ? '' : ` · ${formatSignedPercent(hovered.pct)}`}`"
      />
    </template>
    <TooltipRow v-else :name="measure.label" :value="compact(hovered.value)" />
  </ChartTooltip>
</template>
