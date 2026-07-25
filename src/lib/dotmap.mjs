/* ============================================================
   Mapamundi de puntos.

   Dibuja los continentes como una retícula de puntos y colorea en amarillo
   los países donde está cada cliente. Los contornos salen de un TopoJSON de
   dominio público (Natural Earth, vía world-atlas), que vive en scripts/.
   ============================================================ */

/* Proyección equirectangular recortada por arriba y por abajo: sobra la
   Antártida y así el mapa no queda con un hueco enorme. Estas constantes
   deben coincidir con las de src/templates/partials.mjs. */
export const MAP = { latTop: 78, latBottom: -56, width: 1500, cols: 150, rows: 66 };

const COLOR_LAND = '#a9dcf2';
const COLOR_MARK = '#f2c230';

/** Decodifica los arcos de un TopoJSON a coordenadas geográficas. */
function decodeArcs(topo) {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty];
    });
  });
}

function ringOf(indices, arcs) {
  const points = [];
  for (const index of indices) {
    const arc = index < 0 ? arcs[~index].slice().reverse() : arcs[index];
    if (points.length) points.pop();
    points.push(...arc);
  }
  return points;
}

/** Algunos contornos (Rusia, Fiyi) cruzan el antimeridiano con un salto de
 *  +180 a −180. Sin partirlos, el trazado de rayos toma ese salto por costa y
 *  pinta filas enteras de tierra falsa en medio del océano. */
function splitAtEdge(ring) {
  const jumps = (a, b) => Math.abs(a[0] - b[0]) > 180;
  let start = 0;
  for (let i = 1; i < ring.length; i += 1) {
    if (jumps(ring[i - 1], ring[i])) {
      start = i;
      break;
    }
  }
  if (!start) return [ring];

  const rotated = ring.slice(start).concat(ring.slice(1, start + 1));
  const parts = [];
  let current = [rotated[0]];
  for (let i = 1; i < rotated.length; i += 1) {
    const from = rotated[i - 1];
    const to = rotated[i];
    if (jumps(from, to)) {
      const dir = from[0] > 0 ? 1 : -1;
      const t = (180 * dir - from[0]) / (to[0] + 360 * dir - from[0]);
      const edgeLat = from[1] + t * (to[1] - from[1]);
      current.push([180 * dir, edgeLat]);
      parts.push(current);
      current = [[-180 * dir, edgeLat], to];
    } else {
      current.push(to);
    }
  }
  parts.push(current);
  return parts.filter((part) => part.length > 2);
}

function boxOf(ring) {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of ring) {
    if (x < x0) x0 = x;
    if (x > x1) x1 = x;
    if (y < y0) y0 = y;
    if (y > y1) y1 = y;
  }
  return [x0, y0, x1, y1];
}

/** Prepara la lista de países con sus anillos y sus cajas envolventes. */
function readCountries(topo) {
  const arcs = decodeArcs(topo);
  return topo.objects.countries.geometries.map((geometry) => {
    const polygons = geometry.type === 'MultiPolygon' ? geometry.arcs : [geometry.arcs];
    const rings = [];
    for (const polygon of polygons) {
      for (const indices of polygon) rings.push(...splitAtEdge(ringOf(indices, arcs)));
    }
    return {
      name: (geometry.properties && geometry.properties.name) || String(geometry.id),
      rings,
      boxes: rings.map(boxOf),
      box: boxOf(rings.flat())
    };
  });
}

function insideRings(country, lon, lat) {
  let hits = 0;
  for (let k = 0; k < country.rings.length; k += 1) {
    const [x0, y0, x1, y1] = country.boxes[k];
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    const ring = country.rings[k];
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const [xi, yi] = ring[i];
      const [xj, yj] = ring[j];
      if (yi > lat !== yj > lat && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hits += 1;
    }
  }
  return hits % 2 === 1;
}

/** País que contiene unas coordenadas (o null si caen en el mar). */
export function countryAt(countries, lat, lon) {
  for (const country of countries) {
    const [x0, y0, x1, y1] = country.box;
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    if (insideRings(country, lon, lat)) return country.name;
  }
  return null;
}

/**
 * Genera el SVG del mapa.
 * @param {object} topo    TopoJSON de países (world-atlas countries-110m).
 * @param {array}  places  [{ lat, lon }] de los clientes que hay que resaltar.
 */
export function buildDotMap(topo, places = []) {
  const countries = readCountries(topo);
  const highlighted = new Set();
  for (const place of places) {
    const name = countryAt(countries, place.lat, place.lon);
    if (name) highlighted.add(name);
  }

  const cell = MAP.width / MAP.cols;
  const height = Math.round(cell * MAP.rows);
  const stepLon = 360 / MAP.cols;
  const stepLat = (MAP.latTop - MAP.latBottom) / MAP.rows;

  const land = [];
  const marks = [];

  for (let row = 0; row < MAP.rows; row += 1) {
    /* El desplazamiento evita que la latitud caiga justo sobre un vértice. */
    const lat = MAP.latTop - stepLat * (row + 0.5) + 0.0007;
    for (let col = 0; col < MAP.cols; col += 1) {
      const lon = -180 + stepLon * (col + 0.5) + 0.0011;
      const name = countryAt(countries, lat, lon);
      if (!name) continue;
      const dot = `M${Math.round((col + 0.5) * cell)} ${Math.round((row + 0.5) * cell)}h.01`;
      (highlighted.has(name) ? marks : land).push(dot);
    }
  }

  const stroke = (cell * 0.62).toFixed(1);
  return {
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="${MAP.width}" height="${height}" viewBox="0 0 ${
      MAP.width
    } ${height}" aria-hidden="true" focusable="false"><g fill="none" stroke-width="${stroke}" stroke-linecap="round"><path stroke="${COLOR_LAND}" d="${land.join(
      ''
    )}"/><path stroke="${COLOR_MARK}" d="${marks.join('')}"/></g></svg>\n`,
    height,
    countries: [...highlighted]
  };
}
