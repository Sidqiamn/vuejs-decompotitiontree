<script setup>
import { getDimensionLabel } from '@/config/dataset'

defineProps({
  dims: { type: Array, default: () => [] },
  compare: { type: Boolean, default: false },
})

defineEmits(['pick'])
</script>

<template>
  <div class="dt-rise relative z-[1] mt-[52px] w-[316px] flex-none rounded-xl border border-dashed border-brand-300 bg-paper/75 p-4 backdrop-blur-[1px]">
    <h2 class="text-[14px] font-semibold text-ink-900">Mulai mengurai</h2>
    <p class="mt-1 text-[13px] leading-relaxed text-ink-600">
      Pilih dimensi untuk melihat dari mana {{ compare ? 'selisih P1 – P2' : 'total' }} berasal. Bisa juga tekan
      <span
        class="mx-0.5 inline-grid size-[18px] place-items-center rounded-full border border-ink-300 bg-paper align-[-3px] text-[12px] leading-none text-ink-600"
        aria-hidden="true"
        >+</span
      ><span class="sr-only">tombol tambah</span>
      di samping kotak.
    </p>
    <div class="mt-3 flex flex-wrap gap-2">
      <button v-for="dimension in dims" :key="dimension" type="button" class="dt-chip" @click="$emit('pick', dimension)">
        per {{ getDimensionLabel(dimension) }}
      </button>
    </div>
  </div>
</template>
