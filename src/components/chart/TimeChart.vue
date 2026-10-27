<script setup>
import { computed, ref, useId } from 'vue'
import { calculateChangeRatio } from '@/lib/aggregate'
import { formatSignedPercent, formatValue } from '@/lib/format'
import { getExtent, getNiceScale } from '@/lib/scale'
import { formatBucketLabel, formatBucketTooltip, toCumulative } from '@/lib/timeseries'
import ChartTooltip from './ChartTooltip.vue'
import TooltipRow from './TooltipRow.vue'

const MARGIN = { top: 14, right: 16, bottom: 28, left: 74 }

const props = defineProps({
  /** Hasil buildTimeSeries(). */
  data: { type: Object, required: true },
  measure: { type: Object, required: true },
  compare: { type: Object, default: null },
  /** 'line' | 'cumulative' | 'bar' */
  kind: { type: String, default: 'line' },
  width: { type: Number, required: true },
  height: { type: Number, required: true },
})

const gradientId = `dt-area-${useId()}`
const hoverIndex = ref(null)

const pointCount = computed(() => props.data.p1Series.length)
const plotWidth = computed(() => Math.max(60, props.width - MARGIN.left - MARGIN.right))
const plotHeight = computed(() => Math.max(60, props.height - MARGIN.top - MARGIN.bottom))
const isBarChart = computed(() => props.kind === 'bar')
const bandWidth = computed(() => plotWidth.value / Math.max(1, pointCount.value))

const series = computed(() =>
  props.kind === 'cumulative'
    ? { p1: toCumulative(props.data.p1Series), p2: toCumulative(props.data.p2Series) }
    : { p1: props.data.p1Series, p2: props.data.p2Series },
)

const scale = computed(() => {
  const { min, max } = getExtent(series.value.p1, series.value.p2)
  return getNiceScale(min, max)
})

function xAt(index) {
  if (isBarChart.value) return MARGIN.left + bandWidth.value * (index + 0.5)
  if (pointCount.value === 1) return MARGIN.left + plotWidth.value / 2
  return MARGIN.left + (index / (pointCount.value - 1)) * plotWidth.value
}

function yAt(value) {
  const { min, max } = scale.value
  return MARGIN.top + plotHeight.value - ((value - min) / (max - min || 1)) * plotHeight.value
}

const linePath = (values) =>
  values.map((value, index) => `${index ? 'L' : 'M'} ${xAt(index).toFixed(1)} ${yAt(value).toFixed(1)}`).join(' ')

const zeroY = computed(() => yAt(0))
const areaPath = computed(
  () =>
    `${linePath(series.value.p1)} L ${xAt(pointCount.value - 1).toFixed(1)} ${zeroY.value.toFixed(1)} L ${xAt(0).toFixed(1)} ${zeroY.value.toFixed(1)} Z`,
)

const xTickIndexes = computed(() => {
  const tickCount = Math.max(2, Math.min(8, Math.floor(plotWidth.value / 100)))
  const indexes = new Set()
  for (let k = 0; k < tickCount; k++) indexes.add(Math.round((k / (tickCount - 1)) * (pointCount.value - 1)))
  return Array.from(indexes).sort((a, b) => a - b)
})

/** Label pertama/terakhir grafik garis duduk tepat di tepi plot, jadi diratakan ke dalam supaya tidak terpotong. */
function tickAnchor(index) {
  if (isBarChart.value || pointCount.value < 2) return 'middle'
  if (index === 0) return 'start'
  return index === pointCount.value - 1 ? 'end' : 'middle'
}

const barWidth = computed(() => Math.max(1, props.compare ? bandWidth.value * 0.34 : bandWidth.value * 0.66))
const barY = (value) => Math.min(yAt(value), zeroY.value)
const barHeight = (value) => Math.max(1, Math.abs(yAt(value) - zeroY.value))
const barOpacity = (index) => (hoverIndex.value == null || hoverIndex.value === index ? 1 : 0.42)

/** Animasi "menggambar" diulang hanya saat bentuk deret berubah, bukan setiap hover. */
const revealKey = computed(
  () => `${props.kind}|${props.data.granularity}|${props.data.p1Range.from}|${props.data.p1Range.to}|${pointCount.value}`,
)

function handlePointerMove(event) {
  const svg = event.currentTarget.ownerSVGElement
  const relativeX = event.clientX - svg.getBoundingClientRect().left
  const index = isBarChart.value
    ? Math.floor((relativeX - MARGIN.left) / bandWidth.value)
    : Math.round(((relativeX - MARGIN.left) / plotWidth.value) * (pointCount.value - 1))
  hoverIndex.value = Math.max(0, Math.min(pointCount.value - 1, index))
}

