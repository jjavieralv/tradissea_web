/* Portada: la web entera es esta página, con las secciones enlazadas
   desde el menú (servicios, especialidades, quiénes somos y contacto). */
import { esc, icons, prefixFor, wave } from './layout.mjs';
import { clientsBand, clientsMap, contactBlock } from './partials.mjs';

const ICON_FILES = {
  translation: 'icon-translation.png',
  proofreading: 'icon-proofreading.png',
  postediting: 'icon-postediting.png',
  consulting: 'icon-consulting.png',
  localization: 'icon-localization.png',
  transcreation: 'icon-transcreation.png'
};

export function homePage({ site, t, depth, paths }) {
  const p = prefixFor(depth);
  const h = t.home;
  const a = t.anchors;

  /* ---------- Servicios ---------- */
  const serviceCard = (service) => {
    const detail = [
      ...(service.body || []).slice(1).map((text) => `<p>${esc(text)}</p>`),
      service.list && service.list.length
        ? `<ul>${service.list.map((item) => `<li>${esc(item)}</li>`).join('')}</ul>`
        : '',
      ...(service.bodyAfter || []).map((text) => `<p>${esc(text)}</p>`)
    ]
      .filter(Boolean)
      .join('\n          ');

    const hasDetail = Boolean(detail || (service.body && service.body[0]));

    return `
      <article class="card${hasDetail ? ' card--flip' : ''}" id="${esc(service.id)}"${
      hasDetail ? ' data-service-card' : ''
    }>
        <span class="card-icon"><img src="${p}assets/img/${
      ICON_FILES[service.icon] || ICON_FILES.translation
    }" alt="" width="120" height="120" loading="lazy"></span>
        ${hasDetail ? `<span class="card__zoom" aria-hidden="true">${icons.zoom}</span>` : ''}
        <h3>${esc(service.title)}</h3>
        <p>${esc(service.summary)}</p>
        ${
          hasDetail
            ? `<details class="card__disclosure">
          <summary>${esc(t.ui.readMore)}<span class="card__more-icon" aria-hidden="true">${icons.zoom}</span></summary>
          <div class="details-body">
          ${service.body && service.body[0] ? `<p>${esc(service.body[0])}</p>` : ''}
          ${detail}
          </div>
        </details>`
            : ''
        }
      </article>`;
  };

  /* ---------- Vídeo ---------- */
  const videoSection = site.video.youtubeId
    ? `
<section class="section section--tight" aria-labelledby="video-title">
  <div class="wrap wrap--narrow">
    <div class="section-head section-head--center">
      <h2 id="video-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.video.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.video.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(h.video.text)}</p>
    </div>
    <div class="video-wrap" data-video-id="${esc(site.video.youtubeId)}">
      <picture>
        <source srcset="${p}assets/img/video-poster.webp" type="image/webp">
        <img src="${p}assets/img/video-poster.jpg" alt="" width="1280" height="720" loading="lazy">
      </picture>
      <button class="video-play" type="button" aria-label="${esc(t.ui.playVideo)}"></button>
    </div>
    <p class="video-note">${esc(t.ui.videoNotice)}</p>
  </div>
</section>`
    : '';

  return `
<section class="hero">
  <div class="wrap hero-grid">
    <div>
      <p class="eyebrow">${esc(h.hero.eyebrow)}</p>
      <h1>${esc(h.hero.title)}</h1>
      <p class="lead">${esc(h.hero.text)}</p>
      <div class="btn-row">
        <a class="btn btn--primary" href="#${esc(a.contact)}">${esc(h.hero.ctaPrimary)}<span class="arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--ghost" href="#${esc(a.services)}">${esc(h.hero.ctaSecondary)}</a>
      </div>
      <ul class="hero-points">
        ${h.hero.points.map((point) => `<li>${esc(point)}</li>`).join('\n        ')}
      </ul>
    </div>

    <div class="hero-card">
      <img src="${p}assets/img/logo-tradissea.svg" alt="${esc(t.ui.logoAlt)}" width="380" height="110" fetchpriority="high">
      <div class="hero-langs">
        <span>EN → ES</span>
        <span>DE → ES</span>
        <span>ES ✓</span>
      </div>
      <p class="hero-card-tag" data-typewriter="${esc(JSON.stringify(t.footer.tagline))}">
        <span class="type-text">${esc(t.footer.tagline[0])}</span><span class="type-caret" aria-hidden="true"></span>
      </p>
    </div>
  </div>
</section>

${clientsBand({ site, t, depth })}

<section class="section" id="${esc(a.services)}" aria-labelledby="services-title">
  <div class="wrap">
    <div class="cards-pin" data-cards-pin>
      <div class="cards-pin__stage">
        <div class="section-head section-head--center">
          <h2 id="services-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.services.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.services.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
          <p>${esc(h.services.intro)}</p>
        </div>

        <div class="cards" data-cards role="group" aria-label="${esc(h.services.carousel)}">
          ${h.services.items.map(serviceCard).join('\n')}
        </div>

        <div class="cards-nav" data-cards-nav aria-hidden="true">
          ${h.services.items
            .map(
              (service, i) =>
                `<button class="cards-nav__dot" type="button" data-go="${i}" tabindex="-1" title="${esc(
                  h.services.goTo.replace('{name}', service.title)
                )}"></button>`
            )
            .join('\n          ')}
        </div>
      </div>
    </div>
  </div>

  <dialog class="service-dialog" data-service-dialog aria-labelledby="service-dialog-title">
    <div class="service-dialog__panel" data-service-panel tabindex="-1">
      <button class="service-dialog__close" type="button" data-service-close aria-label="${esc(t.ui.close)}">${
        icons.close
      }</button>
      <div class="service-dialog__scroll" data-service-scroll>
        <div class="service-dialog__head">
          <span class="card-icon" data-service-dialog-icon></span>
          <h2 id="service-dialog-title" data-service-dialog-title>${esc(h.services.title)}</h2>
        </div>
        <div class="service-dialog__body" data-service-dialog-body></div>
      </div>
    </div>
  </dialog>
