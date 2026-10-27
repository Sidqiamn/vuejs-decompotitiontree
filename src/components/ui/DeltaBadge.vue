<script setup>
import { computed } from 'vue'
import { formatPercent } from '@/lib/format'

/**
 * Lencana perubahan: ▲ 54,6% (hijau) atau ▼ 12% (merah).
 * Arah memakai bentuk + warna supaya tetap terbaca tanpa membedakan warna.
 */
const props = defineProps({
  ratio: { type: Number, default: null },

  value: { type: Number, default: null },
  variant: { type: String, default: 'pill' }, // 'pill' | 'plain'
})

const isDown = computed(() => (props.value ?? props.ratio ?? 0) < 0)
const label = computed(() => formatPercent(Math.abs(props.ratio)))
</script>

<template>
  <span
    v-if="ratio != null && Number.isFinite(ratio)"
    class="inline-flex shrink-0 items-center gap-1 font-semibold whitespace-nowrap"
    :class="[
      variant === 'pill' ? 'rounded-full px-1.5 py-0.5 text-[10.5px] leading-none' : 'text-[13px]',
      isDown
        ? variant === 'pill'
          ? 'bg-neg-50 text-neg-700'
          : 'text-neg-700'
        : variant === 'pill'
          ? 'bg-pos-50 text-pos-700'
          : 'text-pos-700',
    ]"
  >
    <svg
      viewBox="0 0 8 6"
      :class="[variant === 'pill' ? 'h-[5px] w-[7px]' : 'h-[6px] w-[8px]', isDown && 'rotate-180']"
      aria-hidden="true"
    >
      <path d="M4 0 8 6H0z" fill="currentColor" />
    </svg>
    <span class="sr-only">{{ isDown ? 'Turun' : 'Naik' }}</span>
    {{ label }}
  </span>
</template>
