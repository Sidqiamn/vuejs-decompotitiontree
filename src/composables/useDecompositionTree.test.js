import { describe, expect, it } from 'vitest'
import { shallowRef } from 'vue'
import { useDecompositionTree } from './useDecompositionTree'

// P1 awal = 1 Feb – 31 Jul 2026, P2 (periode sebelumnya) = 4 Agu 2025 – 31 Jan 2026.
const ROWS = [
  { __d: '2026-07-31', Channel: 'Shopee', Area: 'Jawa', Year: '2026', Revenue: 100, __n: 1 },
  { __d: '2026-06-15', Channel: 'Tokopedia', Area: 'Sumatra', Year: '2026', Revenue: 50, __n: 1 },
  { __d: '2026-01-20', Channel: 'Shopee', Area: 'Jawa', Year: '2026', Revenue: 40, __n: 1 },
  { __d: '2025-12-05', Channel: 'Tokopedia', Area: 'Jawa', Year: '2025', Revenue: 30, __n: 1 },
  { __d: '2025-09-10', Channel: 'Shopee', Area: 'Sumatra', Year: '2025', Revenue: 20, __n: 1 },
  { __d: '2024-03-01', Channel: 'Shopee', Area: 'Jawa', Year: '2024', Revenue: 999, __n: 1 },
]

function createTree() {
  return useDecompositionTree(shallowRef(ROWS), {
    dimensions: ['Channel', 'Area', 'Year'],
    slicerDims: ['Channel'],
    measures: [{ key: 'Revenue', label: 'Pendapatan', field: 'Revenue', format: 'currency' }],
    suggestedDimensions: ['Area'],
    periodDimensions: ['Year'],
  })
}

describe('periode', () => {
  it('mulai dengan 6 bulan terakhir dibanding periode sebelumnya', () => {
    const tree = createTree()
    expect(tree.p1).toEqual({ from: '2026-02-01', to: '2026-07-31' })
    expect(tree.p2).toEqual({ from: '2025-08-04', to: '2026-01-31' })
    expect(tree.scopedRows).toHaveLength(5)
    expect(tree.grandTotals).toMatchObject({ p1: 150, p2: 90, value: 60 })
  })

  it('P2 mengikuti P1 selama mode bukan custom', () => {
    const tree = createTree()
    tree.setP1({ from: '2026-07-01', to: '2026-07-31' })
    expect(tree.p2).toEqual({ from: '2026-05-31', to: '2026-06-30' })

    tree.setP2Mode('yoy')
    expect(tree.p2).toEqual({ from: '2025-07-01', to: '2025-07-31' })

    tree.setP2({ from: '2025-01-01', to: '2025-01-31' })
    expect(tree.p2Mode).toBe('custom')
    tree.setP1({ from: '2026-06-01', to: '2026-06-30' })
    expect(tree.p2).toEqual({ from: '2025-01-01', to: '2025-01-31' })
  })

  it('preset bulan penuh memberi peringatan panjang berbeda yang bisa disamakan', () => {
    const tree = createTree()
    tree.applyPreset('month_prev')
    expect(tree.p1).toEqual({ from: '2026-02-01', to: '2026-02-28' })
    expect(tree.p2).toEqual({ from: '2026-01-01', to: '2026-01-31' })
    expect(tree.lastPresetKey).toBe('month_prev')
    expect(tree.hasLengthMismatch).toBe(true)

    tree.matchP2LengthToP1()
    expect(tree.p2).toEqual({ from: '2026-01-04', to: '2026-01-31' })
    expect(tree.p2Mode).toBe('prev')
    expect(tree.hasLengthMismatch).toBe(false)
  })

  it('menandai tanggal terbalik dan mematikan perbandingan', () => {
    const tree = createTree()
    tree.setP1({ from: '2026-07-31', to: '2026-02-01' })
    expect(tree.compare).toBeNull()
    expect(tree.periodIssue).toMatch(/P1 lebih akhir/)
  })
})

describe('pohon', () => {
  it('mengurai, memilih, dan melepas pilihan', () => {
    const tree = createTree()
    tree.splitNode(-1, null, 'Channel')
    expect(tree.levelData[0].nodes.map((node) => [node.label, node.value])).toEqual([
      ['Shopee', 40],
      ['Tokopedia', 20],
    ])

    tree.toggleNodeSelection(0, 'Shopee')
    tree.splitNode(0, 'Shopee', 'Area')
    expect(tree.levels).toHaveLength(2)
    expect(tree.trailText).toBe('Mengikuti Kanal Shopee')
    expect(tree.focusedRows).toHaveLength(3)

    tree.toggleNodeSelection(0, 'Shopee')
    expect(tree.levels).toHaveLength(1)
    expect(tree.levels[0].selected).toBeNull()
  })

  it('remah jalur kembali ke level yang diklik', () => {
    const tree = createTree()
    tree.splitNode(-1, null, 'Channel')
    tree.splitNode(0, 'Shopee', 'Area')
    tree.toggleNodeSelection(1, 'Jawa')
    expect(tree.trail).toHaveLength(2)

    tree.focusTrail(-1)
    expect(tree.levels).toHaveLength(1)
    expect(tree.trail).toHaveLength(0)
  })

  it('"Cari otomatis" melewati dimensi tanggal saat membandingkan periode', () => {
    const tree = createTree()
    tree.autoSplitNode(-1, null, 'high')
    expect(tree.levels[0]).toMatchObject({ dim: 'Channel', selected: 'Shopee' })

    tree.resetTree()
    tree.autoSplitNode(-1, null, 'low')
    expect(tree.levels[0]).toMatchObject({ dim: 'Channel', selected: 'Tokopedia' })

    // Tanpa perbandingan, dimensi tanggal boleh dipilih (di sini 2026 = 190, nilai tertinggi).
    tree.resetTree()
    tree.setComparing(false)
    tree.setP1({ from: '2025-09-01', to: '2026-07-31' })
    tree.autoSplitNode(-1, null, 'high')
    expect(tree.levels[0]).toMatchObject({ dim: 'Year', selected: '2026' })
  })

  it('saran dimensi tidak menawarkan yang sudah dipakai', () => {
    const tree = createTree()
    expect(tree.suggestions).toEqual(['Area'])
    tree.splitNode(-1, null, 'Area')
    expect(tree.suggestions).toEqual(['Channel', 'Year'])
  })
})

describe('saringan', () => {
  it('menyaring baris dan bisa dibersihkan', () => {
    const tree = createTree()
    tree.setSlicer('Channel', new Set(['Shopee']))
    expect(tree.activeSlicerCount).toBe(1)
    expect(tree.scopedRows).toHaveLength(3)
    expect(tree.grandTotals).toMatchObject({ p1: 100, p2: 60, value: 40 })

    tree.clearSlicers()
    expect(tree.hasActiveSlicer).toBe(false)
    expect(tree.scopedRows).toHaveLength(5)
  })
})
