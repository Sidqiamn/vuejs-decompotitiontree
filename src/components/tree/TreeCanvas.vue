<script setup>
import { nextTick, onMounted, ref, shallowRef, watch } from 'vue'
import { useTree } from '@/composables/treeContext'
import { useResizeObserver } from '@/composables/useResizeObserver'
import { ROOT_NODE_KEY, getNodeKey } from '@/lib/aggregate'
import AppIcon from '../ui/AppIcon.vue'
import LevelColumn from './LevelColumn.vue'
import RootCard from './RootCard.vue'
import StartHint from './StartHint.vue'

defineProps({
  nodeLimit: { type: Number, default: 10 },
})

const tree = useTree()

const scroller = ref(null)
const canvas = ref(null)
const openMenuKey = ref(null)
const hoveredNodeKey = ref(null)

// ---------------------------------------------------------------- menu & hover
const toggleMenu = (key) => {
  openMenuKey.value = openMenuKey.value === key ? null : key
}
const closeMenu = () => {
  openMenuKey.value = null
}
const setHovered = (key, isHovering) => {
  if (isHovering) hoveredNodeKey.value = key
  else if (hoveredNodeKey.value === key) hoveredNodeKey.value = null
}

function splitRoot(dimension) {
  tree.splitNode(-1, null, dimension)
  closeMenu()
}
function autoSplitRoot(mode) {
  tree.autoSplitNode(-1, null, mode)
  closeMenu()
}

// ---------------------------------------------------------------- garis penghubung
/** Elemen kartu per kunci node. Sengaja tidak reaktif: hanya dibaca saat mengukur. */
const nodeElements = new Map()
const registerNode = (key, element) => {
  if (element) nodeElements.set(key, element)
  else nodeElements.delete(key)
}

const links = shallowRef([])
const canvasSize = ref({ width: 0, height: 0 })
let linkSignature = ''

/**
 * Posisi elemen relatif ke kanvas lewat offsetLeft/offsetTop.
 * Sengaja tidak memakai getBoundingClientRect: transform animasi (dt-rise, hover) tidak ikut terhitung,
 * jadi garis selalu menunjuk posisi akhir kartu.
 */
function offsetWithin(element, ancestor) {
  let x = 0
  let y = 0
  let node = element
  while (node && node !== ancestor) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return node === ancestor ? { x, y } : null
}

function updateLinks() {
  const canvasElement = canvas.value
  if (!canvasElement) return

  const nextLinks = []
  const { levelData, levels } = tree

  for (let i = 0; i < levelData.length; i++) {
    const parentKey = i === 0 ? ROOT_NODE_KEY : getNodeKey(i - 1, levels[i - 1].selected)
    const parentElement = nodeElements.get(parentKey)
    const parentOffset = parentElement && offsetWithin(parentElement, canvasElement)
    if (!parentOffset) continue

    const startX = parentOffset.x + parentElement.offsetWidth
    const startY = parentOffset.y + parentElement.offsetHeight / 2

    for (const node of levelData[i].nodes) {
      const key = getNodeKey(i, node.label)
      const childElement = nodeElements.get(key)
      const childOffset = childElement && offsetWithin(childElement, canvasElement)
      if (!childOffset) continue

      const endX = childOffset.x
      const endY = childOffset.y + childElement.offsetHeight / 2
      const midX = startX + (endX - startX) / 2
      nextLinks.push({
        key,
        d: `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`,
        on: levels[i].selected === node.label,
      })
    }
  }

  const width = canvasElement.offsetWidth
  const height = canvasElement.offsetHeight
  const signature = `${width}x${height}|${nextLinks.map((link) => `${link.key}~${link.on}~${link.d}`).join('|')}`
  if (signature === linkSignature) return
  linkSignature = signature

  links.value = nextLinks
  if (canvasSize.value.width !== width || canvasSize.value.height !== height) canvasSize.value = { width, height }
}

watch(
  [
    () => tree.levelData,
    () => tree.levels,
    () => tree.expandedLevels,
    () => tree.shareMode,
    () => tree.compare,
    () => tree.measure,
  ],
  updateLinks,
  { flush: 'post' },
)

useResizeObserver(canvas, updateLinks)

