# Tradissea — web estática multiidioma

Sitio estático (ES · EN · DE) generado con un script propio de Node.js, sin
dependencias externas ni gestores de contenido. Se publica en Cloudflare.

- **Todos los textos viven en `content/`** y se editan a mano: ver
  [EDITAR-TEXTOS.md](EDITAR-TEXTOS.md).
- El diseño mantiene la identidad original (verde `#00807e`, azul `#c9efff`,
  amarillo `#fccc48`, tipografías Prata y Lexend).

## Empezar

```bash
npm run dev      # genera la web, la sirve en http://localhost:4000 y se recarga al guardar
npm run build    # genera la web en dist/
npm start        # sirve dist/ en el puerto 4000
npm run preview  # la sirve en http://localhost:8787 exactamente como lo hará Cloudflare
npm run deploy   # la publica en Cloudflare
```

No hace falta `npm install`: el proyecto no tiene dependencias. Para editar y
generar la web basta Node.js 18 o superior; `preview` y `deploy` usan la
herramienta de Cloudflare (`wrangler`, que se descarga sola) y piden Node.js 22
o superior.

## Estructura

```
content/            Textos (JSON por idioma) y páginas legales (Markdown)
src/css/site.css    Hoja de estilos
src/js/site.js      Menú, animaciones, juego, vídeo, formulario
src/worker.mjs      Código de Cloudflare: comprobación de palabras del juego
src/templates/      Plantillas de cada página
src/lib/            Conversor de Markdown
static/img          Imágenes y logotipos
static/fonts        Tipografías alojadas en el propio sitio
assets-fuente/      Originales en alta resolución (no se publican)
build.mjs           Generador del sitio
serve.mjs           Servidor local
dist/               Resultado (no se versiona; se genera al publicar)
```

### El logotipo

`static/img/logo-tradissea.svg` es vectorial: se ve nítido en cualquier pantalla
y a cualquier tamaño, y pesa unos 7 KB al servirse comprimido. Se generó
vectorizando el original en alta resolución, que se conserva en
`assets-fuente/`. El PNG que queda en `static/img/` ya no se usa en las páginas;
solo sirve para regenerar la imagen de redes sociales (`og-image.jpg`).

## Qué genera el build

- `/es/`, `/en/`, `/de/`: una sola página con todas las secciones (inicio,
  servicios, especialidades, tecnología, proceso, vídeo, quiénes somos y
  contacto), tres páginas legales, la página de descuentos con el juego y un
  404 por idioma.
- `/index.html` que detecta el idioma del navegador y redirige.
- `404.html` en la raíz y en cada idioma, `sitemap.xml`, `robots.txt` y
  `_headers` (cabeceras de caché y seguridad que aplica Cloudflare).
- Enlaces `hreflang` entre idiomas, datos estructurados JSON-LD y etiquetas
  Open Graph.
- CSS y JS con huella en el nombre (`site.2a6a04d3.css`) para que los
  navegadores no sirvan versiones antiguas.

El generador avisa por consola si un idioma tiene claves de más o de menos
respecto al español, que es el idioma de referencia.

## Publicar en Cloudflare

La web se publica como un Worker de «Static Assets»: Cloudflare sirve los
archivos de `dist/` desde su red, sin código de servidor. La configuración está
en [wrangler.toml](wrangler.toml).

### Publicación automática (recomendada)

Una sola vez, en el panel de Cloudflare:

1. **Workers & Pages → Create → Import a repository** y se elige el repositorio
   de GitHub.
2. Nombre del proyecto: `tradissea-web` (debe coincidir con `name` en
   `wrangler.toml`).
3. Comando de build: déjalo vacío. Comando de deploy: `npx wrangler deploy`
   (ya genera la web antes de subirla).

A partir de ahí, cada `push` a `main` regenera y publica la web en un par de
minutos. Las demás ramas generan una versión de prueba con su propia dirección,
sin tocar la web pública.

### Publicación a mano

```bash
npm run deploy
```

La primera vez pide entrar en la cuenta de Cloudflare desde el navegador.

### Dominio propio

En el Worker, **Settings → Domains & Routes → Add → Custom domain**, se escribe
`tradissea.com` (y otra vez para `www.tradissea.com`). Si el dominio ya está en
Cloudflare, los DNS y el HTTPS se configuran solos. Si está en otro proveedor,
primero hay que pasarlo a Cloudflare (**Add a site**) y cambiar los servidores
DNS donde se compró.

