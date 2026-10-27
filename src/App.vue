<script setup>
import { computed, ref } from 'vue'
import { DATA_SOURCE, DIMENSIONS } from '@/config/dataset'
import DecompositionTree from '@/components/DecompositionTree.vue'
import LoadingCanvas from '@/components/LoadingCanvas.vue'
import MessagePanel from '@/components/MessagePanel.vue'
import BrandMark from '@/components/ui/BrandMark.vue'
import InlineCode from '@/components/ui/InlineCode.vue'
import { useDataset } from '@/composables/useDataset'
import { applySelections } from '@/lib/aggregate'
import { readUrlFilters } from '@/lib/dataLoader'

const { status, rows, meta, error, reload } = useDataset()

const urlFilters = readUrlFilters(window.location.search, DIMENSIONS)
const filteredRows = computed(() => applySelections(rows.value, urlFilters))


const isOpen = ref(true)
</script>

<template>
  <LoadingCanvas v-if="status === 'loading'" />

  <MessagePanel v-else-if="status === 'error'" title="Data tidak bisa dimuat">
    <p>{{ error }}</p>
    <p>
      Periksa sumber data di <InlineCode>src/config/dataset.js</InlineCode> (saat ini
      <InlineCode>DATA_SOURCE = '{{ DATA_SOURCE }}'</InlineCode>), lalu coba lagi.
    </p>
    <template #actions>
      <button
        type="button"
        class="focus-ring rounded-lg bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-600"
        @click="reload"
      >
        Coba lagi
      </button>
    </template>
  </MessagePanel>

  <DecompositionTree
    v-else-if="isOpen"
    :rows="filteredRows"
    :meta="meta"
    :locked-filters="urlFilters"
    closable
    @close="isOpen = false"
  />

  <div v-else class="dt-canvas grid h-full place-items-center p-6">
    <div class="dt-rise flex flex-col items-center gap-3 text-center">
      <span class="grid size-11 place-items-center rounded-xl bg-p2-600 text-white shadow-sm">
        <BrandMark class="size-6" />
      </span>
      <p class="text-[14px] font-semibold text-ink-900">Pohon dekomposisi ditutup</p>
      <button
        type="button"
        class="focus-ring rounded-lg bg-brand-700 px-3.5 py-2 text-[13px] font-semibold text-white hover:bg-brand-600"
        @click="isOpen = true"
      >
        Buka lagi
      </button>
    </div>
  </div>
</template>
