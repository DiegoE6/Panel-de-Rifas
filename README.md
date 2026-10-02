# Panel de Rifa

Aplicación web para conducir la rifa de un evento presencial: se cargan los
regalos y la lista de asistencia desde Excel o CSV, se sortea con una secuencia
animada a pantalla completa pensada para proyector, y al final se exportan los
ganadores.

Todo corre en el navegador. **No hay servidor, base de datos ni cuentas**: el
build es una carpeta estática que se abre con doble clic y funciona sin internet.

## El problema

En un evento con cientos de asistentes y decenas de regalos, la rifa suele
resolverse con papelitos o con una hoja de cálculo y `ALEATORIO()`. Las dos
opciones son lentas, poco vistosas en pantalla y difíciles de defender si alguien
pregunta si el sorteo fue justo.

Este panel separa las dos caras del problema:

- **Quien organiza** necesita cargar archivos tal como los tiene, ver de un vistazo
  si los datos cuadran (duplicados, vacíos, más regalos que personas) y llevarse
  un archivo con los resultados.
- **La audiencia** necesita un momento de suspenso y una lista de ganadores legible
  desde el fondo del salón.

## Stack

- **JavaScript vanilla** con módulos ES — sin framework.
- **Vite** para desarrollo y build (`base: './'`, rutas relativas).
- **SheetJS (`xlsx`)** para leer xlsx/xls/csv y exportar resultados.
- **tsParticles** para las capas ambientales de los temas, cargado con `import()`
  dinámico.
- **three.js** para los objetos 3D procedurales del tema navideño, también bajo
  demanda.
- **Web Animations API** y CSS para todo el movimiento; confeti propio en canvas.
- Tipografías vía `@fontsource` (Archivo Black, JetBrains Mono, Outfit),
  empaquetadas en el build.

## Cómo correrlo

Requiere Node.js 18 o superior.

```bash
npm install
npm run dev        # http://localhost:5173
```

Build de producción:

```bash
npm run build      # genera dist/
npm run preview    # sirve dist/ en http://localhost:5174
```

`dist/` es autocontenida: se puede abrir directamente `dist/index.html` desde el
explorador de archivos (protocolo `file://`) o subir tal cual a GitHub Pages,
Netlify o Vercel.

### Probarlo con datos de ejemplo

La carpeta [`ejemplos/`](ejemplos/) trae dos archivos ficticios para probar el
flujo completo sin datos reales:

| Archivo | Contenido |
|---|---|
| [`ejemplos/regalos.csv`](ejemplos/regalos.csv) | 15 regalos — columnas `numregalo`, `nombreregalo` |
| [`ejemplos/asistencia.csv`](ejemplos/asistencia.csv) | 80 personas — columnas `numcredencial`, `nombre`, `appaterno`, `apmaterno` |

Arrastra cada uno a su zona en la pestaña **Carga**, pulsa **Iniciar rifa** y
luego **Sortear** (o la barra espaciadora).

## Cómo se usa

La aplicación tiene dos modos y el cambio entre ellos lo decide la pantalla
completa:

- **Panel de administración** (ventana normal): carga de archivos, ajustes del
  evento, estadísticas y descarga de ganadores en xlsx o csv.
- **Panel de rifa** (pantalla completa): cuenta regresiva de 10 segundos, barra de
  generación, y la tabla de ganadores con recorrido automático. `Esc` sale y
  devuelve al admin; si la secuencia estaba corriendo, se cancela sin registrar
  nada.

Los encabezados de los archivos se comparan sin acentos, mayúsculas ni signos:
`Núm. Credencial`, `NUMCREDENCIAL` y `num_credencial` se reconocen como la misma
columna. Si falta una requerida, el panel muestra cuáles sí encontró.

La sesión se guarda en `localStorage`: si el navegador se cierra a media rifa, se
recupera.

## Decisiones técnicas

### Sorteo sin sesgo con `crypto.getRandomValues`

El generador por defecto no usa `Math.random()`, sino `crypto.getRandomValues`,
que no es predecible. Pero un número aleatorio de 32 bits reducido con `% n` no
es uniforme: si 2³² no es múltiplo de `n`, los primeros valores salen un poco más
seguido (sesgo de módulo). [`src/core/rng.js`](src/core/rng.js) lo resuelve con
muestreo por rechazo:

```js
const limite = Math.floor(0xFFFFFFFF / max) * max
do {
  crypto.getRandomValues(buffer)
  valor = buffer[0]
} while (valor >= limite)          // se descarta la cola que sesgaría
return valor % max
```

Sobre ese entero se construye un Fisher–Yates, y cada ganador sale del pool en
cuanto gana: nadie gana dos veces. Si hay más regalos que personas, el panel lo
avisa antes de empezar.

### Modo semilla reproducible

Si en Ajustes se escribe una semilla, el generador cambia a **mulberry32**
inicializado con un hash de ese texto. El mismo archivo con la misma semilla da
exactamente los mismos ganadores, así que el resultado se puede volver a correr
frente a cualquiera que lo cuestione. Sin semilla, el sorteo vuelve a ser
aleatorio real.

El motor del sorteo ([`src/core/raffle.js`](src/core/raffle.js)) es lógica pura y
no toca el DOM: los ganadores se calculan completos **antes** de que empiece la
animación, que solo los revela.

