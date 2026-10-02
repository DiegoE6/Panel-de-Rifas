/** Valor de una columna de exportación para un ganador. */

export function valorDeColumna (ganador, clave) {
  if (clave === 'fecha') return new Date(ganador.fecha).toLocaleString('es-MX')
  return ganador[clave] ?? ''
}

export function construirFilas (ganadores, columnas) {
  return ganadores.map(g => {
    const fila = {}
    columnas.forEach(c => { fila[c.etiqueta] = valorDeColumna(g, c.clave) })
    return fila
  })
}
