/** Persistencia simple en localStorage, tolerante a fallos. */

export function guardar (clave, valor) {
  try {
    localStorage.setItem(clave, JSON.stringify(valor))
    return true
  } catch (e) {
    console.warn('[storage] no se pudo guardar:', e)
    return false
  }
}

export function cargar (clave) {
  try {
    const crudo = localStorage.getItem(clave)
    return crudo ? JSON.parse(crudo) : null
  } catch (e) {
    console.warn('[storage] no se pudo leer:', e)
    return null
  }
}

export function limpiar (clave) {
  try { localStorage.removeItem(clave) } catch {}
}
