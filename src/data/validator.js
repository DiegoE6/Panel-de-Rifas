/**
 * Revisiones previas al sorteo.
 * Cada aviso: { nivel: 'ok'|'warn'|'error', mensaje, detalle? }
 * Solo 'error' bloquea el botón de iniciar.
 */

export function validarRegalos (regalos) {
  if (!regalos.length) return [{ nivel: 'error', mensaje: 'El archivo de regalos no tiene filas usables.' }]

  const avisos = []
  const repetidos = duplicados(regalos.map(r => r.numregalo))
  if (repetidos.length) {
    avisos.push({
      nivel: 'warn',
      mensaje: `${repetidos.length} núm. de regalo repetido(s)`,
      detalle: `Cada fila se sortea igual por separado. ${repetidos.slice(0, 8).join(', ')}`
    })
  }
  avisos.push({ nivel: 'ok', mensaje: `${regalos.length} regalos por sortear` })
  return avisos
}

export function validarAsistentes (asistentes) {
  if (!asistentes.length) return [{ nivel: 'error', mensaje: 'El archivo de asistencia no tiene filas usables.' }]

  const avisos = []
  const credRepetidas = duplicados(asistentes.map(a => a.numcredencial))
  if (credRepetidas.length) {
    avisos.push({
      nivel: 'error',
      mensaje: `${credRepetidas.length} credencial(es) repetida(s)`,
      detalle: `Una persona podría ganar dos veces. ${credRepetidas.slice(0, 8).join(', ')}`
    })
  }

  const sinCredencial = asistentes.filter(a => a.numcredencial.startsWith('S/C-')).length
  if (sinCredencial) {
    avisos.push({ nivel: 'warn', mensaje: `${sinCredencial} participante(s) sin núm. de credencial`, detalle: 'Se les asignó una clave temporal.' })
  }

  if (!avisos.some(a => a.nivel === 'error')) {
    avisos.push({ nivel: 'ok', mensaje: `${asistentes.length} participantes elegibles` })
  }
  return avisos
}

/** ¿Alcanzan los participantes para todos los regalos? */
export function validarCruce (asistentes, regalos) {
  if (!asistentes.length || !regalos.length) return []
  if (regalos.length > asistentes.length) {
    return [{
      nivel: 'warn',
      mensaje: 'Hay más regalos que participantes',
      detalle: `${regalos.length} regalos vs ${asistentes.length} personas. Sin repetir ganador, el sorteo se detiene en ${asistentes.length}.`
    }]
  }
  return []
}

function duplicados (valores) {
  const cuenta = new Map()
  valores.forEach(v => cuenta.set(v, (cuenta.get(v) || 0) + 1))
  return [...cuenta].filter(([, n]) => n > 1).map(([v]) => v)
}
