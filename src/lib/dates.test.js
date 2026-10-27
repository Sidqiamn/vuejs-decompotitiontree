import { describe, expect, it } from 'vitest'
import {
  countDays,
  detectDateColumn,
  detectDateFormat,
  getDateBounds,
  getInitialRange,
  getMonthEnd,
  getMonthStart,
  getQuarterRange,
  isCompleteRange,
  isInRange,
  parseDate,
  shiftDays,
  shiftYearsSafe,
} from './dates'

describe('parseDate', () => {
  it('membaca ISO dengan jam', () => {
    expect(parseDate('2026-01-07 00:00:00.000')).toBe('2026-01-07')
  })

  it('membaca dd/mm/yyyy dan mm/dd/yyyy', () => {
    expect(parseDate('07/01/2026', 'dmy')).toBe('2026-01-07')
    expect(parseDate('07/01/2026', 'mdy')).toBe('2026-07-01')
  })

  it('mengembalikan null untuk nilai kosong atau tidak valid', () => {
    expect(parseDate('')).toBeNull()
    expect(parseDate(null)).toBeNull()
    expect(parseDate('bukan tanggal')).toBeNull()
  })
})

describe('deteksi tanggal', () => {
  it('menebak urutan hari/bulan', () => {
    expect(detectDateFormat(['25/01/2026', '03/02/2026'])).toBe('dmy')
    expect(detectDateFormat(['01/25/2026', '02/03/2026'])).toBe('mdy')
  })

  it('memakai nama kolom yang dikenal lebih dulu', () => {
    expect(detectDateColumn([], ['id', 'sale_date'], ['Date', 'sale_date'])).toBe('sale_date')
  })

  it('menebak kolom dari isinya', () => {
    const rows = Array.from({ length: 20 }, (_, i) => ({ id: String(i), when: `2026-01-${String(i + 1).padStart(2, '0')}` }))
    expect(detectDateColumn(rows, ['id', 'when'], [])).toBe('when')
  })
})

describe('aritmetika tanggal', () => {
  it('menghitung hari inklusif', () => {
    expect(countDays('2026-02-01', '2026-07-31')).toBe(181)
    expect(countDays('2026-02-01', '')).toBe(0)
  })

  it('menggeser hari melewati batas bulan', () => {
    expect(shiftDays('2026-01-31', -180)).toBe('2025-08-04')
  })

  it('menangani bulan di luar 1–12', () => {
    expect(getMonthStart(2026, 0)).toBe('2025-12-01')
    expect(getMonthEnd(2024, 2)).toBe('2024-02-29')
    expect(getQuarterRange(2026, 0)).toEqual({ from: '2025-10-01', to: '2025-12-31' })
  })

  it('menggeser tahun tanpa meluap di 29 Februari', () => {
    expect(shiftYearsSafe('2024-02-29', -1)).toBe('2023-02-28')
  })

  it('memeriksa rentang', () => {
    const range = { from: '2026-02-01', to: '2026-07-31' }
    expect(isInRange('2026-02-01', range)).toBe(true)
    expect(isInRange('2026-08-01', range)).toBe(false)
    expect(isCompleteRange({ from: '2026-03-01', to: '2026-02-01' })).toBe(false)
  })
})

describe('rentang awal', () => {
  it('mulai dari tanggal 1, lima bulan sebelum bulan terakhir (tidak meluap di tanggal 31)', () => {
    expect(getInitialRange({ min: '2023-01-19', max: '2026-07-31' }, 5)).toEqual({
      from: '2026-02-01',
      to: '2026-07-31',
    })
  })

  it('tidak keluar dari batas awal data', () => {
    expect(getInitialRange({ min: '2026-05-10', max: '2026-07-31' }, 5)).toEqual({
      from: '2026-05-10',
      to: '2026-07-31',
    })
  })

  it('mencari batas data dari kolom __d', () => {
    expect(getDateBounds([{ __d: '2026-03-01' }, { __d: null }, { __d: '2025-01-02' }])).toEqual({
      min: '2025-01-02',
      max: '2026-03-01',
    })
  })
})
