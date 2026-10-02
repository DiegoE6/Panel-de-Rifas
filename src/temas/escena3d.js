/**
 * Escena 3D del tema: un objeto girando en la columna izquierda del panel de
 * rifa, debajo del nombre del evento, durante TODA la rifa (inicio, cuenta,
 * carga y ganadores).
 *
 * Este módulo importa three de forma estática, así que NUNCA se importa de
 * forma estática: la vista de rifa lo pide con import() solo cuando el tema lo
 * usa. Vite lo parte junto con three en su propio chunk y el arranque no lo
 * paga (igual que tsParticles en ambiente.js).
 *
 * Ciclo de vida, una escena a la vez:
 *   montar(catalogo)  arma renderer + objeto, devuelve qué objeto tocó
 *   anclar(hueco)     mete el lienzo en su hueco y arranca el loop
 *   limitarFps(n)     tope de cuadros por segundo (null = los del monitor)
 *   desmontar()       dispose de geometrías, materiales y renderer. Solo al
 *                     salir del panel de rifa.
 *
 * Rendimiento: el panel corre proyectado en hardware modesto y, con la lista
 * de ganadores, el objeto convive minutos con la nieve y el recorrido. DPR
 * tope 1.5, sin sombras, resolución dinámica (ver regular()), tope de fps
 * para ceder hilo a la lista, el loop se detiene con la pestaña oculta, y con
 * movimiento reducido no hay loop: se pinta solo al redimensionar.
 */
import * as THREE from 'three'
import { CATALOGOS } from './objetos3d/index.js'
import { crearKit } from './objetos3d/materiales.js'

const DPR_MAX = 1.5
const FOV = 28                       // tele corto: poca deformación de perspectiva
const ELEVACION = 0.16               // rad: la cámara mira un poco desde arriba
const OCUPA = 0.9                    // fracción del hueco que llena el objeto
const VUELTA_S = 30                  // segundos por vuelta completa
const OSCILA_RAD = 0.61              // ±35° para objetos con giro 'oscilar'
const ANGULO_REPOSO = -0.55          // vista de tres cuartos
const MARGEN_ARRIBA = 0.1            // aire entre el borde superior del hueco y el objeto

/* Resolución dinámica. Cada MUESTRAS cuadros pintados se mira la mediana del
   intervalo contra el objetivo (60 fps, o el tope si lo hay):
   - Lento (> objetivo · LENTO): baja. El costo crece con el cuadrado de la
     escala, así que el paso es proporcional a lo que falta; en un equipo muy
     lento llega al mínimo de un salto.
   - Holgado (< objetivo · HOLGADO) por VENTANAS_PARA_SUBIR seguidas: sube un
     paso. Así un tirón al arrancar no degrada la imagen el resto del evento.
   - Si una subida provoca una bajada enseguida, ese nivel queda vetado un
     rato (TECHO_MS): sin esto oscilaría entre dos escalas y se notaría. */
const MUESTRAS = 30
const LENTO = 1.33                   // a 60 fps objetivo: ~45 fps
const HOLGADO = 1.15                 // a 60 fps objetivo: ~52 fps
const VENTANAS_PARA_SUBIR = 4        // ~2 s a 60 fps, ~4 s a 30
const PASO_ESCALA = 0.75
const ESCALA_MIN = 0.5
const TECHO_MS = 30000

let actual = null
let ultimoId = null                  // no repetir objeto en entradas seguidas

/**
 * @param {string} clave catálogo de objetos3d/index.js
 * @returns {{id: string, label: string} | null}
 */
