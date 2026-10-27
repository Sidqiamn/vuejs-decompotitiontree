import { isInRange } from './dates'

/**
 * Agregasi baris untuk pohon dekomposisi.
 *
 * Bentuk "compare": { p1: {from, to}, p2: {from, to} } atau null.
 * - Tanpa compare: node = { label, value }.
 * - Dengan compare: node = { label, p1, p2, value: p1 − p2, pct: (p1 − p2) / p2 }.
 */

export const EMPTY_LABEL = '(kosong)'

export const toNumber = (value) => Number(value) || 0

export const calculateChangeRatio = (p1Value, p2Value) => (p2Value ? (p1Value - p2Value) / p2Value : null)

const byValueDescending = (a, b) => b.value - a.value

/** Nilai dimensi yang sudah dirapikan: kosong / "NULL" jadi "(kosong)". */
export function getDimensionKey(row, dimension) {
  const value = row[dimension]
  if (value === null || value === undefined || value === '') return EMPTY_LABEL
  const text = String(value).trim()
  return text === '' || text.toUpperCase() === 'NULL' ? EMPTY_LABEL : text
}

export function aggregateByDimension(rows, dimension, field, compare) {
  const groups = new Map()

  if (!compare) {
    for (const row of rows) {
      const key = getDimensionKey(row, dimension)
      groups.set(key, (groups.get(key) || 0) + toNumber(row[field]))
    }
    return Array.from(groups, ([label, value]) => ({ label, value })).sort(byValueDescending)
  }

  for (const row of rows) {
    const key = getDimensionKey(row, dimension)
    let group = groups.get(key)
    if (!group) {
      group = { label: key, p1: 0, p2: 0 }
      groups.set(key, group)
    }
    const value = toNumber(row[field])
    if (isInRange(row.__d, compare.p1)) group.p1 += value
    if (isInRange(row.__d, compare.p2)) group.p2 += value
  }

  return Array.from(groups.values())
    .map((group) => ({
      ...group,
      value: group.p1 - group.p2,
      pct: calculateChangeRatio(group.p1, group.p2),
    }))
    .sort(byValueDescending)
}

export function calculateTotals(rows, field, compare) {
  if (!compare) {
    let total = 0
    for (const row of rows) total += toNumber(row[field])
    return { value: total, p1: total, p2: null, pct: null }
  }

  let p1 = 0
  let p2 = 0
  for (const row of rows) {
    const value = toNumber(row[field])
    if (isInRange(row.__d, compare.p1)) p1 += value
    if (isInRange(row.__d, compare.p2)) p2 += value
  }
  return { value: p1 - p2, p1, p2, pct: calculateChangeRatio(p1, p2) }
}

export const SORT_CYCLE = { desc: 'asc', asc: 'name', name: 'desc' }
export const SORT_LABELS = { desc: 'Nilai ↓', asc: 'Nilai ↑', name: 'A–Z' }

export function sortNodes(nodes, sortMode) {
  const sorted = nodes.slice()
  if (sortMode === 'asc') sorted.sort((a, b) => a.value - b.value)
  else if (sortMode === 'name') sorted.sort((a, b) => a.label.localeCompare(b.label, 'id'))
  else sorted.sort(byValueDescending)
  return sorted
}

/** Ambil `limit` node terbesar (menurut nilai absolut), sisanya digabung jadi "N lainnya". */
export function keepTopNodes(nodes, limit) {
  if (nodes.length <= limit + 1) return nodes.slice().sort(byValueDescending)

  const byMagnitude = nodes.slice().sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
  const rest = byMagnitude.slice(limit)
  const others = { label: `${rest.length} lainnya`, value: 0, p1: 0, p2: 0, pct: null, isOthers: true }

  for (const node of rest) {
    others.value += node.value
    others.p1 += node.p1 || 0
    others.p2 += node.p2 || 0
  }
  others.pct = calculateChangeRatio(others.p1, others.p2)

  return [...byMagnitude.slice(0, limit), others].sort(byValueDescending)
}

/** Saring baris mengikuti pilihan di level 0..depth-1. */
export function filterByLevelPath(rows, levels, depth) {
  let result = rows
  for (let i = 0; i < depth; i++) {
    const { dim, selected } = levels[i]
    result = result.filter((row) => getDimensionKey(row, dim) === selected)
  }
  return result
}

/**
 * Dimensi + anggota dengan nilai tertinggi ('high') atau terendah ('low').
 * Dimensi yang hanya punya satu anggota tidak benar-benar mengurai apa pun (nilainya selalu = induk),
 * jadi hanya dipakai kalau tidak ada dimensi lain.
 */
export function findExtremeSplit(rows, candidateDimensions, field, compare, mode) {
  let best = null
  let fallback = null
  const beats = (entry, current) =>
    !current || (mode === 'high' ? entry.value > current.value : entry.value < current.value)

  for (const dimension of candidateDimensions) {
    const nodes = aggregateByDimension(rows, dimension, field, compare)
    if (!nodes.length) continue

    const candidate = mode === 'high' ? nodes[0] : nodes[nodes.length - 1]
    const entry = { dimension, label: candidate.label, value: candidate.value }
    if (nodes.length < 2) {
      if (beats(entry, fallback)) fallback = entry
    } else if (beats(entry, best)) {
      best = entry
    }
  }

  return best || fallback
}

export const createEmptySelections = (dimensions) =>
  Object.fromEntries(dimensions.map((dimension) => [dimension, new Set()]))

/** Saring baris dengan pilihan slicer / URL: { dimensi: Set(nilai) }. Set kosong = semua. */
export function applySelections(rows, selections) {
  const active = Object.entries(selections).filter(([, selected]) => selected && selected.size > 0)
  if (!active.length) return rows
  return rows.filter((row) => active.every(([dimension, selected]) => selected.has(getDimensionKey(row, dimension))))
}

export const ROOT_NODE_KEY = 'root'
export const getNodeKey = (levelIndex, label) => `${levelIndex}:${label}`
