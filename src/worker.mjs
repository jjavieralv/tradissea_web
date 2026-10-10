/* Tradissea — código que se ejecuta en Cloudflare.
   La web sigue siendo estática: Cloudflare sirve los archivos de dist/ sin
   pasar por aquí. Este código solo atiende las direcciones /api/, hoy una:

     GET /api/word?lang=es&q=aureo   →   { "exists": true }

   El juego «La palabra del día» la usa para saber si una palabra existe. La
   consulta a Wikcionario la hace Cloudflare y no el navegador, así que
   Wikimedia nunca ve la dirección IP de quien juega: solo recibe la palabra.
   `npm run dev` usa este mismo archivo (serve.mjs), así que en local se
   comporta igual que publicado. */

/* Wikimedia pide que quien consulta su API se identifique. */
const USER_AGENT = 'TradisseaWeb/1.0 (https://tradissea.com)';
const DAY = 60 * 60 * 24;

/* Quita tildes, diéresis, ñ y ß: el teclado del juego no las tiene, así que
   AUREO tiene que encontrar «áureo» y GROSS, «groß». */
const plain = (text) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ß/g, 'ss').toLowerCase();

/** ¿Está la palabra en el Wikcionario de ese idioma? Devuelve true o false,
 *  o null si Wikcionario no ha contestado bien. La búsqueda no distingue
 *  acentos y se acepta cualquier título que, sin ellos, coincida. */
export async function wordExists(lang, word, fetchImpl = fetch) {
  const lower = word.toLowerCase();
  const url =
    `https://${lang}.wiktionary.org/w/api.php?action=query&format=json` +
    `&list=search&srnamespace=0&srlimit=50&srprop=&srsearch=${encodeURIComponent('intitle:' + lower)}`;
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': USER_AGENT },
    /* En Cloudflare, la respuesta se guarda un mes: las palabras no cambian
       y así Wikcionario recibe muy pocas consultas. */
    cf: { cacheTtl: DAY * 30, cacheEverything: true }
  });
  if (!res.ok) return null;
  const data = await res.json().catch(() => null);
  if (!data || !data.query || !Array.isArray(data.query.search)) return null;
  return data.query.search.some((page) => plain(String(page.title)) === lower);
}

const reply = (body, status, maxAge = 0) =>
  new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': maxAge ? `public, max-age=${maxAge}` : 'no-store',
      'X-Content-Type-Options': 'nosniff'
    }
  });

/** Atiende /api/*. Si Wikcionario no responde, contesta 502 y el juego da la
 *  palabra por buena: nadie se queda sin jugar por un problema de red. */
export async function handleApi(request, fetchImpl) {
  const url = new URL(request.url);
  if (url.pathname !== '/api/word') return reply({ error: 'not found' }, 404);
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return reply({ error: 'method not allowed' }, 405);
  }

  const lang = url.searchParams.get('lang') || '';
  const word = url.searchParams.get('q') || '';
  if (!/^[a-z]{2,3}$/.test(lang) || !/^[a-zA-Z]{2,15}$/.test(word)) {
    return reply({ error: 'bad request' }, 400);
  }

  let exists = null;
  try {
    exists = await wordExists(lang, word, fetchImpl);
  } catch {
    exists = null;
  }
  if (exists === null) return reply({ error: 'dictionary unavailable' }, 502);
  return reply({ exists }, 200, DAY);
}

export default {
  fetch(request, env) {
    if (new URL(request.url).pathname.startsWith('/api/')) return handleApi(request);
    return env.ASSETS.fetch(request);
  }
};
