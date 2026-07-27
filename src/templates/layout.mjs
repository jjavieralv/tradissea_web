/* Plantilla base: cabecera, pie y <head> comunes a todas las páginas. */

export const esc = (value) =>
  String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** Como esc(), pero evita que un número de teléfono se parta en dos líneas. */
export const nbsp = (value) => esc(value).replace(/ /g, '&nbsp;');

/** Enlace de correo sin la dirección completa en el HTML: los robots de spam
 *  rastrean el patrón «algo@algo», así que se publica partido y el navegador
 *  lo recompone. Sin JavaScript se lee «paula (arroba) tradissea.com» y el
 *  enlace lleva al formulario de contacto. */
export function mailLink({ email, fallbackHref = '#', className = '', inner = null, attrs = '' }) {
  const [user, domain] = String(email).split('@');
  const text = `${esc(user)}<span class="mail-at" aria-hidden="true">&#8202;(arroba)&#8202;</span>${esc(domain)}`;
  return `<a class="mail-link${className ? ` ${className}` : ''}" href="${fallbackHref}" data-user="${esc(
    user
  )}" data-domain="${esc(domain)}"${attrs ? ` ${attrs}` : ''}>${
    inner ? inner.replace('{{mail}}', `<span class="mail-text">${text}</span>`) : `<span class="mail-text">${text}</span>`
  }</a>`;
}

export const icons = {
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4.5" width="19" height="15" rx="2.5"/><path d="m3 7 9 6 9-6"/></svg>',
  phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6.5 3h3l1.5 4-2 1.5a12 12 0 0 0 5.5 5.5L16 12l4 1.5v3a2 2 0 0 1-2.2 2A16.5 16.5 0 0 1 3.5 5.2 2 2 0 0 1 5.5 3z"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2A9.9 9.9 0 0 0 2.1 11.9a9.8 9.8 0 0 0 1.35 4.96L2 22l5.28-1.38a9.9 9.9 0 0 0 4.76 1.21h.01A9.9 9.9 0 0 0 22 11.93 9.9 9.9 0 0 0 12.04 2Zm0 18.02h-.01a8.2 8.2 0 0 1-4.18-1.15l-.3-.18-3.13.82.84-3.05-.2-.31a8.2 8.2 0 1 1 6.98 3.87Zm4.5-6.15c-.25-.12-1.46-.72-1.69-.8-.22-.09-.39-.13-.55.12-.16.24-.63.79-.77.95-.14.16-.28.18-.53.06a6.7 6.7 0 0 1-3.35-2.93c-.25-.43.25-.4.72-1.33.08-.16.04-.3-.02-.42-.06-.12-.55-1.33-.76-1.82-.2-.48-.4-.41-.55-.42h-.47c-.16 0-.42.06-.64.3-.22.25-.84.83-.84 2.02s.86 2.34.98 2.5c.12.16 1.7 2.6 4.12 3.64 1.53.66 2.13.72 2.9.6.46-.06 1.46-.59 1.66-1.17.2-.57.2-1.06.14-1.17-.06-.11-.22-.18-.47-.3Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3zM10 9h3.8v1.65h.05A4.2 4.2 0 0 1 17.6 8.7c3.6 0 4.4 2.3 4.4 5.3V21h-4v-6c0-1.43-.03-3.28-2-3.28-2 0-2.3 1.56-2.3 3.17V21h-3.7z"/></svg>',
  pause: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5h3v14H8zM13 5h3v14h-3z"/></svg>',
  play: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l11-6.5z"/></svg>',
  zoom: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M10.5 7.8v5.4M7.8 10.5h5.4M15.4 15.4 20.5 20.5"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6 6 18"/></svg>'
};

/** Banner superior con el texto desplazándose hacia la izquierda.
 *  El texto se repite para que el bucle no tenga cortes; las repeticiones
 *  quedan ocultas para los lectores de pantalla, que leen solo la versión
 *  estática de .announce__static. */
export const announcement = (site, t) => {
  if (!site.announcement || site.announcement.enabled === false) return '';
  const a = t.announcement;
  if (!a || !a.text.trim()) return '';

  const item = `<span class="announce__item">${esc(a.text)}<i aria-hidden="true">~</i></span>`;
  const group = `<span class="announce__group">${item.repeat(4)}</span>`;

  return `
<div class="announce" data-announce>
  <p class="announce__static">${esc(a.text)}</p>
  <div class="announce__viewport" aria-hidden="true">
    <div class="announce__track">${group.repeat(2)}</div>
  </div>
  <button class="announce__toggle" type="button" data-announce-toggle
    aria-label="${esc(a.pause)}" data-label-pause="${esc(a.pause)}" data-label-play="${esc(a.play)}">
    <span class="announce__icon announce__icon--pause">${icons.pause}</span>
    <span class="announce__icon announce__icon--play">${icons.play}</span>
  </button>
</div>`;
};

