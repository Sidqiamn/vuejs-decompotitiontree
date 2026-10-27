import Papa from 'papaparse'
import {
  AUTO,
  COUNT_FIELD,
  CSV_DELIMITER,
  CSV_FILE,
  DATA_SOURCE,
  DATE_FIELD,
  DATE_FIELD_CANDIDATES,
  DATE_FORMAT,
  DETECTION_SAMPLE_SIZE,
  DIMENSIONS,
  NUMERIC_FIELDS,
} from '@/config/dataset'
import { getDimensionKey, toNumber } from './aggregate'
import { describeDateFormat, detectDateColumn, detectDateFormat, parseDate } from './dates'

const ROW_KEY_SEPARATOR = '\u0001'

export function aggregateRawRows(
  rawRows,
  { dateField, dateFormat = 'dmy', dimensions = DIMENSIONS, numericFields = NUMERIC_FIELDS } = {},
) {
  const groups = new Map()

  for (const rawRow of rawRows) {
    const date = dateField ? parseDate(rawRow[dateField], dateFormat) : null
    const dimensionValues = dimensions.map((dimension) => getDimensionKey(rawRow, dimension))
    const groupKey = [date || '', ...dimensionValues].join(ROW_KEY_SEPARATOR)

    let record = groups.get(groupKey)
    if (!record) {
      record = { __d: date }
      dimensions.forEach((dimension, index) => {
        record[dimension] = dimensionValues[index]
      })
      numericFields.forEach((field) => {
        record[field] = 0
      })
      groups.set(groupKey, record)
    }

    for (const field of numericFields) {
      record[field] += field === COUNT_FIELD ? 1 : toNumber(rawRow[field])
    }
  }

  return Array.from(groups.values())
}

export function parseCsvText(text, { delimiter = CSV_DELIMITER } = {}) {
  const parsed = Papa.parse(String(text).replace(/^﻿/, ''), {
    header: true,
    delimiter,
    skipEmptyLines: true,
  })
  const rows = parsed.data || []
  const headers = parsed.meta?.fields || Object.keys(rows[0] || {})
  return { rows, headers }
}

/** Deteksi kolom & format tanggal, lalu agregasi. */
export function prepareRows(rawRows, headers) {
  const sampleRows = rawRows.slice(0, DETECTION_SAMPLE_SIZE)
  const dateField = DATE_FIELD !== AUTO ? DATE_FIELD : detectDateColumn(sampleRows, headers, DATE_FIELD_CANDIDATES)
  const dateSamples = dateField ? sampleRows.map((row) => row[dateField]) : []
  const dateFormat = DATE_FORMAT !== AUTO ? DATE_FORMAT : detectDateFormat(dateSamples)

  const rows = aggregateRawRows(rawRows, { dateField, dateFormat })
  return {
    rows,
    meta: {
      dateField,
      dateFormat,
      dateFormatLabel: describeDateFormat(dateSamples, dateFormat),
      rawCount: rawRows.length,
      rowCount: rows.length,
      headers,
    },
  }
}

export async function loadFromCsv(fetchImpl = globalThis.fetch) {
  const url = `${import.meta.env.BASE_URL}${CSV_FILE}`
  const response = await fetchImpl(url)
  const contentType = response.headers?.get?.('content-type') || ''

  // Server dev Vite mengembalikan index.html (status 200) untuk berkas yang tidak ada.
  if (!response.ok || contentType.includes('text/html')) {
    throw new Error(`${CSV_FILE} tidak ditemukan di folder public/.`)
  }

  const { rows: rawRows, headers } = parseCsvText(await response.text())
  const result = prepareRows(rawRows, headers)

  if (import.meta.env.DEV) {
    if (result.meta.dateField) {
      console.info(
        `[DecompositionTree] kolom tanggal: "${result.meta.dateField}", format: ${result.meta.dateFormatLabel}`,
      )
    } else {
      console.warn('[DecompositionTree] kolom tanggal tidak terdeteksi. Isi DATE_FIELD di src/config/dataset.js.')
    }
  }

  return { rows: result.rows, meta: { ...result.meta, source: `public/${CSV_FILE}` } }
}

/**
 * Titik sambung ke Supabase. Kembalikan bentuk yang sama dengan loadFromCsv():
 * { rows: <hasil aggregateRawRows>, meta: { source, dateField, dateFormat, rawCount, rowCount } }
 */
export async function loadFromSupabase() {
  throw new Error('loadFromSupabase() belum dihubungkan. Isi dulu bagian ini di src/lib/dataLoader.js.')
}

export const loadDataset = () => (DATA_SOURCE === 'supabase' ? loadFromSupabase() : loadFromCsv())

/** Baca saringan dari URL, mis. ?Channel=Shopee,Tokopedia → { Channel: Set(['Shopee', 'Tokopedia']) }. */
export function readUrlFilters(search, dimensions = DIMENSIONS) {
  const params = new URLSearchParams(search || '')
  const filters = {}

  for (const dimension of dimensions) {
    const value = params.get(dimension)
    if (!value) continue
    const values = value
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
    if (values.length) filters[dimension] = new Set(values)
  }

  return filters
}
