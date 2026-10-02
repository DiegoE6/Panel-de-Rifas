/**
 * Confeti propio en canvas. Sin dependencias: garantiza que el panel
 * funcione offline y que el build no dependa de terceros.
 */

const COLORES = ['#00f0ff', '#ff00c8', '#ffc94d', '#ffffff', '#34d399']

export function celebrar (duracionMs = 3000, cantidad = 220) {
  const canvas = document.createElement('canvas')
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200'
  canvas.width = window.innerWidth
  canvas.height = window.innerHeight
  document.body.appendChild(canvas)

  const ctx = canvas.getContext('2d')
  const piezas = Array.from({ length: cantidad }, () => crearPieza(canvas))
  const inicio = performance.now()

  ;(function frame (t) {
    const transcurrido = t - inicio
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    piezas.forEach(p => {
      p.vy += 0.12                         // gravedad
      p.vx *= 0.995                        // rozamiento
      p.x += p.vx
      p.y += p.vy
      p.rot += p.vrot

      ctx.save()
      ctx.translate(p.x, p.y)
      ctx.rotate(p.rot)
      ctx.globalAlpha = Math.max(0, 1 - transcurrido / duracionMs)
      ctx.fillStyle = p.color
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h)
      ctx.restore()
    })

    if (transcurrido < duracionMs) requestAnimationFrame(frame)
    else canvas.remove()
  })(inicio)
}

function crearPieza (canvas) {
  // Dos chorros laterales, como los canones de un escenario
  const desdeIzquierda = Math.random() < 0.5
  const impulso = 7 + Math.random() * 9
  const angulo = (desdeIzquierda ? -1 : 1) * (Math.PI / 3.2) * (0.6 + Math.random() * 0.8)

  return {
    x: desdeIzquierda ? 0 : canvas.width,
    y: canvas.height * (0.55 + Math.random() * 0.25),
    vx: (desdeIzquierda ? 1 : -1) * impulso * Math.cos(angulo),
    vy: -impulso * Math.abs(Math.sin(angulo)) - Math.random() * 6,
    w: 6 + Math.random() * 8,
    h: 4 + Math.random() * 6,
    rot: Math.random() * Math.PI,
    vrot: (Math.random() - 0.5) * 0.3,
    color: COLORES[Math.floor(Math.random() * COLORES.length)]
  }
}
