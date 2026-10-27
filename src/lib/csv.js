
export function toCsv(rows, columns, delimiter = ';') {
  const escape = (value) => {
    const text = value == null ? '' : String(value)
    return text.includes(delimiter) || /["\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }

  const header = columns.map((column) => escape(column.label)).join(delimiter)
  const body = rows.map((row) => columns.map((column) => escape(column.value(row))).join(delimiter))
  return `﻿${[header, ...body].join('\r\n')}`
}

export function downloadText(filename, text, type = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const slugify = (text) =>
  String(text)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
