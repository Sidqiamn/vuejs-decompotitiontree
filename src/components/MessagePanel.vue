<script setup>
import BrandMark from './ui/BrandMark.vue'

defineProps({ title: { type: String, required: true } })
</script>

<template>
  <div class="dt-canvas grid h-full place-items-center p-6">
    <div class="dt-rise w-full max-w-[520px] rounded-xl border border-ink-200 bg-paper p-7 shadow-sm">
      <span class="mb-4 grid size-10 place-items-center rounded-lg bg-p2-600 text-white">
        <BrandMark class="size-5" />
      </span>
      <h2 class="text-[17px] font-semibold text-ink-900">{{ title }}</h2>
      <div class="mt-2 space-y-2 text-[13px] leading-relaxed text-ink-600">
        <slot />
      </div>
      <div v-if="$slots.actions" class="mt-5 flex gap-2">
        <slot name="actions" />
      </div>
    </div>
  </div>
</template>
