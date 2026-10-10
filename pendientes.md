# Pendientes

Tareas que quedan por hacer en la web de Tradissea. Marca cada una con una `x`
cuando esté hecha: `- [x]`.

## Legal

- [ ] **Aviso legal: nombre de la titular, NIF y domicilio.**
  La LSSI (art. 10) obliga a mostrar en la web el NIF y un domicilio, y el RGPD
  exige identificar al responsable de los datos. Ahora solo pone «Tradissea»
  (nombre comercial) y «Madrid, España». Sin estos datos, el aviso legal no
  cumple la ley y puede haber multa.
  - Si no se quiere publicar el domicilio personal, se puede usar una
    dirección comercial (servicio de domiciliación) o la de la gestoría, si lo
    acepta. El NIF hay que publicarlo en cualquier caso.
  - Dónde cambiarlo: el primer párrafo de `content/legal/es/legal.md`,
    `content/legal/en/legal.md` y `content/legal/de/legal.md`, y los apartados
    «Información básica» y «¿Quién es el responsable…?» de
    `content/legal/*/privacy.md`.

- [ ] **Permiso por escrito para usar los logotipos de clientes.**
  Canva, DeepL, Talgo y Lionbridge aparecen en la franja de clientes y en el
  mapa. Son marcas registradas: conviene tener su autorización por escrito (un
  correo basta). Si alguno no la da, se quita de `content/site.json` →
  `clients`.

- [ ] **Contrato de encargado del tratamiento con IONOS** (fuera de la web).
  IONOS aloja el correo, así que trata datos de los clientes por cuenta de
  Tradissea y el RGPD (art. 28) exige un contrato con él. IONOS lo ofrece en
  su área de cliente; solo hay que aceptarlo y guardar una copia. El de
  Cloudflare ya va incluido en sus condiciones de servicio.

- [ ] **Registro de actividades de tratamiento** (fuera de la web).
  Documento interno que describe qué datos se tratan y para qué. La herramienta
  gratuita «Facilita RGPD» de la AEPD (www.aepd.es) lo genera en unos minutos.

## Publicar en Cloudflare

- [ ] **Conectar el repositorio.** En el panel de Cloudflare: **Workers & Pages
  → Create → Import a repository**, elegir el repositorio y llamar al proyecto
  `tradissea-web`. Dejar vacío el comando de build y poner
  `npx wrangler deploy` como comando de deploy.

- [ ] **Pasar el dominio a Cloudflare.** Hoy el dominio y el correo están en
  IONOS. Al añadir `tradissea.com` en Cloudflare (**Add a site**) y cambiar los
  servidores DNS en IONOS, **comprobar que se conservan los registros de correo
  (MX) de IONOS**; si no, el correo deja de funcionar.

- [ ] **Añadir el dominio a la web.** En el Worker, **Settings → Domains &
  Routes → Add → Custom domain**: `tradissea.com` y `www.tradissea.com`.

- [ ] **Desactivar GitHub Pages**, si estaba activado: en GitHub, **Settings →
  Pages**. Si no, la copia antigua de la web seguirá publicada.
