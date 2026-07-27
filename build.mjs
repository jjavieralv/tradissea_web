#!/usr/bin/env node
/* ============================================================
   Generador del sitio estático de Tradissea.
   Lee los textos de /content y escribe el sitio listo en /dist.
   Sin dependencias: solo necesita Node.js.
   ============================================================ */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { layout, prefixFor, esc, mailLink } from './src/templates/layout.mjs';
import { homePage } from './src/templates/home.mjs';
import { legalPage, notFoundPage } from './src/templates/legal.mjs';
import { gamePage } from './src/templates/game.mjs';
import { markdownToHtml } from './src/lib/markdown.mjs';
import { buildDotMap } from './src/lib/dotmap.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const CONTENT = path.join(ROOT, 'content');
const STATIC = path.join(ROOT, 'static');
const SRC = path.join(ROOT, 'src');
const DIST = path.join(ROOT, 'dist');

const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));
const log = (msg) => process.stdout.write(`${msg}\n`);
const warnings = [];

/* ---------- Utilidades de ficheros ---------- */
function rmrf(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const src = path.join(from, entry.name);
    const dest = path.join(to, entry.name);
    if (entry.isDirectory()) copyDir(src, dest);
    else fs.copyFileSync(src, dest);
  }
}

function write(relative, contents) {
  const target = path.join(DIST, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  const clean =
    typeof contents === 'string' ? contents.replace(/[ \t]+$/gm, '').replace(/\n{3,}/g, '\n\n') : contents;
  fs.writeFileSync(target, clean);
}

const hash = (contents) => crypto.createHash('sha1').update(contents).digest('hex').slice(0, 8);

/* Ofuscación ligera de las palabras del juego (XOR + base64). */
const WORD_KEY = 'tradissea';
const encodeWord = (word) =>
  Buffer.from(
    word
      .split('')
      .map((letter, i) => String.fromCharCode(letter.charCodeAt(0) ^ WORD_KEY.charCodeAt(i % WORD_KEY.length)))
      .join(''),
    'binary'
  ).toString('base64');

/* ---------- Comprobación de traducciones ---------- */
function collectKeys(value, prefix = '', acc = []) {
  if (Array.isArray(value)) {
    acc.push(`${prefix}[]`);
    if (value.length && typeof value[0] === 'object') collectKeys(value[0], `${prefix}[]`, acc);
    return acc;
  }
  if (value && typeof value === 'object') {
    for (const key of Object.keys(value)) {
      if (key.startsWith('_')) continue;
      const next = prefix ? `${prefix}.${key}` : key;
      acc.push(next);
      collectKeys(value[key], next, acc);
    }
  }
  return acc;
}

function checkTranslations(reference, others) {
  const base = new Set(collectKeys(reference.data));
  for (const { lang, data } of others) {
    const keys = new Set(collectKeys(data));
    const missing = [...base].filter((key) => !keys.has(key));
    const extra = [...keys].filter((key) => !base.has(key));
    if (missing.length) warnings.push(`[${lang}.json] faltan claves: ${missing.slice(0, 12).join(', ')}${missing.length > 12 ? ` (+${missing.length - 12})` : ''}`);
    if (extra.length) warnings.push(`[${lang}.json] claves de más: ${extra.slice(0, 12).join(', ')}${extra.length > 12 ? ` (+${extra.length - 12})` : ''}`);
  }
}

/* ---------- Carga de contenido ---------- */
const site = readJson(path.join(CONTENT, 'site.json'));
const languages = site.languages;
const translations = Object.fromEntries(
  languages.map((lang) => [lang, readJson(path.join(CONTENT, `${lang}.json`))])
);

checkTranslations(
  { lang: site.defaultLanguage, data: translations[site.defaultLanguage] },
  languages.filter((lang) => lang !== site.defaultLanguage).map((lang) => ({ lang, data: translations[lang] }))
);

/* Rutas de cada página por idioma (relativas a la raíz del sitio).
   La web es de una sola página: servicios, quiénes somos y contacto son
   secciones de la portada, no páginas propias. */
const PAGE_KEYS = ['home', 'legal', 'privacy', 'cookies'];
const gameOn = Boolean(site.discount && site.discount.enabled !== false);
const pathsByLang = Object.fromEntries(
  languages.map((lang) => {
    const routes = translations[lang].routes;
    const entries = PAGE_KEYS.map((key) => {
      const slug = routes[key] || '';
      return [key, slug ? `${lang}/${slug}/` : `${lang}/`];
    });
    if (gameOn) entries.push(['game', `${lang}/${translations[lang].game.route}/`]);
    return [lang, Object.fromEntries(entries)];
  })
);

/* El porcentaje de descuento se escribe una sola vez, en site.json: en los
   textos se pone {percent} y aquí se sustituye. */
const percent = String((site.discount && site.discount.percent) || 0);
const fillPercent = (value) => {
  if (typeof value === 'string') return value.replace(/\{percent\}/g, percent);
  if (Array.isArray(value)) return value.map(fillPercent);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, fillPercent(item)]));
  }
  return value;
};
for (const lang of languages) {
  if (translations[lang].game) translations[lang].game = fillPercent(translations[lang].game);
}

