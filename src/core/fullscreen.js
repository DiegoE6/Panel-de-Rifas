/**
 * Pantalla completa real. El panel de rifa vive ahí;
 * al salir aparece el panel de admin.
 */

export function soportado () {
  return Boolean(document.documentElement.requestFullscreen)
}

export function activa () {
  return Boolean(document.fullscreenElement)
}

export async function entrar (elemento = document.documentElement) {
  try {
    if (!activa()) await elemento.requestFullscreen({ navigationUI: 'hide' })
    return true
  } catch (e) {
    // Algunos navegadores lo rechazan si no viene de un gesto del usuario
    console.warn('[fullscreen] no se pudo entrar:', e.message)
    return false
  }
}

export async function salir () {
  try {
    if (activa()) await document.exitFullscreen()
  } catch {}
}

/** Avisa cada vez que cambia el estado. Devuelve la función para desuscribir. */
export function alCambiar (fn) {
  const manejar = () => fn(activa())
  document.addEventListener('fullscreenchange', manejar)
  return () => document.removeEventListener('fullscreenchange', manejar)
}
