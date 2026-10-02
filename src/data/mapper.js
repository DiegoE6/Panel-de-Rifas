/**
 * Empata los encabezados del archivo con los campos del esquema
 * y convierte las filas crudas en registros normalizados.
 */

/** "Núm. Credencial" -> "numcredencial" */
export function normalizarClave (texto) {
  return String(texto ?? '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
}

/** @returns {{ campo: string|null }} columna real del archivo por cada campo */
export function mapearColumnas (headers, esquema) {
  const porClave = new Map(headers.map(h => [normalizarClave(h), h]))
  const mapeo = {}
  for (const campo of Object.keys(esquema)) {
    mapeo[campo] = porClave.get(normalizarClave(campo)) ?? null
  }
  return mapeo
}

/** Campos requeridos que no encontraron columna. */
export function faltantes (mapeo, esquema) {
  return Object.entries(esquema)
    .filter(([campo, def]) => def.requerido && !mapeo[campo])
    .map(([, def]) => def.etiqueta)
}

const texto = v => String(v ?? '').trim()

/** Filas de regalos -> [{ id, numregalo, nombre, _raw }] */
export function normalizarRegalos (filas, mapeo) {
  return filas
    .map((fila, i) => ({
      _fila: i + 2,
      _raw: fila,
      numregalo: texto(mapeo.numregalo ? fila[mapeo.numregalo] : '') || String(i + 1),
      nombre: texto(mapeo.nombreregalo ? fila[mapeo.nombreregalo] : '')
    }))
    .filter(r => r.nombre !== '')
    .map(r => ({ ...r, id: r.numregalo }))
}

/** Filas de asistencia -> [{ id, numcredencial, nombre, appaterno, apmaterno, nombreCompleto, _raw }] */
export function normalizarAsistentes (filas, mapeo) {
  return filas
    .map((fila, i) => {
      const nombre    = texto(mapeo.nombre    ? fila[mapeo.nombre]    : '')
      const appaterno = texto(mapeo.appaterno ? fila[mapeo.appaterno] : '')
      const apmaterno = texto(mapeo.apmaterno ? fila[mapeo.apmaterno] : '')
      const numcredencial = texto(mapeo.numcredencial ? fila[mapeo.numcredencial] : '') || `S/C-${i + 1}`

      return {
        _fila: i + 2,
        _raw: fila,
        numcredencial,
        nombre,
        appaterno,
        apmaterno,
        nombreCompleto: [nombre, appaterno, apmaterno].filter(Boolean).join(' '),
        id: numcredencial
      }
    })
    .filter(a => a.nombre !== '')
}
