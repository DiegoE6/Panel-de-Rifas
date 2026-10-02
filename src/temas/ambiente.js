/**
 * Monta y desmonta la capa ambiental del tema.
 *
 * tsParticles se carga bajo demanda con import() dinámico: si el usuario no
 * elige tema, el motor nunca entra al arranque. Vite lo parte en su propio
 * chunk, así que la carga inicial del panel no lo paga.
 */
import { TEMAS } from './temas.js'

const ID_LIENZO = 'ambiente-rifa'

let contenedor = null      // instancia de tsParticles
let cargando = null        // promesa del motor, para no cargarlo dos veces

/** Carga el motor una sola vez por sesión. */
function motor () {
  cargando ??= (async () => {
    const [{ tsParticles }, { loadSlim }, { loadWobbleUpdater }] = await Promise.all([
      import('@tsparticles/engine'),
      import('@tsparticles/slim'),
      import('@tsparticles/updater-wobble')   // no viene en slim
    ])
    await loadSlim(tsParticles)
    await loadWobbleUpdater(tsParticles)
    return tsParticles
  })()
  return cargando
}

/**
 * Aplica el tema a un elemento: el acento como variables CSS locales y,
 * si lo tiene, la capa de partículas.
 * @param {HTMLElement} raiz el contenedor de la rifa
 * @param {string} clave clave del tema
 */
export async function aplicarTema (raiz, clave) {
  const tema = TEMAS[clave] ?? TEMAS.ninguno

  // El acento sustituye al oro solo dentro de este elemento
  if (tema.acento) {
    raiz.style.setProperty('--oro', tema.acento.base)
    raiz.style.setProperty('--oro-soft', tema.acento.suave)
  } else {
    raiz.style.removeProperty('--oro')
    raiz.style.removeProperty('--oro-soft')
  }

  await limpiarParticulas()
  if (!tema.particulas) return

  // Movimiento reducido: el acento sí, las partículas no
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return

  const lienzo = document.createElement('div')
  lienzo.id = ID_LIENZO
  lienzo.className = 'ambiente'
  lienzo.setAttribute('aria-hidden', 'true')
  raiz.prepend(lienzo)

  try {
    const tsParticles = await motor()
    // La vista pudo cambiar mientras cargaba el motor
    if (!document.getElementById(ID_LIENZO)) return
    contenedor = await tsParticles.load({ id: ID_LIENZO, options: tema.particulas })
  } catch (e) {
    console.warn('[ambiente] no se pudo montar el tema:', e)
    lienzo.remove()
  }
}

export async function limpiarParticulas () {
  try { contenedor?.destroy() } catch {}
  contenedor = null
  document.getElementById(ID_LIENZO)?.remove()
}

/** Quita acento y partículas. */
export async function quitarTema (raiz) {
  raiz?.style.removeProperty('--oro')
  raiz?.style.removeProperty('--oro-soft')
  await limpiarParticulas()
}
