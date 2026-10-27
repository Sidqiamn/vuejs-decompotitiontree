<script setup>
import { PRESETS, PRESET_GROUPS } from '@/lib/presets'
import AppIcon from '../ui/AppIcon.vue'

defineProps({
  anchorLabel: { type: String, default: '' },
})

const emit = defineEmits(['select'])

const presetsByGroup = PRESET_GROUPS.map((group) => ({
  group,
  items: PRESETS.filter((preset) => preset.group === group),
}))

/** Select ini bertindak sebagai menu aksi: setelah dipilih, kembali ke teks "Preset…". */
function handleChange(event) {
  const value = event.target.value
  event.target.value = ''
  if (value) emit('select', value)
}
</script>

<template>
  <label class="relative block">
    <span class="sr-only">Pilih preset periode</span>
    <select class="dt-select w-[300px]" @change="handleChange">
      <option value="">Preset…{{ anchorLabel ? ` (dari ${anchorLabel})` : '' }}</option>
      <optgroup v-for="{ group, items } in presetsByGroup" :key="group" :label="group">
        <option v-for="preset in items" :key="preset.key" :value="preset.key">{{ preset.label }}</option>
      </optgroup>
    </select>
    <AppIcon
      name="chevron-down"
      :size="14"
      :stroke-width="2"
      class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 text-ink-700"
    />
  </label>
</template>
