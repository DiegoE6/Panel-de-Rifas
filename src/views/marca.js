/**
 * Marca neutra del panel: un destello de cuatro puntas, una sola forma.
 *
 * Va inline y pinta con currentColor, así hereda el color del contexto sin
 * trucos de filter. El viewBox es cuadrado y sin margen: escala igual de
 * limpio a 38px en el admin que a 340px en la cuenta regresiva.
 *
 * Se envuelve en un <span> (HTML) y no se entrega el <svg> suelto porque el
 * código de la rifa usa `.hidden` y `.className`, que en SVGElement no
 * existen o son de solo lectura.
 */
const TRAZO = 'M50 0C53 31 69 47 100 50C69 53 53 69 50 100C47 69 31 53 0 50C31 47 47 31 50 0Z'

export const ETIQUETA_MARCA = 'Panel de rifa'

/**
 * @param {string} clase  clases del contenedor (definen el tamaño)
 * @param {{id?: string, etiqueta?: string}} [opciones]  sin etiqueta = decorativa
 */
export function marca (clase, { id, etiqueta } = {}) {
  const a11y = etiqueta ? `role="img" aria-label="${etiqueta}"` : 'aria-hidden="true"'
  return `<span class="marca-svg ${clase}"${id ? ` id="${id}"` : ''} ${a11y}>` +
    `<svg viewBox="0 0 100 100" focusable="false" aria-hidden="true"><path fill="currentColor" d="${TRAZO}"/></svg>` +
    '</span>'
}
