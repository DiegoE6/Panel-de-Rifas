/**
 * Revelado de la tabla de ganadores y recorrido automático.
 *
 * El recorrido se arma con la Web Animations API en vez de una animación CSS
 * porque las pausas de los extremos tienen que durar SEGUNDOS FIJOS, no un
 * porcentaje del ciclo: con 40 ganadores el ciclo dura más de dos minutos y
 * un 6% de pausa se convertía en ocho segundos de espera. Los offsets se
 * calculan en tiempo real. WAAPI da rendimiento de CSS con control de JS.
 */

const PASO_MS = 50          // escalonado de entrada por fila
const TOPE_MS = 900         // tope del escalonado: una lista larga no se siente lenta
const ESPERA_INICIO = 7     // segundos quieto arriba antes de arrancar
const ESPERA_FIN = 3        // segundos quieto abajo antes de repetir

/* Velocidad adaptativa. A px/s fijos, una lista de 130 ganadores tardaba más
   de siete minutos en dar una vuelta. La velocidad se calcula para que el
   recorrido dure OBJETIVO_S, con dos topes: no tan lento que aburra ni tan
   rápido que un nombre pase sin poder leerse. Encima va el factor manual del
   panel de admin, con un tope absoluto para que nadie se pase de la raya. */
const OBJETIVO_S = 110      // duración deseada de una vuelta completa
const VEL_MIN = 60          // px/s: listas cortas no se arrastran
const VEL_MAX = 150         // px/s: techo de legibilidad
const VEL_PISO = 25         // tope absoluto inferior con el factor manual
const VEL_TECHO = 420       // tope absoluto superior

/* Medidas nominales de una proyección 1080p, para poder estimar el ciclo
   desde el admin sin estar en pantalla completa. */
export const ALTO_FILA_NOMINAL = 147
export const ALTO_VIEWPORT_NOMINAL = 810

export function velocidadPara (sobra, factor = 1) {
  const base = Math.min(VEL_MAX, Math.max(VEL_MIN, sobra / OBJETIVO_S))
  return Math.min(VEL_TECHO, Math.max(VEL_PISO, base * factor))
}

/**
 * Estimación para el admin: cuánto dura una vuelta con N ganadores.
 * @returns {{sobra:number, velocidad:number, recorrido:number, ciclo:number, porTarjeta:number}}
 */
export function estimarCiclo (nGanadores, factor = 1) {
  const sobra = Math.max(0, nGanadores * ALTO_FILA_NOMINAL - ALTO_VIEWPORT_NOMINAL)
  if (sobra <= 8) return { sobra: 0, velocidad: 0, recorrido: 0, ciclo: 0, porTarjeta: 0 }
  const velocidad = velocidadPara(sobra, factor)
  const recorrido = sobra / velocidad
  return {
    sobra,
    velocidad,
    recorrido,
    ciclo: ESPERA_INICIO + recorrido + ESPERA_FIN,
    porTarjeta: ALTO_FILA_NOMINAL / velocidad
  }
}

export function pintarGanadores (cont, ganadores, factorVelocidad = 1) {
  /* Solo se anima la entrada de las tarjetas que caben en pantalla. Con 130
     ganadores, animar las 130 creaba 130 capas compositadas a la vez y ahí
     estaba el tirón. Las de abajo nadie las ve entrar: llegan por el
     recorrido, ya asentadas. 120px es una altura de fila conservadora. */
  const visibles = Math.ceil(window.innerHeight / 120) + 3

  cont.innerHTML = `
    <div class="ganadores">
      <div class="ganadores__viewport" id="viewport">
        <div class="ganadores__lista" id="lista">
          ${ganadores.map((g, i) => `
            <article class="premio${i < visibles ? '' : ' premio--estatico'}"${i < visibles ? ` style="animation-delay:${Math.min(i * PASO_MS, TOPE_MS)}ms"` : ''}>
              <div class="premio__texto">
                <div class="premio__regalo">${esc(g.regalo)}</div>
                <div class="premio__nombre">${esc(g.nombreCompleto)}</div>
              </div>
              <div class="premio__credencial">${esc(g.numcredencial)}</div>
            </article>`).join('')}
          <div class="fin-lista" id="finLista">
            <span class="fin-lista__texto">Fin de la lista</span>
            <span class="fin-lista__sub">Vuelve a empezar desde el primer ganador</span>
          </div>
        </div>
      </div>
      <div class="ciclo" id="ciclo" hidden>
        <div class="ciclo__pista"><div class="ciclo__fill" id="cicloFill"></div></div>
      </div>
    </div>`

  iniciarRecorrido(
    cont.querySelector('#viewport'),
    cont.querySelector('#lista'),
    cont.querySelector('#ciclo'),
    cont.querySelector('#cicloFill'),
    ganadores.length,
    factorVelocidad
  )
}

function iniciarRecorrido (viewport, lista, ciclo, fill, total, factor) {
  const arranque = Math.min(total * PASO_MS, TOPE_MS) + 400
  setTimeout(() => medir(viewport, lista, ciclo, fill, 0, factor), arranque)
}

function medir (viewport, lista, ciclo, fill, intento, factor) {
  const alto = viewport.clientHeight
  // El layout puede no haber asentado (fuentes, pantalla completa): se reintenta
  if (alto === 0 && intento < 5) {
    requestAnimationFrame(() => medir(viewport, lista, ciclo, fill, intento + 1, factor))
    return
  }

  const sobra = lista.scrollHeight - alto
  if (sobra <= 8) {
    // Cabe completa: no hay recorrido y tampoco marcador de fin
    lista.querySelector('#finLista')?.remove()
    return
  }

  // Movimiento reducido: se deja el scroll nativo en vez del recorrido
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
    viewport.style.overflowY = 'auto'
    return
  }

  const movimiento = sobra / velocidadPara(sobra, factor)
  const total = ESPERA_INICIO + movimiento + ESPERA_FIN

  // Offsets en tiempo real: las pausas duran lo mismo con 10 o con 200 ganadores
  const cuadros = [
    { transform: 'translateY(0px)',        offset: 0 },
    { transform: 'translateY(0px)',        offset: ESPERA_INICIO / total },
    { transform: `translateY(${-sobra}px)`, offset: (ESPERA_INICIO + movimiento) / total },
    { transform: `translateY(${-sobra}px)`, offset: 1 }
  ]

  const opciones = { duration: total * 1000, iterations: Infinity, easing: 'linear' }

  // Promueve la lista a su propia capa una sola vez, en vez de re-rasterizarla
  lista.style.willChange = 'transform'
  const anim = lista.animate(cuadros, opciones)

  // La barra del ciclo comparte tiempos: muestra cuánto falta para repetir
  ciclo.hidden = false
  const animFill = fill.animate(
    [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }],
    opciones
  )

  // Pasar el cursor detiene ambas para poder leer un renglón
  viewport.addEventListener('mouseenter', () => { anim.pause(); animFill.pause() })
  viewport.addEventListener('mouseleave', () => { anim.play(); animFill.play() })
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
