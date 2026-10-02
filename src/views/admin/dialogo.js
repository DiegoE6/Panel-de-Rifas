/**
 * Confirmación y errores dentro de la interfaz.
 * Reemplaza a window.confirm() y window.alert(), que bloquean el hilo,
 * no se pueden estilar y en pantalla completa ni siquiera se ven bien.
 *
 * Usa <dialog> nativo: trae foco atrapado, cierre con Escape y backdrop
 * sin una línea de JS extra.
 */

/**
 * @returns {Promise<boolean>} true si el usuario confirma
 */
export function confirmar ({ titulo, cuerpo, aceptar = 'Continuar', peligro = false }) {
  return new Promise(resolve => {
    const dlg = document.createElement('dialog')
    dlg.className = 'dialogo'
    dlg.innerHTML = `
      <h2 class="dialogo__titulo">${esc(titulo)}</h2>
      <p class="dialogo__cuerpo">${esc(cuerpo)}</p>
      <div class="dialogo__pie">
        <button class="btn btn--fantasma" value="cancelar">Cancelar</button>
        <button class="btn ${peligro ? 'btn--peligro' : 'btn--primario'}" value="aceptar">${esc(aceptar)}</button>
      </div>`

    const [btnCancelar, btnAceptar] = dlg.querySelectorAll('button')
    btnCancelar.onclick = () => dlg.close('cancelar')
    btnAceptar.onclick = () => dlg.close('aceptar')

    dlg.addEventListener('close', () => {
      const ok = dlg.returnValue === 'aceptar'
      dlg.remove()
      resolve(ok)
    }, { once: true })

    document.body.appendChild(dlg)
    dlg.showModal()
    btnCancelar.focus()      // el foco arranca en la salida, no en la acción
  })
}

/** Banner de error inline dentro de un contenedor. */
export function mostrarError (contenedor, mensaje) {
  contenedor.innerHTML = `
    <div class="error-inline" role="alert">
      <span class="badge badge--error">Error</span>
      <span class="error-inline__texto">${esc(mensaje)}</span>
      <button class="error-inline__cerrar" aria-label="Cerrar aviso">&times;</button>
    </div>`
  contenedor.querySelector('.error-inline__cerrar').onclick = () => { contenedor.innerHTML = '' }
}

export function limpiarError (contenedor) {
  if (contenedor) contenedor.innerHTML = ''
}

const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
