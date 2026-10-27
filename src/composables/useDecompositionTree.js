import { computed, markRaw, reactive, ref, shallowRef, watch } from 'vue'
import {
  DIMENSIONS,
  INITIAL_RANGE_MONTHS,
  MEASURES,
  PERIOD_DIMENSIONS,
  SLICERS,
  SUGGESTED_DIMENSIONS,
  getDimensionLabel,
} from '@/config/dataset'
import {
  SORT_CYCLE,
  aggregateByDimension,
  applySelections,
  calculateTotals,
  createEmptySelections,
  filterByLevelPath,
  findExtremeSplit,
  getDimensionKey,
  sortNodes,
} from '@/lib/aggregate'
import { countDays, getDateBounds, getInitialRange, isCompleteRange, isInRange, shiftDays } from '@/lib/dates'
import { formatDate } from '@/lib/format'
import { computePreset, detectP2Mode, followRange } from '@/lib/presets'

const EMPTY_RANGE = Object.freeze({ from: '', to: '' })
const sameRange = (a, b) => a?.from === b?.from && a?.to === b?.to
const isReversed = (range) => !!range.from && !!range.to && range.from > range.to

/**
 * Semua state & perhitungan pohon dekomposisi.
 *
 * Aturan: state berupa array/objek (levels, expandedLevels, slicerSelections, p1, p2Custom)
 * selalu DIGANTI dengan objek baru, tidak di-mutate, supaya shallowRef memicu pembaruan.
 *
 * @param {import('vue').Ref<object[]>} rows  baris hasil aggregateRawRows (dengan kolom __d)
 * @returns objek reactive; ref di dalamnya otomatis ter-unwrap (tree.p1.from, bukan tree.p1.value.from)
 */
