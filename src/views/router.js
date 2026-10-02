/**
 * Dos modos, no cuatro vistas: PANEL RIFA (pantalla completa) y PANEL ADMIN.
 * Entrar a pantalla completa activa la rifa; salir devuelve al admin.
 */
import { getEstado, setEstado, suscribir } from '../core/state.js'
import { alCambiar, activa } from '../core/fullscreen.js'
import * as admin from './admin/adminView.js'
import * as rifa from './rifa/rifaView.js'

let desmontar = null
let modoPrevio = null

export function iniciarRouter () {
  const raiz = document.getElementById('app')

  function montar () {
    const { modo } = getEstado()
    if (modo === modoPrevio) return
    modoPrevio = modo

    if (typeof desmontar === 'function') desmontar()
    raiz.innerHTML = ''
    desmontar = (modo === 'rifa' ? rifa : admin).render(raiz) || null
  }

  // La pantalla completa es la fuente de verdad del modo:
  // si el usuario sale con Esc o F11, el admin vuelve solo.
  alCambiar(enPantallaCompleta => {
    setEstado({ modo: enPantallaCompleta ? 'rifa' : 'admin' })
  })

  suscribir(montar)
  setEstado({ modo: activa() ? 'rifa' : 'admin' })
  montar()
}
