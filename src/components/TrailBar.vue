<script setup>
import { getDimensionLabel } from '@/config/dataset'
import { useTree } from '@/composables/treeContext'
import AppIcon from './ui/AppIcon.vue'

const tree = useTree()
</script>

<template>
  <nav class="flex shrink-0 flex-wrap items-center gap-1.5 border-b border-ink-200 bg-paper px-5 py-2 text-[12px]" aria-label="Jalur">
    <span class="mr-0.5 text-ink-500">Jalur</span>

    <button type="button" class="dt-btn-quiet px-2 py-0.5 text-[12px]" @click="tree.focusTrail(-1)">
      {{ tree.compare ? 'Semua selisih' : 'Semua data' }}
    </button>

    <template v-for="(level, index) in tree.trail" :key="level.dim">
      <AppIcon name="chevron-right" :size="12" class="text-ink-300" />
      <component
        :is="index < tree.trail.length - 1 ? 'button' : 'span'"
        :type="index < tree.trail.length - 1 ? 'button' : undefined"
        class="focus-ring rounded-full border border-brand-200 bg-brand-50 px-2.5 py-0.5 font-medium text-brand-700"
        :class="index < tree.trail.length - 1 && 'transition-colors hover:border-brand-300 hover:bg-brand-100'"
        :aria-current="index === tree.trail.length - 1 ? 'location' : undefined"
        @click="index < tree.trail.length - 1 && tree.focusTrail(index)"
      >
        <span class="font-normal text-ink-500">{{ getDimensionLabel(level.dim) }}</span>
        {{ level.selected }}
      </component>
    </template>
  </nav>
</template>
