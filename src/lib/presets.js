import {
  countDays,
  getMonthRange,
  getMonthStart,
  getQuarter,
  getQuarterRange,
  getYearRange,
  isCompleteRange,
  rangesEqual,
  shiftDays,
  shiftYearsSafe,
  splitIsoDate,
  toIsoDate,
} from './dates'

export const PRESETS = [
  { group: 'Bulan', key: 'month_prev', label: 'Bulan penuh vs bulan sebelumnya' },
  { group: 'Bulan', key: 'month_yoy', label: 'Bulan penuh vs bulan sama tahun lalu' },
  { group: 'Bulan', key: 'mtd_yoy', label: 'MTD (awal bulan s/d acuan) vs tahun lalu' },

  { group: 'Kuartal', key: 'quarter_prev', label: 'Kuartal penuh vs kuartal sebelumnya' },
  { group: 'Kuartal', key: 'quarter_yoy', label: 'Kuartal penuh vs kuartal sama tahun lalu' },

  { group: 'Tahun', key: 'ytd_yoy', label: 'YTD (1 Jan s/d acuan) vs tahun lalu' },
  { group: 'Tahun', key: 'year_prev', label: 'Tahun penuh vs tahun sebelumnya' },

  { group: 'Bergulir', key: 'roll30', label: '30 hari s/d acuan vs 30 hari sebelumnya' },
  { group: 'Bergulir', key: 'roll90', label: '90 hari s/d acuan vs 90 hari sebelumnya' },

  { group: 'Pertahankan P1', key: 'keep_prev', label: 'P2 = periode sebelumnya, panjang sama' },
  { group: 'Pertahankan P1', key: 'keep_yoy', label: 'P2 = periode sama tahun lalu' },
]

export const PRESET_LABELS = Object.fromEntries(PRESETS.map((preset) => [preset.key, preset.label]))
export const PRESET_GROUPS = Array.from(new Set(PRESETS.map((preset) => preset.group)))

function getRollingRanges(anchorDate, days) {
  const p1 = { from: shiftDays(anchorDate, -(days - 1)), to: anchorDate }
  const p2End = shiftDays(p1.from, -1)
  return [p1, { from: shiftDays(p2End, -(days - 1)), to: p2End }]
}


export function computePreset(presetKey, anchorDate, currentRange) {
  if (presetKey === 'keep_prev') {
    const days = countDays(currentRange?.from, currentRange?.to)
    if (days <= 0) return null
    const p2End = shiftDays(currentRange.from, -1)
    return [{ ...currentRange }, { from: shiftDays(p2End, -(days - 1)), to: p2End }]
  }

  if (presetKey === 'keep_yoy') {
    if (!isCompleteRange(currentRange)) return null
    return [
      { ...currentRange },
      { from: shiftYearsSafe(currentRange.from, -1), to: shiftYearsSafe(currentRange.to, -1) },
    ]
  }

  if (!anchorDate) return null
  const { year, month } = splitIsoDate(anchorDate)
  const quarter = getQuarter(month)

  switch (presetKey) {
    case 'month_prev':
      return [getMonthRange(year, month), getMonthRange(year, month - 1)]
    case 'month_yoy':
      return [getMonthRange(year, month), getMonthRange(year - 1, month)]
    case 'mtd_yoy':
      return [
        { from: getMonthStart(year, month), to: anchorDate },
        { from: getMonthStart(year - 1, month), to: shiftYearsSafe(anchorDate, -1) },
      ]
    case 'quarter_prev':
      return [getQuarterRange(year, quarter), getQuarterRange(year, quarter - 1)]
    case 'quarter_yoy':
      return [getQuarterRange(year, quarter), getQuarterRange(year - 1, quarter)]
    case 'ytd_yoy':
      return [
        { from: toIsoDate(year, 1, 1), to: anchorDate },
        { from: toIsoDate(year - 1, 1, 1), to: shiftYearsSafe(anchorDate, -1) },
      ]
    case 'year_prev':
      return [getYearRange(year), getYearRange(year - 1)]
    case 'roll30':
      return getRollingRanges(anchorDate, 30)
    case 'roll90':
      return getRollingRanges(anchorDate, 90)
    default:
      return null
  }
}

/**
 * Mode P2 cepat. Selama mode bukan 'custom', P2 otomatis mengikuti P1.
 * 'custom' berarti P2 diisi manual.
 */
export const P2_MODES = [
  { key: 'yoy', label: 'Tahun lalu', preset: 'keep_yoy' },
  { key: 'prev', label: 'Periode sebelumnya', preset: 'keep_prev' },
]

/** P2 yang mengikuti P1 untuk mode 'yoy' / 'prev'. null kalau P1 belum lengkap. */
export function followRange(mode, p1) {
  const option = P2_MODES.find((item) => item.key === mode)
  if (!option || !isCompleteRange(p1)) return null
  const ranges = computePreset(option.preset, null, p1)
  return ranges ? ranges[1] : null
}

export function detectP2Mode(p1, p2) {
  const match = P2_MODES.find((item) => rangesEqual(followRange(item.key, p1), p2))
  return match ? match.key : 'custom'
}
