<script setup>
import { useTree } from '@/composables/treeContext'
import { formatDate } from '@/lib/format'
import { P2_MODES, PRESET_LABELS } from '@/lib/presets'
import AppIcon from '../ui/AppIcon.vue'
import CompareSwitch from './CompareSwitch.vue'
import DateRangeField from './DateRangeField.vue'
import PresetSelect from './PresetSelect.vue'

const tree = useTree()
</script>

<template>
  <section class="flex shrink-0 flex-wrap items-center gap-2.5 border-b border-ink-200 bg-paper px-5 py-3" aria-label="Periode">
    <DateRangeField
      tone="p1"
      label="Periode"
      badge="P1"
      :model-value="tree.p1"
      :min="tree.dataBounds.min"
      :max="tree.dataBounds.max"
      @update:model-value="tree.setP1"
    />

    <CompareSwitch :model-value="tree.isComparing" @update:model-value="tree.setComparing" />

    <template v-if="tree.isComparing">
      <DateRangeField
        tone="p2"
        label="Pembanding"
        badge="P2"
        :model-value="tree.p2"
        @update:model-value="tree.setP2"
      />

      <div
        class="flex h-[38px] items-center gap-0.5 rounded-lg border border-ink-200 bg-ink-50 p-[3px]"
        role="radiogroup"
        aria-label="P2 mengikuti P1"
      >
        <span class="px-2 text-[11px] text-ink-500" aria-hidden="true">vs</span>
        <button
          v-for="mode in P2_MODES"
          :key="mode.key"
          type="button"
          role="radio"
          :aria-checked="tree.p2Mode === mode.key"
          class="focus-ring h-full rounded-md border px-2.5 text-[12.5px] transition-colors"
          :class="
            tree.p2Mode === mode.key
              ? 'border-p2-200 bg-paper font-semibold text-p2-700 shadow-xs'
              : 'border-transparent text-ink-700 hover:bg-paper/70 hover:text-ink-900'
          "
          @click="tree.setP2Mode(mode.key)"
        >
          {{ mode.label }}
        </button>
      </div>
    </template>

    <PresetSelect :anchor-label="tree.anchorDate ? formatDate(tree.anchorDate) : ''" @select="tree.applyPreset" />

    <span
      v-if="tree.lastPresetKey"
      class="inline-flex items-center gap-1.5 rounded-full border border-brand-200 bg-brand-50 py-1 pr-1.5 pl-2.5 text-[11.5px] text-brand-700"
    >
      {{ PRESET_LABELS[tree.lastPresetKey] }}
      <AppIcon name="check" :size="13" :stroke-width="2" />
    </span>
  </section>
</template>