/* ---------- Assets ---------- */
rmrf(DIST);
fs.mkdirSync(DIST, { recursive: true });

const css = fs.readFileSync(path.join(SRC, 'css', 'site.css'), 'utf8');
const js = fs.readFileSync(path.join(SRC, 'js', 'site.js'), 'utf8');
const assets = { css: `site.${hash(css)}.css`, js: `site.${hash(js)}.js` };

copyDir(path.join(STATIC, 'img'), path.join(DIST, 'assets', 'img'));
copyDir(path.join(STATIC, 'fonts'), path.join(DIST, 'assets', 'fonts'));
write(path.join('assets', 'css', assets.css), css);
write(path.join('assets', 'js', assets.js), js);
write('.nojekyll', '');

/* ---------- Mapa de clientes ----------
   Se dibuja en cada compilación a partir de las coordenadas de site.json, así
   que basta con añadir un cliente para que su país aparezca resaltado. */
{
  const topo = readJson(path.join(ROOT, 'scripts', 'countries-110m.json'));
  const pins = site.clients.filter((client) => typeof client.lat === 'number');
  const map = buildDotMap(topo, pins);
  write(path.join('assets', 'img', 'world-dots.svg'), map.svg);
  if (pins.length && !map.countries.length) {
    warnings.push('El mapa no ha reconocido ningún país: revisa lat/lon en site.json');
  }
}

/* ---------- Datos estructurados ---------- */
function jsonLdFor(lang, t) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.brand,
    description: t.home.description,
    url: `${site.domain}/${pathsByLang[lang].home}`,
    image: `${site.domain}/assets/img/og-image.jpg`,
    logo: `${site.domain}/assets/img/logo-tradissea.png`,
    sameAs: [site.contact.linkedin],
    areaServed: 'Worldwide',
    knowsLanguage: ['es-ES', 'en', 'de'],
    address: { '@type': 'PostalAddress', addressCountry: 'ES' },
    serviceType: t.home.services.items.map((service) => service.title)
  };
}

/* ---------- Generación de páginas ---------- */
const sitemapEntries = [];

const renderPage = ({ lang, pageKey, depth, title, description, content, jsonLd, canonicalKey, bodyClass, noindex, game }) => {
  const t = translations[lang];
  const paths = pathsByLang[lang];
  const key = canonicalKey || pageKey;
  const altPaths = Object.fromEntries(
    languages.map((code) => [code, pathsByLang[code][key] || `${code}/404/`])
  );

  return layout({
    site,
    t,
    lang,
    langs: languages,
    pageKey,
    depth,
    paths,
    altPaths,
    canonical: paths[key] || `${lang}/404/`,
    noindex,
    game,
    title,
    description,
    content,
    jsonLd,
    bodyClass,
    assets
  });
};

for (const lang of languages) {
  const t = translations[lang];
  const paths = pathsByLang[lang];

  /* Inicio */
  write(
    path.join(paths.home, 'index.html'),
    renderPage({
      lang,
      pageKey: 'home',
      depth: 1,
      title: t.home.title,
      description: t.home.description,
      content: homePage({ site, t, depth: 1, paths }),
      jsonLd: jsonLdFor(lang, t)
    })
  );
  sitemapEntries.push({ lang, key: 'home', priority: '1.0' });

  /* Páginas legales */
  const legalDocs = [
    { key: 'legal', file: 'legal.md' },
    { key: 'privacy', file: 'privacy.md' },
    { key: 'cookies', file: 'cookies.md' }
  ];

  for (const doc of legalDocs) {
    const source = path.join(CONTENT, 'legal', lang, doc.file);
    if (!fs.existsSync(source)) {
      warnings.push(`Falta el documento legal ${lang}/${doc.file}`);
      continue;
    }
    const meta = t.legalPages[doc.key];
    write(
      path.join(paths[doc.key], 'index.html'),
      renderPage({
        lang,
        pageKey: doc.key,
        depth: 2,
        title: meta.title,
        description: `${meta.heading} — ${site.brand}`,
        content: legalPage({
          t,
          heading: meta.heading,
          html: markdownToHtml(fs.readFileSync(source, 'utf8')).replace(
            /\{\{email\}\}/g,
            mailLink({ email: site.contact.email, fallbackHref: `../#${t.anchors.contact}` })
          ),
          notice: t.legalPages.translationNotice
        })
      })
    );
    sitemapEntries.push({ lang, key: doc.key, priority: '0.3' });
  }
}

