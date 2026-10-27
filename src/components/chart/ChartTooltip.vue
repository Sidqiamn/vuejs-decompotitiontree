<script setup>
import { computed } from 'vue'

const TOOLTIP_WIDTH = 176

const props = defineProps({
  /** Posisi titik acuan (px) relatif terhadap wadah grafik. */
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  /** Lebar wadah, untuk membalik tooltip ke kiri saat terlalu dekat tepi kanan. */
  width: { type: Number, required: true },
})

const style = computed(() => {
  const flip = props.x > props.width - TOOLTIP_WIDTH - 16
  return {
    width: `${TOOLTIP_WIDTH}px`,
    left: `${flip ? props.x - TOOLTIP_WIDTH - 12 : props.x + 14}px`,
    top: `${Math.max(2, props.y - 16)}px`,
  }
})
</script>

<template>
  <div
    class="dt-menu pointer-events-none absolute z-10 rounded-lg px-2.5 py-2 text-[11px] leading-snug"
    :style="style"
    role="tooltip"
  >
    <slot />
  </div>
</template>
