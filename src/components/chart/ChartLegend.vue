<script setup>
defineProps({ isTimeChart: { type: Boolean, default: true } })
</script>

<template>
  <span class="flex items-center gap-3 text-[11px] text-ink-600">
    <template v-if="isTimeChart">
      <span class="flex items-center gap-1.5"><span class="h-0.5 w-4 rounded-full bg-brand-700" />P1</span>
      <span class="flex items-center gap-1.5">
        <span class="h-0 w-4 border-t-[1.5px] border-dashed border-p2-500" />P2
      </span>
    </template>
    <template v-else>
      <span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-pos-700" />naik</span>
      <span class="flex items-center gap-1.5"><span class="size-2 rounded-sm bg-neg-700" />turun</span>
    </template>
  </span>
</template>