/* ---------- Página del juego ---------- */
if (gameOn) {
  const words = readJson(path.join(CONTENT, 'words.json'));
  for (const lang of languages) {
    const t = translations[lang];
    const list = (words[lang] || []).map((word) => String(word).trim().toUpperCase());
    const wrong = list.filter((word) => word.length !== 5);
    if (wrong.length) warnings.push(`[words.json → ${lang}] no tienen 5 letras: ${wrong.join(', ')}`);
    if (!list.length) {
      warnings.push(`[words.json → ${lang}] no hay palabras: el juego quedará vacío`);
      continue;
    }

    write(
      path.join(pathsByLang[lang].game, 'index.html'),
      renderPage({
        lang,
        pageKey: 'game',
        depth: 2,
        title: t.game.title,
        description: t.game.description,
        content: gamePage({ site, t, depth: 2, paths: pathsByLang[lang] }),
        game: {
          /* Las palabras viajan codificadas para que no se lean de un vistazo
             en el código de la página. No es seguridad, es cortesía. */
          words: list.map(encodeWord),
          percent: Number(percent),
          prefix: (site.discount && site.discount.prefix) || 'TRAD'
        }
      })
    );
    sitemapEntries.push({ lang, key: 'game', priority: '0.5' });
  }
}

/* ---------- Páginas 404 ----------
   El servidor solo puede servir un archivo para las direcciones que no existen,
   así que se genera una página 404 completa por idioma y, en la raíz, un
   redirector que elige la del idioma del visitante. */
for (const lang of languages) {
  const t = translations[lang];
  const paths = pathsByLang[lang];
  write(
    `${lang}/404/index.html`,
    renderPage({
      lang,
      pageKey: 'notFound',
      depth: -1,
      title: t.notFound.title,
      description: t.notFound.text,
      noindex: true,
      content: notFoundPage({ t, paths, anchors: t.anchors })
    })
  );
}

{
  const fallback = site.defaultLanguage;
  const routes = Object.fromEntries(languages.map((lang) => [lang, `/${lang}/404/`]));
  write(
    '404.html',
    `<!DOCTYPE html>
<html lang="${fallback}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>${esc(translations[fallback].notFound.title)}</title>
<link rel="icon" href="/assets/img/favicon.ico" sizes="any">
<script>
(function () {
  var routes = ${JSON.stringify(routes)};
  var available = ${JSON.stringify(languages)};
  var chosen = null;
  try { chosen = localStorage.getItem('tradissea-lang'); } catch (e) {}
  if (available.indexOf(chosen) === -1) chosen = null;
  if (!chosen) {
    var preferred = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < preferred.length && !chosen; i++) {
      var code = String(preferred[i]).slice(0, 2).toLowerCase();
      if (available.indexOf(code) !== -1) chosen = code;
    }
  }
  window.location.replace(routes[chosen || '${fallback}']);
})();
</script>
<noscript><meta http-equiv="refresh" content="0; url=/${fallback}/404/"></noscript>
</head>
<body>
<p><a href="/${fallback}/404/">${esc(translations[fallback].notFound.heading)}</a></p>
</body>
</html>
`
  );
}

