/* Página «Sobre nosotros». */
import { esc, prefixFor } from './layout.mjs';
import { clientsBand } from './partials.mjs';

export function aboutPage({ site, t, depth, paths }) {
  const p = prefixFor(depth);
  const a = t.about;

  return `
<section class="page-header">
  <div class="wrap">
    <p class="eyebrow">${esc(a.eyebrow)}</p>
    <h1>${esc(a.heading)}</h1>
    <p class="lead">${esc(a.lead)}</p>
  </div>
</section>

<section class="section">
  <div class="wrap split split--narrow-media">
    <div>
      ${a.body.map((text) => `<p>${esc(text)}</p>`).join('\n      ')}
      <blockquote class="quote">${esc(a.quote)}</blockquote>
      <img class="signature" src="${p}assets/img/firma-paula.png" alt="${esc(a.signatureAlt)}" width="420" height="346" loading="lazy">
      <p class="u-mt-s"><strong>${esc(a.signature)}</strong></p>
    </div>
    <div>
      <figure class="media-frame u-flush">
        <picture>
          <source srcset="${p}assets/img/paula.webp" type="image/webp">
          <img src="${p}assets/img/paula.jpg" alt="${esc(a.imageAlt)}" width="1400" height="933" loading="lazy">
        </picture>
        <figcaption>${esc(a.imageCaption)}</figcaption>
      </figure>
      <h2 class="u-mt-xl h-sub">${esc(a.facts.title)}</h2>
      <dl class="facts">
        ${a.facts.items
          .map(
            (item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`
          )
          .join('\n        ')}
      </dl>
    </div>
  </div>
</section>

${clientsBand({ site, t, depth })}

<section class="cta-band">
  <div class="wrap wrap--narrow">
    <h2>${esc(a.cta.title)}</h2>
    <p>${esc(a.cta.text)}</p>
    <div class="btn-row">
      <a class="btn btn--yellow" href="${p}${paths.contact}">${esc(a.cta.button)}<span class="arrow" aria-hidden="true">→</span></a>
    </div>
  </div>
</section>
`;
}