export function useDecompositionTree(rows, options = {}) {
  const {
    dimensions = DIMENSIONS,
    slicerDims = SLICERS,
    measures = MEASURES,
    suggestedDimensions = SUGGESTED_DIMENSIONS,
    periodDimensions = PERIOD_DIMENSIONS,
    initialRangeMonths = INITIAL_RANGE_MONTHS,
    compareByDefault = true,
    defaultP2Mode = 'prev',
  } = options

  // ---------------------------------------------------------------- state
  const measureKey = ref(measures[0].key)
  const measure = computed(() => measures.find((item) => item.key === measureKey.value) || measures[0])

  /** [{ dim, selected, sort }] — selected = label yang diklik di level itu (null = belum dipilih). */
  const levels = shallowRef([])
  /** { [indexLevel]: true } untuk kolom yang menampilkan semua kartu. */
  const expandedLevels = shallowRef({})
  /** 'parent' | 'total' — porsi kartu dihitung dari induk atau dari total. */
  const shareMode = ref('parent')

  const isComparing = ref(compareByDefault)
  const p1 = shallowRef({ ...EMPTY_RANGE })
  /** 'prev' | 'yoy' mengikuti P1 otomatis; 'custom' memakai p2Custom. */
  const p2Mode = ref(defaultP2Mode)
  const p2Custom = shallowRef({ ...EMPTY_RANGE })
  const lastPresetKey = ref(null)

  /** { dimensi: Set(nilai) } — Set kosong berarti tidak disaring. */
  const slicerSelections = shallowRef(createEmptySelections(slicerDims))

  // ---------------------------------------------------------------- periode
  const dataBounds = computed(() => getDateBounds(rows.value))
  const hasDates = computed(() => !!dataBounds.value.min)

  let hasInitializedRange = false
  watch(
    dataBounds,
    (bounds) => {
      if (hasInitializedRange || !bounds.max) return
      hasInitializedRange = true
      p1.value = getInitialRange(bounds, initialRangeMonths)
    },
    { immediate: true },
  )

  const p2 = computed((previous) => {
    const next =
      p2Mode.value === 'custom' ? p2Custom.value : followRange(p2Mode.value, p1.value) || EMPTY_RANGE
    return previous && sameRange(previous, next) ? previous : next
  })

  const anchorDate = computed(() => p1.value.from || p1.value.to || dataBounds.value.max || null)

  /** null kalau tidak sedang membandingkan atau tanggal belum valid. */
  const compare = computed((previous) => {
    if (!isComparing.value || !hasDates.value) return null
    const a = p1.value
    const b = p2.value
    if (!isCompleteRange(a) || !isCompleteRange(b)) return null
    if (previous && sameRange(previous.p1, a) && sameRange(previous.p2, b)) return previous
    return { p1: { from: a.from, to: a.to }, p2: { from: b.from, to: b.to } }
  })

  // ---------------------------------------------------------------- baris & agregasi
  const activeSlicerCount = computed(
    () => Object.values(slicerSelections.value).filter((selected) => selected.size > 0).length,
  )
  const hasActiveSlicer = computed(() => activeSlicerCount.value > 0)

  /** Baris setelah saringan & periode — dasar semua angka di layar. */
  const scopedRows = computed(() => {
    let result = applySelections(rows.value, slicerSelections.value)
    const range = compare.value
    if (range) {
      result = result.filter((row) => isInRange(row.__d, range.p1) || isInRange(row.__d, range.p2))
    } else if (hasDates.value && p1.value.from && p1.value.to) {
      const period = p1.value
      result = result.filter((row) => isInRange(row.__d, period))
    }
    return result
  })

  const grandTotals = computed(() => calculateTotals(scopedRows.value, measure.value.field, compare.value))

  /** Satu entri per kolom: { nodes, total, max }. Berhenti di level pertama yang belum dipilih. */
  const levelData = computed(() => {
    const result = []
    const field = measure.value.field
    let levelRows = scopedRows.value

    for (const level of levels.value) {
      const nodes = sortNodes(aggregateByDimension(levelRows, level.dim, field, compare.value), level.sort)
      let total = 0
      let max = 0
      for (const node of nodes) {
        total += node.value
        max = Math.max(max, Math.abs(node.value))
      }
      result.push({ nodes, total, max })

      if (level.selected == null) break
      levelRows = levelRows.filter((row) => getDimensionKey(row, level.dim) === level.selected)
    }

    return result
  })

  /** Baris pada node yang sedang diikuti (dipakai grafik & panel Data). */
  const focusedRows = computed(() => {
    const firstOpenLevel = levels.value.findIndex((level) => level.selected == null)
    const depth = firstOpenLevel === -1 ? levels.value.length : firstOpenLevel
    return filterByLevelPath(scopedRows.value, levels.value, depth)
  })

  const slicerOptions = computed(() => {
    const result = {}
    for (const dimension of slicerDims) {
      const values = new Set()
      for (const row of rows.value) values.add(getDimensionKey(row, dimension))
      result[dimension] = Array.from(values).sort((a, b) => a.localeCompare(b, 'id'))
    }
    return result
  })

  const trail = computed(() => levels.value.filter((level) => level.selected != null))
  const trailText = computed(() =>
    trail.value.length
      ? `Mengikuti ${trail.value.map((level) => `${getDimensionLabel(level.dim)} ${level.selected}`).join(' › ')}`
      : 'Seluruh baris terpilih',
  )

  const suggestions = computed(() => {
    const used = new Set(levels.value.map((level) => level.dim))
    const preferred = suggestedDimensions.filter((dim) => dimensions.includes(dim) && !used.has(dim))
    return preferred.length ? preferred : dimensions.filter((dim) => !used.has(dim)).slice(0, 4)
  })

  // ---------------------------------------------------------------- peringatan
  const p1Days = computed(() => countDays(p1.value.from, p1.value.to))
  const p2Days = computed(() => countDays(p2.value.from, p2.value.to))

  const hasLengthMismatch = computed(
    () => !!compare.value && p1Days.value > 0 && p2Days.value > 0 && p1Days.value !== p2Days.value,
  )

  const periodIssue = computed(() => {
    if (!hasDates.value) return null
    const a = p1.value
    const b = p2.value
    if (isReversed(a)) return 'Tanggal mulai P1 lebih akhir dari tanggal akhirnya. Tukar dulu supaya angkanya terhitung.'
    if (isComparing.value && isReversed(b)) return 'Tanggal mulai P2 lebih akhir dari tanggal akhirnya.'
    if (isComparing.value && (!a.from || !a.to || !b.from || !b.to)) {
      return 'Lengkapi kedua tanggal P1 dan P2 supaya perbandingan aktif.'
    }
    if (!a.from || !a.to) return 'Tanggal P1 belum lengkap, jadi semua baris dipakai.'
    return null
  })

  const dataRangeText = computed(() =>
    hasDates.value ? `${formatDate(dataBounds.value.min)} – ${formatDate(dataBounds.value.max)}` : '',
  )

  const outOfDataLabel = computed(() => {
    if (!hasDates.value) return null
    const { min, max } = dataBounds.value
    const isOutside = (range) => isCompleteRange(range) && (range.to < min || range.from > max)
    if (isOutside(p1.value)) return 'Periode P1'
    if (isComparing.value && isOutside(p2.value)) return 'Periode pembanding P2'
    return null
  })

  // ---------------------------------------------------------------- aksi: periode
  const setMeasure = (key) => {
    measureKey.value = key
  }

  function setP1(range) {
    p1.value = { from: range.from || '', to: range.to || '' }
    lastPresetKey.value = null
  }

  function setP2(range) {
    const next = { from: range.from || '', to: range.to || '' }
    p2Custom.value = next
    p2Mode.value = detectP2Mode(p1.value, next)
    lastPresetKey.value = null
  }

  function setP2Mode(mode) {
    if (mode === 'custom') p2Custom.value = { ...p2.value }
    p2Mode.value = mode
    lastPresetKey.value = null
  }

  const setComparing = (value) => {
    isComparing.value = !!value
  }

  function applyPreset(presetKey) {
    const ranges = computePreset(presetKey, anchorDate.value, p1.value)
    if (!ranges) return
    const [nextP1, nextP2] = ranges
    const mode = detectP2Mode(nextP1, nextP2)
    p1.value = { ...nextP1 }
    if (mode === 'custom') p2Custom.value = { ...nextP2 }
    p2Mode.value = mode
    lastPresetKey.value = presetKey
    isComparing.value = true
  }

  function matchP2LengthToP1() {
    const current = p2.value
    if (p1Days.value <= 0 || !current.to) return
    setP2({ from: shiftDays(current.to, -(p1Days.value - 1)), to: current.to })
  }

  // ---------------------------------------------------------------- aksi: pohon
  function pruneExpanded(fromIndex) {
    const entries = Object.entries(expandedLevels.value).filter(([index]) => Number(index) < fromIndex)
    if (entries.length !== Object.keys(expandedLevels.value).length) {
      expandedLevels.value = Object.fromEntries(entries)
    }
  }

  function getRowsForNode(levelIndex, label) {
    const pathRows = filterByLevelPath(scopedRows.value, levels.value, Math.max(0, levelIndex))
    if (levelIndex < 0) return pathRows
    return pathRows.filter((row) => getDimensionKey(row, levels.value[levelIndex].dim) === label)
  }

  /** Dimensi yang belum dipakai sampai level ini (levelIndex −1 = akar). */
  function getUnusedDimensions(levelIndex) {
    const used = new Set(levels.value.slice(0, levelIndex + 1).map((level) => level.dim))
    return dimensions.filter((dimension) => !used.has(dimension))
  }

  function appendLevelAfter(levelIndex, label, newLevel) {
    const next = levels.value.slice(0, levelIndex + 1)
    if (levelIndex >= 0) next[levelIndex] = { ...next[levelIndex], selected: label }
    levels.value = [...next, newLevel]
    pruneExpanded(levelIndex + 1)
  }

  /** Urai node (levelIndex −1 & label null = akar) berdasarkan dimensi tertentu. */
  function splitNode(levelIndex, label, dimension) {
    appendLevelAfter(levelIndex, label, { dim: dimension, selected: null, sort: 'desc' })
  }

  /**
   * Cari otomatis dimensi dengan anggota tertinggi/terendah, lalu langsung pilih anggota itu.
   * Saat membandingkan periode, dimensi turunan tanggal (PERIOD_DIMENSIONS) dilewati.
   */
  function autoSplitNode(levelIndex, label, mode) {
    const candidates = getUnusedDimensions(levelIndex).filter(
      (dimension) => !compare.value || !periodDimensions.includes(dimension),
    )
    const best = findExtremeSplit(getRowsForNode(levelIndex, label), candidates, measure.value.field, compare.value, mode)
    if (!best) return false
    appendLevelAfter(levelIndex, label, { dim: best.dimension, selected: best.label, sort: 'desc' })
    return true
  }

  function toggleNodeSelection(levelIndex, label) {
    const next = levels.value.slice(0, levelIndex + 1)
    const isAlreadySelected = next[levelIndex].selected === label
    next[levelIndex] = { ...next[levelIndex], selected: isAlreadySelected ? null : label }
    levels.value = next
    pruneExpanded(levelIndex + 1)
  }

  function changeLevelDimension(levelIndex, dimension) {
    const next = levels.value.slice(0, levelIndex + 1)
    next[levelIndex] = { dim: dimension, selected: null, sort: next[levelIndex].sort }
    levels.value = next
    pruneExpanded(levelIndex)
  }

  function cycleLevelSort(levelIndex) {
    const next = levels.value.slice()
    next[levelIndex] = { ...next[levelIndex], sort: SORT_CYCLE[next[levelIndex].sort] || 'desc' }
    levels.value = next
  }

  function removeLevel(levelIndex) {
    levels.value = levels.value.slice(0, levelIndex)
    pruneExpanded(levelIndex)
  }

  /** Klik remah jalur: kembali ke node di level ini (−1 = akar), pilihan di bawahnya dilepas. */
  function focusTrail(levelIndex) {
    const childIndex = levelIndex + 1
    if (childIndex >= levels.value.length) return
    const next = levels.value.slice(0, childIndex + 1)
    next[childIndex] = { ...next[childIndex], selected: null }
    levels.value = next
    pruneExpanded(childIndex + 1)
  }

  function toggleExpanded(levelIndex) {
    const next = { ...expandedLevels.value }
    if (next[levelIndex]) delete next[levelIndex]
    else next[levelIndex] = true
    expandedLevels.value = next
  }

  function resetTree() {
    levels.value = []
    expandedLevels.value = {}
  }

  const toggleShareMode = () => {
    shareMode.value = shareMode.value === 'parent' ? 'total' : 'parent'
  }

  // ---------------------------------------------------------------- aksi: saringan
  function setSlicer(dimension, selected) {
    slicerSelections.value = { ...slicerSelections.value, [dimension]: new Set(selected) }
  }

  function clearSlicers() {
    slicerSelections.value = createEmptySelections(slicerDims)
  }

  return reactive({
    dimensions: markRaw(dimensions),
    slicerDims: markRaw(slicerDims),
    measures: markRaw(measures),

    measureKey,
    measure,
    levels,
    expandedLevels,
    shareMode,
    isComparing,
    p1,
    p2,
    p2Mode,
    lastPresetKey,
    slicerSelections,

    dataBounds,
    hasDates,
    anchorDate,
    compare,
    scopedRows,
    grandTotals,
    levelData,
    focusedRows,
    slicerOptions,
    trail,
    trailText,
    suggestions,
    activeSlicerCount,
    hasActiveSlicer,
    p1Days,
    p2Days,
    hasLengthMismatch,
    periodIssue,
    dataRangeText,
    outOfDataLabel,

    setMeasure,
    setP1,
    setP2,
    setP2Mode,
    setComparing,
    applyPreset,
    matchP2LengthToP1,
    getUnusedDimensions,
    splitNode,
    autoSplitNode,
    toggleNodeSelection,
    changeLevelDimension,
    cycleLevelSort,
    removeLevel,
    focusTrail,
    toggleExpanded,
    resetTree,
    toggleShareMode,
    setSlicer,
    clearSlicers,
  })
}
