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
build.mjs           Generador del sitio
serve.mjs           Servidor local
dist/               Resultado (no se versiona; se genera al publicar)
```

## Qué genera el build

- `/es/`, `/en/`, `/de/` con inicio, sobre nosotros, contacto y tres páginas
  legales cada uno (20 páginas en total).
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

### Publicar en una subcarpeta

Todos los enlaces internos son relativos, así que el sitio funciona igual en
`https://tradissea.com/` que en `https://usuario.github.io/repositorio/`. Solo el
archivo `404.html` usa rutas absolutas: en una subcarpeta, sus enlaces apuntarán
a la raíz del dominio.

## Decisiones técnicas

- **Sin cookies ni rastreo.** Solo se guarda el idioma elegido en el navegador
  (`localStorage`).
- **El vídeo de YouTube no se carga hasta que se pulsa el play**, y entonces usa
  `youtube-nocookie.com`.
- **Tipografías alojadas en el propio dominio**: no se conecta con Google Fonts.
- **Formulario**: sin `endpoint` configurado abre el programa de correo del
  visitante; con un endpoint (Formspree o similar) lo envía en segundo plano.
  Incluye campo trampa antispam y validación accesible.
- **Accesibilidad**: revisado con axe (WCAG 2.1 AA) en todas las plantillas;
  navegación por teclado, textos alternativos, foco visible y respeto por
  `prefers-reduced-motion`.
