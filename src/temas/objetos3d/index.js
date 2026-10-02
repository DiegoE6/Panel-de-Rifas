/**
 * Catálogos de objetos 3D por evento.
 *
 * Un tema activa su escena con `escena3d: '<catálogo>'` en temas.js. Para
 * sumar objetos de otro evento: un archivo por objeto que exporte su build
 * (recibe el kit de materiales.js y devuelve un THREE.Group) y un catálogo
 * nuevo aquí. La escena no cambia.
 *
 * `giro` es opcional:
 *   'completo' (default)  vuelta entera sobre Y
 *   'oscilar'             vaivén de ±35°; para objetos planos que de canto
 *                         se reducirían a una raya detrás del texto
 */
import { trineo } from './trineo.js'
import { arbol } from './arbol.js'
import { muneco } from './muneco.js'
import { casa } from './casa.js'
import { corona } from './corona.js'

export const CATALOGOS = {
  navidad: [
    { id: 'trineo', label: 'Trineo con regalos', build: trineo },
    { id: 'arbol',  label: 'Árbol',              build: arbol },
    { id: 'muneco', label: 'Muñeco de nieve',    build: muneco },
    { id: 'casa',   label: 'Casa de jengibre',   build: casa },
    { id: 'corona', label: 'Corona',             build: corona, giro: 'oscilar' }
  ]
}
