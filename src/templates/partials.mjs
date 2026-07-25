/* Bloques reutilizables entre páginas. */
import { esc, nbsp, icons, mailLink, prefixFor } from './layout.mjs';

/** Formulario de contacto + vías directas. */
export function contactBlock({ site, t, depth, paths, idPrefix = '', aside = '', anchors = null }) {
  const p = prefixFor(depth);
  const f = t.contact.form;
  const id = (name) => `${idPrefix}${name}`;

  const field = (name, label, control, required) => `
    <div class="field">
      <label for="${id(name)}">${esc(label)}${required ? ` <span class="req" aria-hidden="true">*</span><span class="visually-hidden"> (${esc(f.required)})</span>` : ''}</label>
      ${control}
      <span class="field-error" id="${id(name)}-error" aria-live="polite"></span>
    </div>`;

  return `
<div class="form-layout">
  <div class="form-card">
    <form data-contact-form novalidate>
      <div class="hp" aria-hidden="true">
        <label for="${id('website')}">No rellenar</label>
        <input type="text" id="${id('website')}" name="website" tabindex="-1" autocomplete="off">
      </div>

      ${field(
        'name',
        f.name,
        `<input type="text" id="${id('name')}" name="name" autocomplete="name" placeholder="${esc(
          f.namePlaceholder
        )}" aria-describedby="${id('name')}-error" required>`,
        true
      )}
      ${field(
        'email',
        f.email,
        `<input type="email" id="${id('email')}" name="email" autocomplete="email" placeholder="${esc(
          f.emailPlaceholder
        )}" aria-describedby="${id('email')}-error" required>`,
        true
      )}
      ${field(
        'company',
        f.company,
        `<input type="text" id="${id('company')}" name="company" autocomplete="organization" placeholder="${esc(
          f.companyPlaceholder
        )}">`,
        false
      )}
      ${field(
        'service',
        f.service,
        `<select id="${id('service')}" name="service">${f.serviceOptions
          .map((option) => `<option>${esc(option)}</option>`)
          .join('')}</select>`,
        false
      )}
      ${field(
        'message',
        f.message,
        `<textarea id="${id('message')}" name="message" placeholder="${esc(
          f.messagePlaceholder
        )}" aria-describedby="${id('message')}-error" required></textarea>`,
        true
      )}

      <div class="field field--check">
        <input type="checkbox" id="${id('consent')}" name="consent" aria-describedby="${id('consent')}-error" required>
        <label for="${id('consent')}">${esc(f.consent)}</label>
      </div>
      <span class="field-error" id="${id('consent')}-error" aria-live="polite"></span>

      <div class="btn-row u-mt-m">
        <button class="btn btn--primary" type="submit">${esc(f.submit)}</button>
      </div>

      <p class="form-note">${esc(t.contact.privacyNote)} <a href="${p}${paths.privacy}">${esc(
    t.contact.privacyLink
  )}</a>.</p>
      <div class="form-status" role="status" tabindex="-1"></div>
    </form>
  </div>

  <div>
    <h3>${esc(t.contact.directTitle)}</h3>
    <ul class="contact-list">
      <li>
        ${mailLink({
          email: site.contact.email,
          fallbackHref: anchors ? `#${anchors.contact}` : '#',
          inner: `${icons.mail}<span><span class="label">${esc(
            t.contact.emailLabel
          )}</span><span class="value">{{mail}}</span></span>`
        })}
      </li>
      <li>
        <a href="${esc(site.contact.linkedin)}" target="_blank" rel="noopener noreferrer">
          ${icons.linkedin}
          <span><span class="label">${esc(t.contact.linkedinLabel)}</span><span class="value">Paula Barbero</span></span>
        </a>
      </li>
    </ul>
    ${aside}
  </div>
</div>`;
}

/** Mapamundi de puntos con la ubicación de algunos clientes.
 *  El mapa usa una proyección equirectangular recortada por arriba y por abajo;
 *  estas constantes deben coincidir con las del SVG (static/img/world-dots.svg). */
const MAP = { latTop: 78, latBottom: -56 };

export function clientsMap({ site, t, depth }) {
  const p = prefixFor(depth);
  const pins = site.clients.filter((client) => typeof client.lat === 'number');
  if (!pins.length) return '';

  const place = (client) => ({
    x: ((client.lon + 180) / 360) * 100,
    y: ((MAP.latTop - client.lat) / (MAP.latTop - MAP.latBottom)) * 100
  });

  return `
<figure class="map">
  <img class="map__base" src="${p}assets/img/world-dots.svg" alt="${esc(t.about.map.alt)}" width="1500" height="660" loading="lazy">
  <ul class="map__pins">
    ${pins
      .map((client) => {
        const { x, y } = place(client);
        return `<li class="map__pin" data-label="${esc(client.label || 'top')}" style="--x:${x.toFixed(
          2
        )}%;--y:${y.toFixed(2)}%">
      <span class="map__dot" aria-hidden="true"></span>
      <span class="map__label">${esc(client.name)}${
          client.city ? `<span class="map__city">${esc(client.city)}</span>` : ''
        }</span>
    </li>`;
      })
      .join('\n    ')}
  </ul>
</figure>`;
}

/** Franja teal con los logotipos de clientes. */
export function clientsBand({ site, t, depth }) {
  const p = prefixFor(depth);
  return `
<section class="clients" aria-labelledby="clients-title">
  <div class="wrap">
    <h2 id="clients-title">${esc(t.home.clients.title)}</h2>
    <div class="clients-row">
      ${site.clients
        .map(
          (client) =>
            `<img src="${p}assets/img/${client.logo}" alt="${esc(client.name)}" loading="lazy" width="200" height="60"${
              client.scale ? ` style="--client-scale:${Number(client.scale)}"` : ''
            }>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>`;
}
