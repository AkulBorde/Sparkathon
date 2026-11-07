// Landscape: entrance park, themed courtyards, Commons Spine + greenway, community garden,
// recreation green, pedestrian paths. All drought-tolerant / native-leaning plant palettes.
import { T } from '../core/batcher.js';
import { smoothPath, ellipsePts, roundedRectPts, distToSegment } from '../core/geo.js';
import { NATIVE_SHRUBS, GRASSES } from './vegetation.js';
import { pavilion } from './buildings.js';
import {
  bench, umbrellaTable, picnicTable, pathLight, stringLightPost, stringLights, raisedBed, compostBins, toolShed,
  greenhouse, fitnessStation, bocceCourt, pingPong, halfCourt, boulder, fountain, trashBin, bikeRack, shadeSail,
  person, playStructure, swingSet, springRider, soccerField, communityPool, gazebo,
} from './furniture.js';

const WOOD = '#9b7350';

function nearPolyline(x, z, pts, w) {
  for (let i = 1; i < pts.length; i++) if (distToSegment(x, z, pts[i - 1], pts[i]) < w) return true;
  return false;
}

/** Native planting bed: mulch/DG ground with shrubs, grasses and boulders. Coordinates are world. */
export function nativeBed(d, forest, r, pts, density = 0.12, ground = 'mulch') {
  d.poly(ground, '#ffffff', pts, 0.035);
  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
  for (const [x, z] of pts) { minX = Math.min(minX, x); maxX = Math.max(maxX, x); minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z); }
  const area = (maxX - minX) * (maxZ - minZ);
  const n = Math.round(area * density);
  for (let i = 0; i < n; i++) {
    const x = r.range(minX, maxX), z = r.range(minZ, maxZ);
    if (!inPoly(x, z, pts)) continue;
    const v = r();
    if (v < 0.5) forest.add('shrub', x, z, 0.6 + r() * 0.7, undefined, r.pick(NATIVE_SHRUBS));
    else if (v < 0.92) forest.add('grass', x, z, 0.7 + r() * 0.6, undefined, r.pick(GRASSES));
    else boulder(d, x, z, 0.6 + r() * 0.9);
  }
}

