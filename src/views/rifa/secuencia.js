/**
 * Los segundos previos al revelado.
 *
 * Una sola idea sostenida: el escudo en grande arriba y, debajo, primero la
 * cuenta regresiva y luego la barra de generación. Cae en el nivel
 * "raro / celebración" del gate de frecuencia, así que aquí vive el
 * presupuesto de deleite — gastado en un momento, no repartido en efectos.
 */
import { marca } from '../marca.js'

export const SEGUNDOS_CUENTA = 10
export const MS_CARGA = 2400

/**
 * Cuenta regresiva con el escudo en grande.
 * @param {{sinMarca?: boolean}} [opciones] sinMarca: solo el número (el tema
 *   trae objeto 3D, que ya es la identidad visual en la otra columna)
 * @returns {Promise<HTMLElement|null>} el escudo grande (null sin marca), o
 *   null si se abortó
 */
export async function correrCuentaRegresiva (centro, signal, { sinMarca = false } = {}) {
  centro.innerHTML = `
    <div class="cuenta">
      ${sinMarca ? '' : marca('cuenta__escudo', { id: 'escudoGrande' })}
      <div class="cuenta__slot" id="slot">
        <div class="cuenta__num" id="num">${SEGUNDOS_CUENTA}</div>
      </div>
    </div>`

  const num = centro.querySelector('#num')

  for (let n = SEGUNDOS_CUENTA; n >= 1; n--) {
    if (signal.aborted) return null
    num.textContent = n
    num.classList.remove('late')
    void num.offsetWidth           // fuerza reflow: reinicia el latido
    num.classList.add('late')
    await esperar(1000, signal)
  }

  return signal.aborted ? null : centro.querySelector('#escudoGrande')
}

/**
 * Barra de generación. El escudo se queda donde está: solo cambia lo de abajo.
 * Va en `linear` — el progreso no se suaviza, mentiría sobre cuánto falta.
 */
export async function correrBarraCarga (centro, signal) {
  const slot = centro.querySelector('#slot')
  if (!slot) return

  slot.innerHTML = `
    <div class="carga">
      <div class="carga__cifra"><span id="cargaPct">0</span><span class="carga__signo">%</span></div>
      <div class="carga__pista"><div class="carga__fill" id="cargaFill"></div></div>
      <div class="carga__label" id="cargaLabel">Generando ganadores</div>
    </div>`

  const fill = slot.querySelector('#cargaFill')
  const label = slot.querySelector('#cargaLabel')
  const pct = slot.querySelector('#cargaPct')

  const anim = fill.animate(
    [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
    { duration: MS_CARGA, easing: 'linear', fill: 'forwards' }
  )
  signal.addEventListener('abort', () => anim.cancel(), { once: true })

  /* La cifra se lee del reloj de la propia animación, no de un contador
     aparte: así nunca se desincroniza de la barra aunque el navegador
     pierda frames. */
  let vivo = true
  ;(function tick () {
    if (!vivo) return
    const avance = Math.min(1, (Number(anim.currentTime) || 0) / MS_CARGA)
    pct.textContent = Math.round(avance * 100)
    requestAnimationFrame(tick)
  })()

  await anim.finished.catch(() => {})
  vivo = false

  if (!signal.aborted) {
    pct.textContent = '100'          // cierra en 100 exacto, sin quedarse en 99
    label.textContent = 'Listo'
  }
  await esperar(320, signal)
}

/**
 * El escudo viaja a su sitio de reposo en la esquina superior izquierda.
 *
 * Se anima un clon en `position: fixed` y no el escudo original, por dos
 * razones: el contenedor central tiene overflow oculto y recortaría el vuelo,
 * y así el encabezado no cambia de tamaño mientras el clon viaja.
 *
 * cloneNode(true): la marca es un <span> con el <svg> dentro; un clon
 * superficial llegaría vacío y el vuelo sería invisible.
 */
export function volarEscudoAlEncabezado (escudoGrande, escudoEncabezado) {
  if (!escudoGrande || !escudoEncabezado) return Promise.resolve()

  const desde = escudoGrande.getBoundingClientRect()
  escudoEncabezado.hidden = false
  const hasta = escudoEncabezado.getBoundingClientRect()
  if (!desde.width || !hasta.width) return Promise.resolve()

  // El del encabezado espera invisible hasta que el clon llegue
  escudoEncabezado.style.visibility = 'hidden'

  const clon = escudoGrande.cloneNode(true)
  clon.removeAttribute('id')
  clon.className = 'marca-svg escudo-vuelo'
  Object.assign(clon.style, {
    left: `${desde.left}px`, top: `${desde.top}px`,
    width: `${desde.width}px`, height: `${desde.height}px`
  })
  document.body.appendChild(clon)

  // El original se va en el mismo frame: nunca se ven los dos a la vez
  escudoGrande.style.visibility = 'hidden'

  const escala = hasta.width / desde.width
  const dx = (hasta.left + hasta.width / 2) - (desde.left + desde.width / 2)
  const dy = (hasta.top + hasta.height / 2) - (desde.top + desde.height / 2)

  const anim = clon.animate([
    { transform: 'translate(0px, 0px) scale(1)' },
    { transform: `translate(${dx}px, ${dy}px) scale(${escala})` }
  ], {
    duration: 760,
    easing: 'cubic-bezier(0.77, 0, 0.175, 1)',   // movimiento en pantalla
    fill: 'forwards'
  })

  return anim.finished.catch(() => {}).then(() => {
    escudoEncabezado.style.visibility = ''
    clon.remove()
  })
}

function esperar (ms, signal) {
  return new Promise(resolve => {
    const id = setTimeout(resolve, ms)
    signal.addEventListener('abort', () => { clearTimeout(id); resolve() }, { once: true })
  })
}
