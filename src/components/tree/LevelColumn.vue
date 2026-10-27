<script setup>
import { computed } from 'vue'
import { getDimensionLabel } from '@/config/dataset'
import { useTree } from '@/composables/treeContext'
import { SORT_LABELS, getNodeKey } from '@/lib/aggregate'
import AppIcon from '../ui/AppIcon.vue'
import NodeCard from './NodeCard.vue'

const props = defineProps({
  levelIndex: { type: Number, required: true },
  nodeLimit: { type: Number, default: 10 },
  openMenuKey: { type: String, default: null },
  registerNode: { type: Function, default: null },
})

const emit = defineEmits(['toggle-menu', 'close-menu', 'hover'])

const tree = useTree()

const level = computed(() => tree.levels[props.levelIndex])
const data = computed(() => tree.levelData[props.levelIndex])
const isExpanded = computed(() => !!tree.expandedLevels[props.levelIndex])

/** Kartu terpilih di luar `nodeLimit` (mis. hasil "Cari otomatis") tetap ditampilkan di akhir daftar. */
const pinnedNode = computed(() => {
  const selected = level.value.selected
  if (selected == null || isExpanded.value) return null
  const index = data.value.nodes.findIndex((node) => node.label === selected)
  return index >= props.nodeLimit ? data.value.nodes[index] : null
})
const visibleNodes = computed(() => {
  if (isExpanded.value) return data.value.nodes
  const top = data.value.nodes.slice(0, props.nodeLimit)
  return pinnedNode.value ? [...top, pinnedNode.value] : top
})
/** Jumlah kartu di atas batas; > 0 berarti kolom ini bisa dibuka/ditutup. */
const extraCount = computed(() => Math.max(0, data.value.nodes.length - props.nodeLimit))
const hiddenCount = computed(() => data.value.nodes.length - visibleNodes.value.length)
const showToggle = computed(() => (isExpanded.value ? extraCount.value > 0 : hiddenCount.value > 0))
const dimensionOptions = computed(() => [level.value.dim, ...tree.getUnusedDimensions(props.levelIndex)])
const unusedDims = computed(() => tree.getUnusedDimensions(props.levelIndex))
const hasSelection = computed(() => level.value.selected != null)

function pick(label, dimension) {
  tree.splitNode(props.levelIndex, label, dimension)
  emit('close-menu')
}

function autoSplit(label, mode) {
  tree.autoSplitNode(props.levelIndex, label, mode)
  emit('close-menu')
}
</script>

<template>
  <div class="dt-rise relative z-[1] w-[264px] flex-none scroll-mx-8 scroll-mt-6" :data-level="levelIndex">
    <div class="mb-3 flex h-10 items-center gap-0.5 rounded-lg border border-ink-200 bg-paper/85 pr-1 pl-1">
      <label class="relative min-w-0 flex-1">
        <span class="sr-only">Dimensi untuk level {{ levelIndex + 1 }}</span>
        <select
          class="focus-ring w-full cursor-pointer appearance-none truncate rounded-md border-0 bg-transparent py-1 pr-6 pl-2 text-[13px] font-semibold text-ink-800 hover:bg-ink-50"
          :value="level.dim"
          @change="tree.changeLevelDimension(levelIndex, $event.target.value)"
        >
          <option v-for="dimension in dimensionOptions" :key="dimension" :value="dimension">
            {{ getDimensionLabel(dimension) }}
          </option>
        </select>
        <AppIcon
          name="chevron-down"
          :size="13"
          :stroke-width="2"
          class="pointer-events-none absolute top-1/2 right-1.5 -translate-y-1/2 text-ink-500"
        />
      </label>
      <span class="px-1 text-[11px] text-ink-400" :title="`${data.nodes.length} anggota`">{{ data.nodes.length }}</span>
      <button
        type="button"
        class="dt-btn-quiet px-1.5 py-1 text-[11.5px] whitespace-nowrap"
        title="Ganti urutan"
        @click="tree.cycleLevelSort(levelIndex)"
      >
        {{ SORT_LABELS[level.sort] || SORT_LABELS.desc }}
      </button>
      <button
        type="button"
        class="dt-btn-quiet px-1.5 py-1 hover:bg-neg-50 hover:text-neg-700"
        :aria-label="`Hapus level ${getDimensionLabel(level.dim)}`"
        title="Hapus kolom ini"
        @click="tree.removeLevel(levelIndex)"
      >
        <AppIcon name="close" :size="13" :stroke-width="2" />
      </button>
    </div>

    <div class="flex flex-col gap-2">
      <NodeCard
        v-for="node in visibleNodes"
        :key="node.label"
        :class="node === pinnedNode && 'mt-2 before:absolute before:inset-x-6 before:-top-3 before:border-t before:border-dashed before:border-ink-300'"
        :node="node"
        :node-key="getNodeKey(levelIndex, node.label)"
        :level="data"
        :is-selected="level.selected === node.label"
        :is-dimmed="hasSelection && level.selected !== node.label"
        :measure="tree.measure"
        :compare="tree.compare"
        :share-mode="tree.shareMode"
        :grand-total="tree.grandTotals.value"
        :is-menu-open="openMenuKey === getNodeKey(levelIndex, node.label)"
        :unused-dims="unusedDims"
        :register-node="registerNode"
        @select="tree.toggleNodeSelection(levelIndex, node.label)"
        @toggle-menu="emit('toggle-menu', getNodeKey(levelIndex, node.label))"
        @close-menu="emit('close-menu')"
        @pick="(dimension) => pick(node.label, dimension)"
        @auto="(mode) => autoSplit(node.label, mode)"
        @hover="(isHovering) => emit('hover', getNodeKey(levelIndex, node.label), isHovering)"
      />

      <button
        v-if="showToggle"
        type="button"
        class="focus-ring w-full rounded-lg border border-dashed border-ink-300 bg-paper/60 py-2 text-[12px] text-ink-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
        :aria-expanded="isExpanded"
        @click="tree.toggleExpanded(levelIndex)"
      >
        {{ isExpanded ? 'Tampilkan lebih sedikit' : `Tampilkan ${hiddenCount} lainnya` }}
      </button>
    </div>
  </div>
</template>
