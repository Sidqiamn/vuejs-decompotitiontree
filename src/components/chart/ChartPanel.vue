<script setup>
import { computed, ref } from 'vue'
import { AUTO, getDimensionLabel } from '@/config/dataset'
import { useTree } from '@/composables/treeContext'
import { useElementWidth } from '@/composables/useResizeObserver'
import { aggregateByDimension, calculateTotals, keepTopNodes } from '@/lib/aggregate'
import { countDays } from '@/lib/dates'
import {
  CHART_KINDS,
  DIMENSION_CHART_KINDS,
  GRANULARITY_LABELS,
  GRANULARITY_OPTIONS,
  TIME_CHART_KINDS,
  buildTimeSeries,
  chooseAutoGranularity,
  resolveGranularity,
} from '@/lib/timeseries'
import AppIcon from '../ui/AppIcon.vue'
import BridgeChart from './BridgeChart.vue'
import ChartLegend from './ChartLegend.vue'
import ContributionChart from './ContributionChart.vue'
import Sparkline from './Sparkline.vue'
import TimeChart from './TimeChart.vue'

const CHART_HEIGHT = 220

const tree = useTree()
const open = defineModel('open', { type: Boolean, default: false })

const chartKind = ref('line')
const granularityChoice = ref(AUTO)
const chartDimension = ref(tree.dimensions[0])

const container = ref(null)
const width = useElementWidth(container)

const activeP1Range = computed(() => (tree.compare ? tree.compare.p1 : tree.p1))
const activeP2Range = computed(() => (tree.compare ? tree.compare.p2 : null))
const spanDays = computed(() => countDays(activeP1Range.value.from, activeP1Range.value.to))
const autoGranularity = computed(() => chooseAutoGranularity(spanDays.value))
const granularity = computed(() => resolveGranularity(granularityChoice.value, spanDays.value))

const availableKinds = computed(() => CHART_KINDS.filter((kind) => !kind.compareOnly || tree.compare))
const activeKind = computed(() =>
  availableKinds.value.some((kind) => kind.key === chartKind.value) ? chartKind.value : 'line',
)
const isTimeChart = computed(() => TIME_CHART_KINDS.includes(activeKind.value))
const needsDimension = computed(() => DIMENSION_CHART_KINDS.includes(activeKind.value))

const timeSeries = computed(() =>
  buildTimeSeries(tree.focusedRows, tree.measure.field, granularity.value, activeP1Range.value, activeP2Range.value),
)

const dimensionNodes = computed(() => {
  if (!needsDimension.value) return null
  const nodes = aggregateByDimension(tree.focusedRows, chartDimension.value, tree.measure.field, tree.compare)
  return keepTopNodes(nodes, activeKind.value === 'bridge' ? 7 : 10)
})

const totals = computed(() => calculateTotals(tree.focusedRows, tree.measure.field, tree.compare))
const isEmpty = computed(() => (isTimeChart.value ? !timeSeries.value : !dimensionNodes.value?.length))
</script>

<template>
  <section class="shrink-0 border-b border-ink-200 bg-paper">
    <div class="flex flex-wrap items-center gap-2 px-5 py-2">
      <button
        type="button"
        class="dt-btn-quiet -ml-1.5 font-medium"
        :aria-expanded="open"
        aria-controls="dt-chart-body"
        @click="open = !open"
      >
        <AppIcon
          name="chevron-right"
          :size="14"
          :stroke-width="2"
          class="transition-transform duration-200"
          :class="open && 'rotate-90'"
        />
        Grafik
      </button>

      <label class="relative">
        <span class="sr-only">Jenis grafik</span>
        <select class="dt-select min-w-[176px]" :value="activeKind" @change="chartKind = $event.target.value">
          <option v-for="kind in availableKinds" :key="kind.key" :value="kind.key">{{ kind.label }}</option>
        </select>
        <AppIcon
          name="chevron-down"
          :size="14"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-700"
        />
      </label>

      <label v-if="isTimeChart" class="relative">
        <span class="sr-only">Rentang tiap titik</span>
        <select v-model="granularityChoice" class="dt-select min-w-[164px]">
          <option v-for="option in GRANULARITY_OPTIONS" :key="option.key" :value="option.key">
            {{ option.key === AUTO ? `Otomatis, ${GRANULARITY_LABELS[autoGranularity]}` : option.label }}
          </option>
        </select>
        <AppIcon
          name="chevron-down"
          :size="14"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-700"
        />
      </label>

      <label v-if="needsDimension" class="relative">
        <span class="sr-only">Dimensi yang dipecah</span>
        <select v-model="chartDimension" class="dt-select min-w-[150px]">
          <option v-for="dimension in tree.dimensions" :key="dimension" :value="dimension">
            {{ getDimensionLabel(dimension) }}
          </option>
        </select>
        <AppIcon
          name="chevron-down"
          :size="14"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-700"
        />
      </label>

      <ChartLegend v-if="open && tree.compare" :is-time-chart="isTimeChart" class="ml-1" />

      <div class="ml-auto flex min-w-0 items-center gap-3">
        <span class="truncate text-[12px] text-ink-500">{{ tree.trailText }}</span>
        <Sparkline
          v-if="!open && timeSeries"
          :p1-series="timeSeries.p1Series"
          :p2-series="timeSeries.p2Series"
        />
      </div>
    </div>

    <div v-if="open" id="dt-chart-body" ref="container" class="relative pb-2">
      <p v-if="isEmpty" class="px-3 py-10 text-center text-[12px] text-ink-500">Tidak ada baris pada rentang ini.</p>
      <TimeChart
        v-else-if="isTimeChart"
        :data="timeSeries"
        :measure="tree.measure"
        :compare="tree.compare"
        :kind="activeKind"
        :width="width"
        :height="CHART_HEIGHT"
      />
      <ContributionChart
        v-else-if="activeKind === 'contribution'"
        :nodes="dimensionNodes"
        :measure="tree.measure"
        :compare="tree.compare"
        :width="width"
        :height="CHART_HEIGHT"
      />
      <BridgeChart
        v-else
        :steps="dimensionNodes"
        :start-value="totals.p2 || 0"
        :end-value="totals.p1 || 0"
        :measure="tree.measure"
        :width="width"
        :height="CHART_HEIGHT"
      />
    </div>
  </section>
</template>
