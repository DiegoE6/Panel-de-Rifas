/** Pestaña 1 — carga de los dos archivos y revisión previa. */
import { getEstado, setEstado, setConfig, reiniciarTodo } from '../../core/state.js'
import { leerArchivo, EXTENSIONES_VALIDAS } from '../../data/fileReader.js'
import { mapearColumnas, normalizarRegalos, normalizarAsistentes, faltantes } from '../../data/mapper.js'
import { ESQUEMA_REGALOS, ESQUEMA_ASISTENCIA } from '../../data/schema.js'
import { validarRegalos, validarAsistentes, validarCruce } from '../../data/validator.js'
import { dropzone } from './dropzone.js'
import { confirmar, mostrarError, limpiarError } from './dialogo.js'
import { TEMAS } from '../../temas/temas.js'
import { estimarCiclo } from '../rifa/tablaGanadores.js'

export function render (raiz) {
  const { regalos, asistentes, ganadores } = getEstado()

  raiz.innerHTML = `
    <div class="stack">
      <header class="seccion">
        <h1 class="view__titulo">Carga de datos</h1>
        <div class="seccion__meta">
          <span class="seccion__dato"><strong>${asistentes.length}</strong> participantes</span>
          <span class="seccion__dato"><strong>${regalos.length}</strong> regalos</span>
          <span class="seccion__dato">${ganadores.length ? `<strong>${ganadores.length}</strong> ganadores` : 'sorteo pendiente'}</span>
        </div>
        <p class="view__sub">
          Sube el archivo de regalos y el de asistencia (${EXTENSIONES_VALIDAS.join(' · ')}).
          Las columnas se detectan por nombre; los encabezados pueden traer acentos, mayúsculas o espacios.
        </p>
      </header>

      <div id="errores"></div>

      <div class="grid-2">
        <div id="dzRegalos"></div>
        <div id="dzAsistencia"></div>
      </div>

      <div id="revision"></div>
      <div id="ajustes"></div>

      <div class="row">
        <button class="btn btn--peligro" id="btnLimpiar">Limpiar todo</button>
      </div>
    </div>`

  const errores = raiz.querySelector('#errores')

  dropzone(raiz.querySelector('#dzRegalos'), {
    tipo: 'regalos', titulo: 'Archivo de regalos',
    columnas: 'numregalo · nombreregalo',
    onArchivo: f => cargar(f, 'regalos', errores)
  })

  dropzone(raiz.querySelector('#dzAsistencia'), {
    tipo: 'asistencia', titulo: 'Archivo de asistencia',
    columnas: 'numcredencial · nombre · appaterno · apmaterno',
    onArchivo: f => cargar(f, 'asistencia', errores)
  })

  raiz.querySelector('#btnLimpiar').onclick = async () => {
    const ok = await confirmar({
      titulo: 'Limpiar todo',
      cuerpo: 'Se borran los dos archivos cargados y los ganadores. Esta acción no se puede deshacer.',
      aceptar: 'Borrar todo',
      peligro: true
    })
    if (ok) reiniciarTodo()
  }

  pintarRevision(raiz.querySelector('#revision'))
  pintarAjustes(raiz.querySelector('#ajustes'))
}

async function cargar (file, tipo, errores) {
  limpiarError(errores)
  try {
    const { nombre, headers, filas } = await leerArchivo(file)
    const esquema = tipo === 'regalos' ? ESQUEMA_REGALOS : ESQUEMA_ASISTENCIA
    const mapeo = mapearColumnas(headers, esquema)
    const registros = tipo === 'regalos'
      ? normalizarRegalos(filas, mapeo)
      : normalizarAsistentes(filas, mapeo)

    const e = getEstado()
    setEstado({
      archivos: { ...e.archivos, [tipo]: { nombre, headers, filas } },
      mapeo:    { ...e.mapeo,    [tipo]: mapeo },
      [tipo === 'regalos' ? 'regalos' : 'asistentes']: registros,
      ganadores: [], sorteoHecho: false
    })
  } catch (err) {
    mostrarError(errores, `No se pudo leer "${file.name}". ${err.message}`)
  }
}

