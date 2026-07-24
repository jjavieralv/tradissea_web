/* Página de contacto. */
import { esc } from './layout.mjs';
import { contactBlock } from './partials.mjs';

export function contactPage({ site, t, depth, paths }) {
  const c = t.contact;
  const facts = t.about.facts;

  return `
<section class="page-header">
  <div class="wrap">
    <p class="eyebrow">${esc(c.eyebrow)}</p>
    <h1>${esc(c.heading)}</h1>
    <p class="lead">${esc(c.lead)}</p>
  </div>
</section>

<section class="section">
  <div class="wrap">
    ${contactBlock({
      site,
      t,
      depth,
      paths,
      aside: `
    <div class="fact-card">
      <h3>${esc(facts.title)}</h3>
      <dl class="facts">
        ${facts.items
          .map((item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`)
          .join('\n        ')}
      </dl>
    </div>`
    })}
  </div>
</section>
`;
}
