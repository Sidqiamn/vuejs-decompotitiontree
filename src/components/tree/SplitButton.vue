<script setup>
import AppIcon from '../ui/AppIcon.vue'

defineProps({
  isOpen: { type: Boolean, default: false },
  label: { type: String, required: true },
  revealOnHover: { type: Boolean, default: false },
})

defineEmits(['click'])
</script>

<template>>
  <button
    type="button"
    data-dt-split
    class="focus-ring absolute top-1/2 -right-3 z-[3] grid size-6 -translate-y-1/2 place-items-center rounded-full border shadow-xs transition-[scale,opacity,background-color,border-color,color] duration-200 hover:scale-110 active:scale-95"
    :class="[
      isOpen
        ? 'border-brand-700 bg-brand-700 text-white'
        : 'border-ink-300 bg-paper text-ink-500 hover:border-brand-600 hover:text-brand-700',
      revealOnHover && !isOpen && 'opacity-70 group-hover:opacity-100 focus-visible:opacity-100',
    ]"
    :aria-label="label"
    :aria-expanded="isOpen"
    aria-haspopup="menu"
    @click.stop="$emit('click')"
  >
    <AppIcon name="plus" :size="13" :stroke-width="2.2" />
  </button>
</template>
