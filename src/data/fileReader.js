/**
 * Lectura de archivos. SheetJS maneja xlsx, xls y csv con la misma API,
 * asi que el panel acepta cualquiera de los tres sin ramificar.
 */
import * as XLSX from 'xlsx'

export const EXTENSIONES_VALIDAS = ['.xlsx', '.xls', '.csv']

export function extensionValida (nombreArchivo) {
  return EXTENSIONES_VALIDAS.some(ext => nombreArchivo.toLowerCase().endsWith(ext))
}

/**
 * @returns {Promise<{ nombre: string, headers: string[], filas: object[] }>}
 */
export async function leerArchivo (file) {
  if (!extensionValida(file.name)) {
    throw new Error(`Formato no soportado. Usa ${EXTENSIONES_VALIDAS.join(', ')}`)
  }

  const buffer = await file.arrayBuffer()
  const libro = XLSX.read(buffer, { type: 'array', cellDates: true, raw: false })
  const hoja = libro.Sheets[libro.SheetNames[0]]
  if (!hoja) throw new Error('El archivo no tiene hojas legibles.')

  // defval: '' evita que falten llaves cuando una celda viene vacia
  const filas = XLSX.utils.sheet_to_json(hoja, { defval: '', raw: false })
  if (!filas.length) throw new Error('El archivo no tiene filas de datos.')

  const headers = Object.keys(filas[0]).filter(h => String(h).trim() !== '')
  return { nombre: file.name, headers, filas, hojas: libro.SheetNames }
}
