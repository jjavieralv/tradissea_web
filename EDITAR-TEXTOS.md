# Cómo cambiar los textos de la web

Todos los textos de la web están en la carpeta **`content/`**. No hay que tocar
nada de código: se edita el texto, se guarda y la web se actualiza.

```
content/
├── site.json      → datos de contacto, vídeo, logotipos de clientes
├── es.json        → todos los textos en español
├── en.json        → todos los textos en inglés
├── de.json        → todos los textos en alemán
└── legal/
    ├── es/  legal.md · privacy.md · cookies.md
    ├── en/  legal.md · privacy.md · cookies.md
    └── de/  legal.md · privacy.md · cookies.md
```

---

## 1. Cambiar una frase de la web

Abre el archivo del idioma (`content/es.json`, `en.json` o `de.json`) y busca el
texto que quieres cambiar. Cada línea tiene esta forma:

```json
"title": "Que tu mensaje llegue igual de lejos en cualquier idioma",
```

- A la **izquierda** está el nombre interno (`title`). **No se toca.**
- A la **derecha**, entre comillas, está el texto. **Eso es lo que se cambia.**

### Cuatro reglas para que no se rompa nada

1. El texto va siempre **entre comillas dobles** `" "`.
2. **No borres la coma** del final de la línea (salvo si es la última de su grupo).
3. Si necesitas comillas dentro de una frase, usa las españolas: `«así»`.
4. Si en un texto aparece `\n` o `\"`, déjalos tal cual.

Ejemplo de cambio correcto:

```json
"ctaPrimary": "Cuéntanos tu proyecto",     ← antes
"ctaPrimary": "Pide tu presupuesto",       ← después
```

---

## 2. Dónde está cada cosa

La web es de **una sola página**: al pulsar en el menú se baja a la sección
correspondiente. Solo el aviso legal, la privacidad y las cookies son páginas
aparte.

| Zona de la web | Dónde se edita |
| --- | --- |
| Aviso verde en movimiento de la parte superior | `announcement` |
| Menú superior y botón «Pide presupuesto» | `nav` |
| Nombre de las secciones en la barra de direcciones | `anchors` |
| Titular grande de la portada | `home` → `hero` |
| «Quiénes han confiado en nosotros» | `home` → `clients` |
| Los seis servicios | `home` → `services` → `items` |
| Especialidades (técnica, jurídica, turismo) | `home` → `industries` |
| «La mejor tecnología a tu servicio» | `home` → `tech` |
| «Cómo trabajamos» (las cuatro paradas) | `home` → `process` |
| «Por qué Tradissea» | `home` → `why` |
| Texto del vídeo | `home` → `video` |
| Sección «Quiénes somos» y el mapa de clientes | `about` |
| Sección «Contacto» y el formulario | `contact` |
| Pie de página y eslogan que se escribe solo | `footer` |
| Página de error 404 | `notFound` |
| Títulos de las páginas legales | `legalPages` |

El eslogan que se escribe solo en la portada («Navigating cultures…») sale de
`footer` → `tagline`: si añades o quitas frases ahí, la animación las recoge.

Los tres archivos de idioma tienen **exactamente la misma estructura**: si
cambias algo en `es.json`, busca lo mismo en `en.json` y `de.json`.

---

## 3. Textos largos (aviso legal, privacidad, cookies)

Están en `content/legal/` y se escriben en un formato muy sencillo:

```markdown
## Un título de apartado

Un párrafo normal, se escribe tal cual.

- Un punto de una lista
- Otro punto

Una palabra en **negrita** y un [enlace](https://ejemplo.com).
```

---

## 4. Datos de contacto, vídeo y logotipos

Están en `content/site.json`:

- **`contact`** → correo, teléfono, WhatsApp y LinkedIn. Si cambias el teléfono,
  cambia también `phoneLink` (el mismo número sin espacios, con el prefijo `+34`).
- **`video.youtubeId`** → el identificador del vídeo de YouTube. En una dirección
  como `youtube.com/watch?v=EFWKsBNPzo0`, el identificador es `EFWKsBNPzo0`.
  Si lo dejas vacío (`""`), la sección del vídeo desaparece.
- **`clients`** → los logotipos de la franja verde **y los puntos del mapa**.
  Para añadir uno nuevo, guarda el logotipo **en blanco y con fondo
  transparente** en `static/img/` y añade su línea. `scale` sirve para que todos
  se vean del mismo tamaño visual; `city`, `lat` y `lon` colocan el punto en el
  mapamundi. Las coordenadas se sacan de Google Maps: clic derecho sobre el
  lugar y copiar los dos números que aparecen (el primero es `lat`).

## 4 bis. El correo no aparece entero en la web

Para que los robots de spam no lo recojan, en el código la dirección va partida
en dos y el navegador la recompone al abrir la página. Se ve y funciona con
normalidad, pero **si cambias el correo hazlo solo en `site.json`**: el resto de
la web (pie, contacto, textos legales y formulario) lo toma de ahí.

---

## 5. Recibir los mensajes del formulario por correo

Tal como está ahora, cuando alguien rellena el formulario se le abre su programa
de correo con el mensaje ya escrito para enviártelo. Funciona, pero pierdes
algunos contactos por el camino.

Para recibirlos directamente en el buzón:

1. Entra en [formspree.io](https://formspree.io) y crea una cuenta gratuita.
2. Crea un formulario nuevo con el correo `paula@tradissea.com`.
3. Copia la dirección que te da (algo como `https://formspree.io/f/abcdwxyz`).
4. Pégala en `content/site.json`:

```json
"form": {
  "endpoint": "https://formspree.io/f/abcdwxyz"
}
```

---

## 6. Ver los cambios antes de publicarlos

En la carpeta del proyecto:

```bash
npm run dev
```

Y abre <http://localhost:4000>. Cada vez que guardes un archivo de `content/`,
la web se regenera sola: basta con recargar la página del navegador.

Si algo se ha roto (una comilla o una coma de menos), el terminal lo dirá con un
mensaje del tipo `Unexpected token in JSON`, indicando la línea del problema.

---

## 7. Publicar los cambios

Si el proyecto está en GitHub con las páginas activadas, basta con guardar los
cambios en la rama `main`: en un par de minutos la web pública se actualiza sola.

Más detalles en el archivo `README.md`.
