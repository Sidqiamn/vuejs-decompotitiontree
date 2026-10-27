import { inject, provide } from 'vue'

const TREE_KEY = Symbol('decomposition-tree')

export function provideTree(tree) {
  provide(TREE_KEY, tree)
}

/** Ambil state pohon di komponen turunan (PeriodBar, SlicerBar, TreeCanvas, dst.). */
export function useTree() {
  const tree = inject(TREE_KEY, null)
  if (!tree) throw new Error('useTree() hanya bisa dipakai di dalam <DecompositionTree>.')
  return tree
}