const tooltip = computed(() => {
  const index = hoverIndex.value
  if (index == null) return null
  const p1Value = series.value.p1[index]
  const p2Value = series.value.p2 ? series.value.p2[index] : null
  const ratio = p2Value == null ? null : calculateChangeRatio(p1Value, p2Value)
  return {
    index,
    p1Value,
    p2Value,
    x: xAt(index),
    y: yAt(Math.max(p1Value, p2Value ?? p1Value)),
    title: formatBucketTooltip(props.data.p1Range, props.data.granularity, index),
    p2Title: series.value.p2 ? formatBucketTooltip(props.data.p2Range, props.data.granularity, index) : '',
    diff:
      p2Value == null
        ? ''
        : `${formatValue(p1Value - p2Value, props.measure.format, { compact: true, signed: true })}${
            ratio == null ? '' : ` · ${formatSignedPercent(ratio)}`
          }`,
  }
})

const compact = (value) => formatValue(value, props.measure.format, { compact: true })
</script>

<template>
  <svg :width="width" :height="height" role="img" :aria-label="`Grafik ${measure.label}`" class="block">
    <defs>
      <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="var(--brand-700)" stop-opacity=".16" />
        <stop offset="100%" stop-color="var(--brand-700)" stop-opacity="0" />
      </linearGradient>
    </defs>

    <g v-for="tick in scale.ticks" :key="tick">
      <line
        :x1="MARGIN.left"
        :x2="MARGIN.left + plotWidth"
        :y1="yAt(tick)"
        :y2="yAt(tick)"
        :stroke="tick === 0 && scale.min < 0 ? 'var(--ink-300)' : 'var(--ink-100)'"
        stroke-width="1"
      />
      <text :x="MARGIN.left - 10" :y="yAt(tick) + 3.5" text-anchor="end" font-size="10" fill="var(--ink-500)">
        {{ compact(tick) }}
      </text>
    </g>

    <text
      v-for="index in xTickIndexes"
      :key="`x${index}`"
      :x="xAt(index)"
      :y="height - 9"
      :text-anchor="tickAnchor(index)"
      font-size="10"
      fill="var(--ink-500)"
    >
      {{ formatBucketLabel(data.labels[index], data.granularity) }}
    </text>

    <g v-if="isBarChart">
      <rect
        v-for="(value, index) in series.p1"
        :key="`p1-${index}`"
        :x="compare ? xAt(index) - barWidth - 1 : xAt(index) - barWidth / 2"
        :y="barY(value)"
        :width="barWidth"
        :height="barHeight(value)"
        :rx="Math.min(2, barWidth / 2)"
        fill="var(--brand-700)"
        :opacity="barOpacity(index)"
      />
      <template v-if="series.p2">
        <rect
          v-for="(value, index) in series.p2"
          :key="`p2-${index}`"
          :x="xAt(index) + 1"
          :y="barY(value)"
          :width="barWidth"
          :height="barHeight(value)"
          :rx="Math.min(2, barWidth / 2)"
          fill="var(--p2-300)"
          :opacity="barOpacity(index)"
        />
      </template>
    </g>

    <g v-else :key="revealKey" class="dt-reveal">
      <path :d="areaPath" :fill="`url(#${gradientId})`" />
      <path
        v-if="series.p2"
        :d="linePath(series.p2)"
        fill="none"
        stroke="var(--p2-500)"
        stroke-width="1.5"
        stroke-dasharray="4 4"
        stroke-linecap="round"
      />
      <path
        :d="linePath(series.p1)"
        fill="none"
        stroke="var(--brand-700)"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      />
    </g>

    <g v-if="tooltip" pointer-events="none">
      <line
        :x1="tooltip.x"
        :x2="tooltip.x"
        :y1="MARGIN.top"
        :y2="MARGIN.top + plotHeight"
        stroke="var(--brand-300)"
        stroke-width="1"
      />
      <template v-if="!isBarChart">
        <circle
          v-if="tooltip.p2Value != null"
          :cx="tooltip.x"
          :cy="yAt(tooltip.p2Value)"
          r="3"
          fill="var(--paper)"
          stroke="var(--p2-500)"
          stroke-width="1.5"
        />
        <circle
          :cx="tooltip.x"
          :cy="yAt(tooltip.p1Value)"
          r="3.5"
          fill="var(--brand-700)"
          stroke="var(--paper)"
          stroke-width="1.5"
        />
      </template>
    </g>

    <rect
      :x="MARGIN.left"
      :y="MARGIN.top"
      :width="plotWidth"
      :height="plotHeight"
      fill="transparent"
      @pointermove="handlePointerMove"
      @pointerleave="hoverIndex = null"
    />
  </svg>

  <ChartTooltip v-if="tooltip" :x="tooltip.x" :y="tooltip.y" :width="width">
    <div class="font-medium text-ink-900">{{ tooltip.title }}</div>
    <TooltipRow :name="compare ? 'P1' : measure.label" :marker="compare ? 'p1' : null" :value="compact(tooltip.p1Value)" />
    <template v-if="tooltip.p2Value != null">
      <TooltipRow name="P2" marker="p2" :value="compact(tooltip.p2Value)" muted />
      <div class="mt-1 border-t border-ink-200 pt-1 text-ink-500">P2: {{ tooltip.p2Title }}</div>
      <TooltipRow name="Selisih" :value="tooltip.diff" />
    </template>
  </ChartTooltip>
</template>
