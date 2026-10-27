<script setup>
import AppHeader from './AppHeader.vue'

const COLUMNS = [0, 1, 2]
const CARDS = [0, 1, 2, 3]
</script>

<template>
  <div class="flex h-full flex-col" aria-busy="true">
    <AppHeader period-text="Membaca data…" :show-actions="false" />
    <div class="h-[62px] shrink-0 border-b border-ink-200 bg-paper px-5 py-3">
      <div class="dt-skeleton h-[38px] w-[min(720px,100%)] rounded-lg" />
    </div>
    <div class="dt-canvas flex flex-1 items-start gap-[72px] overflow-hidden px-6 pt-6">
      <div v-for="column in COLUMNS" :key="column" class="w-[264px] flex-none" :style="{ opacity: 1 - column * 0.28 }">
        <div class="dt-skeleton mb-3 h-10 rounded-lg" />
        <div class="flex flex-col gap-2">
          <div v-for="card in CARDS" :key="card" class="dt-skeleton h-[104px] rounded-lg" />
        </div>
      </div>
    </div>
    <span class="sr-only" role="status">Memuat data…</span>
  </div>
</template>
