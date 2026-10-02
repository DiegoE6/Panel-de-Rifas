/**
 * Temas por evento.
 *
 * Un tema NO cambia el diseño: cambia dos variables. El color de acento
 * (que hoy es el oro) y una capa de partículas ambientales. Misma tipografía,
 * mismo layout, mismo ritmo. Así se lee como "tema del evento" sin que dos
 * diseños peleen en la misma pantalla.
 *
 * `escena3d` (opcional) nombra un catálogo de src/temas/objetos3d/index.js:
 * en la rifa sale un objeto de ese catálogo girando detrás del nombre del
 * evento y de la cuenta regresiva. Sin el campo, la secuencia es la de
 * siempre con la marca.
 *
 * Ninguno usa emoji ni clip-art: todo son formas geométricas teñidas del
 * acento. Las densidades son bajas a propósito — esto corre DETRÁS de nombres
 * que la audiencia tiene que leer desde el fondo del salón.
 */

/** Opciones compartidas: sin interacción, montado en un contenedor propio. */
const BASE = {
  fullScreen: { enable: false },
  detectRetina: true,
  fpsLimit: 40,        // ambiente de fondo: 40 se ve igual y cuesta un tercio menos
  pauseOnBlur: true,
  pauseOnOutsideViewport: true,
  interactivity: { events: { onHover: { enable: false }, onClick: { enable: false } } }
}

/** Cae desde arriba, con deriva lateral. */
function cayendo ({ color, shape, size, cantidad, velocidad, opacidad, rotar = false, shapeOptions }) {
  return {
    ...BASE,
    particles: {
      color: { value: color },
      shape: shape === 'rect' ? { type: 'square' } : { type: shape, options: shapeOptions },
      number: { value: cantidad, density: { enable: true, area: 1000 } },
      opacity: { value: opacidad },
      size: { value: size },
      move: {
        enable: true,
        direction: 'bottom',
        speed: velocidad,
        straight: false,
        random: true,
        outModes: 'out'
      },
      wobble: { enable: true, distance: 14, speed: 8 },
      ...(rotar ? { rotate: { value: { min: 0, max: 360 }, direction: 'random', animation: { enable: true, speed: 12, sync: false } } } : {}),
      zIndex: { value: { min: 0, max: 60 } }
    }
  }
}

/** Sube desde abajo y se apaga al llegar arriba. */
function subiendo ({ color, shape, size, cantidad, velocidad, opacidad }) {
  return {
    ...BASE,
    particles: {
      color: { value: color },
      shape: { type: shape },
      number: { value: cantidad, density: { enable: true, area: 1000 } },
      opacity: {
        value: opacidad,
        animation: { enable: true, speed: 0.4, startValue: 'max', destroy: 'min', sync: false }
      },
      size: { value: size },
      move: {
        enable: true,
        direction: 'top',
        speed: velocidad,
        straight: false,
        random: true,
        outModes: 'out'
      },
      wobble: { enable: true, distance: 20, speed: 6 },
      zIndex: { value: { min: 0, max: 60 } }
    }
  }
}

export const TEMAS = {
  ninguno: {
    nombre: 'Sin tema',
    descripcion: 'El diseño base, sin partículas.',
    acento: null,
    particulas: null
  },

  servidor: {
    nombre: 'Día del Servidor Público',
    descripcion: 'Oro institucional, sin partículas. El más formal.',
    acento: null,                       // conserva el oro de la casa
    particulas: null
  },

  madres: {
    nombre: 'Día de las Madres',
    descripcion: 'Rosa y pétalos cayendo.',
    acento: { base: '#F2A5BE', suave: '#F8CBD9' },
    particulas: cayendo({
      color: ['#F2A5BE', '#F8CBD9', '#E88CAB'],
      shape: 'circle', size: { min: 5, max: 11 },
      cantidad: 70, velocidad: { min: 1, max: 2.4 }, opacidad: { min: 0.15, max: 0.45 }
    })
  },

  padre: {
    nombre: 'Día del Padre',
    descripcion: 'Azul acero con chispas cálidas subiendo.',
    acento: { base: '#8FBEEA', suave: '#B9D8F4' },
    particulas: subiendo({
      color: ['#E8934D', '#E8B54D', '#C9743A'],
      shape: 'circle', size: { min: 1.5, max: 3.5 },
      cantidad: 90, velocidad: { min: 0.5, max: 1.4 }, opacidad: { min: 0.2, max: 0.6 }
    })
  },

  nino: {
    nombre: 'Día del Niño',
    descripcion: 'Globos de colores subiendo. El único donde lo juguetón es correcto.',
    // El ámbar anterior quedaba a ΔE 6 del oro base: el ojo no lo registraba
    // como otro color y el tema parecía "solo partículas". Morado es el más
    // lejano de todos los demás acentos.
    acento: { base: '#A96BFF', suave: '#C9A3FF' },
    particulas: subiendo({
      color: ['#F2545B', '#4EA8DE', '#57CC99', '#F2C14E', '#B15EFF'],
      shape: 'circle', size: { min: 9, max: 18 },
      cantidad: 26, velocidad: { min: 0.7, max: 1.6 }, opacidad: { min: 0.25, max: 0.5 }
    })
  },

  secretarias: {
    nombre: 'Día de las Secretarias',
    descripcion: 'Jade y hojas de papel volteando al caer.',
    acento: { base: '#6FD6B0', suave: '#A5E8CF' },
    particulas: cayendo({
      color: ['#6FD6B0', '#A5E8CF', '#4FB894'],
      shape: 'rect', size: { min: 6, max: 13 },
      cantidad: 55, velocidad: { min: 1.2, max: 2.6 }, opacidad: { min: 0.15, max: 0.4 },
      rotar: true
    })
  },

  posada: {
    nombre: 'Posada Navideña',
    descripcion: 'Verde, nieve cayendo y un objeto navideño en 3D.',
    acento: { base: '#7FD99A', suave: '#B2EAC2' },
    escena3d: 'navidad',
    particulas: cayendo({
      color: ['#FFFFFF', '#DFF3E6'],
      shape: 'circle', size: { min: 2, max: 7 },
      cantidad: 120, velocidad: { min: 0.8, max: 2 }, opacidad: { min: 0.2, max: 0.55 }
    })
  }
}

export const CLAVES_TEMA = Object.keys(TEMAS)
