<script setup>
import { computed, nextTick, ref, watch } from 'vue'
import { getDimensionLabel } from '@/config/dataset'
import { useTree } from '@/composables/treeContext'
import { aggregateByDimension, calculateTotals } from '@/lib/aggregate'
import { downloadText, slugify, toCsv } from '@/lib/csv'
import { formatCount, formatDate, formatDateRange, formatPercent, formatSignedPercent, formatValue } from '@/lib/format'
import AppIcon from './ui/AppIcon.vue'

const props = defineProps({
  meta: { type: Object, default: null },
})

const open = defineModel('open', { type: Boolean, default: false })
const tree = useTree()

const panel = ref(null)
const closeButton = ref(null)
let returnFocusTo = null

/** Dimensi tabel: ikuti kolom pohon yang sedang terbuka, bisa diganti manual. */
const chosenDimension = ref(null)
const defaultDimension = computed(() => {
  const openLevel = tree.levels.find((level) => level.selected == null)
  if (openLevel) return openLevel.dim
  const used = new Set(tree.trail.map((level) => level.dim))
  return tree.dimensions.find((dimension) => !used.has(dimension)) || tree.dimensions[0]
})
const dimension = computed(() => chosenDimension.value || defaultDimension.value)

const rows = computed(() =>
  open.value ? aggregateByDimension(tree.focusedRows, dimension.value, tree.measure.field, tree.compare) : [],
)
const totals = computed(() => calculateTotals(tree.focusedRows, tree.measure.field, tree.compare))

const full = (value, signed = false) => formatValue(value, 'int', { signed })
const shareOf = (value, base) => (base ? value / base : null)

const unitLabel = computed(() => (tree.measure.format === 'currency' ? ' (Rp)' : ''))

const metaItems = computed(() => [
  { label: 'Sumber', value: props.meta?.source || '–' },
  { label: 'Baris mentah', value: props.meta ? formatCount(props.meta.rawCount) : '–' },
  { label: 'Baris teragregasi', value: props.meta ? formatCount(props.meta.rowCount) : '–' },
  {
    label: 'Kolom tanggal',
    value: props.meta?.dateField
      ? `${props.meta.dateField} · ${props.meta.dateFormatLabel || props.meta.dateFormat}`
      : 'tidak terdeteksi',
  },
  {
    label: 'Rentang data',
    value: tree.hasDates ? `${formatDate(tree.dataBounds.min)} – ${formatDate(tree.dataBounds.max)}` : '–',
  },
  { label: 'Baris dalam cakupan', value: formatCount(tree.focusedRows.length) },
])

function exportCsv() {
  const dimensionLabel = getDimensionLabel(dimension.value)
  const columns = tree.compare
    ? [
        { label: dimensionLabel, value: (row) => row.label },
        { label: `P1 ${formatDateRange(tree.compare.p1)}`, value: (row) => row.p1 },
        { label: `P2 ${formatDateRange(tree.compare.p2)}`, value: (row) => row.p2 },
        { label: 'Selisih', value: (row) => row.value },
        { label: 'Perubahan (%)', value: (row) => (row.pct == null ? '' : (row.pct * 100).toFixed(2).replace('.', ',')) },
      ]
    : [
        { label: dimensionLabel, value: (row) => row.label },
        { label: tree.measure.label, value: (row) => row.value },
        {
          label: 'Porsi (%)',
          value: (row) => {
            const share = shareOf(row.value, totals.value.value)
            return share == null ? '' : (share * 100).toFixed(2).replace('.', ',')
          },
        },
      ]
  const date = new Date().toISOString().slice(0, 10)
  downloadText(
    `pohon-dekomposisi_${slugify(tree.measure.label)}_${slugify(dimensionLabel)}_${date}.csv`,
    toCsv(rows.value, columns),
  )
}

function close() {
  open.value = false
}

