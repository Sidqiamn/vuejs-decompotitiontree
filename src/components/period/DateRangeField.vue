<script setup>
import { computed } from 'vue'
import { countDays } from '@/lib/dates'

const props = defineProps({
  /** 'p1' (marun) atau 'p2' (biru) */
  tone: { type: String, default: 'p1' },
  label: { type: String, required: true },
  badge: { type: String, required: true },
  modelValue: { type: Object, required: true },
  min: { type: String, default: null },
  max: { type: String, default: null },
})

const emit = defineEmits(['update:modelValue'])

const isP1 = computed(() => props.tone === 'p1')
const days = computed(() => countDays(props.modelValue.from, props.modelValue.to))
const isReversed = computed(
  () => !!props.modelValue.from && !!props.modelValue.to && props.modelValue.from > props.modelValue.to,
)

const update = (part, value) => emit('update:modelValue', { ...props.modelValue, [part]: value })
</script>

<template>
  <div
    class="dt-shadow flex flex-wrap items-center gap-2 rounded-lg border border-l-[3px] border-ink-200 bg-paper py-1.5 pr-2 pl-3"
    :class="isP1 ? 'border-l-brand-700' : 'border-l-p2-600'"
    role="group"
    :aria-label="`${label} ${badge}`"
  >
    <span class="text-[12.5px] font-semibold" :class="isP1 ? 'text-brand-700' : 'text-p2-700'">{{ label }}</span>
    <span
      class="rounded px-1.5 py-px text-[10px] leading-4 font-bold tracking-wide"
      :class="isP1 ? 'bg-brand-700 text-white' : 'bg-p2-100 text-p2-700'"
    >
      {{ badge }}
    </span>

    <input
      class="dt-date"
      type="date"
      :data-tone="tone"
      :value="modelValue.from"
      :min="min || undefined"
      :max="max || undefined"
      :aria-label="`${label}, tanggal mulai`"
      :aria-invalid="isReversed || undefined"
      @change="update('from', $event.target.value)"
    />
    <span class="text-ink-300" aria-hidden="true">–</span>
    <input
      class="dt-date"
      type="date"
      :data-tone="tone"
      :value="modelValue.to"
      :min="min || undefined"
      :max="max || undefined"
      :aria-label="`${label}, tanggal akhir`"
      :aria-invalid="isReversed || undefined"
      @change="update('to', $event.target.value)"
    />

    <span v-if="isReversed" class="rounded-full bg-neg-50 px-2 py-0.5 text-[11px] font-medium text-neg-700">
      Tanggal terbalik
    </span>
    <span v-else-if="days > 0" class="rounded-full bg-ink-100 px-2 py-0.5 text-[11px] font-medium text-ink-600">
      {{ days }} hari
    </span>
  </div>
</template>
