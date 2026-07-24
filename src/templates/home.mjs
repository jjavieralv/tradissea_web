/* Página de inicio. */
import { esc, icons, prefixFor, wave } from './layout.mjs';
import { clientsBand, contactBlock } from './partials.mjs';

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

  const videoSection = site.video.youtubeId
    ? `
<section class="section section--tight" aria-labelledby="video-title">
  <div class="wrap wrap--narrow">
    <div class="section-head section-head--center">
      <h2 id="video-title" class="has-rule">${esc(h.video.title)}</h2>
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
        <a class="btn btn--primary" href="${p}${paths.contact}">${esc(h.hero.ctaPrimary)}<span class="arrow" aria-hidden="true">→</span></a>
        <a class="btn btn--ghost" href="#servicios">${esc(h.hero.ctaSecondary)}</a>
      </div>
      <ul class="hero-points">
        ${h.hero.points.map((point) => `<li>${esc(point)}</li>`).join('\n        ')}
      </ul>
    </div>
    <div class="hero-card">
      <img src="${p}assets/img/logo-tradissea.png" alt="${esc(t.ui.logoAlt)}" width="380" height="110" fetchpriority="high">
      <div class="hero-langs">
        <span>EN → ES</span>
        <span>DE → ES</span>
        <span>ES ✓</span>
      </div>
      <span class="hero-card-tag">${esc(t.footer.tagline[0])}</span>
    </div>
  </div>
</section>

${clientsBand({ site, t, depth })}

<section class="section" id="servicios" aria-labelledby="services-title">
  <div class="wrap">
    <div class="section-head section-head--center">
      <h2 id="services-title" class="has-rule">${esc(h.services.title)}</h2>
      <p>${esc(h.services.intro)}</p>
    </div>
    <div class="cards">
      ${h.services.items.map(serviceCard).join('\n')}
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
<section class="section section--sky section--overlap" aria-labelledby="process-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="process-title" class="has-rule">${esc(h.process.title)}</h2>
      <p>${esc(h.process.intro)}</p>
    </div>
    <div class="steps">
      ${h.process.steps
        .map(
          (step) => `<div class="step">
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.text)}</p>
      </div>`
        )
        .join('\n      ')}
    </div>
  </div>
</section>
${wave('#eaf8ff', true)}

<section class="section section--tight section--overlap" aria-labelledby="why-title">
  <div class="wrap">
    <div class="section-head">
      <h2 id="why-title" class="has-rule">${esc(h.why.title)}</h2>
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

<section class="section section--mist" aria-labelledby="about-teaser-title">
  <div class="wrap split split--narrow-media">
    <div>
      <p class="eyebrow">${esc(h.aboutTeaser.eyebrow)}</p>
      <h2 id="about-teaser-title">${esc(h.aboutTeaser.title)}</h2>
      <p class="lead">${esc(h.aboutTeaser.text)}</p>
      <div class="btn-row u-mt-l">
        <a class="btn btn--ghost" href="${p}${paths.about}">${esc(h.aboutTeaser.cta)}<span class="arrow" aria-hidden="true">→</span></a>
      </div>
    </div>
    <figure class="media-frame u-flush">
      <picture>
        <source srcset="${p}assets/img/paula.webp" type="image/webp">
        <img src="${p}assets/img/paula.jpg" alt="${esc(h.aboutTeaser.imageAlt)}" width="1400" height="933" loading="lazy">
      </picture>
    </figure>
  </div>
</section>

<section class="section" id="contacto" aria-labelledby="home-contact-title">
  <div class="wrap">
    <div class="section-head section-head--center">
      <p class="eyebrow">${esc(t.nav.contact)}</p>
      <h2 id="home-contact-title">${esc(h.cta.title)}</h2>
      <p>${esc(h.cta.text)}</p>
    </div>
    ${contactBlock({ site, t, depth, paths, idPrefix: 'home-' })}
  </div>
</section>
`;
}
