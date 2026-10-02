/**
 * PANEL ADMIN — carga de archivos, estadísticas y descarga de ganadores.
 * Se usa muchas veces al día: motion mínimo, todo por debajo de 300ms.
 */
import { getEstado, setEstado, suscribir, listoParaSortear } from '../../core/state.js'
import { entrar } from '../../core/fullscreen.js'
import { render as renderCarga } from './cargaPanel.js'
import { render as renderStats } from './statsPanel.js'
import { render as renderGanadores } from './ganadoresPanel.js'
import { marca, ETIQUETA_MARCA } from '../marca.js'

const PESTANAS = [
  { clave: 'carga',     etiqueta: 'Carga',        render: renderCarga, siempre: true },
  { clave: 'stats',     etiqueta: 'Estadísticas', render: renderStats },
  { clave: 'ganadores', etiqueta: 'Ganadores',    render: renderGanadores }
]

export function render (raiz) {
  raiz.innerHTML = `
    <header class="topbar">
      <div class="marca">
        ${marca('marca__escudo', { etiqueta: ETIQUETA_MARCA })}
        <span class="marca__label">Panel de rifa</span>
      </div>
      <div class="spacer"></div>
      <nav class="tabs" id="tabs" aria-label="Secciones del panel"><div class="tabs__thumb" id="thumb"></div></nav>
      <div class="spacer"></div>
      <button class="btn btn--oro" id="btnRifa">Iniciar rifa</button>
    </header>
    <main class="view" id="panel"></main>`

  const tabs  = raiz.querySelector('#tabs')
  const thumb = raiz.querySelector('#thumb')
  const panel = raiz.querySelector('#panel')

  PESTANAS.forEach(p => {
    const btn = document.createElement('button')
    btn.className = 'tab'
    btn.dataset.clave = p.clave
    btn.textContent = p.etiqueta
    btn.onclick = () => setEstado({ pestana: p.clave })
    tabs.appendChild(btn)
  })

  raiz.querySelector('#btnRifa').onclick = () => entrar()   // fullscreenchange cambia el modo

  function pintar () {
    const { pestana, regalos, asistentes, ganadores } = getEstado()
    const listo = listoParaSortear()

    tabs.querySelectorAll('.tab').forEach(btn => {
      const def = PESTANAS.find(p => p.clave === btn.dataset.clave)
      const esActiva = btn.dataset.clave === pestana
      btn.classList.toggle('is-active', esActiva)
      btn.setAttribute('aria-current', esActiva ? 'page' : 'false')
      btn.disabled = !def.siempre && !listo
      if (esActiva) moverThumb(thumb, btn, tabs)
    })

    raiz.querySelector('#btnRifa').disabled = !listo

    const def = PESTANAS.find(p => p.clave === pestana) ?? PESTANAS[0]
    panel.innerHTML = ''
    def.render(panel)
  }

  // Re-pinta solo cuando cambia algo que le concierne a esta vista
  let firma = null
  const desuscribir = suscribir(() => {
    const e = getEstado()
    const nueva = `${e.pestana}|${e.regalos.length}|${e.asistentes.length}|${e.ganadores.length}|${e.columnasExport.join()}`
    if (nueva !== firma) { firma = nueva; pintar() }
  })

  pintar()
  return desuscribir
}

/** El thumb solo se traslada: no toca layout ni pinta de nuevo. */
function moverThumb (thumb, btn, tabs) {
  const r = btn.getBoundingClientRect()
  const base = tabs.getBoundingClientRect()
  thumb.style.transform = `translateX(${r.left - base.left - 3}px)`
}
