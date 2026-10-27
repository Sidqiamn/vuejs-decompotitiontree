import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { applySelections, calculateTotals } from './aggregate'
import { aggregateRawRows, parseCsvText, prepareRows, readUrlFilters } from './dataLoader'
import { getDateBounds, getInitialRange, isInRange } from './dates'
import { followRange } from './presets'

describe('parseCsvText & aggregateRawRows', () => {
  const csv = '﻿sale_date;Channel;Revenue\n2026-01-07 00:00:00.000;Shopee;100\n2026-01-07 00:00:00.000;Shopee;50\n2026-01-08 00:00:00.000;;20\n'

  it('membuang BOM dan memakai pemisah ";"', () => {
    const { rows, headers } = parseCsvText(csv)
    expect(headers).toEqual(['sale_date', 'Channel', 'Revenue'])
    expect(rows).toHaveLength(3)
  })

  it('menggabungkan baris dengan tanggal & dimensi sama', () => {
    const { rows } = parseCsvText(csv)
    const result = aggregateRawRows(rows, {
      dateField: 'sale_date',
      dimensions: ['Channel'],
      numericFields: ['Revenue', '__n'],
    })
    expect(result).toEqual([
      { __d: '2026-01-07', Channel: 'Shopee', Revenue: 150, __n: 2 },
      { __d: '2026-01-08', Channel: '(kosong)', Revenue: 20, __n: 1 },
    ])
  })
})

describe('readUrlFilters', () => {
  it('membaca daftar nilai dipisah koma', () => {
    const filters = readUrlFilters('?Channel=Shopee,%20Tokopedia&lain=abaikan', ['Channel'])
    expect(Object.keys(filters)).toEqual(['Channel'])
    expect([...filters.Channel]).toEqual(['Shopee', 'Tokopedia'])
  })
})

describe('angka acuan dari dummy_dataset.csv', () => {

  const csvPath = fileURLToPath(new URL('../../public/dummy_dataset.csv', import.meta.url))
  const { rows: rawRows, headers } = parseCsvText(readFileSync(csvPath, 'utf8'))
  const { rows, meta } = prepareRows(rawRows, headers)

  it('mendeteksi kolom tanggal dan rentang data', () => {
    expect(meta.dateField).toBe('sale_date')
    expect(getDateBounds(rows)).toEqual({ min: '2023-01-19', max: '2026-07-31' })
  })

  it('rentang awal dan pembanding sesuai desain', () => {
    const p1 = getInitialRange(getDateBounds(rows), 5)
    expect(p1).toEqual({ from: '2026-02-01', to: '2026-07-31' })
    expect(followRange('prev', p1)).toEqual({ from: '2025-08-04', to: '2026-01-31' })
  })

  it('selisih pendapatan +Rp 3.083.033.369 (▲54,6%) dari 5.086 baris', () => {
    const compare = {
      p1: { from: '2026-02-01', to: '2026-07-31' },
      p2: { from: '2025-08-04', to: '2026-01-31' },
    }
    const scoped = applySelections(rows, {}).filter(
      (row) => isInRange(row.__d, compare.p1) || isInRange(row.__d, compare.p2),
    )
    const totals = calculateTotals(scoped, 'Revenue', compare)

    expect(scoped).toHaveLength(5086)
    expect(totals.p1).toBe(8733311663)
    expect(totals.p2).toBe(5650278294)
    expect(totals.value).toBe(3083033369)
    expect(totals.pct).toBeCloseTo(0.5456, 4)
  })
})
