/**
 * Columnas exactas de los dos archivos.
 * El encabezado se compara normalizado (sin acentos, sin espacios ni signos),
 * así que "Num. Regalo", "NUMREGALO" y "num_regalo" caen en el mismo campo.
 */

export const ESQUEMA_REGALOS = {
  numregalo:    { etiqueta: 'Núm. regalo', requerido: true },
  nombreregalo: { etiqueta: 'Regalo',      requerido: true }
}

export const ESQUEMA_ASISTENCIA = {
  numcredencial: { etiqueta: 'Núm. credencial', requerido: true },
  nombre:        { etiqueta: 'Nombre',          requerido: true },
  appaterno:     { etiqueta: 'Apellido paterno', requerido: false },
  apmaterno:     { etiqueta: 'Apellido materno', requerido: false }
}

/** Columnas que se ofrecen al exportar ganadores. */
export const COLUMNAS_EXPORT = [
  { clave: 'ronda',         etiqueta: '#',               porDefecto: true },
  { clave: 'numregalo',     etiqueta: 'Núm. regalo',     porDefecto: true },
  { clave: 'regalo',        etiqueta: 'Regalo',          porDefecto: true },
  { clave: 'numcredencial', etiqueta: 'Núm. credencial', porDefecto: true },
  { clave: 'nombreCompleto',etiqueta: 'Ganador',         porDefecto: true },
  { clave: 'nombre',        etiqueta: 'Nombre',          porDefecto: false },
  { clave: 'appaterno',     etiqueta: 'A. paterno',      porDefecto: false },
  { clave: 'apmaterno',     etiqueta: 'A. materno',      porDefecto: false },
  { clave: 'fecha',         etiqueta: 'Fecha y hora',    porDefecto: true }
]
