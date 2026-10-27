import { describe, expect, it } from 'vitest'
import { getNiceScale } from './scale'
import { buildTimeSeries, chooseAutoGranularity, countBuckets, resolveGranularity, toCumulative } from './timeseries'

describe('granularitas', () => {
  it('memilih otomatis dari panjang rentang', () => {
    expect(chooseAutoGranularity(60)).toBe('day')
    expect(chooseAutoGranularity(181)).toBe('week')
    expect(chooseAutoGranularity(1000)).toBe('month')
  })

  it('rentang harian yang terlalu panjang dinaikkan jadi mingguan', () => {
    expect(resolveGranularity('day', 2000)).toBe('week')
    expect(resolveGranularity('month', 30)).toBe('month')
  })

  it('menghitung jumlah ember', () => {
    const range = { from: '2026-02-01', to: '2026-07-31' }
    expect(countBuckets(range, 'day')).toBe(181)
    expect(countBuckets(range, 'week')).toBe(26)
    expect(countBuckets(range, 'month')).toBe(6)
  })
})

describe('buildTimeSeries', () => {
  it('menjumlahkan P1 dan P2 ke ember yang sejajar', () => {
    const rows = [
      { __d: '2026-02-01', Revenue: 10 },
      { __d: '2026-03-15', Revenue: 5 },
      { __d: '2025-08-04', Revenue: 7 },
    ]
    const series = buildTimeSeries(
      rows,
      'Revenue',
      'month',
      { from: '2026-02-01', to: '2026-07-31' },
      { from: '2025-08-04', to: '2026-01-31' },
    )
    expect(series.p1Series).toEqual([10, 5, 0, 0, 0, 0])
    expect(series.p2Series).toEqual([7, 0, 0, 0, 0, 0])
    expect(series.labels[0]).toBe('2026-02-01')
  })

  it('null kalau rentang belum lengkap', () => {
    expect(buildTimeSeries([], 'Revenue', 'day', { from: '', to: '' }, null)).toBeNull()
  })

  it('deret kumulatif', () => {
    expect(toCumulative([1, 2, 3])).toEqual([1, 3, 6])
  })
})

describe('getNiceScale', () => {
  it('membulatkan sumbu ke kelipatan rapi', () => {
    expect(getNiceScale(0, 87)).toEqual({ min: 0, max: 100, ticks: [0, 25, 50, 75, 100] })
    expect(getNiceScale(0, 8_733_311_663).ticks).toEqual([0, 2_500_000_000, 5_000_000_000, 7_500_000_000, 10_000_000_000])
    expect(getNiceScale(-30, 70).ticks).toContain(0)
  })
})
