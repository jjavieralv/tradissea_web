/* Páginas legales (contenido en Markdown). */
import { esc } from './layout.mjs';

export function legalPage({ t, heading, html, notice }) {
  return `
<section class="page-header">
  <div class="wrap">
    <p class="eyebrow">${esc(t.footer.legalTitle)}</p>
    <h1>${esc(heading)}</h1>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${notice ? `<p class="notice">${esc(notice)}</p>` : ''}
    <div class="prose">
      ${html}
    </div>
  </div>
</section>
`;
}

/** Barco de papel a la deriva: ilustración de la página 404. */
const boatArt = (alt) => `
<svg viewBox="0 0 640 420" role="img" aria-label="${esc(alt)}">
  <defs>
    <linearGradient id="sky404" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f5fcff"/>
      <stop offset="1" stop-color="#eaf8ff"/>
    </linearGradient>
  </defs>
  <rect width="640" height="420" fill="url(#sky404)"/>
  <g fill="none" stroke="#a9dcf2" stroke-width="3" stroke-linecap="round">
    <path d="M60 96c26-16 52-16 78 0M96 70c18-11 36-11 54 0"/>
    <path d="M470 132c26-16 52-16 78 0"/>
  </g>
  <!-- barco -->
  <g transform="translate(258 168)">
    <path d="M8 96 0 44h124l-8 52a10 10 0 0 1-9 7H17a10 10 0 0 1-9-7Z" fill="#ffffff" stroke="#00807e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M62 44V0l52 44Z" fill="#fccc48" stroke="#00807e" stroke-width="4" stroke-linejoin="round"/>
    <path d="M62 44V6L14 44Z" fill="#c9efff" stroke="#00807e" stroke-width="4" stroke-linejoin="round"/>
  </g>
  <!-- olas -->
  <g fill="none" stroke-linecap="round">
    <path d="M0 300c60-26 120-26 180 0s120 26 180 0 120-26 180 0 120 26 180 0v130H0Z" fill="#c9efff" stroke="none"/>
    <path d="M0 330c60-24 120-24 180 0s120 24 180 0 120-24 180 0 120 24 180 0v100H0Z" fill="#eaf8ff" stroke="none"/>
    <path d="M0 300c60-26 120-26 180 0s120 26 180 0 120-26 180 0 120 26 180 0" stroke="#ffffff" stroke-width="3"/>
  </g>
  <g fill="#00807e" opacity=".5">
    <circle cx="150" cy="352" r="5"/><circle cx="205" cy="372" r="3.5"/><circle cx="470" cy="358" r="4.5"/>
  </g>
</svg>`;

export function notFoundPage({ t, paths, anchors }) {
  const n = t.notFound;
  return `
<section class="error-page">
  <div class="wrap">
    <div class="error-grid">
      <div>
        <p class="eyebrow">${esc(n.eyebrow)}</p>
        <h1>${esc(n.heading)}</h1>
        <p class="lead">${esc(n.text)}</p>
        <div class="btn-row u-mt-l">
          <a class="btn btn--primary" href="/${paths.home}">${esc(n.button)}</a>
          <a class="btn btn--ghost" href="/${paths.home}#${esc(anchors.services)}">${esc(n.buttonServices)}</a>
        </div>
        <div class="error-help">
          <h2>${esc(n.helpTitle)}</h2>
          <p>${esc(n.helpText)}</p>
          <div class="btn-row u-mt-s">
            <a class="btn btn--ghost" href="/${paths.home}#${esc(anchors.contact)}">${esc(n.helpButton)}</a>
          </div>
        </div>
      </div>
      <div class="error-art">${boatArt(n.imageAlt)}</div>
    </div>
  </div>
</section>
`;
}
