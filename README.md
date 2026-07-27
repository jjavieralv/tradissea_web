# Tradissea — web estática multiidioma

Sitio estático (ES · EN · DE) generado con un script propio de Node.js, sin
dependencias externas ni gestores de contenido. Pensado para publicarse en
GitHub Pages.

- **Todos los textos viven en `content/`** y se editan a mano: ver
  [EDITAR-TEXTOS.md](EDITAR-TEXTOS.md).
- El diseño mantiene la identidad original (verde `#00807e`, azul `#c9efff`,
  amarillo `#fccc48`, tipografías Prata y Lexend).

## Empezar

```bash
npm run dev      # genera la web, la sirve en http://localhost:4000 y se recarga al guardar
npm run build    # genera la web en dist/
npm start        # sirve dist/ en el puerto 4000
```

No hace falta `npm install`: el proyecto no tiene dependencias. Solo Node.js 18 o
superior.

## Estructura

```
content/            Textos (JSON por idioma) y páginas legales (Markdown)
src/css/site.css    Hoja de estilos
src/js/site.js      Menú, vídeo, formulario
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
- `404.html`, `sitemap.xml`, `robots.txt`, `.nojekyll`.
- Enlaces `hreflang` entre idiomas, datos estructurados JSON-LD y etiquetas
  Open Graph.
- CSS y JS con huella en el nombre (`site.2a6a04d3.css`) para que los
  navegadores no sirvan versiones antiguas.

El generador avisa por consola si un idioma tiene claves de más o de menos
respecto al español, que es el idioma de referencia.

## Publicar en GitHub Pages

1. Sube el proyecto a un repositorio de GitHub (rama `main`).
2. En **Settings → Pages**, en «Source», elige **GitHub Actions**.
3. Listo: cada `push` a `main` regenera y publica la web
   (`.github/workflows/deploy.yml`).

### Dominio propio

En **Settings → Pages → Custom domain**, escribe `tradissea.com` y activa
«Enforce HTTPS». En el proveedor del dominio hay que apuntar los DNS a GitHub
(registros `A` a `185.199.108-111.153` y un `CNAME` de `www` al dominio
`usuario.github.io`).

Alternativa: escribir el dominio en `content/site.json` → `"customDomain":
"tradissea.com"` para que el build genere el archivo `CNAME`.

## Publicar en Cloudflare

La configuración está en [wrangler.toml](wrangler.toml): la web se publica como
un Worker de «Static Assets», que no es más que Cloudflare sirviendo los
archivos de `dist/` desde su red.

A mano, desde el ordenador:

```bash
npm run deploy   # genera dist/ y la sube
```

La primera vez pedirá entrar en la cuenta de Cloudflare desde el navegador.

Automático: en el panel de Cloudflare, **Workers & Pages → Create → Workers →
Import a repository**, se elige el repositorio y Cloudflare ejecuta `node
build.mjs` y publica en cada `push` a `main`.

### Dominio propio en Cloudflare

En el Worker, **Settings → Domains & Routes → Add → Custom domain**, se escribe
`tradissea.com`. Si el dominio ya está en Cloudflare, los DNS y el HTTPS se
configuran solos.

### Publicar en una subcarpeta

Todos los enlaces internos son relativos, así que el sitio funciona igual en
`https://tradissea.com/` que en `https://usuario.github.io/repositorio/`. Solo el
archivo `404.html` usa rutas absolutas: en una subcarpeta, sus enlaces apuntarán
a la raíz del dominio.

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
  Incluye campo trampa antispam y validación accesible.
- **Accesibilidad**: revisado con axe (WCAG 2.1 AA) en todas las plantillas;
  navegación por teclado, textos alternativos, foco visible y respeto por
  `prefers-reduced-motion`.
