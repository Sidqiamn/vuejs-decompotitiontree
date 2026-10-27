<script setup>
import { computed } from 'vue'
import { getExtent } from '@/lib/scale'

const WIDTH = 180
const HEIGHT = 36
const PADDING = 3

const props = defineProps({
  p1Series: { type: Array, required: true },
  p2Series: { type: Array, default: null },
})

function buildPath(series, peak) {
  if (!series || series.length < 2) return null
  const xAt = (index) => PADDING + (index / (series.length - 1)) * (WIDTH - PADDING * 2)
  const yAt = (value) => HEIGHT - PADDING - (value / peak) * (HEIGHT - PADDING * 2)
  const baseline = HEIGHT - PADDING

  let line = `M ${xAt(0).toFixed(1)} ${yAt(series[0]).toFixed(1)}`
  for (let i = 1; i < series.length; i++) line += ` L ${xAt(i).toFixed(1)} ${yAt(series[i]).toFixed(1)}`
  const area = `${line} L ${xAt(series.length - 1).toFixed(1)} ${baseline} L ${xAt(0).toFixed(1)} ${baseline} Z`
  return { line, area }
}

const paths = computed(() => {
  const peak = getExtent(props.p1Series, props.p2Series).max || 1
  return { p1: buildPath(props.p1Series, peak), p2: buildPath(props.p2Series, peak) }
})
</script>

<template>
  <svg
    v-if="paths.p1"
    :width="WIDTH"
    :height="HEIGHT"
    :viewBox="`0 0 ${WIDTH} ${HEIGHT}`"
    class="shrink-0"
    aria-hidden="true"
  >
    <path :d="paths.p1.area" fill="var(--brand-700)" opacity=".09" />
    <path
      v-if="paths.p2"
      :d="paths.p2.line"
      fill="none"
      stroke="var(--p2-500)"
      stroke-width="1.3"
      stroke-dasharray="3 3"
      stroke-linecap="round"
    />
    <path
      :d="paths.p1.line"
      fill="none"
      stroke="var(--brand-700)"
      stroke-width="1.75"
      stroke-linecap="round"
      stroke-linejoin="round"
    />
  </svg>
</template>
