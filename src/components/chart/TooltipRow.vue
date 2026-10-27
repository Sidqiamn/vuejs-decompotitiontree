<script setup>
defineProps({
  name: { type: String, required: true },
  value: { type: String, required: true },
  muted: { type: Boolean, default: false },
  /** Penanda warna: 'p1' | 'p2' | null */
  marker: { type: String, default: null },
})
</script>

<template>
  <div class="mt-1 flex items-baseline justify-between gap-2">
    <span class="flex items-center gap-1.5 text-ink-500">
      <span v-if="marker === 'p1'" class="h-0.5 w-3 rounded-full bg-brand-700" />
      <span v-else-if="marker === 'p2'" class="h-0 w-3 border-t-[1.5px] border-dashed border-p2-500" />
      {{ name }}
    </span>
    <span class="text-right font-medium" :class="muted ? 'text-ink-600' : 'text-ink-900'">{{ value }}</span>
  </div>
</template>