</section>

${wave('#eaf8ff')}
<section class="section section--sky section--overlap" id="${esc(a.industries)}" aria-labelledby="industries-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="industries-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.industries.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.industries.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(h.industries.intro)}</p>
    </div>
    <div class="industries">
      ${h.industries.items
        .map(
          (item) => `<article class="industry" id="${esc(item.id)}">
        <h3>${esc(item.title)}</h3>
        <p class="industry__claim">${esc(item.claim)}</p>
        <p class="industry__text">${esc(item.text)}</p>
        <p class="industry__docs-title">${esc(item.docsTitle)}</p>
        <ul class="industry__docs">
          ${item.docs.map((doc) => `<li>${esc(doc)}</li>`).join('\n          ')}
        </ul>
      </article>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>
${wave('#eaf8ff', true)}

<section class="section section--tight section--overlap" aria-labelledby="tech-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="tech-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.tech.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.tech.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(h.tech.intro)}</p>
    </div>
    <div class="features">
      ${h.tech.items
        .map(
          (item) => `<div class="feature">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

<section class="section section--mist" aria-labelledby="process-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="process-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.process.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.process.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(h.process.intro)}</p>
    </div>
    <div class="line-wrap" data-line style="--stops:${h.process.steps.length}">
      <span class="line__track" aria-hidden="true">
        <span class="line__progress" data-line-progress></span>
        <span class="line__train" data-line-train></span>
      </span>
      <ol class="line">
        ${h.process.steps
          .map(
            (step) => `<li class="line__stop">
          <span class="line__dot" aria-hidden="true"></span>
          <h3>${esc(step.title)}</h3>
          <p>${esc(step.text)}</p>
        </li>`
          )
          .join('\n        ')}
      </ol>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="why-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="why-title" class="has-rule" data-type-in><span class="visually-hidden">${esc(h.why.title)}</span><span class="type-in__text" aria-hidden="true">${esc(h.why.title)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(h.why.intro)}</p>
    </div>
    <div class="features">
      ${h.why.items
        .map(
          (item) => `<div class="feature">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>

${videoSection}

<section class="section section--sky" id="${esc(a.about)}" aria-labelledby="about-title">
  <div class="wrap">
    <div class="section-head">
      <p class="eyebrow">${esc(t.about.eyebrow)}</p>
      <h2 id="about-title" data-type-in><span class="visually-hidden">${esc(t.about.heading)}</span><span class="type-in__text" aria-hidden="true">${esc(t.about.heading)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p class="lead">${esc(t.about.lead)}</p>
    </div>

    <div class="split split--narrow-media">
      <div>
        ${t.about.body.map((text) => `<p>${esc(text)}</p>`).join('\n        ')}
        <blockquote class="quote">${esc(t.about.quote)}</blockquote>
        <img class="signature" src="${p}assets/img/firma-paula.png" alt="${esc(t.about.signatureAlt)}" width="420" height="346" loading="lazy">
        <p class="u-mt-s"><strong>${esc(t.about.signature)}</strong></p>
      </div>
      <div>
        <figure class="media-frame u-flush">
          <picture>
            <source srcset="${p}assets/img/paula.webp" type="image/webp">
            <img src="${p}assets/img/paula.jpg" alt="${esc(t.about.imageAlt)}" width="1400" height="933" loading="lazy">
          </picture>
          <figcaption>${esc(t.about.imageCaption)}</figcaption>
        </figure>
        <h3 class="u-mt-xl h-sub">${esc(t.about.facts.title)}</h3>
        <dl class="facts">
          ${t.about.facts.items
            .map((item) => `<div><dt>${esc(item.label)}</dt><dd>${esc(item.value)}</dd></div>`)
            .join('\n          ')}
        </dl>
      </div>
    </div>

    <div class="map-block">
      <div class="section-head section-head--center">
        <h3 class="h-sub">${esc(t.about.map.title)}</h3>
        <p>${esc(t.about.map.text)}</p>
      </div>
      ${clientsMap({ site, t, depth })}
    </div>
  </div>
</section>

<section class="section" id="${esc(a.contact)}" aria-labelledby="contact-title">
  <div class="wrap">
    <div class="section-head section-head--center">
      <p class="eyebrow">${esc(t.contact.eyebrow)}</p>
      <h2 id="contact-title" data-type-in><span class="visually-hidden">${esc(t.contact.heading)}</span><span class="type-in__text" aria-hidden="true">${esc(t.contact.heading)}</span><span class="type-caret" aria-hidden="true"></span></h2>
      <p>${esc(t.contact.lead)}</p>
    </div>
    ${contactBlock({ site, t, depth, paths, anchors: a })}
  </div>
</section>
`;
}