/* ---------- Raíz: elige idioma ---------- */
{
  const options = languages
    .map((lang) => {
      const t = translations[lang];
      return `<a class="lang-option" href="${pathsByLang[lang].home}" hreflang="${lang}" lang="${lang}">
        <span class="code">${lang.toUpperCase()}</span>
        <span class="name">${esc(t.meta.languageName)}</span>
      </a>`;
    })
    .join('\n      ');

  const alternates = languages
    .map((lang) => `<link rel="alternate" hreflang="${lang}" href="${site.domain}/${pathsByLang[lang].home}">`)
    .join('\n');

  write(
    'index.html',
    `<!DOCTYPE html>
<html lang="${site.defaultLanguage}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(site.brand)} — ${esc(translations[site.defaultLanguage].home.title)}</title>
<meta name="description" content="${esc(translations[site.defaultLanguage].home.description)}">
<link rel="canonical" href="${site.domain}/${pathsByLang[site.defaultLanguage].home}">
${alternates}
<link rel="alternate" hreflang="x-default" href="${site.domain}/">
<link rel="icon" href="assets/img/favicon.ico" sizes="any">
<link rel="icon" href="assets/img/icon-512.png" type="image/png">
<link rel="apple-touch-icon" href="assets/img/apple-touch-icon.png">
<link rel="stylesheet" href="assets/css/${assets.css}">
<style>
  .picker { min-height: 100dvh; display: grid; place-items: center; text-align: center;
    background: linear-gradient(180deg, var(--sky-mist), #fff); padding: 2rem 1.25rem; }
  .picker img { width: min(320px, 74vw); margin: 0 auto 2.5rem; }
  .lang-options { display: flex; flex-wrap: wrap; gap: 0.9rem; justify-content: center; }
  .lang-option { display: flex; flex-direction: column; gap: 0.15rem; min-width: 8.5rem;
    padding: 1rem 1.4rem; background: #fff; border: 1px solid var(--line); border-radius: var(--radius);
    text-decoration: none; box-shadow: var(--shadow-sm); transition: transform .18s ease, border-color .18s ease; }
  .lang-option:hover { transform: translateY(-3px); border-color: rgba(0,128,126,.45); }
  .lang-option .code { font-family: var(--font-display); font-size: 1.5rem; color: var(--teal); }
  .lang-option .name { font-size: .9rem; color: var(--ink-soft); }
</style>
<noscript><meta http-equiv="refresh" content="0; url=${pathsByLang[site.defaultLanguage].home}"></noscript>
</head>
<body>
<div class="picker">
  <div>
    <img src="assets/img/logo-tradissea.svg" alt="${esc(site.brand)}" width="760" height="220">
    <div class="lang-options">
      ${options}
    </div>
  </div>
</div>
<script>
(function () {
  var available = ${JSON.stringify(languages)};
  var routes = ${JSON.stringify(Object.fromEntries(languages.map((lang) => [lang, pathsByLang[lang].home])))};
  var chosen = null;
  try { chosen = localStorage.getItem('tradissea-lang'); } catch (e) {}
  if (available.indexOf(chosen) === -1) chosen = null;
  if (!chosen) {
    var preferred = navigator.languages || [navigator.language || ''];
    for (var i = 0; i < preferred.length && !chosen; i++) {
      var code = String(preferred[i]).slice(0, 2).toLowerCase();
      if (available.indexOf(code) !== -1) chosen = code;
    }
  }
  window.location.replace(routes[chosen || '${site.defaultLanguage}']);
})();
</script>
</body>
</html>
`
  );
}

/* ---------- sitemap.xml y robots.txt ---------- */
{
  const today = new Date().toISOString().slice(0, 10);
  const urls = sitemapEntries
    .map(({ lang, key, priority }) => {
      const alternates = languages
        .map(
          (code) =>
            `    <xhtml:link rel="alternate" hreflang="${code}" href="${site.domain}/${pathsByLang[code][key]}"/>`
        )
        .join('\n');
      return `  <url>
    <loc>${site.domain}/${pathsByLang[lang][key]}</loc>
    <lastmod>${today}</lastmod>
    <priority>${priority}</priority>
${alternates}
    <xhtml:link rel="alternate" hreflang="x-default" href="${site.domain}/"/>
  </url>`;
    })
    .join('\n');

  write(
    'sitemap.xml',
    `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
${urls}
</urlset>
`
  );

  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${site.domain}/sitemap.xml\n`);
}

/* ---------- Dominio propio (opcional) ---------- */
if (site.customDomain) write('CNAME', `${site.customDomain}\n`);

/* ---------- Resumen ---------- */
const pageCount = sitemapEntries.length + 2;
log(`✓ Sitio generado en dist/ — ${pageCount} páginas, idiomas: ${languages.join(', ')}`);
if (warnings.length) {
  log('\n⚠ Avisos:');
  warnings.forEach((warning) => log(`  · ${warning}`));
  log('');
}
