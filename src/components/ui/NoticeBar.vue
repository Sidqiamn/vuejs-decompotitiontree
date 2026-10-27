<script setup>
import AppIcon from './AppIcon.vue'
</script>

<template>
  <div
    class="flex flex-wrap items-center gap-x-2 gap-y-1 border-b border-note-200 bg-note-50 px-5 py-2 text-[12px] text-note-700"
    role="status"
  >
    <AppIcon name="info" :size="15" />
    <slot />
  </div>
</template>
