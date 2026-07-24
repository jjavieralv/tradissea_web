#!/usr/bin/env node
/* Servidor local para ver la web mientras se edita.
   Uso:  node serve.mjs [--port 4000] [--watch]
   Con --watch, cualquier cambio en content/ o src/ regenera el sitio. */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');

const args = process.argv.slice(2);
const portArg = args.indexOf('--port');
const PORT = Number(process.env.PORT || (portArg !== -1 ? args[portArg + 1] : 4000));
const WATCH = args.includes('--watch');

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2'
};

function build() {
  const result = spawnSync(process.execPath, [path.join(ROOT, 'build.mjs')], {
    stdio: 'inherit',
    cwd: ROOT
  });
  return result.status === 0;
}

if (!fs.existsSync(DIST) || WATCH) build();

if (WATCH) {
  let timer = null;
  const schedule = () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      process.stdout.write('\n↻ Cambios detectados, regenerando…\n');
      build();
    }, 150);
  };
  for (const dir of ['content', 'src', 'static']) {
    const target = path.join(ROOT, dir);
    if (fs.existsSync(target)) fs.watch(target, { recursive: true }, schedule);
  }
}

const server = http.createServer((req, res) => {
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch {
    pathname = '/';
  }

  let filePath = path.join(DIST, pathname);
  if (!filePath.startsWith(DIST)) {
    res.writeHead(403).end('Forbidden');
    return;
  }

  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    if (!pathname.endsWith('/')) {
      res.writeHead(301, { Location: `${pathname}/` }).end();
      return;
    }
    filePath = path.join(filePath, 'index.html');
  }

  if (!fs.existsSync(filePath)) {
    const notFound = path.join(DIST, '404.html');
    const body = fs.existsSync(notFound) ? fs.readFileSync(notFound) : 'Not found';
    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' }).end(body);
    return;
  }

  const type = TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache' });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(PORT, () => {
  process.stdout.write(`\n  Tradissea → http://localhost:${PORT}\n`);
  process.stdout.write(`  ${WATCH ? 'Modo edición: los cambios se aplican al guardar.' : 'Sirviendo dist/'}\n\n`);
});
