<script setup>

const ICONS = {
  close: 'M6 6l12 12M18 6 6 18',
  'chevron-down': 'm6 9 6 6 6-6',
  'chevron-right': 'm9 6 6 6-6 6',
  plus: 'M12 5v14M5 12h14',
  check: 'm5 12.5 4.5 4.5L19 7',
  'panel-up': 'M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4ZM3 9.5h18m-11.5 6 2.5-2.5 2.5 2.5',
  'panel-down':
    'M5.5 4h13A2.5 2.5 0 0 1 21 6.5v11a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5v-11A2.5 2.5 0 0 1 5.5 4ZM3 9.5h18m-11.5 3.5 2.5 2.5 2.5-2.5',
  database:
    'M19.5 5.5c0 1.55-3.36 2.8-7.5 2.8s-7.5-1.25-7.5-2.8 3.36-2.8 7.5-2.8 7.5 1.25 7.5 2.8ZM4.5 5.5V12c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V5.5M4.5 12v6.5c0 1.55 3.36 2.8 7.5 2.8s7.5-1.25 7.5-2.8V12',
  download: 'M12 4v11m0 0-4.5-4.5M12 15l4.5-4.5M5 19.5h14',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.4-5.5M4.5 4.5V9H9',
  info: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-10v5.5m0-8.6v.1',
  sparkle: 'M12 3.5 13.9 9l5.6 1.9-5.6 1.9L12 18.5l-1.9-5.7-5.6-1.9L10.1 9 12 3.5ZM19 16.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7.7-1.8Z',
  arrow: 'M5 12h14m-5-5 5 5-5 5',
}

defineProps({
  name: { type: String, required: true },
  size: { type: [Number, String], default: 16 },
  strokeWidth: { type: [Number, String], default: 1.7 },
})
</script>

<template>
  <svg
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    :stroke-width="strokeWidth"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    focusable="false"
    class="shrink-0"
  >
    <path :d="ICONS[name]" />
  </svg>
</template>