function inPoly(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

// =====================================================================================
//  ENTRANCE PARK
// =====================================================================================
export function buildPark(d, forest, r, P, extras, makeSign) {
  const { bounds: B, axisZ } = P;
  const features = {};
  // jogging / walking loop
  const loop = smoothPath(P.loop, 160, true);
  d.ribbon('dg', '#ffffff', loop, 3.2, 0.055, true);
  // event lawn
  const L = P.eventLawn;
  d.poly('lawn', '#ffffff', ellipsePts(L.x, L.z, L.rx, L.rz, 64), 0.03);
  d.ribbon('concrete', '#ffffff', ellipsePts(L.x, L.z, L.rx + 1.2, L.rz + 1.2, 64), 2.2, 0.05, true);
  features.lawn = { x: L.x, z: L.z, sx: L.rx * 2, sz: L.rz * 2 };
  // stage at the north end
  d.at(P.stage.x, 0, P.stage.z, 0, () => {
    d.block('matte', '#cdc6b8', 0, 0, 0, 14, 0.8, 7);
    d.block('matte', '#bdb5a5', 0, 0, 4.0, 14, 0.4, 1.2);
    for (const x of [-6.5, 6.5]) for (const z of [-3, 3]) d.block('metal', '#4a4f52', x, 0.8, z, 0.3, 4.4, 0.3);
    d.box('metal', '#e9e6df', 0, 5.6, 0, 15, 0.25, 8, 0, -0.12);
    d.box('wood', WOOD, 0, 3.0, -3.4, 13, 4.4, 0.2);
  });
  // string lights around the lawn
  const posts = ellipsePts(L.x, L.z, L.rx + 3.2, L.rz + 3.2, 12);
  posts.forEach((p, i) => {
    stringLightPost(d, p[0], p[1]);
    stringLights(d, p, posts[(i + 1) % posts.length], 4.4, 0.6);
  });
  // benches around the lawn facing it
  ellipsePts(L.x, L.z, L.rx + 5.2, L.rz + 5.2, 16).forEach(([x, z], i) => {
    if (i % 2) bench(d, x, z, Math.atan2(L.x - x, L.z - z));
  });
  // soccer field in the middle of the event lawn
  d.at(L.x, 0, L.z, 0, () => soccerField(d, 32, 54));
  features.soccer = { x: L.x, z: L.z, sx: 34, sz: 56 };
  for (let i = 0; i < 16; i++) person(d, L.x + r.range(-14, 14), L.z + r.range(-24, 24), r() * 6, r);

  // main axis promenade + entrance plaza
  d.ribbon('pavers', '#ffffff', [[B.x0 - 3, axisZ], [-127, axisZ]], 7, 0.065);
  d.rect('pavers', '#ffffff', P.plaza.x, P.plaza.z, 18, 32, 0.07);
  d.disc('pavers', '#e8dccb', P.plaza.x + 2, P.plaza.z, 6.5, 0.075);
  fountain(d, P.plaza.x + 2, P.plaza.z, 3.2);
  // monument sign wall facing Indian Hill
  d.block('matte', '#a8957a', B.x0 - 1.2, 0, axisZ - 11, 1.2, 1.3, 9);
  d.block('matte', '#a8957a', B.x0 - 1.2, 0, axisZ + 11, 1.2, 1.3, 9);
  d.block('matte', '#9a8870', B.x0 - 1.2, 1.3, axisZ - 11, 1.4, 0.12, 9.2);
  d.block('matte', '#9a8870', B.x0 - 1.2, 1.3, axisZ + 11, 1.4, 0.12, 9.2);
  extras.push(makeSign(['NORTH CAMPUS COMMONS', 'Claremont Colleges Workforce Housing'], B.x0 - 1.95, 0.68, axisZ - 11, -Math.PI / 2, 8.4, 1.05, '#3d4a3f'));
  extras.push(makeSign(['NORTH CAMPUS COMMONS', 'Public Park · Community Center'], B.x0 - 1.95, 0.68, axisZ + 11, -Math.PI / 2, 8.4, 1.05, '#3d4a3f'));
  for (const z of [axisZ - 15, axisZ - 5.5, axisZ + 5.5, axisZ + 15]) forest.add('palm', B.x0 + 1.5, z, 0.85 + r() * 0.15);
  bikeRack(d, P.plaza.x + 6, P.plaza.z - 13, 0, 6);
  bikeRack(d, P.plaza.x + 6, P.plaza.z + 13, 0, 6);
  // allée of sycamores along the promenade
  for (let x = -165; x <= -133; x += 9) { forest.add('sycamore', x, axisZ - 6.5, 0.9 + r() * 0.15); forest.add('sycamore', x, axisZ + 6.5, 0.9 + r() * 0.15); pathLight(d, x + 4.5, axisZ - 4); pathLight(d, x + 4.5, axisZ + 4); }
  for (let i = 0; i < 10; i++) person(d, r.range(-175, -130), axisZ + r.range(-3, 3), r() < 0.5 ? Math.PI / 2 : -Math.PI / 2, r);

  // playground
  const PG = P.playground;
  d.poly('rubber', '#ffffff', roundedRectPts(PG.x, PG.z, PG.w, PG.d, 5), 0.06);
  d.ribbon('concrete', '#ffffff', roundedRectPts(PG.x, PG.z, PG.w + 2.4, PG.d + 2.4, 6), 1.2, 0.055, true);
  playStructure(d, PG.x - 4, PG.z - 2, 0.1);
  swingSet(d, PG.x + 8, PG.z + 6, 0);
  springRider(d, PG.x + 9, PG.z - 6, '#e74c3c'); springRider(d, PG.x + 11, PG.z - 4, '#f1c40f'); springRider(d, PG.x + 7, PG.z - 3.5, '#3498db');
  shadeSail(d, PG.x - 4, PG.z - 2, 0.3, 11, '#f0e9d8');
  shadeSail(d, PG.x + 8, PG.z + 6, -0.4, 8, '#d9ebe6');
  for (let k = 0; k < 4; k++) bench(d, PG.x - 12 + k * 8, PG.z - PG.d / 2 - 2.8, 0);
  // basketball courts in front of the playground
  const courtZ = PG.z + PG.d / 2 + 10;
  for (const cx of [PG.x - 8, PG.x + 9]) halfCourt(d, cx, courtZ, 0);
  for (let i = 0; i < 8; i++) person(d, PG.x + r.range(-14, 15), courtZ + r.range(-5, 5), r() * 6, r);
  features.courts = { x: PG.x + 0.5, z: courtZ, sx: 34, sz: 16 };
  for (let i = 0; i < 12; i++) person(d, PG.x + r.range(-12, 12), PG.z + r.range(-8, 8), r() * 6, r);
  features.playground = { x: PG.x, z: PG.z, sx: PG.w, sz: PG.d };

  // pavilion with BBQ + picnic area
  // community pool (replaces the picnic pavilion)
  const PV = P.pavilion;
  d.at(PV.x, 0, PV.z, 0, () => communityPool(d, r));
  features.pavilion = { x: PV.x, z: PV.z, sx: 40, sz: 26 };

  // native meadow + bioswale (south)
  const M = P.meadow;
  const meadow = [[M.x0, M.z0], [M.x1, M.z0 + 4], [M.x1, M.z1], [M.x0, M.z1]];
  nativeBed(d, forest, r, meadow, 0.32, 'dg');
  d.ribbon('dg', '#d7c7a5', smoothPath([[M.x0 + 2, M.z0 + 12], [-150, M.z0 + 6], [-128, M.z0 + 16], [M.x1 - 2, M.z0 + 10]], 40), 2, 0.06);
  // frontage native beds along Indian Hill
  for (const [z0, z1] of [[B.z0 + 4, axisZ - 18], [axisZ + 18, B.z1 - 4]]) {
    nativeBed(d, forest, r, [[B.x0 - 2, z0], [B.x0 + 6, z0 + 3], [B.x0 + 7, z1 - 3], [B.x0 - 2, z1]], 0.35);
  }
  // shade trees around the park, avoiding program areas
  const avoid = (x, z) => {
    if (((x - L.x) / (L.rx + 6)) ** 2 + ((z - L.z) / (L.rz + 6)) ** 2 < 1) return true;
    if (Math.abs(x - PG.x) < PG.w / 2 + 4 && Math.abs(z - PG.z) < PG.d / 2 + 4) return true;
    if (Math.abs(x - PG.x) < 21 && Math.abs(z - (PG.z + PG.d / 2 + 10)) < 9.5) return true;
    if (Math.abs(x - PV.x) < 22 && Math.abs(z - PV.z) < 16) return true;
    if (Math.abs(z - axisZ) < 10 && x < -120) return true;
    if (x > -130 && Math.abs(z - axisZ) < 22) return true; // community center + patio
    if (Math.abs(x - P.stage.x) < 10 && Math.abs(z - P.stage.z) < 7) return true;
    if (nearPolyline(x, z, loop, 3.2)) return true;
    if (x > M.x0 && x < M.x1 && z > M.z0 && z < M.z1) return r() > 0.08;
    return false;
  };
  for (let i = 0; i < 420; i++) {
    const x = r.range(B.x0 + 3, B.x1 - 2), z = r.range(B.z0 + 2, B.z1 - 2);
    if (avoid(x, z)) continue;
    const v = r();
    forest.add(v < 0.5 ? 'oak' : v < 0.72 ? 'sycamore' : v < 0.86 ? 'jacaranda' : 'olive', x, z, 0.8 + r() * 0.35);
    if (forest.items.oak && forest.count > 2000) break;
  }
  // benches + lights along the loop
  for (let i = 0; i < loop.length; i += 8) {
    const [x, z] = loop[i], [nx, nz] = loop[(i + 1) % loop.length];
    const ry = Math.atan2(nx - x, nz - z);
    bench(d, x + Math.cos(ry) * 2.6, z - Math.sin(ry) * 2.6, ry - Math.PI / 2);
    pathLight(d, x - Math.cos(ry) * 2.2, z + Math.sin(ry) * 2.2);
  }
  for (let i = 0; i < 10; i++) { const [x, z] = loop[Math.floor(r() * loop.length)]; person(d, x, z, r() * 6, r); }
  return { features, loop };
}

// =====================================================================================
//  COURTYARDS (drawn in cluster-local frame; hx/hz = inner half-sizes between buildings)
// =====================================================================================
export function courtyard(d, forest, r, c, info, dims) {
  const { hx, hz } = info.court;
  const mews = c.type === 'mews';
  const inset = 3.4; // porch zone
  const wx = hx - inset, wz = hz - inset;
  const plant = (sp, x, z, s = 1, color) => { const [X, Z] = d.world(x, z); forest.add(sp, X, Z, s, undefined, color); };

  if (mews) {
    d.rect('lawn', '#ffffff', 0, 0, hx * 2, hz * 2 - 2, 0.03);
    d.rect('concrete', '#ffffff', 0, 0, hx * 2 + 8, 2.4, 0.06);
    for (const s of [-1, 1]) d.rect('concrete', '#ffffff', 0, s * (hz - 2.6), hx * 2, 1.2, 0.055);
  } else {
    d.rect('lawn', '#ffffff', 0, 0, hx * 2, hz * 2, 0.03);
    d.ribbon('concrete', '#ffffff', [[-wx, -wz], [wx, -wz], [wx, wz], [-wx, wz]], 2.0, 0.06, true);
    // corner passages out to the surrounding walks (only where an E/W building exists)
    const passZ = (hz + dims.shortUnits * dims.shortUnitWidth / 2) / 2;
    for (const sx of [-1, 1]) {
      const side = sx > 0 ? 'e' : 'w';
      if (info.sides.includes(side)) for (const sz of [-1, 1]) d.ribbon('concrete', '#ffffff', [[sx * wx, sz * passZ], [sx * (hx + dims.depth + dims.yard + 1), sz * passZ]], 2.4, 0.062);
      else d.rect('pavers', '#ffffff', sx * (hx + 2), 0, 6, hz * 2 - 4, 0.065); // open side: entry plaza
    }
    for (const sz of [-1, 1]) {
      const side = sz > 0 ? 's' : 'n';
      if (!info.sides.includes(side)) d.rect('pavers', '#ffffff', 0, sz * (hz + 2), hx * 2 - 4, 6, 0.065);
    }
    // open side gateway arbor
    const openDir = { n: [0, -1], s: [0, 1], e: [1, 0], w: [-1, 0] }[c.open];
    if (openDir) {
      const [ox, oz] = openDir;
      const gx = ox * (hx + 1), gz = oz * (hz + 1);
      const ry = ox ? Math.PI / 2 : 0;
      d.at(gx, 0, gz, ry, () => {
        for (const s of [-1, 1]) { d.block('wood', WOOD, s * 2.2, 0, 0, 0.25, 2.8, 0.25); d.block('wood', WOOD, s * 2.2, 0, 1.6, 0.25, 2.8, 0.25); }
        for (let k = 0; k < 6; k++) d.block('wood', '#a87a52', 0, 2.8, -0.2 + k * 0.4, 5.2, 0.15, 0.1);
        d.block('wood', WOOD, 0, 2.6, 0, 5, 0.2, 0.15); d.block('wood', WOOD, 0, 2.6, 1.6, 5, 0.2, 0.15);
      });
      for (const s of [-1, 1]) {
        const [sx2, sz2] = ox ? [gx + ox * 3, s * (hz - 4)] : [s * (hx - 4), gz + oz * 3];
        plant('olive', sx2, sz2, 0.9);
      }
    }
  }
  // corner/edge shade trees
  if (!mews) for (const [sx, sz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) plant(r() < 0.5 ? 'olive' : 'jacaranda', sx * (wx - 2.8), sz * (wz - 2.8), 0.75 + r() * 0.15);
  // small foundation plantings along porches
  const edgeShrubs = mews ? 10 : 16;
  for (let i = 0; i < edgeShrubs; i++) {
    const t = r() * 2 - 1, side = Math.floor(r() * 4);
    const [x, z] = side < 2 ? [t * (hx - 1), (side ? 1 : -1) * (hz - 2.4)] : [(side === 2 ? 1 : -1) * (hx - 2.4), t * (hz - 1)];
    if (mews && side >= 2) continue;
    plant('shrub', x, z, 0.55 + r() * 0.4, r.pick(NATIVE_SHRUBS));
  }

  const W = mews ? hx - 4 : wx - 1.8, H = mews ? hz - 4 : wz - 1.8; // usable half-size of theme area
  const theme = c.theme;
  if (theme === 'social') {
    if (!mews) { d.rect('pavers', '#ffffff', 0, 0, W * 1.3, H * 1.2, 0.065); }
    const n = mews ? 4 : 3;
    for (let i = 0; i < n; i++) umbrellaTable(d, (i - (n - 1) / 2) * (W * 0.55), mews ? 0 : -H * 0.25, r.pick(['#eae3d2', '#d8e8e3', '#f2dccb', '#e3e0f0']), r);
    // pergola with long communal table
    d.at(0, 0, mews ? 0 : H * 0.45, 0, () => {
      for (const x of [-4, 0, 4]) for (const z of [-1.5, 1.5]) d.block('wood', WOOD, x, 0, z, 0.22, 2.8, 0.22);
      for (const z of [-1.5, 1.5]) d.block('wood', WOOD, 0, 2.8, z, 8.8, 0.25, 0.18);
      for (let k = 0; k < 16; k++) d.block('wood', '#a87a52', -4.2 + k * 0.56, 3.05, 0, 0.1, 0.16, 3.6);
      d.block('wood', WOOD, 0, 0.74, 0, 6, 0.06, 1.0);
      for (const s of [-1, 1]) d.block('wood', WOOD, 0, 0.42, s * 0.85, 6, 0.05, 0.35);
    });
    if (!mews) {
      const P = [[-W, -H], [W, -H], [W, H], [-W, H]];
      P.forEach((p) => stringLightPost(d, p[0], p[1]));
      stringLights(d, P[0], P[2], 4.4, 0.8); stringLights(d, P[1], P[3], 4.4, 0.8);
    }
    for (let i = 0; i < 9; i++) person(d, r.range(-W, W), r.range(-H, H), r() * 6, r, r() < 0.5);
  } else if (theme === 'garden') {
    d.rect('dg', '#ffffff', 0, 0, W * 2 + 1, H * 2 + 1, 0.05);
    const cols = Math.max(2, Math.floor((W * 2) / 3.6)), rows = Math.max(1, Math.floor((H * 2) / 2.6));
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      if (i === cols - 1 && j === 0 && !mews) continue;
      raisedBed(d, -W + 1.6 + i * ((W * 2 - 3.2) / Math.max(cols - 1, 1)), -H + 1 + j * ((H * 2 - 2) / Math.max(rows - 1, 1)), 0, r);
    }
    compostBins(d, W - 1.8, -H + 0.8, 0);
    if (!mews) toolShed(d, -W - 0.3, H + 0.4, 0);
    plant('citrus', W - 1, H - 1, 0.9); plant('citrus', -W + 1, -H + 0.5, 0.8);
    for (let i = 0; i < 5; i++) person(d, r.range(-W, W), r.range(-H, H), r() * 6, r);
  } else if (theme === 'recreation') {
    if (W > 11) bocceCourt(d, 0, mews ? 0 : -H * 0.45, Math.PI / 2);
    pingPong(d, mews ? -W * 0.7 : -W * 0.5, mews ? 0 : H * 0.45, 0);
    fitnessStation(d, W * 0.45, mews ? 0 : H * 0.45, 0, 0);
    fitnessStation(d, mews ? W * 0.85 : W * 0.85, mews ? 0 : H * 0.45, 0, 1);
    if (!mews) fitnessStation(d, -W * 0.1, H * 0.45, 0, 2);
    for (let i = 0; i < 7; i++) person(d, r.range(-W, W), r.range(-H, H), r() * 6, r);
  } else { // relax
    if (!mews) fountain(d, 0, 0, 1.6);
    const bx = mews ? [-W * 0.6, -W * 0.2, W * 0.2, W * 0.6] : [-4, 4];
    for (const x of bx) { bench(d, x, mews ? -1.6 : -3.4, 0); bench(d, x, mews ? 1.6 : 3.4, Math.PI); }
    plant('oak', mews ? -W * 0.85 : -W * 0.6, mews ? 0 : H * 0.1, 0.75);
    plant(mews ? 'jacaranda' : 'oak', mews ? W * 0.85 : W * 0.6, mews ? 0 : -H * 0.1, 0.7);
    // reading nook: pergola + lounge chairs
    if (!mews) d.at(-W * 0.55, 0, -H * 0.55, 0.3, () => {
      for (const [x, z] of [[-1.6, -1.2], [1.6, -1.2], [1.6, 1.2], [-1.6, 1.2]]) d.block('wood', WOOD, x, 0, z, 0.2, 2.6, 0.2);
      for (let k = 0; k < 8; k++) d.block('wood', '#a87a52', -1.8 + k * 0.5, 2.6, 0, 0.12, 0.15, 3.0);
      for (const x of [-0.8, 0.8]) { d.box('wood', '#c49a6c', x, 0.35, 0, 0.7, 0.08, 1.8, 0, -0.25); }
    });
    for (let i = 0; i < 6; i++) { const [x, z] = [r.range(-W * 0.7, W * 0.7), r.range(-H * 0.7, H * 0.7)]; boulder(d, x, z, 0.5 + r() * 0.5); plant('grass', x + 0.8, z + 0.4, 0.8, r.pick(GRASSES)); }
    for (let i = 0; i < 5; i++) person(d, r.range(-W, W), r.range(-H, H), r() * 6, r, r() < 0.6);
  }
}

// =====================================================================================
//  COMMONS SPINE, GREENWAY, PATHS
// =====================================================================================
export function buildGreenways(d, forest, r, G) {
  const S = G.spine;
  const z0 = S.z - S.width / 2, z1 = S.z + S.width / 2;
  d.rect('lawn', '#ffffff', (S.x0 + S.x1) / 2, S.z, S.x1 - S.x0, S.width, 0.03);
  d.ribbon('pavers', '#ffffff', [[S.x0, S.z], [S.x1, S.z]], S.path, 0.065);
  // rain-garden bioswales on both sides (stormwater infiltration)
  for (const zz of [z0 + 3.2, z1 - 3.2]) {
    for (let x = S.x0 + 6; x < S.x1 - 10; x += 34) {
      if (Math.abs(x + 12 - G.plaza.x) < 16 || Math.abs(x + 12 + 12) < 10) continue;
      const pts = roundedRectPts(x + 12, zz, 24, 3.2, 1.5, 3);
      d.poly('mulch', '#c9bfae', pts, 0.04);
      for (let k = 0; k < 9; k++) {
        const px = x + 1.5 + k * 2.6, pz = zz + r.range(-0.8, 0.8);
        if (k % 3 === 1) d.tpl(T.blob2, 'matte', '#9a9286', px, 0.12, pz, 0.8, 0.35, 0.7);
        else forest.add(k % 2 ? 'grass' : 'shrub', px, pz, 0.6 + r() * 0.4, undefined, r.pick(k % 2 ? GRASSES : NATIVE_SHRUBS));
      }
    }
  }
  // tree rows + benches + lights
  for (let x = S.x0 + 6; x < S.x1 - 4; x += 12) {
    if (Math.abs(x - G.plaza.x) < 12) continue;
    forest.add(x % 24 < 12 ? 'sycamore' : 'jacaranda', x, S.z - 6.5, 0.85 + r() * 0.2);
    forest.add(x % 24 < 12 ? 'jacaranda' : 'sycamore', x + 6, S.z + 6.5, 0.85 + r() * 0.2);
    pathLight(d, x + 3, S.z - 3.2); pathLight(d, x + 9, S.z + 3.2);
    if ((x - S.x0) % 24 < 12) { bench(d, x + 3, S.z - 4.4, 0); bench(d, x + 9, S.z + 4.4, Math.PI); }
  }
  for (let i = 0; i < 30; i++) person(d, r.range(S.x0, S.x1), S.z + r.range(-2.5, 2.5), r() < 0.5 ? Math.PI / 2 : -Math.PI / 2, r);

  // north-south greenway (gently curving, fire-lane rated path)
  const Gw = G.greenway;
  const gpath = smoothPath(Gw.ctrl, 90);
  d.rect('lawn', '#ffffff', Gw.x, -13, Gw.width - 4, 330, 0.028);
  d.ribbon('concrete', '#ffffff', gpath, Gw.path, 0.062);
  for (let i = 0; i < gpath.length - 1; i += 4) {
    const [x, z] = gpath[i];
    if (Math.abs(z - S.z) < 16) continue;
    const side = (i / 4) % 2 ? 1 : -1;
    forest.add(r.pick(['oak', 'sycamore', 'oak', 'jacaranda']), x + side * r.range(7, 12), z + r.range(-2, 2), 0.8 + r() * 0.3);
    if (i % 12 === 0) bench(d, x - side * 3.2, z, side > 0 ? Math.PI / 2 : -Math.PI / 2);
    if (i % 8 === 0) pathLight(d, x + side * 2.6, z);
  }
  // meandering bioswale along the greenway
  const swale = smoothPath(Gw.ctrl.map(([x, z], i) => [x + (i % 2 ? -9 : 9), z]), 70).filter(([, z]) => Math.abs(z - S.z) > 18 && z > -175 && z < 150);
  for (let i = 0; i < swale.length; i++) {
    const [x, z] = swale[i];
    if (i % 2 === 0) forest.add('grass', x, z, 0.9, undefined, r.pick(GRASSES));
    else forest.add('shrub', x + 0.8, z, 0.7, undefined, r.pick(NATIVE_SHRUBS));
  }
  for (let i = 0; i < 16; i++) { const [x, z] = gpath[Math.floor(r() * gpath.length)]; person(d, x, z, r() * 6, r); }

  // crossroads plaza where the spine meets the greenway
  const PZ = G.plaza;
  d.disc('pavers', '#ffffff', PZ.x, PZ.z, PZ.r, 0.07, 40);
  d.cyl('matte', '#c8bca8', PZ.x, 0, PZ.z, 5.2, 0.5, 24);
  d.cyl('mulch', '#6b513a', PZ.x, 0.01, PZ.z, 4.6, 0.52, 24);
  forest.add('oak', PZ.x, PZ.z, 1.15);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.5; bench(d, PZ.x + Math.cos(a) * 7.2, PZ.z + Math.sin(a) * 7.2, Math.atan2(-Math.cos(a), -Math.sin(a)) + Math.PI); }
  for (let i = 0; i < 8; i++) person(d, PZ.x + r.range(-7, 7), PZ.z + r.range(-7, 7), r() * 6, r);

  // secondary walks
  for (const p of G.paths) {
    d.ribbon('concrete', '#ffffff', p.pts, p.w, 0.06);
  }
  return { greenwayPath: gpath };
}

