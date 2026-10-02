/** Punto de entrada. */

// Tipografías empaquetadas: el dist del evento corre sin internet
import '@fontsource/archivo-black/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/700.css'
import '@fontsource-variable/outfit'

import './styles/tokens.css'
import './styles/base.css'
import './styles/components.css'
import './styles/rifa.css'

import { restaurar } from './core/state.js'
import { iniciarRouter } from './views/router.js'

restaurar()      // recupera la sesión si el navegador se cerró a media rifa
iniciarRouter()
