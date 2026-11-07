// Surrounding context (kept deliberately muted so the proposal reads clearly):
// Indian Hill Blvd (west), California Botanic Garden (north), Bernard Field Station (east),
// CGU / Claremont School of Theology (south), existing neighborhood west of Indian Hill.
import { pointInPolygon, distToPolygonEdge } from '../core/geo.js';
import { car, CAR_COLORS } from './parking.js';

export function buildContext(d, forest, r, { boundary, road }) {
  // big ground plane: dry Inland Empire grassland
  d.rect('dry', '#ffffff', 0, 0, 3600, 3600, -0.05);
  // irrigated site base (the proposal)
  d.poly('grass', '#ffffff', boundary, 0.0);

  const ihx = road.indianHillX;
  // ---- Indian Hill Blvd (4 lanes + landscaped median)
  d.rect('asphalt', '#ffffff', ihx, 0, 22, 2400, 0.02);
  d.rect('concrete', '#ffffff', ihx, 0, 3.2, 2400, 0.1);
  d.rect('grass', '#e6f0d8', ihx, 0, 2.6, 2400, 0.11);
  for (const s of [-1, 1]) {
    d.dashes('markings', '#f0f0f0', [[ihx + s * 5.4, -1200], [ihx + s * 5.4, 1200]], 0.12, 3, 6, 0.06);
    d.rect('concrete', '#ffffff', ihx + s * 13.5, 0, 2.2, 2400, 0.1);
  }
  for (let z = -1150; z < 1150; z += 22) {
    if (Math.abs(z - 34) < 30) continue;
    forest.add(z % 44 === 0 ? 'ctx' : 'sycamore', ihx, z + r.range(-3, 3), 0.75 + r() * 0.2);
  }
  // ---- Foothill Blvd (south) and E Radcliffe Dr (north)
  const foothillZ = 470, radcliffeZ = -480;
  d.rect('asphalt', '#ffffff', 0, foothillZ, 3600, 26, 0.02);
  d.rect('concrete', '#ffffff', 0, foothillZ, 3600, 3, 0.1);
  for (const s of [-1, 1]) d.dashes('markings', '#f0f0f0', [[-1800, foothillZ + s * 6.5], [1800, foothillZ + s * 6.5]], 0.12, 3, 6, 0.06);
  d.rect('asphalt', '#ffffff', 300, radcliffeZ, 2400, 12, 0.02);
  d.dashes('markings', '#e8c34a', [[-900, radcliffeZ], [1500, radcliffeZ]], 0.12, 3, 4, 0.06);
  // Mills Ave (east, far)
  d.rect('asphalt', '#ffffff', 900, 0, 16, 2400, 0.02);

  // ---- land-use patches
  const botanic = [[-189, -1100], [700, -1100], [700, -203], [186, -203], [-5, -203], [-57, -116], [-186, -116], [-189, -116]];
  const fieldStation = [[186, -203], [700, -203], [700, 420], [186, 420]];
  d.poly('scrub', '#ffffff', fieldStation, -0.03);
  d.poly('scrub', '#ffffff', botanic, -0.03);

  // trees & scrub in the Botanic Garden (north) — avoid the site and roads
  for (let i = 0; i < 900; i++) {
    const x = r.range(-188, 700), z = r.range(-900, -120);
    if (pointInPolygon(x, z, boundary) || distToPolygonEdge(x, z, boundary) < 6) continue;
    if (!pointInPolygon(x, z, botanic) || Math.abs(z - radcliffeZ) < 12) continue;
    if (r() < 0.45) forest.add('ctx', x, z, 0.6 + r() * 0.6);
    else forest.add('scrub', x, z, 0.9 + r() * 1.4, undefined, r.pick(['#5d6943', '#6b7149', '#4f5d3c', '#77744f']));
  }
  // coastal sage scrub in the Bernard Field Station (east)
  for (let i = 0; i < 1100; i++) {
    const x = r.range(195, 880), z = r.range(-195, 420);
    if (r() < 0.12) forest.add('ctx', x, z, 0.5 + r() * 0.5);
    else forest.add('scrub', x, z, 0.8 + r() * 1.6, undefined, r.pick(['#5f6a43', '#6c7048', '#566240', '#7a7752', '#4e5a3a']));
  }

  // ---- south: CGU / School of Theology campus massing (muted)
  const campus = [
    [-150, 290, 60, 30, 9], [-60, 300, 40, 50, 12], [40, 280, 70, 26, 10], [140, 300, 50, 40, 8],
    [-130, 380, 50, 40, 8], [-20, 390, 80, 30, 11], [110, 380, 60, 34, 9], [260, 330, 80, 50, 10],
  ];
  for (const [x, z, w, dd, h] of campus) {
    d.block('matte', '#e3ddd2', x, 0, z, w, h, dd);
    d.block('matte', '#cfc8bb', x, h, z, w + 0.6, 0.6, dd + 0.6);
    for (let k = 0; k < 3; k++) forest.add('ctx', x + r.range(-w / 2 - 8, w / 2 + 8), z + dd / 2 + 8 + r() * 6, 0.7 + r() * 0.4);
  }
  // surface lots + trees south
  for (let i = 0; i < 160; i++) {
    const x = r.range(-200, 600), z = r.range(225, 455);
    if (campus.some(([cx, cz, w, dd]) => Math.abs(x - cx) < w / 2 + 6 && Math.abs(z - cz) < dd / 2 + 6)) continue;
    forest.add('ctx', x, z, 0.6 + r() * 0.5);
  }

  // ---- existing single-family neighborhood west of Indian Hill
  for (let row = 0; row < 26; row++) {
    const z = -620 + row * 48;
    d.rect('asphalt', '#ffffff', -520, z + 24, 600, 9, 0.02);
    for (let col = 0; col < 14; col++) {
      const x = -240 - col * 22 + r.range(-2, 2), hz = z + (col % 2 ? 6 : -4);
      if (r() < 0.12) continue;
      const w = 12 + r() * 4, dd = 10 + r() * 3;
      d.block('matte', r.pick(['#e8dfcf', '#ddd3c2', '#efe9df', '#d8cdb8']), x, 0, hz, w, 3.4, dd);
      d.prism('roof', r.pick(['#9b6a55', '#8c5a48', '#7a6e66', '#a0705a']), x, 3.4, hz, dd + 0.8, 2.2, w + 0.8, Math.PI / 2);
      if (r() < 0.7) forest.add('ctx', x + r.range(-10, 10), hz + 10, 0.55 + r() * 0.35);
      if (r() < 0.35) car(d, x + 7, hz - 8, Math.PI / 2, r.pick(CAR_COLORS), 'sedan');
    }
  }
  // a few cars on Indian Hill
  for (let i = 0; i < 10; i++) {
    const z = r.range(-700, 700), dir = i % 2;
    car(d, ihx + (dir ? 3.2 : -3.2) + (r() < 0.5 ? 0 : (dir ? 3.6 : -3.6)), z, dir ? Math.PI / 2 : -Math.PI / 2, r.pick(CAR_COLORS), 'sedan');
  }

  return {
    labels: [
      { text: 'Indian Hill Blvd', pos: [ihx, 2, -260] },
      { text: 'Foothill Blvd', pos: [60, 2, foothillZ] },
      { text: 'California Botanic Garden', pos: [120, 4, -330] },
      { text: 'Bernard Field Station', pos: [330, 4, 40] },
      { text: 'CGU · Claremont School of Theology', pos: [0, 12, 300] },
      { text: 'To the 5Cs campuses ↘', pos: [340, 4, 380] },
    ],
  };
}