export function montar (clave) {
  desmontar()
  const lista = CATALOGOS[clave]
  if (!lista?.length) return null

  /* Math.random y no rng.js a propósito: con semilla, rng.js es el generador
     del sorteo, y sacar un número aquí correría la secuencia y cambiaría a
     los ganadores. Esto es decoración, no necesita ser auditable. */
  const opciones = lista.length > 1 ? lista.filter(o => o.id !== ultimoId) : lista
  const objeto = opciones[Math.floor(Math.random() * opciones.length)]
  ultimoId = objeto.id

  const elemento = document.createElement('div')
  elemento.className = 'escena3d'
  elemento.dataset.objeto = objeto.id          // para depurar: qué objeto tocó
  elemento.setAttribute('aria-hidden', 'true')

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
  const dprBase = Math.min(window.devicePixelRatio || 1, DPR_MAX)
  renderer.setPixelRatio(dprBase)
  renderer.setClearColor(0x000000, 0)          // transparente: se ve el fondo tinta
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.15
  elemento.appendChild(renderer.domElement)

  const escena = new THREE.Scene()
  const camara = new THREE.PerspectiveCamera(FOV, 1, 0.05, 60)
  iluminar(escena)

  const kit = crearKit()
  const modelo = objeto.build(kit)

  // El objeto gira sobre SU centro, no sobre el origen con el que se modeló
  const caja = new THREE.Box3().setFromObject(modelo)
  const tam = caja.getSize(new THREE.Vector3())
  modelo.position.sub(caja.getCenter(new THREE.Vector3()))
  const pivote = new THREE.Group()
  pivote.add(modelo)
  pivote.rotation.y = ANGULO_REPOSO
  escena.add(pivote)

  const oscila = objeto.giro === 'oscilar'
  const medidas = {
    alto: tam.y / 2,
    // Ancho máximo que puede llegar a proyectar mientras gira
    ancho: oscila
      ? tam.x / 2 + (tam.z / 2) * Math.sin(OSCILA_RAD)
      : Math.hypot(tam.x, tam.z) / 2,
    fondo: Math.hypot(tam.x, tam.z) / 2
  }

  const lienzo = { ancho: 0, alto: 0 }
  const reducido = matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf = 0
  let ultimo = 0
  let tiempo = 0
  let intervaloMin = 0               // ms entre cuadros pintados; 0 = sin tope

  // --- resolución dinámica ---
  let escala = 1
  let ventanasHolgadas = 0
  let ultimaSubida = -Infinity
  let techo = Infinity
  let techoHasta = 0
  const muestras = []

  function aplicarEscala (nueva, ahora, subiendo) {
    escala = nueva
    if (subiendo) ultimaSubida = ahora
    renderer.setPixelRatio(dprBase * escala)
    if (lienzo.ancho) renderer.setSize(lienzo.ancho, lienzo.alto, false)
    elemento.dataset.escala = escala.toFixed(2)   // para depurar
  }

  function regular (dt, ahora) {
    muestras.push(dt)
    if (muestras.length < MUESTRAS) return
    const mediana = muestras.sort((a, b) => a - b)[MUESTRAS >> 1]
    muestras.length = 0
    const objetivo = (intervaloMin || 1000 / 60) / 1000

    if (mediana > objetivo * LENTO) {
      ventanasHolgadas = 0
      // Recién subió y ya no aguanta: ese nivel queda vetado un rato
      if (ahora - ultimaSubida < 3000) { techo = escala; techoHasta = ahora + TECHO_MS }
      if (escala > ESCALA_MIN) {
        aplicarEscala(Math.max(ESCALA_MIN, escala * Math.min(PASO_ESCALA, Math.sqrt(objetivo * LENTO / mediana))), ahora, false)
      }
    } else if (mediana < objetivo * HOLGADO) {
      if (++ventanasHolgadas < VENTANAS_PARA_SUBIR || escala >= 1) return
      ventanasHolgadas = 0
      const nueva = Math.min(1, escala / PASO_ESCALA)
      if (nueva >= techo && ahora < techoHasta) return
      aplicarEscala(nueva, ahora, true)
    } else {
      ventanasHolgadas = 0
    }
  }

  function pintar () { renderer.render(escena, camara) }

  function frame (ahora) {
    raf = 0
    // Con tope de fps se saltan cuadros del monitor (−2 ms de holgura: a 60 Hz
    // un tope de 30 cae justo en cuadros alternos)
    if (ultimo && intervaloMin && ahora - ultimo < intervaloMin - 2) { pedir(); return }
    const dt = ultimo ? Math.min(0.1, (ahora - ultimo) / 1000) : 0   // tope: un tirón no se convierte en salto
    ultimo = ahora
    tiempo += dt
    if (dt) regular(dt, ahora)
    pivote.rotation.y = oscila
      ? ANGULO_REPOSO + Math.sin(tiempo * 0.35) * OSCILA_RAD
      : ANGULO_REPOSO + tiempo * (Math.PI * 2 / VUELTA_S)
    kit.luces.forEach((m, i) => { m.emissiveIntensity = 0.35 + 1.1 * (0.5 + 0.5 * Math.sin(tiempo * 2.4 + i * 1.7)) })
    pintar()
    pedir()
  }

  function pedir () {
    if (reducido || raf || document.hidden || !elemento.isConnected) return
    raf = requestAnimationFrame(frame)
  }

  function detener () {
    if (raf) cancelAnimationFrame(raf)
    raf = 0
    ultimo = 0                      // al volver no se acumula el tiempo pausado
    muestras.length = 0             // ni se mezclan frames de antes y después
  }

  function fijarFps (fps) {
    intervaloMin = fps ? 1000 / fps : 0
    muestras.length = 0             // el objetivo cambió: las muestras viejas no valen
    ventanasHolgadas = 0
  }

  const onVisible = () => (document.hidden ? detener() : pedir())
  document.addEventListener('visibilitychange', onVisible)

  if (reducido) kit.luces.forEach(m => { m.emissiveIntensity = 1 })

  const observador = new ResizeObserver(([entrada]) => {
    const { width, height } = entrada.contentRect
    if (!width || !height) return
    lienzo.ancho = width
    lienzo.alto = height
    renderer.setSize(width, height, false)     // el CSS dimensiona el canvas
    encuadrar(camara, medidas, lienzo)
    pintar()                                    // sin esperar al siguiente frame: no parpadea vacío
  })
  observador.observe(elemento)

  elemento.dataset.escala = '1.00'
  actual = { elemento, renderer, escena, observador, onVisible, pedir, detener, fijarFps }
  return { id: objeto.id, label: objeto.label }
}

