<script setup>
import { getDimensionLabel } from '@/config/dataset'
import { useTree } from '@/composables/treeContext'
import { formatCount } from '@/lib/format'
import SlicerDropdown from './SlicerDropdown.vue'

const tree = useTree()
</script>

<template>
  <section
    class="flex shrink-0 flex-wrap items-center gap-2 border-b border-ink-200 bg-paper px-5 py-2.5"
    aria-label="Saringan"
  >
    <span class="mr-1 text-[12px] text-ink-500">Saring</span>
    <SlicerDropdown
      v-for="dimension in tree.slicerDims"
      :key="dimension"
      :label="getDimensionLabel(dimension)"
      :options="tree.slicerOptions[dimension] || []"
      :selected="tree.slicerSelections[dimension]"
      @change="(selected) => tree.setSlicer(dimension, selected)"
    />
    <button type="button" class="dt-btn-quiet" :disabled="!tree.hasActiveSlicer" @click="tree.clearSlicers()">
      Bersihkan semua
    </button>
    <span class="ml-auto text-[12px] text-ink-500">{{ formatCount(tree.scopedRows.length) }} baris terpilih</span>
  </section>
</template>
