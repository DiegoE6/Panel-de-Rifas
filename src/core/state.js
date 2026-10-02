/**
 * Store central. Toda vista lee de aquí y se suscribe a los cambios.
 */
import { guardar, cargar, limpiar } from './storage.js'

const ESTADO_INICIAL = {
  modo: 'admin',          // 'admin' | 'rifa'
  pestana: 'carga',       // carga | stats | ganadores

  archivos: {
    regalos:    { nombre: null, headers: [], filas: [] },
    asistencia: { nombre: null, headers: [], filas: [] }
  },
  mapeo: { regalos: {}, asistencia: {} },

  regalos: [],
  asistentes: [],
  ganadores: [],
  sorteoHecho: false,

  config: {
    nombreEvento: '',     // se muestra en el panel de rifa
    tema: 'ninguno',      // tema visual por tipo de evento (opcional)
    velocidad: 1,         // factor sobre la velocidad calculada del recorrido
    semilla: null,        // null = aleatorio real; texto = sorteo reproducible
    confeti: true
  },

  columnasExport: []
}

const CLAVE = 'panel-rifa:v2'

let estado = structuredClone(ESTADO_INICIAL)
const suscriptores = new Set()

export const getEstado = () => estado

export function setEstado (parche) {
  estado = { ...estado, ...(typeof parche === 'function' ? parche(estado) : parche) }
  guardar(CLAVE, estado)
  suscriptores.forEach(fn => fn(estado))
  return estado
}

export const setConfig = parche => setEstado({ config: { ...estado.config, ...parche } })

export function suscribir (fn) {
  suscriptores.add(fn)
  return () => suscriptores.delete(fn)
}

/** Recupera la sesión anterior si el navegador se cerró a media rifa. */
export function restaurar () {
  const previo = cargar(CLAVE)
  if (previo) estado = { ...structuredClone(ESTADO_INICIAL), ...previo, modo: 'admin' }
  return estado
}

/** Borra el resultado; conserva los archivos cargados. */
export const reiniciarSorteo = () => setEstado({ ganadores: [], sorteoHecho: false })

export function reiniciarTodo () {
  limpiar(CLAVE)
  estado = structuredClone(ESTADO_INICIAL)
  suscriptores.forEach(fn => fn(estado))
  return estado
}

/** ¿Hay datos suficientes para sortear? */
export const listoParaSortear = () => estado.regalos.length > 0 && estado.asistentes.length > 0
