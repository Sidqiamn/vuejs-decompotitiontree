<script setup>
defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})
defineEmits(['update:modelValue'])
</script>

<template>
  <button
    type="button"
    role="switch"
    :aria-checked="modelValue"
    :disabled="disabled"
    class="focus-ring inline-flex h-[38px] items-center gap-2.5 rounded-lg border px-3 text-[12.5px] font-medium transition-colors disabled:opacity-45"
    :class="
      modelValue
        ? 'border-brand-200 bg-brand-50 text-ink-900'
        : 'border-ink-200 bg-paper text-ink-700 hover:border-brand-300'
    "
    @click="$emit('update:modelValue', !modelValue)"
  >
    <span
      class="relative h-[18px] w-8 shrink-0 rounded-full transition-colors duration-200"
      :class="modelValue ? 'bg-brand-700' : 'bg-ink-300'"
      aria-hidden="true"
    >
      <span
        class="absolute top-0.5 left-0.5 size-[14px] rounded-full bg-white shadow-sm transition-transform duration-200"
        :class="modelValue && 'translate-x-[14px]'"
      />
    </span>
    Bandingkan periode
  </button>
</template>
