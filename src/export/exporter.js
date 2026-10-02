/** Genera y descarga el archivo de ganadores. */
import * as XLSX from 'xlsx'
import { construirFilas } from './columns.js'

export function exportarXlsx (ganadores, columnas, base = 'ganadores-rifa') {
  const filas = construirFilas(ganadores, columnas)
  const hoja = XLSX.utils.json_to_sheet(filas)

  hoja['!cols'] = columnas.map(c => ({
    wch: Math.min(40, Math.max(c.etiqueta.length + 2, ...filas.map(f => String(f[c.etiqueta] ?? '').length + 2)))
  }))

  const libro = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(libro, hoja, 'Ganadores')
  XLSX.writeFile(libro, `${base}-${marca()}.xlsx`)
}

export function exportarCsv (ganadores, columnas, base = 'ganadores-rifa') {
  const hoja = XLSX.utils.json_to_sheet(construirFilas(ganadores, columnas))
  const csv = XLSX.utils.sheet_to_csv(hoja)
  // BOM para que Excel en Windows respete los acentos
  descargar(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' }), `${base}-${marca()}.csv`)
}

function descargar (blob, nombre) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = nombre
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

function marca () {
  const d = new Date()
  const p = n => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`
}
