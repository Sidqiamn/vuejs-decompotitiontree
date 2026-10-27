<script setup>
import { computed, ref, toRef } from 'vue'
import {
  DIMENSIONS,
  MEASURES,
  NODE_LIMIT,
  REPORT_NAME,
  SLICERS,
  SUGGESTED_DIMENSIONS,
  getDimensionLabel,
} from '@/config/dataset'
import { provideTree } from '@/composables/treeContext'
import { useDecompositionTree } from '@/composables/useDecompositionTree'
import { usePersistentRef } from '@/composables/usePersistentRef'
import { formatDateRange } from '@/lib/format'
import AppHeader from './AppHeader.vue'
import ChartPanel from './chart/ChartPanel.vue'
import DataDrawer from './DataDrawer.vue'
import SlicerBar from './filters/SlicerBar.vue'
import KpiSummary from './KpiSummary.vue'
import MessagePanel from './MessagePanel.vue'
import PeriodBar from './period/PeriodBar.vue'
import TrailBar from './TrailBar.vue'
import TreeCanvas from './tree/TreeCanvas.vue'
import InlineCode from './ui/InlineCode.vue'
import NoticeBar from './ui/NoticeBar.vue'

const props = defineProps({
  /** Baris hasil aggregateRawRows() (lihat src/lib/dataLoader.js). */
  rows: { type: Array, default: () => [] },
  /** Info sumber data untuk panel Data. */
  meta: { type: Object, default: null },
  dimensions: { type: Array, default: () => DIMENSIONS },
  slicerDims: { type: Array, default: () => SLICERS },
  measures: { type: Array, default: () => MEASURES },
  suggestedDimensions: { type: Array, default: () => SUGGESTED_DIMENSIONS },
  nodeLimit: { type: Number, default: NODE_LIMIT },
  reportName: { type: String, default: REPORT_NAME },
  /** Saringan tetap dari URL: { dimensi: Set(nilai) } — hanya ditampilkan sebagai info. */
  lockedFilters: { type: Object, default: () => ({}) },
  /** Tampilkan tombol × di header (memancarkan event "close"). */
  closable: { type: Boolean, default: false },
})

defineEmits(['close'])

const tree = useDecompositionTree(toRef(props, 'rows'), {
  dimensions: props.dimensions,
  slicerDims: props.slicerDims,
  measures: props.measures,
  suggestedDimensions: props.suggestedDimensions,
})
provideTree(tree)

const barsHidden = usePersistentRef('dt.barsHidden', false)
const chartOpen = usePersistentRef('dt.chartOpen', false)
const dataOpen = ref(false)

const periodText = computed(() => {
  if (!tree.hasDates) return 'Seluruh data'
  if (tree.compare) return `${formatDateRange(tree.compare.p1)} dibanding ${formatDateRange(tree.compare.p2)}`
  return tree.p1.from && tree.p1.to ? formatDateRange(tree.p1) : 'Seluruh data'
})

const headerExtra = computed(() =>
  barsHidden.value && tree.activeSlicerCount ? `${tree.activeSlicerCount} saringan aktif` : '',
)

const lockedFilterText = computed(() =>
  Object.entries(props.lockedFilters)
    .map(([dimension, values]) => `${getDimensionLabel(dimension)} = ${Array.from(values).join(', ')}`)
    .join(' · '),
)
</script>

<template>
  <MessagePanel v-if="!rows.length" title="Tidak ada baris untuk diuraikan">
    <p>
      Letakkan <InlineCode>dummy_dataset.csv</InlineCode> di folder <InlineCode>public/</InlineCode>, lalu muat
      ulang halaman.
    </p>
    <p>
      Kalau berkasnya sudah ada, cocokkan <InlineCode>DIMENSIONS</InlineCode> dan
      <InlineCode>NUMERIC_FIELDS</InlineCode> di <InlineCode>src/config/dataset.js</InlineCode> dengan nama kolom di
      CSV-nya.
    </p>
  </MessagePanel>

  <div v-else class="flex min-h-full flex-col bg-canvas desk:h-full">
    <AppHeader
      :report-name="reportName"
      :period-text="periodText"
      :extra-text="headerExtra"
      :measures="tree.measures"
      :measure-key="tree.measureKey"
      :bars-hidden="barsHidden"
      :closable="closable"
      @update:measure-key="tree.setMeasure"
      @toggle-bars="barsHidden = !barsHidden"
      @open-data="dataOpen = true"
      @close="$emit('close')"
    />

    <template v-if="!barsHidden">
      <PeriodBar v-if="tree.hasDates" />
      <NoticeBar v-else>
        Kolom tanggal tidak terbaca, jadi perbandingan periode dimatikan. Isi <InlineCode>DATE_FIELD</InlineCode> di
        <InlineCode>src/config/dataset.js</InlineCode> dengan nama kolom tanggal di CSV kamu.
      </NoticeBar>
      <SlicerBar />
    </template>

    <NoticeBar v-if="lockedFilterText">Data disaring lewat URL: {{ lockedFilterText }}</NoticeBar>
    <NoticeBar v-if="tree.periodIssue">{{ tree.periodIssue }}</NoticeBar>
    <NoticeBar v-if="tree.hasLengthMismatch">
      <span>Panjang periode berbeda: P1 {{ tree.p1Days }} hari, P2 {{ tree.p2Days }} hari. Selisihnya jadi tidak setara.</span>
      <button
        type="button"
        class="focus-ring rounded-md border border-current px-2 py-0.5 text-[11.5px] font-medium transition-colors hover:bg-white/60"
        @click="tree.matchP2LengthToP1()"
      >
        Samakan jadi {{ tree.p1Days }} hari
      </button>
    </NoticeBar>
    <NoticeBar v-if="tree.outOfDataLabel">
      {{ tree.outOfDataLabel }} berada di luar rentang data ({{ tree.dataRangeText }}), jadi nilainya nol.
    </NoticeBar>

    <KpiSummary />
    <TrailBar v-if="tree.trail.length" />
    <ChartPanel v-if="tree.hasDates && !barsHidden" v-model:open="chartOpen" />
    <TreeCanvas :node-limit="nodeLimit" />
    <DataDrawer v-model:open="dataOpen" :meta="meta" />
  </div>
</template>