// =====================================================================================
//  RECREATION GREEN + COMMUNITY GARDEN / ORCHARD
// =====================================================================================
export function buildRecGreen(d, forest, r, A) {
  const { x, z, w, d: dd } = A;
  d.rect('lawn', '#ffffff', x, z, w, dd, 0.03);
  d.ribbon('dg', '#ffffff', roundedRectPts(x, z, w - 6, dd - 6, 8, 4), 2.4, 0.055, true);
  halfCourt(d, x + 12, z + 6, Math.PI);
  bocceCourt(d, x - 15, z + 4, 0);
  fitnessStation(d, x - 4, z - 17, 0, 0); fitnessStation(d, x + 4, z - 17, 0, 1); fitnessStation(d, x + 12, z - 17, 0, 2);
  pingPong(d, x - 6, z + 12, Math.PI / 2);
  for (const [tx, tz] of [[x - w / 2 + 3, z - dd / 2 + 3], [x + w / 2 - 3, z - dd / 2 + 3], [x - w / 2 + 3, z + dd / 2 - 3], [x + w / 2 - 3, z + dd / 2 - 3], [x, z - dd / 2 + 2.5]]) forest.add('oak', tx, tz, 0.8);
  for (let k = 0; k < 4; k++) bench(d, x - 18 + k * 12, z + dd / 2 - 5.5, Math.PI);
  for (let i = 0; i < 14; i++) person(d, x + r.range(-w / 2 + 4, w / 2 - 4), z + r.range(-dd / 2 + 4, dd / 2 - 4), r() * 6, r);
}

