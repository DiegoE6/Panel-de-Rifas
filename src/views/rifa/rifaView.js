/**
 * PANEL RIFA — pantalla completa, solo la rifa.
 * Salir de pantalla completa (Esc o el botón) devuelve al panel de admin.
 *
 * Secuencia: cuenta regresiva de 10s con el escudo en grande, el escudo vuela
 * a su sitio en la esquina superior izquierda, y entra la tabla.
 *
 * Si el tema trae objeto 3D (`escena3d`), el panel se parte en dos columnas
 * fijas. La izquierda (nombre del evento + objeto girando) se arma una vez y
 * no se vuelve a tocar; la derecha es #centro, donde corren las cuatro
 * pantallas. Sin marca: el objeto ya es la identidad visual del evento.
 */
import { getEstado, setEstado } from '../../core/state.js'
import { salir } from '../../core/fullscreen.js'
import { sortearTodo } from '../../core/raffle.js'
import { correrCuentaRegresiva, correrBarraCarga, volarEscudoAlEncabezado } from './secuencia.js'
import { pintarGanadores } from './tablaGanadores.js'
import { celebrar } from '../../animations/confetti.js'
import { aplicarTema, quitarTema } from '../../temas/ambiente.js'
import { TEMAS } from '../../temas/temas.js'
import { marca, ETIQUETA_MARCA } from '../marca.js'

const FPS_3D_CON_LISTA = 30

let corriendo = false

export function render (raiz) {
  const { config } = getEstado()
  const nombre = config.nombreEvento?.trim() ?? ''
  const catalogo3d = TEMAS[config.tema]?.escena3d
  const con3d = Boolean(catalogo3d)

  const centroHTML = '<div class="rifa__centro" id="centro"></div>'
  raiz.innerHTML = `
    <section class="rifa${con3d ? ' rifa--3d' : ''}">
      <div class="rifa__top">
        ${marca('rifa__logo', { id: 'escudoTop', etiqueta: ETIQUETA_MARCA })}
        <div class="rifa__evento" id="evento">${esc(nombre)}</div>
        <button class="btn btn--fantasma rifa__salir" id="btnSalir">Salir · Esc</button>
      </div>
      ${con3d ? `
        <div class="rifa__cuerpo">
          <aside class="rifa__lado">
            ${nombre ? `<h1 class="rifa__lado-nombre">${esc(nombre)}</h1>` : ''}
            <div class="rifa__hueco3d" id="hueco3d"></div>
          </aside>
          ${centroHTML}
        </div>` : centroHTML}
    </section>`

  const panel = raiz.querySelector('.rifa')
  const centro = raiz.querySelector('#centro')

  // El tema vive todo lo que dura la rifa: cuenta regresiva y tabla de ganadores
  aplicarTema(panel, config.tema ?? 'ninguno')
  const escudoTop = raiz.querySelector('#escudoTop')
  const evento = raiz.querySelector('#evento')
  const btnSalir = raiz.querySelector('#btnSalir')

  btnSalir.onclick = () => salir()

  /* Objeto 3D del tema. three pesa ~600 KB: se pide con import() solo si el
     tema lo usa. Llega asíncrono; su hueco ya está reservado en la columna
     izquierda, así que cuando aparece no empuja nada. Vive hasta la limpieza
     de esta vista, ganadores incluidos. */
  let vivo = true
  let escena = null
  let fps3d = null
  if (con3d) {
    import('../../temas/escena3d.js')
      .then(m => {
        if (!vivo || !m.montar(catalogo3d)) return
        escena = m
        escena.limitarFps(fps3d)
        escena.anclar(raiz.querySelector('#hueco3d'))
      })
      .catch(e => console.warn('[escena3d] no se pudo montar:', e))
  }

  const { ganadores, sorteoHecho } = getEstado()
  if (sorteoHecho && ganadores.length) {
    mostrarGanadores(ganadores)
  } else {
    pantallaInicial()
  }

  function pantallaInicial () {
    escudoTop.hidden = false
    evento.hidden = false
    btnSalir.hidden = false

    // Si el nombre va en grande, no se repite en la barra.
    // Con 3D ya está en la columna izquierda: aquí solo el arranque.
    evento.hidden = Boolean(nombre)

    centro.innerHTML = `
      <div class="rifa__listo">
        ${nombre && !con3d ? `<h1 class="rifa__evento-grande">${esc(nombre)}</h1>` : ''}
        <p class="rifa__titulo">Todo listo para el sorteo</p>
        <button class="btn btn--oro btn--lg" id="btnComenzar">Comenzar</button>
      </div>`
    centro.querySelector('#btnComenzar').onclick = ejecutar
  }

  /** Con los ganadores en pantalla no hay botones: se sale con Escape. */
  function mostrarGanadores (lista) {
    escudoTop.hidden = false
    btnSalir.hidden = true
    // El objeto sigue, pero a 30 fps: el hilo es para el recorrido de la lista
    if (con3d) {
      fps3d = FPS_3D_CON_LISTA
      escena?.limitarFps(fps3d)
    }
    pintarGanadores(centro, lista, getEstado().config.velocidad ?? 1)
  }

  async function ejecutar () {
    if (corriendo) return
    corriendo = true

    const { regalos, asistentes, config } = getEstado()
    const control = new AbortController()
    const onKey = e => { if (e.code === 'Escape') control.abort() }
    document.addEventListener('keydown', onKey)

    try {
      // Se calcula antes de animar: los 10 segundos son espectáculo, no cómputo
      const ganadores = sortearTodo(regalos, asistentes, config)

      // El encabezado se despeja: durante la cuenta solo está el escudo grande
      escudoTop.hidden = true
      btnSalir.hidden = true
      evento.hidden = true

      const escudoGrande = await correrCuentaRegresiva(centro, control.signal, { sinMarca: con3d })
      if (control.signal.aborted) { pantallaInicial(); return }

      // La barra simula la generación; el escudo se queda arriba sin moverse
      await correrBarraCarga(centro, control.signal)
      if (control.signal.aborted) { pantallaInicial(); return }

      evento.hidden = false
      // Con 3D no hay marca que vuele: el objeto se queda en su columna
      if (!con3d) await volarEscudoAlEncabezado(escudoGrande, escudoTop)

      setEstado({ ganadores, sorteoHecho: true })
      mostrarGanadores(ganadores)

      // Se separa del montaje de la tabla para no competir por el compositor,
      // y con listas largas se baja la cuenta de piezas
      if (config.confeti) {
        const piezas = ganadores.length > 60 ? 120 : 200
        setTimeout(() => celebrar(2600, piezas), 350)
      }
    } catch (err) {
      escudoTop.hidden = false
      evento.hidden = false
      centro.innerHTML = `<div class="rifa__listo"><h1 class="rifa__titulo">${esc(err.message)}</h1></div>`
    } finally {
      document.removeEventListener('keydown', onKey)
      corriendo = false
    }
  }

  const onSpace = e => {
    if (e.code === 'Space' && !corriendo && !getEstado().sorteoHecho) { e.preventDefault(); ejecutar() }
  }
  document.addEventListener('keydown', onSpace)

  // Único punto donde se destruye la escena 3D
  return () => {
    vivo = false
    escena?.desmontar()
    document.removeEventListener('keydown', onSpace)
    quitarTema(panel)
    corriendo = false
  }
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
