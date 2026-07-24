/* Bloques reutilizables entre páginas. */
import { esc, nbsp, icons, prefixFor } from './layout.mjs';

/** Formulario de contacto + vías directas. */
export function contactBlock({ site, t, depth, paths, idPrefix = '', aside = '' }) {
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
        <a href="mailto:${esc(site.contact.email)}">
          ${icons.mail}
          <span><span class="label">${esc(t.contact.emailLabel)}</span><span class="value">${esc(
    site.contact.email
  )}</span></span>
        </a>
      </li>
      <li>
        <a href="tel:${esc(site.contact.phoneLink)}">
          ${icons.phone}
          <span><span class="label">${esc(t.contact.phoneLabel)}</span><span class="value">${nbsp(
    site.contact.phone
  )}</span></span>
        </a>
      </li>
      <li>
        <a href="${esc(site.contact.whatsapp)}" target="_blank" rel="noopener noreferrer">
          ${icons.whatsapp}
          <span><span class="label">${esc(t.contact.whatsappLabel)}</span><span class="value">${nbsp(
    site.contact.phone
  )}</span></span>
        </a>
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