onMounted(() => {
  updateLinks()
  document.fonts?.ready?.then(updateLinks)
})

function linkStroke(link) {
  if (link.on) return 'var(--brand-700)'
  return link.key === hoveredNodeKey.value ? 'var(--brand-500)' : 'var(--ink-300)'
}

watch(
  () => tree.levels.length,
  async (length, previousLength) => {
    if (length <= previousLength) return
    await nextTick()
    const column = canvas.value?.querySelector(`[data-level="${length - 1}"]`)
    if (!column) return
    const target = column.querySelector('[aria-pressed="true"]') || column
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'nearest', inline: 'nearest' })
  },
)
</script>

<template>
  <div ref="scroller" class="dt-canvas dt-scroll min-h-[60vh] flex-1 overflow-auto px-4 pt-6 pb-10 sm:px-6 desk:min-h-0">
    <div ref="canvas" class="relative flex w-max min-w-full items-start gap-[72px]">
      <svg
        class="pointer-events-none absolute inset-0 overflow-visible"
        :width="canvasSize.width"
        :height="canvasSize.height"
        aria-hidden="true"
      >
        <path
          v-for="link in links"
          :key="link.key"
          class="dt-draw"
          :class="(link.on || link.key === hoveredNodeKey) && 'dt-glow'"
          pathLength="1"
          :d="link.d"
          fill="none"
          stroke-linecap="round"
          :stroke="linkStroke(link)"
          :stroke-width="link.on || link.key === hoveredNodeKey ? 2 : 1.25"
          :opacity="link.on || link.key === hoveredNodeKey ? 1 : 0.75"
          style="transition: stroke 0.18s ease, stroke-width 0.18s ease, opacity 0.18s ease"
        />
      </svg>

      <div class="dt-rise relative z-[1] w-[264px] flex-none">
        <div class="mb-3 flex h-10 items-center rounded-lg border border-ink-200 bg-paper/85 px-3">
          <span class="truncate text-[13px] font-semibold text-ink-800">{{ tree.measure.label }}</span>
        </div>
        <RootCard
          :measure="tree.measure"
          :compare="tree.compare"
          :totals="tree.grandTotals"
          :row-count="tree.scopedRows.length"
          :is-filtered="tree.hasActiveSlicer"
          :is-menu-open="openMenuKey === ROOT_NODE_KEY"
          :unused-dims="tree.getUnusedDimensions(-1)"
          :register-node="registerNode"
          @toggle-menu="toggleMenu(ROOT_NODE_KEY)"
          @close-menu="closeMenu"
          @pick="splitRoot"
          @auto="autoSplitRoot"
        />
      </div>

      <div
        v-if="!tree.scopedRows.length"
        class="dt-rise relative z-[1] mt-[52px] w-[316px] flex-none rounded-xl border border-note-200 bg-note-50 p-4 text-note-700"
        role="status"
      >
        <h2 class="flex items-center gap-1.5 text-[14px] font-semibold"><AppIcon name="info" :size="16" />Tidak ada baris</h2>
        <p class="mt-1 text-[13px] leading-relaxed">
          Tidak ada data yang cocok dengan saringan dan periode ini. Longgarkan saringan atau ubah tanggalnya.
        </p>
        <button
          v-if="tree.hasActiveSlicer"
          type="button"
          class="focus-ring mt-3 rounded-md border border-current px-2.5 py-1 text-[12px] font-medium transition-colors hover:bg-white/60"
          @click="tree.clearSlicers()"
        >
          Bersihkan saringan
        </button>
      </div>

      <StartHint
        v-else-if="!tree.levels.length"
        :dims="tree.suggestions"
        :compare="!!tree.compare"
        @pick="splitRoot"
      />

      <LevelColumn
        v-for="(_, levelIndex) in tree.levelData"
        :key="`${levelIndex}-${tree.levels[levelIndex].dim}`"
        :level-index="levelIndex"
        :node-limit="nodeLimit"
        :open-menu-key="openMenuKey"
        :register-node="registerNode"
        @toggle-menu="toggleMenu"
        @close-menu="closeMenu"
        @hover="setHovered"
      />
    </div>
  </div>
</template>
