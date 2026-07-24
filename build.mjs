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

import { layout, prefixFor, esc } from './src/templates/layout.mjs';
import { homePage } from './src/templates/home.mjs';
import { aboutPage } from './src/templates/about.mjs';
import { contactPage } from './src/templates/contact.mjs';
import { legalPage, notFoundPage } from './src/templates/legal.mjs';
import { markdownToHtml } from './src/lib/markdown.mjs';

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

/* Rutas de cada página por idioma (relativas a la raíz del sitio). */
const PAGE_KEYS = ['home', 'about', 'contact', 'legal', 'privacy', 'cookies'];
const pathsByLang = Object.fromEntries(
  languages.map((lang) => {
    const routes = translations[lang].routes;
    const entries = PAGE_KEYS.map((key) => {
      const slug = routes[key] || '';
      return [key, slug ? `${lang}/${slug}/` : `${lang}/`];
    });
    return [lang, Object.fromEntries(entries)];
  })
);

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

/* ---------- Datos estructurados ---------- */
function jsonLdFor(lang, t) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: site.brand,
    description: t.home.description,
    url: `${site.domain}/${pathsByLang[lang].home}`,
    email: site.contact.email,
    telephone: site.contact.phone,
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

const renderPage = ({ lang, pageKey, depth, title, description, content, jsonLd, canonicalKey, bodyClass }) => {
  const t = translations[lang];
  const paths = pathsByLang[lang];
  const altPaths = Object.fromEntries(
    languages.map((code) => [code, pathsByLang[code][canonicalKey || pageKey]])
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
    canonical: paths[canonicalKey || pageKey],
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

  /* Sobre nosotros */
  write(
    path.join(paths.about, 'index.html'),
    renderPage({
      lang,
      pageKey: 'about',
      depth: 2,
      title: t.about.title,
      description: t.about.description,
      content: aboutPage({ site, t, depth: 2, paths })
    })
  );
  sitemapEntries.push({ lang, key: 'about', priority: '0.8' });

  /* Contacto */
  write(
    path.join(paths.contact, 'index.html'),
    renderPage({
      lang,
      pageKey: 'contact',
      depth: 2,
      title: t.contact.title,
      description: t.contact.description,
      content: contactPage({ site, t, depth: 2, paths })
    })
  );
  sitemapEntries.push({ lang, key: 'contact', priority: '0.8' });

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
          html: markdownToHtml(fs.readFileSync(source, 'utf8')),
          notice: t.legalPages.translationNotice
        })
      })
    );
    sitemapEntries.push({ lang, key: doc.key, priority: '0.3' });
  }
}

/* ---------- Página 404 (rutas absolutas) ---------- */
{
  const lang = site.defaultLanguage;
  const t = translations[lang];
  const paths = pathsByLang[lang];
  write(
    '404.html',
    renderPage({
      lang,
      pageKey: 'home',
      depth: -1,
      title: t.notFound.title,
      description: t.notFound.text,
      content: notFoundPage({ t, paths })
    })
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
    <img src="assets/img/logo-tradissea.png" alt="${esc(site.brand)}" width="760" height="220">
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
