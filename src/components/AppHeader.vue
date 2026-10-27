<script setup>
import AppIcon from './ui/AppIcon.vue'
import BrandMark from './ui/BrandMark.vue'

defineProps({
  title: { type: String, default: 'Pohon dekomposisi' },
  reportName: { type: String, default: '' },
  periodText: { type: String, default: '' },
  extraText: { type: String, default: '' },
  measures: { type: Array, default: () => [] },
  measureKey: { type: String, default: '' },
  barsHidden: { type: Boolean, default: false },
  closable: { type: Boolean, default: false },
  showActions: { type: Boolean, default: true },
})

defineEmits(['close', 'update:measureKey', 'toggle-bars', 'open-data'])
</script>

<template>
  <header class="dt-topbar flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 text-white sm:px-5">
    <button
      v-if="closable"
      type="button"
      class="dt-header-icon -ml-1 grid size-8 shrink-0 place-items-center rounded-lg text-white/90 transition-colors hover:bg-white/12 hover:text-white"
      aria-label="Tutup pohon dekomposisi"
      @click="$emit('close')"
    >
      <AppIcon name="close" :size="19" />
    </button>

    <span
      class="grid size-9 shrink-0 place-items-center rounded-[10px] bg-p2-600 text-white shadow-[inset_0_0_0_1px_rgb(255_255_255/0.2),0_2px_6px_rgb(0_0_0/0.18)]"
    >
      <BrandMark class="size-[19px]" />
    </span>

    <div class="min-w-[170px] flex-1">
      <h1 class="truncate text-[16px] leading-tight font-semibold tracking-[0.005em]">{{ title }}</h1>
      <p class="mt-0.5 truncate text-[12px] text-white/72">
        <template v-if="reportName">{{ reportName }} <span class="text-white/45">/</span> </template>
        {{ periodText }}
        <template v-if="extraText"> · {{ extraText }}</template>
      </p>
    </div>

    <div v-if="showActions" class="ml-auto flex shrink-0 items-center gap-2">
      <label class="relative">
        <span class="sr-only">Metrik</span>
        <select
          class="dt-header-btn appearance-none pr-8"
          :value="measureKey"
          @change="$emit('update:measureKey', $event.target.value)"
        >
          <option v-for="item in measures" :key="item.key" :value="item.key">{{ item.label }}</option>
        </select>
        <AppIcon
          name="chevron-down"
          :size="14"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2"
        />
      </label>

      <button
        type="button"
        class="dt-header-btn"
        :aria-pressed="barsHidden"
        :title="barsHidden ? 'Tampilkan bilah periode & saringan' : 'Sembunyikan bilah periode & saringan'"
        @click="$emit('toggle-bars')"
      >
        <AppIcon :name="barsHidden ? 'panel-down' : 'panel-up'" :size="15" />
        <span class="hidden md:inline">{{ barsHidden ? 'Tampilkan bilah' : 'Sembunyikan bilah' }}</span>
      </button>

      <button type="button" class="dt-header-btn" title="Lihat dan unduh data" @click="$emit('open-data')">
        <AppIcon name="database" :size="15" />
        <span class="hidden sm:inline">Data</span>
      </button>
    </div>
  </header>
</template>