function pintarRevision (cont) {
  const { regalos, asistentes, mapeo, archivos } = getEstado()
  if (!archivos.regalos.nombre && !archivos.asistencia.nombre) { cont.innerHTML = ''; return }

  const avisos = []

  if (archivos.regalos.nombre) {
    const falta = faltantes(mapeo.regalos, ESQUEMA_REGALOS)
    falta.forEach(f => avisos.push({ nivel: 'error', mensaje: `Regalos: falta la columna "${f}"`, detalle: `Encabezados encontrados: ${archivos.regalos.headers.join(', ')}` }))
    if (!falta.length) avisos.push(...validarRegalos(regalos))
  }

  if (archivos.asistencia.nombre) {
    const falta = faltantes(mapeo.asistencia, ESQUEMA_ASISTENCIA)
    falta.forEach(f => avisos.push({ nivel: 'error', mensaje: `Asistencia: falta la columna "${f}"`, detalle: `Encabezados encontrados: ${archivos.asistencia.headers.join(', ')}` }))
    if (!falta.length) avisos.push(...validarAsistentes(asistentes))
  }

  avisos.push(...validarCruce(asistentes, regalos))

  cont.innerHTML = `
    <div class="card">
      <h2 class="card__titulo">Revisión</h2>
      <div class="stack stack--junto mt-4">
        ${avisos.map(a => `
          <div class="aviso">
            <span class="badge badge--${a.nivel === 'ok' ? 'ok' : a.nivel === 'warn' ? 'warn' : 'error'}">
              ${a.nivel === 'ok' ? 'Listo' : a.nivel === 'warn' ? 'Aviso' : 'Error'}
            </span>
            <div class="aviso__cuerpo">
              <div>${esc(a.mensaje)}</div>
              ${a.detalle ? `<div class="aviso__detalle">${esc(a.detalle)}</div>` : ''}
            </div>
          </div>`).join('')}
      </div>
    </div>`
}

function pintarAjustes (cont) {
  const { config } = getEstado()
  cont.innerHTML = `
    <div class="card">
      <h2 class="card__titulo">Ajustes del sorteo</h2>
      <p class="card__sub">${esc(TEMAS[config.tema ?? 'ninguno']?.descripcion ?? '')} El nombre del evento se muestra en el panel de rifa. Una persona gana una sola vez. Con una semilla el sorteo es reproducible: se puede volver a correr y demostrar que da el mismo resultado.</p>
      <div class="row row--fin mt-4">
        <div class="field">
          <label for="evento">Nombre del evento</label>
          <input class="input input--ancho" id="evento" placeholder="Ej. Posada de fin de año 2026" value="${esc(config.nombreEvento ?? '')}">
        </div>
        <div class="field">
          <label for="tema">Tema del evento</label>
          <select class="input" id="tema">
            ${Object.entries(TEMAS).map(([clave, t]) =>
              `<option value="${clave}" ${(config.tema ?? 'ninguno') === clave ? 'selected' : ''}>${esc(t.nombre)}</option>`).join('')}
          </select>
        </div>
        <div class="field">
          <label for="semilla">Semilla (opcional)</label>
          <input class="input" id="semilla" placeholder="vacío = aleatorio real" value="${esc(config.semilla ?? '')}">
        </div>
        <label class="switch switch--bajo" for="confeti">
          <input type="checkbox" id="confeti" ${config.confeti ? 'checked' : ''}> Confeti al revelar
        </label>
      </div>

      <div class="velocidad">
        <div class="velocidad__cab">
          <label for="velocidad">Velocidad del recorrido de ganadores</label>
          <output class="velocidad__factor num" id="velFactor">${(config.velocidad ?? 1).toFixed(1)}×</output>
        </div>
        <input class="rango" type="range" id="velocidad"
               min="0.5" max="2.5" step="0.1" value="${config.velocidad ?? 1}">
        <div class="velocidad__escala">
          <span>Lento</span><span>Normal</span><span>Rápido</span>
        </div>
        <p class="velocidad__estimado num" id="velEstimado"></p>
      </div>
    </div>`

  cont.querySelector('#evento').oninput   = e => setConfig({ nombreEvento: e.target.value })
  cont.querySelector('#tema').onchange    = e => { setConfig({ tema: e.target.value }); pintarAjustes(cont) }
  cont.querySelector('#semilla').onchange = e => setConfig({ semilla: e.target.value.trim() || null })
  cont.querySelector('#confeti').onchange = e => setConfig({ confeti: e.target.checked })

  const rango = cont.querySelector('#velocidad')
  const factorOut = cont.querySelector('#velFactor')
  const estimado = cont.querySelector('#velEstimado')

  function pintarEstimado (factor) {
    factorOut.textContent = `${factor.toFixed(1)}×`
    const n = getEstado().regalos.length
    if (!n) { estimado.textContent = 'Carga el archivo de regalos para ver la estimación.'; return }

    const e = estimarCiclo(n, factor)
    if (!e.ciclo) { estimado.textContent = `Con ${n} ganadores la lista cabe en pantalla: no hay recorrido.`; return }

    estimado.textContent =
      `${n} ganadores · ${Math.round(e.velocidad)} px/s · ` +
      `una vuelta cada ${formatoTiempo(e.ciclo)} · ${e.porTarjeta.toFixed(1)} s por tarjeta`
  }

  // input = mientras arrastra (solo pinta); change = al soltar (guarda)
  rango.oninput  = e => pintarEstimado(Number(e.target.value))
  rango.onchange = e => setConfig({ velocidad: Number(e.target.value) })

  pintarEstimado(config.velocidad ?? 1)
}

function formatoTiempo (segundos) {
  const s = Math.round(segundos)
  return s < 60 ? `${s} s` : `${Math.floor(s / 60)} min ${String(s % 60).padStart(2, '0')} s`
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