### Qué aporta Cloudflare

- **Páginas de error en su idioma:** `/es/loquesea` devuelve el 404 en español
  y `/en/nope` en inglés, sin redirecciones y con el código 404 correcto para
  Google. Fuera de las carpetas de idioma, el 404 de la raíz elige el idioma
  del visitante. `npm run dev` imita este comportamiento.
- **Caché larga:** el CSS y el JS se guardan un año en el navegador, porque
  llevan la huella en el nombre y cambian de nombre al cambiar. Las imágenes,
  una semana. Lo define `build.mjs` en `dist/_headers`.
- **Cabeceras de seguridad** básicas en todas las páginas.
- **Un poco de código propio** en `src/worker.mjs`: solo atiende `/api/` (la
  comprobación de palabras del juego) y el resto de la web se sirve sin pasar
  por él. Entra de sobra en el plan gratuito.

## Detalles y sorpresas de la web

Pequeños efectos y funciones que no se ven a primera vista. Las rutas son las
del servidor local (`npm run dev`); en la web publicada son las mismas detrás
de `tradissea.com`. Todos los efectos animados se desactivan solos si el
visitante tiene activado «reducir movimiento» en su sistema.

### «La palabra del día»: el juego de descuentos

- **Dónde verlo:** `/es/descuentos/`, `/en/discounts/` y `/de/rabatte/`. Se
  llega desde el enlace «Descuentos» del pie de página, en la columna legal.
- **Para qué sirve:** es un gancho comercial. Quien adivina la palabra de cinco
  letras en seis intentos gana un código de descuento (ahora un 10 %) para su
  próximo encargo. El botón del resultado lleva al formulario de contacto con
  el código ya escrito en el mensaje.
- **Cómo funciona:**
  - Cada idioma tiene su propia lista de palabras en `content/words.json`. Cada
    día toca la siguiente y es la misma para todo el mundo.
  - Las palabras que escribe el jugador se comprueban en Wikcionario sin
    distinguir tildes, ñ ni diéresis, porque el teclado del juego no las tiene:
    AUREO vale por «áureo». La consulta la hace Cloudflare (`/api/word`, en
    `src/worker.mjs`), no el navegador, así que Wikimedia no ve la IP de quien
    juega. Si Wikcionario no responde, la palabra se da por buena.
  - Las condiciones del descuento (validez, quién participa, derecho a rechazar
    códigos…) están en `game.terms` de cada idioma y se ven bajo el juego.
  - La partida del día se guarda en el navegador, así que recargar la página no
    da otra oportunidad.
- **Cómo es el código:** `TRAD-10-DDMM-XXXX` (prefijo, porcentaje, día y mes, y
  cuatro caracteres de control). El prefijo y el porcentaje se cambian en
  `content/site.json` → `discount`.
- **Ojo:** todo ocurre en el navegador, sin servidor. Alguien con conocimientos
  técnicos puede sacar la palabra o el código leyendo el JavaScript de la
  página. Para un descuento del 10 % es razonable, pero conviene comprobar a
  mano que la fecha del código es reciente antes de aplicarlo.
- **Código:** `src/templates/game.mjs` (página) y `src/js/site.js`, sección
  «La palabra del día».

### El mar del pie de página

- **Dónde verlo:** al final de cualquier página, en la ola azul que hay justo
  encima del pie.
- **Qué hace:** al pasar el ratón (o el dedo) por encima, el agua se agita y
  salpican burbujas y letras: la virgulilla `~`, la eszett `ß` y el apóstrofo
  `’`, los tres signos del patrón de la marca, en los colores de Tradissea. Al
  hacer clic salta una salpicadura más grande. En el móvil, el mar rompe solo
  la primera vez que aparece en pantalla.
- **Código:** `src/js/site.js`, sección «El mar del pie», y
  `src/templates/layout.mjs` (`data-wave`).

### Títulos que se escriben solos y se corrigen

- **Dónde verlo:** en la portada, al hacer scroll. Lo hacen los títulos de
  cada sección («Servicios», «Cómo trabajamos», «Contacta con nosotros»…).
- **Qué hace:** cuando el título entra en pantalla, se teclea letra a letra.
  Hacia la mitad mete una errata con una tecla vecina del teclado (subrayada en
  rojo), escribe un par de letras más, «se da cuenta», borra hasta el fallo y
  lo corrige. Es un guiño a la corrección de textos, uno de los servicios de
  la agencia. La errata es aleatoria, así que cada visita es distinta.