/** Onda decorativa entre secciones. */
export const wave = (fill, flip = false) => `
<svg class="wave${flip ? ' wave--flip' : ''}" viewBox="0 0 1440 90" preserveAspectRatio="none" aria-hidden="true" focusable="false">
  <path fill="${fill}" d="M0 42c120-28 240-38 360-22s240 58 360 60 240-38 360-56 240-14 360 4v62H0z"/>
</svg>`;

/** Perfil de ola: suma de dos senoides muestreadas. El ancho contiene un número
 *  entero de ciclos, así el dibujo encaja consigo mismo y se desplaza en bucle. */
const WAVE_W = 2880;
const WAVE_H = 200;

const wavePoints = ({ base, amp, cycles, phase, steps = 72 }) => {
  const points = [];
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * WAVE_W;
    const angle = (2 * Math.PI * cycles * x) / WAVE_W;
    const y = base - amp * Math.sin(angle + phase) - amp * 0.32 * Math.sin(2 * angle + phase * 1.7);
    points.push(`${Math.round(x)} ${y.toFixed(1)}`);
  }
  return points;
};

const waveLayer = (index, options, foam) => {
  const points = wavePoints(options);
  const line = `M${points.join('L')}`;
  return `<svg class="wave-layer wave-layer--${index}" viewBox="0 0 ${WAVE_W} ${WAVE_H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <path class="wave-fill" d="${line}L${WAVE_W} ${WAVE_H}L0 ${WAVE_H}Z"/>
      ${foam ? `<path class="wave-foam" d="${line}"/>` : ''}
    </svg>`;
};

/** Mar animado que separa el contenido del pie: tres capas de oleaje,
 *  los símbolos de la marca derivando bajo el agua y salpicaduras. */
export const seaDivider = () => `
<div class="wave-divider" data-wave>
  <div class="wave-sea" aria-hidden="true">
    ${waveLayer(1, { base: 58, amp: 30, cycles: 3, phase: 0 })}
    ${waveLayer(2, { base: 92, amp: 22, cycles: 5, phase: 2.4 }, true)}
    ${waveLayer(3, { base: 126, amp: 16, cycles: 4, phase: 4.1 }, true)}
    <span class="wave-drift"></span>
  </div>
  <div class="wave-splash" data-wave-splash aria-hidden="true"></div>
</div>`;

/** Prefijo relativo desde la profundidad de la página hasta la raíz del sitio.
 *  depth < 0 devuelve rutas absolutas («/»), necesarias en la página 404,
 *  que el servidor puede mostrar desde cualquier dirección. */
export const prefixFor = (depth) => (depth < 0 ? '/' : depth === 0 ? '' : '../'.repeat(depth));

export function layout({
  site,
  t,
  lang,
  langs,
  pageKey,
  depth,
  paths,
  altPaths,
  canonical,
  title,
  description,
  bodyClass = '',
  content,
  jsonLd,
  noindex = false,
  game = null,
  assets
}) {
  const p = prefixFor(depth);
  const url = (key) => p + paths[key];
  const year = new Date().getFullYear();

  /* Web de una sola página: el menú lleva a las secciones de la portada. Desde
     la propia portada basta el ancla, para que el navegador se desplace en vez
     de recargar; desde las páginas legales hace falta la ruta completa. */
  const a = t.anchors;
  const onHome = pageKey === 'home';
  const section = (name) => (onHome ? `#${name}` : `${url('home')}#${name}`);
  const navItems = [
    ['home', t.nav.home, onHome ? '#top' : url('home')],
    ['services', t.nav.services, section(a.services)],
    ['about', t.nav.about, section(a.about)],
    ['contact', t.nav.contact, section(a.contact)]
  ];
  const contactHref = section(a.contact);

  const langLinks = langs
    .map((code) => {
      const isCurrent = code === lang;
      const target = p + (altPaths[code] || `${code}/`);
      return `<a href="${target}" hreflang="${code}" lang="${code}"${
        isCurrent ? ' aria-current="true"' : ''
      }>${esc(code.toUpperCase())}</a>`;
    })
    .join('');

  const alternates = langs
    .map(
      (code) =>
        `<link rel="alternate" hreflang="${code}" href="${site.domain}/${altPaths[code] || `${code}/`}">`
    )
    .join('\n  ');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(description)}">
${noindex ? '<meta name="robots" content="noindex">' : `<link rel="canonical" href="${site.domain}/${canonical}">`}
${noindex ? '' : `${alternates}
  <link rel="alternate" hreflang="x-default" href="${site.domain}/">`}