### Velocidad adaptativa del recorrido

Cuando la tabla de ganadores no cabe en pantalla, se desplaza sola en bucle. A una
velocidad fija, una lista de 130 ganadores tardaba más de siete minutos en dar la
vuelta. Ahora la velocidad se calcula para que el recorrido dure unos 110 segundos,
acotada entre 60 y 150 px/s: lo bastante rápida para no aburrir, lo bastante lenta
para leer cada nombre. El admin puede ajustar un factor manual, con topes absolutos,
y ve una estimación de cuánto dura cada vuelta antes de proyectar.

El recorrido se arma con la Web Animations API y no con una animación CSS porque
las pausas en los extremos (7 s arriba, 3 s abajo) tienen que ser segundos fijos,
no un porcentaje del ciclo. Además, solo se anima la entrada de las tarjetas
visibles: animar 130 a la vez creaba 130 capas compuestas y provocaba tirones.

### Gate de frecuencia para las animaciones

La regla que ordena todo el movimiento es: **cuanto más seguido se ve algo, menos
debe animarse.**

| Zona | Frecuencia | Presupuesto de motion |
|---|---|---|
| Panel admin (botones, pestañas, zonas de carga) | muchas veces por sesión | todo por debajo de 300 ms |
| Secuencia de la rifa | una vez por evento | los 10 segundos completos de espectáculo |

Reglas que se aplican en todo el proyecto:

- Curvas propias en tokens (`--ease-out: cubic-bezier(0.23, 1, 0.32, 1)`); nunca
  `ease-in` en UI, nunca `transition: all`, nunca entrar desde `scale(0)`.
- Solo se animan `transform` y `opacity`; ninguna transición toca el layout.
- La barra de progreso va en `linear`, y su porcentaje se lee del reloj de la
  propia animación para que nunca se desincronice.
- La marca vuela de la cuenta regresiva al encabezado con un FLIP sobre un clon
  en `position: fixed`, para no quedar recortada por el contenedor.
- `prefers-reduced-motion` conserva opacidad y color, quita desplazamiento y
  partículas.
- `alert()` y `confirm()` reemplazados por `<dialog>` nativo: no bloquean el hilo
  y sí se ven en pantalla completa.

### Temas por evento

Opcionales. Un tema no cambia el diseño: cambia el color de acento y añade una
capa de partículas geométricas detrás del contenido, con densidad y opacidad bajas
para no competir con los nombres. El motor de partículas se carga con `import()`
dinámico, así que si no hay tema nunca entra al arranque y Vite lo separa en su
propio chunk. Para agregar uno basta con registrarlo en
[`src/temas/temas.js`](src/temas/temas.js).

### Objeto 3D en una columna fija

Un tema puede declarar `escena3d: '<catálogo>'`. En la Posada Navideña sale al
azar uno de cinco objetos modelados por código, sin texturas ni archivos (trineo,
árbol, muñeco de nieve, casa de jengibre y corona).

Con objeto 3D, el panel de rifa se parte en dos columnas que no cambian entre
pantallas. La izquierda (34 %) lleva el nombre del evento y, debajo, el objeto
girando; se arma una sola vez y no se vuelve a tocar. La derecha va cambiando:
botón de inicio, cuenta regresiva, barra de carga y lista de ganadores. El objeto
nunca compite con el texto, porque cada uno tiene su columna, y la marca del
panel se oculta: el objeto ya es la identidad visual del evento.

- **three.js va en su propio chunk** (~195 KB gzip) y solo se descarga si el tema
  lo pide; el bundle inicial no cambia.
- **La lista se mide contra su columna.** Los tamaños de la tarjeta de ganador se
  redefinen en `cqw` sobre la columna derecha; los originales en `vw` se quedaban
  grandes en un 66 % de ancho.
- **Convive minutos con la lista.** Con los ganadores en pantalla la escena baja a
  30 fps para dejarle el hilo al recorrido. La resolución interna es dinámica:
  baja si la mediana de frames no llega al objetivo y se recupera cuando hay
  holgura sostenida, con un veto temporal para no oscilar entre dos niveles. El
  devicePixelRatio tiene un tope de 1.5 y el loop se detiene con la pestaña
  oculta.
- **Se destruye una sola vez,** al salir del panel de rifa: geometrías,
  materiales y contexto WebGL. Con `prefers-reduced-motion` el objeto se muestra
  quieto y sin loop.

## Estructura

```
src/
├── main.js
├── styles/        tokens · base · components · rifa
├── core/          state · storage · rng · raffle · fullscreen
├── data/          schema · fileReader · mapper · validator
├── views/
│   ├── router.js  alterna admin / rifa según la pantalla completa
│   ├── marca.js   marca SVG inline (currentColor)
│   ├── admin/     adminView · cargaPanel · dropzone · statsPanel · ganadoresPanel · dialogo
│   └── rifa/      rifaView · secuencia · tablaGanadores
├── temas/         temas · ambiente · escena3d
│   └── objetos3d/ un archivo por objeto + materiales y catálogo
├── animations/    confetti
└── export/        columns · exporter
ejemplos/          CSV ficticios para probar el panel
```

## Atajos

- `Barra espaciadora` — sortear
- `Esc` — cancelar la secuencia / salir de pantalla completa

## Licencia

[MIT](LICENSE) © Diego Enrique Paez Gallardo
