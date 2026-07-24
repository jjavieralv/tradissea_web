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

export function notFoundPage({ t, paths }) {
  return `
<section class="error-page">
  <div class="wrap wrap--narrow">
    <p class="eyebrow">404</p>
    <h1>${esc(t.notFound.heading)}</h1>
    <p class="lead">${esc(t.notFound.text)}</p>
    <div class="btn-row btn-row--center u-mt-l">
      <a class="btn btn--primary" href="/${paths.home}">${esc(t.notFound.button)}</a>
    </div>
  </div>
</section>
`;
}
