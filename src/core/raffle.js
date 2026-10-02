/**
 * Motor del sorteo. No toca el DOM: solo calcula.
 * Cada fila del archivo de regalos es una unidad sorteable.
 */
import { enteroAleatorio, configurarRng } from './rng.js'

/** Participantes que todavía pueden ganar. */
export function elegibles (asistentes, ganadores) {
  const yaGanaron = new Set(ganadores.map(g => g.numcredencial))
  return asistentes.filter(a => !yaGanaron.has(a.numcredencial))
}

/**
 * Sortea todos los regalos de una pasada, sin repetir persona.
 * Se detiene si se agotan los participantes.
 * @returns {object[]} ganadores
 */
export function sortearTodo (regalos, asistentes, config = {}) {
  configurarRng(config.semilla ?? null)

  const ganadores = []
  const disponibles = [...asistentes]

  for (const regalo of regalos) {
    if (!disponibles.length) break
    const i = enteroAleatorio(disponibles.length)
    const [persona] = disponibles.splice(i, 1)   // sale del pool: no repite

    ganadores.push({
      ronda: ganadores.length + 1,
      numregalo: regalo.numregalo,
      regalo: regalo.nombre,
      numcredencial: persona.numcredencial,
      nombreCompleto: persona.nombreCompleto,
      nombre: persona.nombre,
      appaterno: persona.appaterno,
      apmaterno: persona.apmaterno,
      asistente: persona,
      fecha: new Date().toISOString()
    })
  }
  return ganadores
}

/** Participantes que no ganaron nada. */
export function sinPremio (asistentes, ganadores) {
  const ganaron = new Set(ganadores.map(g => g.numcredencial))
  return asistentes.filter(a => !ganaron.has(a.numcredencial))
}