function trapFocus(event) {
  if (event.key === 'Escape') {
    event.stopPropagation()
    close()
    return
  }
  if (event.key !== 'Tab' || !panel.value) return
  const focusable = panel.value.querySelectorAll(
    'button:not([disabled]), select:not([disabled]), input:not([disabled]), [tabindex]:not([tabindex="-1"])',
  )
  if (!focusable.length) return
  const first = focusable[0]
  const last = focusable[focusable.length - 1]
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

watch(open, async (isOpen) => {
  if (isOpen) {
    returnFocusTo = document.activeElement
    chosenDimension.value = null
    await nextTick()
    closeButton.value?.focus()
  } else {
    returnFocusTo?.focus?.()
    returnFocusTo = null
  }
})
</script>

<template>
  <Teleport to="body">
    <Transition name="dt-drawer">
      <div v-if="open" class="fixed inset-0 z-50 flex justify-end" @keydown="trapFocus">
        <div class="absolute inset-0 bg-brand-900/30" aria-hidden="true" @click="close" />

        <section
          ref="panel"
          class="dt-drawer-panel relative flex h-full w-full max-w-[680px] flex-col bg-paper text-[13px] text-ink-900 shadow-[-12px_0_40px_-12px_rgb(36_26_31/0.35)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="dt-data-title"
        >
          <header class="flex items-start gap-3 border-b border-ink-200 px-5 py-4">
            <span class="grid size-9 shrink-0 place-items-center rounded-lg bg-brand-50 text-brand-700">
              <AppIcon name="database" :size="18" />
            </span>
            <div class="min-w-0 flex-1">
              <h2 id="dt-data-title" class="text-[15px] font-semibold">Data</h2>
              <p class="truncate text-[12px] text-ink-600">{{ tree.trailText }}</p>
            </div>
            <button
              ref="closeButton"
              type="button"
              class="dt-btn-quiet p-1.5"
              aria-label="Tutup panel data"
              @click="close"
            >
              <AppIcon name="close" :size="18" />
            </button>
          </header>

          <div class="dt-scroll min-h-0 flex-1 overflow-auto px-5 py-4">
            <dl class="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-lg border border-ink-200 bg-wash p-3.5 sm:grid-cols-3">
              <div v-for="item in metaItems" :key="item.label" class="min-w-0">
                <dt class="text-[11px] text-ink-500">{{ item.label }}</dt>
                <dd class="truncate font-medium" :title="item.value">{{ item.value }}</dd>
              </div>
            </dl>

            <div class="mt-5 flex flex-wrap items-center gap-2">
              <h3 class="mr-auto text-[13px] font-semibold">
                Rincian {{ tree.measure.label.toLowerCase() }} per
              </h3>
              <label class="relative">
                <span class="sr-only">Dimensi tabel</span>
                <select
                  class="dt-select min-w-[160px]"
                  :value="dimension"
                  @change="chosenDimension = $event.target.value"
                >
                  <option v-for="item in tree.dimensions" :key="item" :value="item">{{ getDimensionLabel(item) }}</option>
                </select>
                <AppIcon
                  name="chevron-down"
                  :size="14"
                  :stroke-width="2"
                  class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-700"
                />
              </label>
              <button
                type="button"
                class="focus-ring inline-flex h-[34px] items-center gap-1.5 rounded-lg bg-brand-700 px-3 text-[12.5px] font-semibold text-white transition-colors hover:bg-brand-600 disabled:opacity-45"
                :disabled="!rows.length"
                @click="exportCsv"
              >
                <AppIcon name="download" :size="15" />
                Unduh CSV
              </button>
            </div>

            <div class="mt-3 overflow-x-auto rounded-lg border border-ink-200">
              <table class="w-full border-collapse text-[12px]">
                <thead class="bg-ink-50 text-[11px] text-ink-600">
                  <tr>
                    <th scope="col" class="px-3 py-2 text-left font-medium">{{ getDimensionLabel(dimension) }}</th>
                    <template v-if="tree.compare">
                      <th scope="col" class="px-3 py-2 text-right font-medium">
                        <span class="text-brand-700">P1</span>{{ unitLabel }}
                      </th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">
                        <span class="text-p2-700">P2</span>{{ unitLabel }}
                      </th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">Selisih</th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">Δ%</th>
                    </template>
                    <template v-else>
                      <th scope="col" class="px-3 py-2 text-right font-medium">{{ tree.measure.label }}{{ unitLabel }}</th>
                      <th scope="col" class="px-3 py-2 text-right font-medium">Porsi</th>
                    </template>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="row in rows" :key="row.label" class="border-t border-ink-100 hover:bg-brand-50/60">
                    <th scope="row" class="max-w-[220px] truncate px-3 py-1.5 text-left font-normal" :title="row.label">
                      {{ row.label }}
                    </th>
                    <template v-if="tree.compare">
                      <td class="px-3 py-1.5 text-right">{{ full(row.p1) }}</td>
                      <td class="px-3 py-1.5 text-right text-ink-600">{{ full(row.p2) }}</td>
                      <td
                        class="px-3 py-1.5 text-right font-medium"
                        :class="row.value < 0 ? 'text-neg-700' : row.value > 0 ? 'text-pos-700' : ''"
                      >
                        {{ full(row.value, true) }}
                      </td>
                      <td class="px-3 py-1.5 text-right text-ink-600">{{ formatSignedPercent(row.pct) }}</td>
                    </template>
                    <template v-else>
                      <td class="px-3 py-1.5 text-right">{{ full(row.value) }}</td>
                      <td class="px-3 py-1.5 text-right text-ink-600">
                        {{ formatPercent(shareOf(row.value, totals.value)) }}
                      </td>
                    </template>
                  </tr>
                  <tr v-if="!rows.length">
                    <td :colspan="tree.compare ? 5 : 3" class="px-3 py-6 text-center text-ink-500">
                      Tidak ada baris pada cakupan ini.
                    </td>
                  </tr>
                </tbody>
                <tfoot v-if="rows.length" class="border-t border-ink-200 bg-wash font-semibold">
                  <tr>
                    <th scope="row" class="px-3 py-2 text-left">Total</th>
                    <template v-if="tree.compare">
                      <td class="px-3 py-2 text-right">{{ full(totals.p1) }}</td>
                      <td class="px-3 py-2 text-right text-ink-600">{{ full(totals.p2) }}</td>
                      <td class="px-3 py-2 text-right" :class="totals.value < 0 ? 'text-neg-700' : 'text-pos-700'">
                        {{ full(totals.value, true) }}
                      </td>
                      <td class="px-3 py-2 text-right text-ink-600">{{ formatSignedPercent(totals.pct) }}</td>
                    </template>
                    <template v-else>
                      <td class="px-3 py-2 text-right">{{ full(totals.value) }}</td>
                      <td class="px-3 py-2 text-right text-ink-600">100%</td>
                    </template>
                  </tr>
                </tfoot>
              </table>
            </div>
            <p class="mt-2 text-[11px] text-ink-500">
              CSV memakai pemisah titik koma (;) supaya langsung rapi saat dibuka di Excel.
            </p>
          </div>
        </section>
      </div>
    </Transition>
  </Teleport>
</template>
