import { describe, expect, it } from 'vitest'
import { computePreset, detectP2Mode, followRange } from './presets'

const P1 = { from: '2026-02-01', to: '2026-07-31' }

describe('computePreset', () => {
  it('keep_prev: periode sebelumnya dengan panjang sama', () => {
    expect(computePreset('keep_prev', null, P1)).toEqual([P1, { from: '2025-08-04', to: '2026-01-31' }])
  })

  it('keep_yoy: periode sama tahun lalu', () => {
    expect(computePreset('keep_yoy', null, P1)[1]).toEqual({ from: '2025-02-01', to: '2025-07-31' })
  })

  it('preset bulan & kuartal dihitung dari tanggal acuan', () => {
    expect(computePreset('month_prev', '2026-07-15')).toEqual([
      { from: '2026-07-01', to: '2026-07-31' },
      { from: '2026-06-01', to: '2026-06-30' },
    ])
    expect(computePreset('quarter_prev', '2026-02-10')[1]).toEqual({ from: '2025-10-01', to: '2025-12-31' })
    expect(computePreset('ytd_yoy', '2026-07-31')).toEqual([
      { from: '2026-01-01', to: '2026-07-31' },
      { from: '2025-01-01', to: '2025-07-31' },
    ])
  })

  it('preset bergulir', () => {
    expect(computePreset('roll30', '2026-07-31')).toEqual([
      { from: '2026-07-02', to: '2026-07-31' },
      { from: '2026-06-02', to: '2026-07-01' },
    ])
  })

  it('null kalau input belum lengkap', () => {
    expect(computePreset('keep_prev', null, { from: '', to: '' })).toBeNull()
    expect(computePreset('month_prev', null)).toBeNull()
  })
})

describe('mode P2', () => {
  it('P2 mengikuti P1', () => {
    expect(followRange('prev', P1)).toEqual({ from: '2025-08-04', to: '2026-01-31' })
    expect(followRange('yoy', P1)).toEqual({ from: '2025-02-01', to: '2025-07-31' })
    expect(followRange('custom', P1)).toBeNull()
    expect(followRange('prev', { from: '2026-07-31', to: '2026-02-01' })).toBeNull()
  })

  it('mengenali mode dari pasangan P1/P2', () => {
    expect(detectP2Mode(P1, { from: '2025-08-04', to: '2026-01-31' })).toBe('prev')
    expect(detectP2Mode(P1, { from: '2025-02-01', to: '2025-07-31' })).toBe('yoy')
    expect(detectP2Mode(P1, { from: '2025-01-01', to: '2025-06-30' })).toBe('custom')
  })
})