/** Mete el lienzo en su hueco y arranca el loop. */
export function anclar (hueco) {
  if (!actual || !hueco) return
  const { elemento } = actual
  if (elemento.parentNode !== hueco) {
    hueco.appendChild(elemento)
    elemento.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 900, easing: 'cubic-bezier(0.23, 1, 0.32, 1)' })
  }
  actual.pedir()
}

/**
 * Tope de fps. Con la lista de ganadores en pantalla se baja a 30: un objeto
 * girando lento se ve igual, y el hilo que sobra es para el recorrido, que
 * es lo que de verdad tiene que ir suave.
 * @param {number|null} fps
 */
export function limitarFps (fps) {
  actual?.fijarFps(fps)
}

/** Libera todo: después de esto no queda canvas, contexto ni loop. */
export function desmontar () {
  if (!actual) return
  const { elemento, renderer, escena, observador, onVisible, detener } = actual
  actual = null

  detener()
  observador.disconnect()
  document.removeEventListener('visibilitychange', onVisible)

  // Geometrías y materiales se comparten entre mallas: un Set evita el doble dispose
  const geometrias = new Set()
  const materiales = new Set()
  escena.traverse(o => {
    if (o.geometry) geometrias.add(o.geometry)
    if (o.material) [].concat(o.material).forEach(m => materiales.add(m))
  })
  geometrias.forEach(g => g.dispose())
  materiales.forEach(m => m.dispose())

  renderer.dispose()
  renderer.forceContextLoss()      // el navegador suelta el contexto ya, no cuando pase el GC
  elemento.remove()
}

/**
 * Key light cálida, relleno frío tenue y un contraluz que recorta la silueta
 * contra el fondo tinta. Los objetos se diseñaron sobre crema con luz de
 * estudio neutra: aquí esa luz los dejaba apagados.
 */
function iluminar (escena) {
  escena.add(new THREE.HemisphereLight(0x8fa6d8, 0x1a120c, 0.45))   // ambiente frío desde arriba

  const key = new THREE.DirectionalLight(0xffd1a0, 3.2)
  key.position.set(-2.6, 3.2, 3.4)
  escena.add(key)

  const relleno = new THREE.DirectionalLight(0x7d98ff, 0.55)
  relleno.position.set(3, 0.6, 2)
  escena.add(relleno)

  const contra = new THREE.DirectionalLight(0xffe2bd, 2.4)
  contra.position.set(1.8, 2.4, -3.6)
  escena.add(contra)
}

/**
 * Aleja la cámara lo justo para que el objeto llene OCUPA del hueco, gire
 * como gire, y lo sube hasta el borde superior del hueco.
 * medidas: semialto, semiancho máximo al girar y radio horizontal (mundo).
 *
 * Arriba y no centrado: el hueco es más alto que ancho, así que los objetos
 * anchos (casa, trineo) los limita el ancho y sobra alto. Centrados flotaban
 * lejos del nombre; pegados arriba, nombre y objeto se leen como un bloque.
 * Los objetos altos ya llenan el alto y no se mueven.
 */
function encuadrar (camara, { alto, ancho, fondo }, lienzo) {
  const aspecto = lienzo.ancho / lienzo.alto
  const tanV = Math.tan(THREE.MathUtils.degToRad(FOV / 2))
  const tanH = tanV * aspecto
  /* + un tercio del fondo: lo que gira hacia la cámara se ve más grande. Sumar
     el fondo entero era demasiado conservador y dejaba el objeto chico. */
  const distancia = Math.max(alto / (tanV * OCUPA), ancho / (tanH * OCUPA)) + fondo * 0.3
  // Fracción del semialto visible que ocupa el objeto; lo que sobra se usa para subirlo
  const ocupa = alto / (distancia * tanV)
  const subir = Math.max(0, 1 - ocupa - MARGEN_ARRIBA) * distancia * tanV
  camara.aspect = aspecto
  camara.position.set(0, Math.sin(ELEVACION) * distancia - subir, Math.cos(ELEVACION) * distancia)
  camara.lookAt(0, -subir, 0)
  camara.updateProjectionMatrix()
}