- **Accesibilidad:** los lectores de pantalla leen el título completo y
  correcto; la animación es una copia decorativa.
- **Código:** `src/js/site.js`, sección «Títulos que se escriben».

### El eslogan a máquina

- **Dónde verlo:** en la tarjeta de la portada, junto al logotipo.
- **Qué hace:** «Navigating cultures» → «languages» → «translations». Solo se
  borra y se reescribe la última palabra.
- **Textos:** `footer.tagline` en cada archivo de idioma.

### Tarjetas de servicios que se amplían

- **Dónde verlo:** sección «Servicios» de la portada. Las seis tarjetas tienen
  una lupa en la esquina.
- **Qué hace:** al hacer clic, la tarjeta gira en 3D y se amplía hasta
  convertirse en una ventana con la explicación completa del servicio. Se
  cierra con la ✕, con Escape o haciendo clic fuera. Sin JavaScript funcionan
  como desplegables normales.
- **En el móvil:** la sección se queda fija y el scroll vertical pasa las
  tarjetas de lado, como un carrusel con puntos de posición. También se pueden
  arrastrar con el dedo.
- **Textos:** `home.services.items` (el detalle sale de `body` y `list`).

### El tren de «Cómo trabajamos»

- **Dónde verlo:** sección «Cómo trabajamos» de la portada.
- **Qué hace:** al llegar a ella, un convoy recorre la línea de las cuatro
  fases y se para en cada estación, que se ilumina al llegar. Es un guiño a la
  especialidad en traducción ferroviaria. En el móvil la línea es vertical.

### Y además

- **Mapa de clientes:** mapamundi de puntos en el que los países de los clientes
  (Canva, DeepL, Talgo, Lionbridge) se pintan en amarillo, con un cartelito por
  ciudad. Se configura en `content/site.json` → `clients`.
- **Página 404 con humor:** cualquier dirección inexistente (por ejemplo
  `/es/loquesea`) muestra un chiste de corrector distinto en cada idioma: la
  «cocreta» de la RAE en español, «irregardless» en inglés y «Macher» en
  alemán. Sale en el idioma del navegador del visitante.
- **Aviso en movimiento:** franja superior con texto desplazándose y botón de
  pausa. Se cambia en `announcement.text` de cada idioma.
- **El menú sigue la lectura:** el enlace del menú se subraya según la sección
  que se está leyendo.
- **El idioma se recuerda:** quien entra en `/` va al idioma de su navegador o
  al último que eligió.
- **Correo a prueba de spam:** ver «Decisiones técnicas».

## Decisiones técnicas

- **El correo nunca se publica entero**: va partido en el HTML y el navegador lo
  recompone, para que los rastreadores de spam no lo encuentren. Sin JavaScript
  se lee «paula (arroba) tradissea.com» y el enlace lleva al formulario.
- **Mapa de clientes**: mapamundi de puntos generado desde datos abiertos
  (Natural Earth vía world-atlas) con el script `scripts/dotmap.mjs`; pesa 37 KB
  (unos 6 KB al servirse comprimido) y no depende de ningún servicio externo.
- **Sin cookies ni rastreo.** En `localStorage` solo se guardan el idioma
  elegido y la partida del día del juego.
- **«La palabra del día»** (`/es/descuentos/`): juego propio, sin librerías. La
  palabra sale de la fecha, así que es la misma para todos sin servidor, y viaja
  codificada para que no se lea en el código de la página. El código de
  descuento incluye el porcentaje configurado en `site.json`. No usa el nombre
  ni el diseño de Wordle, que son marca del New York Times.
- **El vídeo de YouTube no se carga hasta que se pulsa el play**, y entonces usa
  `youtube-nocookie.com`.
- **Tipografías alojadas en el propio dominio**: no se conecta con Google Fonts.
- **Formulario**: sin `endpoint` configurado abre el programa de correo del
  visitante; con un endpoint (Formspree o similar) lo envía en segundo plano.
  Incluye campo trampa antispam y validación accesible. La casilla de
  consentimiento enlaza a la política de privacidad, que empieza con la
  información básica sobre protección de datos que recomienda la AEPD.
- **Accesibilidad**: revisado con axe (WCAG 2.1 AA) en todas las plantillas;
  navegación por teclado, textos alternativos, foco visible y respeto por
  `prefers-reduced-motion`.
