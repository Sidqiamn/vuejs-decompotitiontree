import { describe, expect, it } from 'vitest'
import {
  EMPTY_LABEL,
  aggregateByDimension,
  applySelections,
  calculateTotals,
  filterByLevelPath,
  findExtremeSplit,
  getDimensionKey,
  keepTopNodes,
  sortNodes,
} from './aggregate'

const compare = {
  p1: { from: '2026-02-01', to: '2026-02-28' },
  p2: { from: '2026-01-01', to: '2026-01-31' },
}

const rows = [
  { __d: '2026-02-03', Channel: 'Shopee', Area: 'Jawa', Revenue: 100 },
  { __d: '2026-02-10', Channel: 'Tokopedia', Area: 'Jawa', Revenue: 40 },
  { __d: '2026-02-11', Channel: 'Shopee', Area: 'Sumatra', Revenue: 60 },
  { __d: '2026-01-05', Channel: 'Shopee', Area: 'Jawa', Revenue: 50 },
  { __d: '2026-01-20', Channel: 'Tokopedia', Area: 'Sumatra', Revenue: 80 },
]

describe('getDimensionKey', () => {
  it('merapikan nilai kosong', () => {
    expect(getDimensionKey({ a: '' }, 'a')).toBe(EMPTY_LABEL)
    expect(getDimensionKey({ a: 'NULL' }, 'a')).toBe(EMPTY_LABEL)
    expect(getDimensionKey({ a: '  Jakarta ' }, 'a')).toBe('Jakarta')
  })
})

describe('aggregateByDimension', () => {
  it('tanpa pembanding: jumlah per anggota, urut menurun', () => {
    expect(aggregateByDimension(rows, 'Channel', 'Revenue', null)).toEqual([
      { label: 'Shopee', value: 210 },
      { label: 'Tokopedia', value: 120 },
    ])
  })

  it('dengan pembanding: P1, P2, selisih, dan persentase', () => {
    const [shopee, tokopedia] = aggregateByDimension(rows, 'Channel', 'Revenue', compare)
    expect(shopee).toEqual({ label: 'Shopee', p1: 160, p2: 50, value: 110, pct: 2.2 })
    expect(tokopedia).toEqual({ label: 'Tokopedia', p1: 40, p2: 80, value: -40, pct: -0.5 })
  })
})

describe('calculateTotals', () => {
  it('menjumlahkan semua baris', () => {
    expect(calculateTotals(rows, 'Revenue', null)).toEqual({ value: 330, p1: 330, p2: null, pct: null })
  })

  it('menghitung selisih P1 − P2', () => {
    expect(calculateTotals(rows, 'Revenue', compare)).toEqual({ value: 70, p1: 200, p2: 130, pct: 70 / 130 })
  })
})

describe('urutan & pemangkasan', () => {
  const nodes = [
    { label: 'B', value: 5 },
    { label: 'A', value: -2 },
    { label: 'C', value: 9 },
  ]

  it('mengurutkan menurun, menaik, dan A–Z', () => {
    expect(sortNodes(nodes, 'desc').map((n) => n.label)).toEqual(['C', 'B', 'A'])
    expect(sortNodes(nodes, 'asc').map((n) => n.label)).toEqual(['A', 'B', 'C'])
    expect(sortNodes(nodes, 'name').map((n) => n.label)).toEqual(['A', 'B', 'C'])
  })

  it('menggabungkan sisa node jadi "N lainnya"', () => {
    const many = Array.from({ length: 6 }, (_, i) => ({ label: `n${i}`, value: 10 - i, p1: 10 - i, p2: 0 }))
    const result = keepTopNodes(many, 3)
    expect(result).toHaveLength(4)
    expect(result.find((n) => n.isOthers)).toMatchObject({ label: '3 lainnya', value: 7 + 6 + 5 })
  })
})

describe('jalur & saringan', () => {
  it('menyaring mengikuti pilihan tiap level', () => {
    const levels = [
      { dim: 'Channel', selected: 'Shopee' },
      { dim: 'Area', selected: 'Jawa' },
    ]
    expect(filterByLevelPath(rows, levels, 1)).toHaveLength(3)
    expect(filterByLevelPath(rows, levels, 2)).toHaveLength(2)
  })

  it('menerapkan pilihan slicer; Set kosong berarti semua', () => {
    expect(applySelections(rows, { Channel: new Set(['Tokopedia']), Area: new Set() })).toHaveLength(2)
    expect(applySelections(rows, { Channel: new Set() })).toBe(rows)
  })

  it('mencari dimensi dengan nilai tertinggi dan terendah', () => {
    expect(findExtremeSplit(rows, ['Channel', 'Area'], 'Revenue', compare, 'high')).toEqual({
      dimension: 'Channel',
      label: 'Shopee',
      value: 110,
    })
    expect(findExtremeSplit(rows, ['Channel', 'Area'], 'Revenue', compare, 'low')).toEqual({
      dimension: 'Channel',
      label: 'Tokopedia',
      value: -40,
    })
  })

  it('melewati dimensi satu anggota kecuali tidak ada pilihan lain', () => {
    const simple = [
      { Channel: 'Shopee', Pay: 'Tunai', Revenue: 30 },
      { Channel: 'Tokopedia', Pay: 'Tunai', Revenue: 20 },
    ]
    expect(findExtremeSplit(simple, ['Pay', 'Channel'], 'Revenue', null, 'high')).toMatchObject({
      dimension: 'Channel',
      label: 'Shopee',
    })
    expect(findExtremeSplit(simple, ['Pay'], 'Revenue', null, 'high')).toMatchObject({ dimension: 'Pay', value: 50 })
  })
})
