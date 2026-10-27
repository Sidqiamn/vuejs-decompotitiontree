/**
 * Utilitas tanggal. Semua tanggal di aplikasi disimpan sebagai string ISO "YYYY-MM-DD"
 * supaya bisa dibandingkan langsung dengan operator < dan >.
 */

export const MS_PER_DAY = 86_400_000

const ISO_DATE_PATTERN = /^(\d{4})-(\d{1,2})-(\d{1,2})/
const NUMERIC_DATE_PATTERN = /^(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{4})/
const DATE_SEPARATOR_PATTERN = /[/\-.]/

const padTwoDigits = (value) => String(value).padStart(2, '0')

export const toIsoDate = (year, month, day) => `${year}-${padTwoDigits(month)}-${padTwoDigits(day)}`
export const isoToDate = (iso) => new Date(`${iso}T00:00:00`)
export const dateToIso = (date) => toIsoDate(date.getFullYear(), date.getMonth() + 1, date.getDate())

export const splitIsoDate = (iso) => ({
  year: +iso.slice(0, 4),
  month: +iso.slice(5, 7),
  day: +iso.slice(8, 10),
})

/** Ubah nilai mentah (ISO, dd/mm/yyyy, mm/dd/yyyy, atau teks yang dikenali Date) jadi ISO. */
export function parseDate(rawValue, format = 'dmy') {
  if (rawValue == null) return null
  const text = String(rawValue).trim()
  if (!text) return null

  const isoMatch = text.match(ISO_DATE_PATTERN)
  if (isoMatch) return toIsoDate(isoMatch[1], +isoMatch[2], +isoMatch[3])

  const numericMatch = text.match(NUMERIC_DATE_PATTERN)
  if (numericMatch) {
    const first = +numericMatch[1]
    const second = +numericMatch[2]
    const year = numericMatch[3]
    return format === 'mdy' ? toIsoDate(year, first, second) : toIsoDate(year, second, first)
  }

  const timestamp = Date.parse(text)
  if (Number.isNaN(timestamp)) return null
  return dateToIso(new Date(timestamp))
}

/** Tebak urutan hari/bulan dari contoh nilai: angka > 12 pasti hari. */
export function detectDateFormat(samples) {
  let dayFirstVotes = 0
  let monthFirstVotes = 0

  for (const sample of samples) {
    const match = String(sample ?? '').match(NUMERIC_DATE_PATTERN)
    if (!match) continue
    if (+match[1] > 12) dayFirstVotes++
    else if (+match[2] > 12) monthFirstVotes++
  }

  return monthFirstVotes > dayFirstVotes ? 'mdy' : 'dmy'
}

/** Label format tanggal untuk ditampilkan, mis. "ISO (YYYY-MM-DD)" atau "DD/MM/YYYY". */
export function describeDateFormat(samples, format) {
  const filled = samples.filter((sample) => sample != null && String(sample).trim() !== '')
  if (!filled.length) return '–'
  const isoCount = filled.filter((sample) => ISO_DATE_PATTERN.test(String(sample).trim())).length
  if (isoCount / filled.length > 0.5) return 'ISO (YYYY-MM-DD)'
  return format === 'mdy' ? 'MM/DD/YYYY' : 'DD/MM/YYYY'
}

/** Cari kolom tanggal: pertama dari daftar nama yang dikenal, lalu dari isi kolom. */
export function detectDateColumn(sampleRows, headers, candidates = []) {
  const knownHeader = candidates.find((candidate) => headers.includes(candidate))
  if (knownHeader) return knownHeader

  for (const header of headers) {
    let checkedCount = 0
    let parsedCount = 0

    for (const row of sampleRows) {
      const value = row[header]
      if (value == null || value === '') continue
      if (!DATE_SEPARATOR_PATTERN.test(String(value))) continue
      checkedCount++
      if (parseDate(value)) parsedCount++
    }

    if (checkedCount > 10 && parsedCount / checkedCount > 0.8) return header
  }

  return null
}

export function shiftDays(iso, days) {
  const date = isoToDate(iso)
  date.setDate(date.getDate() + days)
  return dateToIso(date)
}

/** Tanggal 1 pada bulan tertentu. Bulan boleh di luar 1–12 (mis. 0 = Desember tahun lalu). */
export function getMonthStart(year, month) {
  const date = new Date(Date.UTC(year, month - 1, 1))
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)
}

/** Tanggal terakhir pada bulan tertentu. Bulan boleh di luar 1–12. */
export function getMonthEnd(year, month) {
  const date = new Date(Date.UTC(year, month, 0))
  return toIsoDate(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate())
}

export const getQuarter = (month) => Math.floor((month - 1) / 3) + 1

export const getMonthRange = (year, month) => ({
  from: getMonthStart(year, month),
  to: getMonthEnd(year, month),
})

export function getQuarterRange(year, quarter) {
  const targetYear = year + Math.floor((quarter - 1) / 4)
  const normalizedQuarter = ((((quarter - 1) % 4) + 4) % 4) + 1
  const firstMonth = (normalizedQuarter - 1) * 3 + 1
  return { from: getMonthStart(targetYear, firstMonth), to: getMonthEnd(targetYear, firstMonth + 2) }
}

export const getYearRange = (year) => ({ from: toIsoDate(year, 1, 1), to: toIsoDate(year, 12, 31) })

/** Geser tahun tanpa meluap: 29 Feb 2024 − 1 tahun = 28 Feb 2023. */
export function shiftYearsSafe(iso, years) {
  const { year, month, day } = splitIsoDate(iso)
  const lastDay = +getMonthEnd(year + years, month).slice(8, 10)
  return toIsoDate(year + years, month, Math.min(day, lastDay))
}

/** Jumlah hari inklusif. 0 kalau salah satu tanggal kosong; negatif kalau terbalik. */
export function countDays(from, to) {
  if (!from || !to) return 0
  return Math.round((isoToDate(to) - isoToDate(from)) / MS_PER_DAY) + 1
}

export const isInRange = (date, range) =>
  !!date && !!range && !!range.from && !!range.to && date >= range.from && date <= range.to

export const isCompleteRange = (range) => !!range && !!range.from && !!range.to && range.from <= range.to

export const rangesEqual = (a, b) => !!a && !!b && a.from === b.from && a.to === b.to

/** Tanggal paling awal & paling akhir di kolom __d. */
export function getDateBounds(rows) {
  let min = null
  let max = null
  for (const row of rows) {
    const date = row.__d
    if (!date) continue
    if (!min || date < min) min = date
    if (!max || date > max) max = date
  }
  return { min, max }
}

/**
 * Rentang awal P1: dari tanggal 1 pada bulan (bulan terakhir − months) sampai tanggal terakhir data.
 * Contoh: data berakhir 31 Jul 2026, months = 5 → 1 Feb 2026 – 31 Jul 2026.
 */
export function getInitialRange(bounds, months) {
  if (!bounds?.max) return { from: '', to: '' }
  const { year, month } = splitIsoDate(bounds.max)
  const from = getMonthStart(year, month - months)
  return { from: bounds.min && from < bounds.min ? bounds.min : from, to: bounds.max }
}
