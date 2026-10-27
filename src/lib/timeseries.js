import { AUTO } from '@/config/dataset'
import { toNumber } from './aggregate'
import { MS_PER_DAY, countDays, getMonthStart, isInRange, isoToDate, shiftDays, splitIsoDate } from './dates'
import { formatDate } from './format'

export const CHART_KINDS = [
  { key: 'line', label: 'Tren garis' },
  { key: 'cumulative', label: 'Tren kumulatif' },
  { key: 'bar', label: 'Batang per periode' },
  { key: 'contribution', label: 'Kontribusi per dimensi' },
  { key: 'bridge', label: 'Jembatan selisih', compareOnly: true },
]

export const TIME_CHART_KINDS = ['line', 'cumulative', 'bar']
export const DIMENSION_CHART_KINDS = ['contribution', 'bridge']

export const GRANULARITY_OPTIONS = [
  { key: AUTO, label: 'Otomatis' },
  { key: 'day', label: 'Harian' },
  { key: 'week', label: 'Mingguan' },
  { key: 'month', label: 'Bulanan' },
]

export const GRANULARITY_LABELS = { day: 'harian', week: 'mingguan', month: 'bulanan' }

/** Rentang harian di atas ini otomatis dinaikkan jadi mingguan supaya grafik tetap terbaca. */
export const MAX_DAILY_SPAN_DAYS = 1500

const DAY_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short' })
const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'short', year: '2-digit' })
const LONG_MONTH_FORMATTER = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })

/** ≤ 3 bulan harian, ≤ 1,5 tahun mingguan, selebihnya bulanan. */
export function chooseAutoGranularity(spanDays) {
  if (spanDays <= 92) return 'day'
  if (spanDays <= 548) return 'week'
  return 'month'
}

export function resolveGranularity(choice, spanDays) {
  let granularity = choice === AUTO ? chooseAutoGranularity(spanDays) : choice
  if (granularity === 'day' && spanDays > MAX_DAILY_SPAN_DAYS) granularity = 'week'
  return granularity
}

export function countBuckets(range, granularity) {
  if (!range || !range.from || !range.to) return 0

  if (granularity === 'month') {
    const start = splitIsoDate(range.from)
    const end = splitIsoDate(range.to)
    return (end.year - start.year) * 12 + (end.month - start.month) + 1
  }

  const days = countDays(range.from, range.to)
  return granularity === 'week' ? Math.ceil(days / 7) : days
}

export function getBucketIndex(iso, range, granularity) {
  if (granularity === 'month') {
    const start = splitIsoDate(range.from)
    const current = splitIsoDate(iso)
    return (current.year - start.year) * 12 + (current.month - start.month)
  }

  const daysFromStart = Math.round((isoToDate(iso) - isoToDate(range.from)) / MS_PER_DAY)
  return granularity === 'week' ? Math.floor(daysFromStart / 7) : daysFromStart
}

export function getBucketStart(range, granularity, index) {
  if (granularity === 'month') {
    const start = splitIsoDate(range.from)
    const monthOffset = start.month - 1 + index
    const year = start.year + Math.floor(monthOffset / 12)
    const month = (((monthOffset % 12) + 12) % 12) + 1
    return getMonthStart(year, month)
  }
  return shiftDays(range.from, granularity === 'week' ? index * 7 : index)
}

export function formatBucketLabel(iso, granularity) {
  if (!iso) return ''
  const formatter = granularity === 'month' ? MONTH_LABEL_FORMATTER : DAY_LABEL_FORMATTER
  return formatter.format(isoToDate(iso))
}

export function formatBucketTooltip(range, granularity, index) {
  if (!range) return ''
  const from = getBucketStart(range, granularity, index)
  if (granularity === 'day') return formatDate(from)
  if (granularity === 'month') return LONG_MONTH_FORMATTER.format(isoToDate(from))
  const to = shiftDays(from, 6)
  return `${DAY_LABEL_FORMATTER.format(isoToDate(from))} – ${formatDate(to)}`
}

export function buildTimeSeries(rows, field, granularity, p1Range, p2Range) {
  if (!p1Range || !p1Range.from || !p1Range.to) return null

  const bucketTotal = Math.max(countBuckets(p1Range, granularity), p2Range ? countBuckets(p2Range, granularity) : 0)
  if (bucketTotal <= 0) return null

  const p1Series = new Array(bucketTotal).fill(0)
  const p2Series = p2Range ? new Array(bucketTotal).fill(0) : null

  const addToBucket = (series, date, range, value) => {
    const index = getBucketIndex(date, range, granularity)
    if (index >= 0 && index < bucketTotal) series[index] += value
  }

  for (const row of rows) {
    const date = row.__d
    if (!date) continue
    const value = toNumber(row[field])
    if (isInRange(date, p1Range)) addToBucket(p1Series, date, p1Range, value)
    if (p2Series && isInRange(date, p2Range)) addToBucket(p2Series, date, p2Range, value)
  }

  const labels = Array.from({ length: bucketTotal }, (_, index) => getBucketStart(p1Range, granularity, index))

  return { p1Series, p2Series, labels, granularity, p1Range, p2Range }
}

export function toCumulative(series) {
  if (!series) return null
  let runningTotal = 0
  return series.map((value) => (runningTotal += value))
}
