/**
 * Generacion aleatoria.
 * - Por defecto usa crypto.getRandomValues (no predecible, sin sesgo).
 * - Con semilla usa mulberry32: el sorteo se vuelve reproducible y auditable
 *   (se puede volver a correr y demostrar que dio el mismo resultado).
 */

let generador = null

/** Configura el modo. semilla = null -> crypto; semilla = string -> reproducible. */
export function configurarRng (semilla = null) {
  generador = semilla ? mulberry32(hashSemilla(String(semilla))) : null
}

/** Entero en [0, max) sin sesgo de modulo. */
export function enteroAleatorio (max) {
  if (max <= 0) throw new RangeError('max debe ser > 0')
  if (generador) return Math.floor(generador() * max)

  const limite = Math.floor(0xFFFFFFFF / max) * max
  const buffer = new Uint32Array(1)
  let valor
  do {
    crypto.getRandomValues(buffer)
    valor = buffer[0]
  } while (valor >= limite)          // rechazo: elimina el sesgo del modulo
  return valor % max
}

/** Elemento aleatorio de un arreglo. */
export function elegirUno (arreglo) {
  if (!arreglo.length) return null
  return arreglo[enteroAleatorio(arreglo.length)]
}

/** Fisher-Yates, devuelve una copia barajada. */
export function barajar (arreglo) {
  const copia = [...arreglo]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = enteroAleatorio(i + 1)
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

// --- internos ---
function mulberry32 (a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hashSemilla (str) {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}
