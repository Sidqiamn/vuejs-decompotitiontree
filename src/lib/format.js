import { isoToDate } from './dates'

/** Semua format angka & tanggal memakai locale Indonesia. Jangan panggil toLocaleString langsung di komponen. */
const LOCALE = 'id-ID'

const DATE_FORMATTER = new Intl.DateTimeFormat(LOCALE, { day: 'numeric', month: 'short', year: 'numeric' })
const COMPACT_NUMBER_FORMAT = new Intl.NumberFormat(LOCALE, { notation: 'compact', maximumFractionDigits: 1 })
const FULL_NUMBER_FORMAT = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })
const PERCENT_FORMAT = new Intl.NumberFormat(LOCALE, { style: 'percent', maximumFractionDigits: 1 })

export const EM_DASH = '–'
const MINUS = '−'

export const formatDate = (iso) => (iso ? DATE_FORMATTER.format(isoToDate(iso)) : EM_DASH)

export const formatDateRange = (range) =>
  range && range.from && range.to ? `${formatDate(range.from)} – ${formatDate(range.to)}` : EM_DASH

/**
 * Format nilai metrik.
 * @param {number} value
 * @param {'currency'|'int'} format
 * @param {{compact?: boolean, signed?: boolean}} options
 *   compact: "Rp 8,7 M" alih-alih "Rp 8.733.311.663"
 *   signed:  tampilkan "+" untuk nilai positif (dipakai untuk selisih)
 */
export function formatValue(value, format, { compact = false, signed = false } = {}) {
  if (value == null || Number.isNaN(value)) return EM_DASH
  const formatter = compact ? COMPACT_NUMBER_FORMAT : FULL_NUMBER_FORMAT
  const magnitude = formatter.format(Math.abs(value))
  const sign = value < 0 ? MINUS : signed && value > 0 ? '+' : ''
  return format === 'currency' ? `${sign}Rp ${magnitude}` : `${sign}${magnitude}`
}


export const formatPercent = (ratio) =>
  ratio == null || Number.isNaN(ratio) || !Number.isFinite(ratio)
    ? EM_DASH
    : `${ratio < 0 ? MINUS : ''}${PERCENT_FORMAT.format(Math.abs(ratio))}`


export const formatSignedPercent = (ratio) =>
  ratio == null || Number.isNaN(ratio) || !Number.isFinite(ratio)
    ? EM_DASH
    : `${ratio < 0 ? MINUS : '+'}${PERCENT_FORMAT.format(Math.abs(ratio))}`

export const formatCount = (count) => FULL_NUMBER_FORMAT.format(count || 0)

export const truncateText = (text, maxLength) => {
  const value = String(text)
  return value.length > maxLength ? `${value.slice(0, Math.max(1, maxLength - 1))}…` : value
}
