<script setup>
import { computed } from 'vue'
import { useTree } from '@/composables/treeContext'
import { formatDateRange, formatValue } from '@/lib/format'
import AppIcon from './ui/AppIcon.vue'
import DeltaBadge from './ui/DeltaBadge.vue'

const tree = useTree()

const totals = computed(() => tree.grandTotals)
const valueClass = computed(() => {
  if (!tree.compare) return 'text-brand-700'
  if (totals.value.value < 0) return 'text-neg-700'
  return totals.value.value > 0 ? 'text-pos-700' : 'text-ink-700'
})

const compact = (value) => formatValue(value, tree.measure.format, { compact: true })
const periodLabel = computed(() =>
  tree.hasDates && tree.p1.from && tree.p1.to ? formatDateRange(tree.p1) : 'seluruh data',
)
</script>

<template>
  <section class="flex shrink-0 flex-wrap items-center gap-x-6 gap-y-2 border-b border-ink-200 bg-wash px-5 py-3.5">
    <div class="min-w-0">
      <div class="flex flex-wrap items-center gap-x-3 gap-y-1">
        <span class="text-[28px] leading-none font-semibold tracking-[-0.02em]" :class="valueClass">
          {{ formatValue(totals.value, tree.measure.format, { signed: !!tree.compare }) }}
        </span>
        <DeltaBadge v-if="tree.compare" variant="plain" :value="totals.value" :ratio="totals.pct" />
      </div>
      <p class="mt-1.5 text-[12px] text-ink-600">
        <template v-if="tree.compare">
          Selisih P1 – P2 ·
          <b class="font-semibold text-brand-700">P1</b> {{ compact(totals.p1) }} vs
          <b class="font-semibold text-p2-700">P2</b> {{ compact(totals.p2) }}. Pohon di bawah mengurai selisih ini.
        </template>
        <template v-else>
          Total {{ tree.measure.label.toLowerCase() }}, {{ periodLabel }}. Pohon di bawah mengurai total ini.
        </template>
      </p>
    </div>

    <div class="ml-auto flex items-center gap-1">
      <button
        type="button"
        class="dt-btn-quiet"
        :title="`Klik untuk menghitung porsi dari ${tree.shareMode === 'parent' ? 'total' : 'induk'}`"
        @click="tree.toggleShareMode()"
      >
        Porsi dari {{ tree.shareMode === 'parent' ? 'induk' : 'total' }}
      </button>
      <button type="button" class="dt-btn-quiet" :disabled="!tree.levels.length" @click="tree.resetTree()">
        <AppIcon name="reset" :size="14" />
        Mulai ulang
      </button>
    </div>
  </section>
</template>