<meta name="theme-color" content="#00807e">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${esc(site.brand)}">
<meta property="og:locale" content="${esc(t.meta.locale)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${site.domain}/${canonical}">
<meta property="og:image" content="${site.domain}/assets/img/og-image.jpg">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="${p}assets/img/favicon.ico" sizes="any">
<link rel="icon" href="${p}assets/img/icon-512.png" type="image/png">
<link rel="apple-touch-icon" href="${p}assets/img/apple-touch-icon.png">
<link rel="preload" as="font" type="font/woff2" href="${p}assets/fonts/prata-400-latin.woff2" crossorigin>
<link rel="preload" as="font" type="font/woff2" href="${p}assets/fonts/lexend-var-latin.woff2" crossorigin>
<link rel="stylesheet" href="${p}assets/css/${assets.css}">
${jsonLd ? `<script type="application/ld+json">${JSON.stringify(jsonLd)}</script>` : ''}
</head>
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<span id="top"></span>
<a class="skip-link" href="#main">${esc(t.ui.skipToContent)}</a>
${announcement(site, t)}

<header class="site-header">
  <div class="wrap header-inner">
    <a class="brand" href="${url('home')}" aria-label="${esc(site.brand)} — ${esc(t.nav.home)}">
      <img src="${p}assets/img/logo-tradissea.svg" alt="${esc(t.ui.logoAlt)}" width="380" height="110">
    </a>

    <nav id="primary-nav" class="nav" aria-label="${esc(t.ui.menu)}">
      ${navItems
        .map(
          ([key, label, href]) =>
            `<a href="${href}" data-nav="${key}"${key === pageKey ? ' aria-current="page"' : ''}>${esc(label)}</a>`
        )
        .join('\n      ')}
      <a class="btn btn--primary" href="${contactHref}">${esc(t.nav.cta)}</a>
    </nav>

    <div class="header-actions">
      <nav class="lang" aria-label="${esc(t.ui.changeLanguage)}">${langLinks}</nav>
      <a class="btn btn--primary" href="${contactHref}">${esc(t.nav.cta)}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="primary-nav"
        aria-label="${esc(t.ui.openMenu)}" data-label-open="${esc(t.ui.openMenu)}" data-label-close="${esc(
    t.ui.closeMenu
  )}">
        <span></span>
      </button>
    </div>
  </div>
</header>

<main id="main">
${content}
</main>

${seaDivider()}
<footer class="site-footer">
  <div class="wrap">
    <div class="footer-grid">
      <div class="footer-brand">
        <img src="${p}assets/img/logo-tradissea.svg" alt="${esc(t.ui.logoAlt)}" width="360" height="104" loading="lazy">
        <ul class="footer-tagline">
          ${t.footer.tagline.map((line) => `<li>${esc(line)}</li>`).join('\n          ')}
        </ul>
      </div>

      <div>
        <h2>${esc(t.footer.linksTitle)}</h2>
        <ul class="footer-links">
          ${navItems.map(([, label, href]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('\n          ')}
        </ul>
      </div>

      <div>
        <h2>${esc(t.footer.contactTitle)}</h2>
        <ul class="footer-links">
          <li>${mailLink({ email: site.contact.email, fallbackHref: contactHref })}</li>
        </ul>
        <div class="social-row">
          <a href="${esc(site.contact.linkedin)}" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">${
    icons.linkedin
  }</a>
          ${mailLink({
    email: site.contact.email,
    fallbackHref: contactHref,
    className: 'mail-link--icon',
    inner: icons.mail,
    attrs: `aria-label="${esc(t.contact.emailLabel)}"`
  })}
        </div>
      </div>

      <div>
        <h2>${esc(t.footer.legalTitle)}</h2>
        <ul class="footer-links">
          ${paths.game ? `<li><a href="${url('game')}">${esc(t.game.eyebrow)}</a></li>` : ''}
          <li><a href="${url('legal')}">${esc(t.footer.legal)}</a></li>
          <li><a href="${url('privacy')}">${esc(t.footer.privacy)}</a></li>
          <li><a href="${url('cookies')}">${esc(t.footer.cookies)}</a></li>
        </ul>
      </div>
    </div>

    <div class="footer-bottom">
      <p>© ${year} ${esc(site.brand)}. ${esc(t.footer.rights)}</p>
      <p><a href="#top">${esc(t.ui.toTop)}</a></p>
    </div>
  </div>
</footer>

<script>window.TRADISSEA=${JSON.stringify({
    lang,
    mail: { u: String(site.contact.email).split('@')[0], d: String(site.contact.email).split('@')[1] },
    formEndpoint: site.form.endpoint || '',
    mailSubject: site.brand,
    formText: t.contact.form,
    game: game
      ? {
          words: game.words,
          percent: game.percent,
          prefix: game.prefix,
          text: t.game
        }
      : null
  })};</script>
<script src="${p}assets/js/${assets.js}" defer></script>
</body>
</html>
`;
}
