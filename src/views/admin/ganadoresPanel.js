/** Pestaña 3 — columnas a exportar, vista previa y descarga. */
import { getEstado, setEstado, reiniciarSorteo } from '../../core/state.js'
import { COLUMNAS_EXPORT } from '../../data/schema.js'
import { valorDeColumna } from '../../export/columns.js'
import { exportarXlsx, exportarCsv } from '../../export/exporter.js'
import { confirmar } from './dialogo.js'

const NUMERICAS = ['ronda', 'numregalo', 'numcredencial']

export function render (raiz) {
  const { ganadores, columnasExport } = getEstado()

  if (!ganadores.length) {
    raiz.innerHTML = `
      <div class="stack">
        <header class="seccion">
          <h1 class="view__titulo">Ganadores</h1>
          <p class="view__sub">Todavía no se ha ejecutado la rifa.</p>
        </header>
        <div class="card"><div class="vacio">Pulsa «Iniciar rifa» para sortear.</div></div>
      </div>`
    return
  }

  const seleccion = columnasExport.length
    ? columnasExport
    : COLUMNAS_EXPORT.filter(c => c.porDefecto).map(c => c.clave)

  raiz.innerHTML = `
    <div class="stack">
      <header class="seccion">
        <h1 class="view__titulo">Ganadores</h1>
        <div class="seccion__meta">
          <span class="seccion__dato"><strong>${ganadores.length}</strong> premios entregados</span>
        </div>
        <p class="view__sub">Elige las columnas que quieres en el archivo de descarga.</p>
      </header>

      <div class="card">
        <h2 class="card__titulo">Columnas</h2>
        <div class="cols-export" id="cols">
          ${COLUMNAS_EXPORT.map(c => `
            <label class="switch" for="col-${c.clave}">
              <input type="checkbox" id="col-${c.clave}" value="${c.clave}" ${seleccion.includes(c.clave) ? 'checked' : ''}>
              ${c.etiqueta}
            </label>`).join('')}
        </div>
      </div>

      <div class="row">
        <button class="btn btn--oro" id="btnXlsx">Descargar Excel</button>
        <button class="btn" id="btnCsv">Descargar CSV</button>
        <div class="spacer"></div>
        <button class="btn btn--peligro" id="btnReiniciar">Reiniciar sorteo</button>
      </div>

      <div id="preview"></div>
    </div>`

  const leer = () => [...raiz.querySelectorAll('#cols input:checked')].map(i => i.value)
  const cols = () => COLUMNAS_EXPORT.filter(c => leer().includes(c.clave))

  raiz.querySelectorAll('#cols input').forEach(i => {
    i.onchange = () => { setEstado({ columnasExport: leer() }); preview() }
  })

  raiz.querySelector('#btnXlsx').onclick = () => exportarXlsx(ganadores, cols())
  raiz.querySelector('#btnCsv').onclick  = () => exportarCsv(ganadores, cols())

  raiz.querySelector('#btnReiniciar').onclick = async () => {
    const ok = await confirmar({
      titulo: 'Reiniciar sorteo',
      cuerpo: `Se borran los ${ganadores.length} ganadores y todos los regalos vuelven a la cola. Los archivos cargados se conservan.`,
      aceptar: 'Reiniciar',
      peligro: true
    })
    if (ok) reiniciarSorteo()
  }

  function preview () {
    const c = cols()
    const cont = raiz.querySelector('#preview')
    if (!c.length) { cont.innerHTML = '<div class="card"><div class="vacio">Selecciona al menos una columna.</div></div>'; return }

    cont.innerHTML = `
      <div class="table-wrap table-wrap--alta">
        <table class="table">
          <thead><tr>${c.map(x => `<th>${x.etiqueta}</th>`).join('')}</tr></thead>
          <tbody>
            ${ganadores.map(g => `
              <tr>${c.map(x => `<td class="${NUMERICAS.includes(x.clave) ? 'num' : ''}">${esc(valorDeColumna(g, x.clave))}</td>`).join('')}</tr>`).join('')}
          </tbody>
        </table>
      </div>`
  }

  preview()
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
