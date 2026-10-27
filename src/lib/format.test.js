import { describe, expect, it } from 'vitest'
import { formatCount, formatDate, formatDateRange, formatPercent, formatSignedPercent, formatValue, truncateText } from './format'


const plain = (text) => text.replace(/ | /g, ' ')

describe('formatValue', () => {
  it('rupiah penuh dan ringkas', () => {
    expect(plain(formatValue(8733311663, 'currency'))).toBe('Rp 8.733.311.663')
    expect(plain(formatValue(8733311663, 'currency', { compact: true }))).toBe('Rp 8,7 M')
  })

  it('tanda + untuk selisih positif, − untuk negatif', () => {
    expect(plain(formatValue(3083033369, 'currency', { signed: true }))).toBe('+Rp 3.083.033.369')
    expect(plain(formatValue(-1234567, 'currency', { compact: true, signed: true }))).toBe('−Rp 1,2 jt')
    expect(plain(formatValue(0, 'int', { signed: true }))).toBe('0')
  })

  it('tanda pisah untuk nilai kosong', () => {
    expect(formatValue(null, 'int')).toBe('–')
  })
})

describe('persen & hitungan', () => {
  it('format persen Indonesia', () => {
    expect(formatPercent(0.5456)).toBe('54,6%')
    expect(formatPercent(-0.25)).toBe('−25%')
    expect(formatSignedPercent(0.5456)).toBe('+54,6%')
    expect(formatPercent(null)).toBe('–')
  })

  it('format jumlah baris', () => {
    expect(formatCount(5086)).toBe('5.086')
  })
})

describe('tanggal', () => {
  it('format pendek Indonesia', () => {
    expect(formatDate('2026-02-01')).toBe('1 Feb 2026')
    expect(formatDate('2025-08-04')).toBe('4 Agu 2025')
    expect(formatDateRange({ from: '2026-02-01', to: '2026-07-31' })).toBe('1 Feb 2026 – 31 Jul 2026')
  })
})

describe('truncateText', () => {
  it('memotong dengan elipsis', () => {
    expect(truncateText('SUMATERA BAGIAN TENGAH', 10)).toBe('SUMATERA …')
    expect(truncateText('Jawa', 10)).toBe('Jawa')
  })
})
