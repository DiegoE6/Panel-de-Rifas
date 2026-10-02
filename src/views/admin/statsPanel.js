/** Pestaña 2 — estadísticas del sorteo. */
import { getEstado } from '../../core/state.js'
import { sinPremio } from '../../core/raffle.js'

export function render (raiz) {
  const { regalos, asistentes, ganadores } = getEstado()
  const noGanaron = sinPremio(asistentes, ganadores)
  const probabilidad = asistentes.length ? (regalos.length / asistentes.length) * 100 : 0
  const cobertura = asistentes.length ? (ganadores.length / asistentes.length) * 100 : 0

  raiz.innerHTML = `
    <div class="stack">
      <header class="seccion">
        <h1 class="view__titulo">Estadísticas</h1>
        <div class="seccion__meta">
          <span class="seccion__dato"><strong>${asistentes.length}</strong> participantes</span>
          <span class="seccion__dato"><strong>${regalos.length}</strong> regalos</span>
          <span class="seccion__dato">${ganadores.length ? `<strong>${ganadores.length}</strong> ganadores` : 'sorteo pendiente'}</span>
        </div>
        <p class="view__sub">Cifras de los archivos cargados y del resultado del sorteo.</p>
      </header>

      <div class="grid-4">
        ${stat('Participantes', asistentes.length)}
        ${stat('Regalos', regalos.length)}
        ${stat('Ganadores', ganadores.length, ganadores.length ? `${cobertura.toFixed(1)}% de los asistentes` : 'Sorteo no ejecutado', true)}
        ${stat('Sin premio', ganadores.length ? noGanaron.length : '—')}
      </div>

      <div class="card">
        <h2 class="card__titulo">Probabilidad por persona</h2>
        <p class="card__sub">Con ${regalos.length} regalos entre ${asistentes.length} participantes y sin repetir ganador.</p>
        <div class="stat__valor stat__valor--oro mt-3">${probabilidad.toFixed(1)}%</div>
        <div class="barra mt-4"><div class="barra__fill barra__fill--oro" style="width:${Math.min(probabilidad, 100)}%"></div></div>
      </div>

      ${ganadores.length ? `
        <div class="card">
          <h2 class="card__titulo">Reparto</h2>
          <div class="stack stack--junto mt-4">
            ${barra('Ganaron', ganadores.length, asistentes.length, 'barra__fill--oro')}
            ${barra('No ganaron', noGanaron.length, asistentes.length, 'barra__fill--tenue')}
          </div>
        </div>

        <div class="card">
          <h2 class="card__titulo">Participantes sin premio</h2>
          <p class="card__sub">${noGanaron.length} de ${asistentes.length}.</p>
          <div class="table-wrap table-wrap--alta mt-4">
            <table class="table">
              <thead><tr><th>Credencial</th><th>Nombre</th></tr></thead>
              <tbody>
                ${noGanaron.slice(0, 300).map(a => `
                  <tr><td class="num">${esc(a.numcredencial)}</td><td>${esc(a.nombreCompleto)}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
          ${noGanaron.length > 300 ? `<p class="card__sub">Mostrando 300 de ${noGanaron.length}.</p>` : ''}
        </div>
      ` : `<div class="card"><div class="vacio">Ejecuta la rifa para ver el reparto.</div></div>`}
    </div>`
}

function stat (etiqueta, valor, pie = '', oro = false) {
  return `
    <div class="stat">
      <div class="stat__etiqueta">${etiqueta}</div>
      <div class="stat__valor ${oro ? 'stat__valor--oro' : ''}">${valor}</div>
      ${pie ? `<div class="stat__pie">${pie}</div>` : ''}
    </div>`
}

function barra (etiqueta, n, total, variante) {
  const pct = total ? (n / total) * 100 : 0
  return `
    <div>
      <div class="medida">
        <span>${etiqueta}</span><div class="spacer"></div>
        <strong class="medida__n">${n}</strong>
        <span class="medida__pct">${pct.toFixed(1)}%</span>
      </div>
      <div class="barra mt-3"><div class="barra__fill ${variante}" style="width:${pct}%"></div></div>
    </div>`
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
