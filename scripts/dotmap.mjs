import fs from 'node:fs';

const topo = JSON.parse(fs.readFileSync('scripts/land-110m.json', 'utf8'));
const [sx, sy] = topo.transform.scale;
const [tx, ty] = topo.transform.translate;

const arcs = topo.arcs.map(arc => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => { x += dx; y += dy; return [x * sx + tx, y * sy + ty]; });
});
const ring = idx => {
  const pts = [];
  for (const i of idx) {
    const a = i < 0 ? arcs[~i].slice().reverse() : arcs[i];
    if (pts.length) pts.pop();
    pts.push(...a);
  }
  return pts;
};

/* Algunos contornos (Rusia, Fiyi, la Antártida) cruzan el antimeridiano y
   vienen con un salto de +180 a -180. Si se dejan así, el trazado de rayos
   cuenta ese salto como si fuera costa y pinta filas enteras de tierra falsa
   en medio del océano. Aquí se parten por el borde y se cierra cada trozo. */
const splitAtEdge = (r) => {
  const jump = (a, b) => Math.abs(a[0] - b[0]) > 180;
  let start = 0;
  for (let i = 1; i < r.length; i++) if (jump(r[i - 1], r[i])) { start = i; break; }
  if (!start) return [r];
  const rotated = r.slice(start).concat(r.slice(1, start + 1));
  const parts = [];
  let cur = [rotated[0]];
  for (let i = 1; i < rotated.length; i++) {
    const p0 = rotated[i - 1], p1 = rotated[i];
    if (jump(p0, p1)) {
      const dir = p0[0] > 0 ? 1 : -1;
      const t = (180 * dir - p0[0]) / (p1[0] + 360 * dir - p0[0]);
      const yEdge = p0[1] + t * (p1[1] - p0[1]);
      cur.push([180 * dir, yEdge]);
      parts.push(cur);
      cur = [[-180 * dir, yEdge], p1];
    } else {
      cur.push(p1);
    }
  }
  parts.push(cur);
  return parts.filter((p) => p.length > 2);
};

const geom = topo.objects.land.geometries;
const rings = [];
for (const g of geom) {
  const polys = g.type === 'MultiPolygon' ? g.arcs : [g.arcs];
  for (const poly of polys) for (const r of poly) rings.push(...splitAtEdge(ring(r)));
}
// bounding boxes para descartar rápido
const boxes = rings.map(r => {
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for (const [x,y] of r) { if(x<x0)x0=x; if(x>x1)x1=x; if(y<y0)y0=y; if(y>y1)y1=y; }
  return [x0,y0,x1,y1];
});
console.log('anillos:', rings.length);

const inside = (lon, lat) => {
  let hits = 0;
  for (let k = 0; k < rings.length; k++) {
    const [x0,y0,x1,y1] = boxes[k];
    if (lon < x0 || lon > x1 || lat < y0 || lat > y1) continue;
    const r = rings[k];
    for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
      const [xi, yi] = r[i], [xj, yj] = r[j];
      if ((yi > lat) !== (yj > lat) && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) hits++;
    }
  }
  return hits % 2 === 1;
};

// lienzo: equirectangular recortada (sin Antártida)
const LAT_TOP = 78, LAT_BOTTOM = -56;
const COLS = 150, ROWS = 66;
const W = 1500;
const stepLon = 360 / COLS;
const stepLat = (LAT_TOP - LAT_BOTTOM) / ROWS;
const cell = W / COLS;
const height = Math.round(cell * ROWS);
const r = (cell * 0.34).toFixed(1);

let dots = [];
for (let row = 0; row < ROWS; row++) {
  // el desplazamiento evita que la latitud coincida con un vértice del contorno
  const lat = LAT_TOP - stepLat * (row + 0.5) + 0.0007;
  for (let col = 0; col < COLS; col++) {
    const lon = -180 + stepLon * (col + 0.5) + 0.0011;
    if (!inside(lon, lat)) continue;
    const x = (col + 0.5) * cell;
    const y = (row + 0.5) * cell;
    dots.push(`M${Math.round(x)} ${Math.round(y)}h.01`);
  }
}
console.log('puntos de tierra:', dots.length, '| lienzo', W, 'x', height);

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${height}" viewBox="0 0 ${W} ${height}" aria-hidden="true" focusable="false"><path d="${dots.join('')}" stroke="#a9dcf2" stroke-width="${(cell * 0.62).toFixed(1)}" stroke-linecap="round" fill="none"/></svg>
`;
fs.writeFileSync('/home/coder/web_paula/static/img/world-dots.svg', svg);
console.log('SVG:', (svg.length/1024).toFixed(1), 'KB');
// datos de proyección para colocar los marcadores
console.log('PROYECCIÓN', JSON.stringify({ W, H: height, LAT_TOP, LAT_BOTTOM }));