export function buildNorthGarden(d, forest, r, A) {
  const { x, z, w, d: dd } = A;
  d.rect('dg', '#ffffff', x, z, w, dd, 0.045);
  // raised bed allotments
  for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) raisedBed(d, x - 6 + i * 3.4, z - 14 + j * 2.6, 0, r);
  // orchard (citrus + olive)
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) forest.add(j === 2 ? 'olive' : 'citrus', x - 6 + i * 5.5, z + 4 + j * 5.5, 0.9);
  greenhouse(d, x - 17, z - 10, Math.PI / 2);
  compostBins(d, x + 17, z - 15, 0); compostBins(d, x + 17, z - 11, 0);
  toolShed(d, x + 18, z - 4, -Math.PI / 2);
  picnicTable(d, x + 16, z + 10, 0);
  // pollinator meadow edge
  nativeBed(d, forest, r, [[x - w / 2, z + dd / 2 - 4], [x + w / 2, z + dd / 2 - 4], [x + w / 2, z + dd / 2], [x - w / 2, z + dd / 2]], 0.6);
  for (let i = 0; i < 9; i++) person(d, x + r.range(-10, 10), z + r.range(-16, 0), r() * 6, r);
}

/** Small neighborhood park among the homes: lawn, loop walk, gazebo, play pieces, benches, shade trees. */
export function pocketPark(d, forest, r, { x, z, w, d: dd }) {
  d.poly('lawn', '#ffffff', roundedRectPts(x, z, w, dd, 9, 5), 0.032);
  d.ribbon('dg', '#ffffff', roundedRectPts(x, z, w - 7, dd - 7, 7, 5), 2.2, 0.058, true);
  gazebo(d, x, z, 3.2);
  playStructure(d, x + w * 0.24, z - dd * 0.18, 0.4);
  d.disc('rubber', '#ffffff', x + w * 0.24, z - dd * 0.18, 6.5, 0.05);
  swingSet(d, x - w * 0.24, z + dd * 0.2, 0.2);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + 0.3; bench(d, x + Math.cos(a) * 7, z + Math.sin(a) * 7, Math.atan2(-Math.cos(a), -Math.sin(a))); }
  const ring = roundedRectPts(x, z, w - 2.5, dd - 2.5, 8, 3);
  ring.forEach(([tx, tz], i) => { if (i % 2 === 0) forest.add(r.pick(['oak', 'jacaranda', 'sycamore']), tx, tz, 0.75 + r() * 0.2); });
  for (let i = 0; i < 12; i++) person(d, x + r.range(-w / 2 + 4, w / 2 - 4), z + r.range(-dd / 2 + 4, dd / 2 - 4), r() * 6, r, r() < 0.3);
}
