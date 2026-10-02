/** Zona de arrastre para xlsx / xls / csv. */
import { getEstado } from '../../core/state.js'
import { EXTENSIONES_VALIDAS } from '../../data/fileReader.js'

export function dropzone (cont, { tipo, titulo, columnas, onArchivo }) {
  const archivo = getEstado().archivos[tipo]
  const cargado = Boolean(archivo.nombre)
  const id = `file-${tipo}`

  cont.innerHTML = `
    <label class="dropzone ${cargado ? 'is-loaded' : ''}" for="${id}">
      <span class="dropzone__estado">${cargado ? 'Cargado' : 'Sin archivo'}</span>
      <span class="dropzone__titulo">${titulo}</span>
      <span class="dropzone__pista">
        ${cargado
          ? `${esc(archivo.nombre)} · ${archivo.filas.length} filas · clic para reemplazar`
          : `Arrastra o haz clic · columnas: ${columnas}`}
      </span>
      <input type="file" id="${id}" accept="${EXTENSIONES_VALIDAS.join(',')}">
    </label>`

  const zona = cont.querySelector('.dropzone')
  cont.querySelector('input').onchange = e => e.target.files[0] && onArchivo(e.target.files[0])

  ;['dragenter', 'dragover'].forEach(ev =>
    zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.add('is-over') }))
  ;['dragleave', 'drop'].forEach(ev =>
    zona.addEventListener(ev, e => { e.preventDefault(); zona.classList.remove('is-over') }))

  zona.addEventListener('drop', e => {
    const f = e.dataTransfer?.files?.[0]
    if (f) onArchivo(f)
  })
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
