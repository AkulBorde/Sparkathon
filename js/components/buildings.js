// Residential architecture: Southern California townhomes (stucco, tile roofs, porches, bays,
// balconies, private patios), cluster arrangement, community center and park pavilion.
import * as THREE from 'three';
import { T } from '../core/batcher.js';

export const PALETTES = [
  { wall: '#ece2ce', wall2: '#e2d4b9', trim: '#faf6ee', roof: '#a9573b', base: '#b9a98d', door: ['#2f4b5c', '#7a2f2a', '#3d5a40', '#5b4636'] },
  { wall: '#dec8a4', wall2: '#d2b993', trim: '#f6f0e4', roof: '#99462f', base: '#a48d6b', door: ['#284055', '#6e3b2a', '#45553a', '#2f2f2f'] },
  { wall: '#f2ede4', wall2: '#e7dece', trim: '#ffffff', roof: '#b5653f', base: '#c3b8a6', door: ['#335e6b', '#8a3b2c', '#4b5f3a', '#c48a3a'] },
  { wall: '#d2d5bf', wall2: '#c4caac', trim: '#f5f3ea', roof: '#8f4834', base: '#a3a68e', door: ['#5a3a2a', '#2c4757', '#7b5a2c', '#3a3a3a'] },
  { wall: '#e8cdb7', wall2: '#ddbca2', trim: '#f8f1e8', roof: '#a4503a', base: '#b79c86', door: ['#2d4a55', '#425b3b', '#6b2f2b', '#383838'] },
  { wall: '#dadedb', wall2: '#cbd1ce', trim: '#ffffff', roof: '#615b58', base: '#a9adaa', door: ['#a3482f', '#2c4b63', '#3f5d47', '#c08a35'] },
];

const FRAME = '#3a3530', GLASS = '#5f7b90', CONC = '#cdc7bb', FENCE = '#8d6c4c', RAIL = '#2d2d2d';
const PITCH = (24 * Math.PI) / 180, TAN = Math.tan(PITCH);
const FLOOR = 3.0, PLINTH = 0.45;

/** Window with frame, glass, mullion and sill. (px,pz) on a wall face; ry rotates so local +z points outward. */
export function windowAt(d, px, pz, ry, yc, w, h, trim = '#f6f2ea') {
  d.at(px, 0, pz, ry, () => {
    d.box('matte', FRAME, 0, yc, 0.025, w + 0.14, h + 0.14, 0.07);
    d.box('glass', GLASS, 0, yc, 0.07, w, h, 0.03);
    d.box('matte', FRAME, 0, yc, 0.09, 0.05, h, 0.025);
    if (w > 1.5) d.box('matte', FRAME, 0, yc + h * 0.18, 0.09, w, 0.04, 0.025);
    d.box('stucco', trim, 0, yc - h / 2 - 0.1, 0.07, w + 0.32, 0.08, 0.17);
  });
}

/** Gable roof spanning `L` along x and `D` deep, eave at height H. Ridge along x. */
export function gableRoof(d, L, D, H, color, gableColor, { ov = 0.45, ends = true, cap = true } = {}) {
  const s = D / 2 + ov, slope = s / Math.cos(PITCH), Lr = L + 0.7;
  const yc = H + (D / 2 - s / 2) * TAN + 0.08;
  d.tpl(T.box, 'roof', color, 0, yc, s / 2, Lr, 0.16, slope, 0, PITCH, 0);
  d.tpl(T.box, 'roof', color, 0, yc, -s / 2, Lr, 0.16, slope, 0, -PITCH, 0);
  if (cap) d.box('roof', shade(color, 0.82), 0, H + (D / 2) * TAN + 0.17, 0, Lr, 0.16, 0.34);
  if (ends) {
    d.prism('stucco', gableColor, -L / 2 + 0.1, H, 0, D, (D / 2) * TAN, 0.2, Math.PI / 2);
    d.prism('stucco', gableColor, L / 2 - 0.1, H, 0, D, (D / 2) * TAN, 0.2, Math.PI / 2);
  }
  d.box('stucco', '#f4efe6', 0, H - ov * TAN - 0.02, s - 0.04, Lr, 0.2, 0.06);
  d.box('stucco', '#f4efe6', 0, H - ov * TAN - 0.02, -s + 0.04, Lr, 0.2, 0.06);
}

export function shade(hex, k) {
  const c = new THREE.Color(hex);
  c.multiplyScalar(k);
  return '#' + c.getHexString();
}

/**
 * One attached townhouse building in local coordinates: length along x (centered), front door
 * side faces +z, back (private patio side) faces -z, ground at y=0.
 */
export function townhouseBar(d, { units, uw, D, stories, pal, r, yards = true, balconies = true }) {
  const H = PLINTH + stories * FLOOR, L = units * uw, zf = D / 2, zb = -D / 2;
  let footprint = L * D;
  for (let i = 0; i < units; i++) {
    const x0 = -L / 2 + i * uw, cx = x0 + uw / 2;
    const wall = i % 2 ? pal.wall2 : pal.wall;
    const bay = i % 2 === 1 || units === 1;
    d.block('stucco', wall, cx, 0, 0, uw, H, D);
    d.block('matte', pal.base, cx, 0, 0, uw + 0.02, 0.55, D + 0.08);
    if (i > 0) d.block('stucco', pal.trim, x0, 0.55, 0, 0.24, H - 0.55, D + 0.1);
    for (let k = 1; k < stories; k++) d.box('stucco', pal.trim, cx, PLINTH + k * FLOOR, 0, uw, 0.14, D + 0.1);

    // ---- front: door, stoop, porch canopy
    const doorX = x0 + 1.25;
    d.box('stucco', pal.trim, doorX, PLINTH + 1.22, zf + 0.02, 1.32, 2.5, 0.06);
    d.box('paint', r.pick(pal.door), doorX, PLINTH + 1.08, zf + 0.06, 0.96, 2.16, 0.06);
    d.box('glass', GLASS, doorX, PLINTH + 2.32, zf + 0.07, 0.96, 0.22, 0.03);
    d.block('matte', CONC, doorX, 0, zf + 0.85, 2.0, PLINTH, 1.7);
    d.block('matte', CONC, doorX, 0, zf + 1.95, 2.0, PLINTH / 2, 0.5);
    d.box('stucco', pal.trim, doorX, PLINTH + 2.78, zf + 0.9, 2.2, 0.14, 1.8);
    d.cyl('matte', pal.trim, doorX - 0.95, PLINTH, zf + 1.68, 0.14, 2.72, 6);
    d.cyl('matte', pal.trim, doorX + 0.95, PLINTH, zf + 1.68, 0.14, 2.72, 6);
    d.box('glow', '#fff1cc', doorX + 0.78, PLINTH + 2.0, zf + 0.06, 0.12, 0.22, 0.1);
    d.box('matte', '#4b4038', doorX - 0.8, PLINTH + 1.3, zf + 0.06, 0.28, 0.18, 0.05); // house number plate
    // planter pot by the stoop
    d.cyl('matte', '#b5654a', doorX + 1.3, 0, zf + 1.2, 0.5, 0.45, 8);
    d.sphere('foliage', r.pick(['#5d7d3c', '#6f8a46', '#7b6a9e']), doorX + 1.3, 0.62, zf + 1.2, 0.6, 0.45, 0.6);

    if (bay) {
      const bw = uw - 3.0, bx = x0 + 2.55 + bw / 2, bd = 1.1;
      footprint += bw * bd;
      d.block('stucco', wall, bx, 0, zf + bd / 2, bw, H, bd);
      d.block('matte', pal.base, bx, 0, zf + bd / 2, bw + 0.04, 0.55, bd + 0.04);
      for (let k = 1; k < stories; k++) d.box('stucco', pal.trim, bx, PLINTH + k * FLOOR, zf + bd / 2, bw + 0.08, 0.14, bd + 0.08);
      for (let f = 0; f < stories; f++) windowAt(d, bx, zf + bd, 0, PLINTH + f * FLOOR + (f ? 1.6 : 1.45), bw - 0.9, f ? 1.5 : 1.75, pal.trim);
      for (let f = 1; f < stories; f++) windowAt(d, doorX, zf, 0, PLINTH + f * FLOOR + 1.6, 0.9, 1.4, pal.trim);
      // front-facing cross gable over the bay (penetrates the main roof)
      const hs = bw / 2 + 0.35, zb2 = zf - 2.8, zfr = zf + bd + 0.4, zl = zfr - zb2, zc = (zfr + zb2) / 2;
      const sw = hs / Math.cos(PITCH), ycs = H + (bw / 2 - hs / 2) * TAN + 0.08;
      d.tpl(T.box, 'roof', pal.roof, bx - hs / 2, ycs, zc, sw, 0.16, zl, 0, 0, PITCH);
      d.tpl(T.box, 'roof', pal.roof, bx + hs / 2, ycs, zc, sw, 0.16, zl, 0, 0, -PITCH);
      d.prism('stucco', wall, bx, H, zf + bd - 0.1, bw, (bw / 2) * TAN, 0.2);
      d.box('roof', shade(pal.roof, 0.82), bx, H + (bw / 2) * TAN + 0.16, zc, 0.3, 0.14, zl);
      // little vent in the gable
      d.box('stucco', pal.trim, bx, H + (bw / 2) * TAN * 0.42, zf + bd + 0.01, 0.5, 0.35, 0.04);
    } else {
      windowAt(d, x0 + 4.25, zf, 0, PLINTH + 1.45, 1.8, 1.6, pal.trim);
      for (let f = 1; f < stories; f++) {
        windowAt(d, x0 + 1.5, zf, 0, PLINTH + f * FLOOR + 1.6, 1.15, 1.45, pal.trim);
        windowAt(d, x0 + 4.4, zf, 0, PLINTH + f * FLOOR + 1.6, 1.5, 1.45, pal.trim);
      }
    }

    // ---- back: sliding door, windows, balconies
    d.at(x0 + 2.2, 0, zb, Math.PI, () => {
      d.box('matte', FRAME, 0, PLINTH + 1.12, 0.025, 2.5, 2.3, 0.07);
      d.box('glass', GLASS, 0, PLINTH + 1.12, 0.07, 2.36, 2.16, 0.03);
      d.box('matte', FRAME, 0, PLINTH + 1.12, 0.09, 0.06, 2.16, 0.025);
    });
    windowAt(d, x0 + uw - 1.15, zb, Math.PI, PLINTH + 1.55, 0.9, 1.2, pal.trim);
    for (let f = 1; f < stories; f++) {
      const fy = PLINTH + f * FLOOR;
      const hasBalc = balconies && (stories >= 3 || i % 2 === 0);
      if (hasBalc) {
        d.at(x0 + 2.0, 0, zb, Math.PI, () => {
          d.box('matte', FRAME, 0, fy + 1.12, 0.025, 1.7, 2.3, 0.07);
          d.box('glass', GLASS, 0, fy + 1.12, 0.07, 1.56, 2.16, 0.03);
        });
        const bwid = uw - 1.0;
        d.box('stucco', pal.trim, cx, fy - 0.1, zb - 0.75, bwid, 0.2, 1.5);
        d.box('metal', RAIL, cx, fy + 1.0, zb - 1.47, bwid, 0.06, 0.06);
        d.box('metal', RAIL, cx - bwid / 2 + 0.03, fy + 0.5, zb - 0.75, 0.06, 1.0, 1.5);
        d.box('metal', RAIL, cx + bwid / 2 - 0.03, fy + 0.5, zb - 0.75, 0.06, 1.0, 1.5);
        for (let k = 0; k <= 12; k++) d.box('metal', RAIL, cx - bwid / 2 + (k * bwid) / 12, fy + 0.5, zb - 1.47, 0.03, 1.0, 0.03);
        windowAt(d, x0 + 4.6, zb, Math.PI, fy + 1.6, 1.1, 1.4, pal.trim);
      } else {
        windowAt(d, x0 + 1.6, zb, Math.PI, fy + 1.6, 1.2, 1.4, pal.trim);
        windowAt(d, x0 + 4.4, zb, Math.PI, fy + 1.6, 1.2, 1.4, pal.trim);
      }
    }

    // ---- private patio + fence
    if (yards) {
      d.block('matte', CONC, cx, 0, zb - 1.3, uw - 0.5, 0.06, 2.3);
      d.block('wood', FENCE, cx, 0, zb - 2.55, uw, 1.25, 0.06);
      for (let k = 0; k < 4; k++) d.box('wood', shade(FENCE, 0.85), x0 + 0.1 + k * (uw / 4), 0.65, zb - 2.6, 0.08, 1.3, 0.08);
      d.block('wood', FENCE, x0 + 0.03, 0, zb - 1.3, 0.06, 1.25, 2.5);
      if (i === units - 1) d.block('wood', FENCE, x0 + uw - 0.03, 0, zb - 1.3, 0.06, 1.25, 2.5);
      if (r() < 0.6) {
        // patio set: small table + 2 chairs, or a lounge chair
        d.cyl('matte', '#3d3d3d', cx + 0.6, 0, zb - 1.3, 0.7, 0.72, 10);
        d.block('matte', '#3d3d3d', cx - 0.2, 0, zb - 1.3, 0.45, 0.45, 0.45);
        d.block('matte', '#3d3d3d', cx + 1.4, 0, zb - 1.3, 0.45, 0.45, 0.45);
      }
      if (r() < 0.5) d.sphere('foliage', r.pick(['#4f6e35', '#62803f']), x0 + uw - 0.6, 0.5, zb - 2.1, 0.9, 1.0, 0.7);
    }
  }

  // ---- end walls
  for (const side of [-1, 1]) {
    for (let f = 0; f < stories; f++) {
      const fy = PLINTH + f * FLOOR + (f ? 1.6 : 1.45);
      windowAt(d, side * L / 2, -1.8, side * Math.PI / 2, fy, 1.0, 1.35, pal.trim);
      windowAt(d, side * L / 2, 2.2, side * Math.PI / 2, fy, 1.0, 1.35, pal.trim);
    }
  }
  // utility meters + AC pad on one end
  d.block('matte', '#9da3a6', L / 2 + 0.5, 0, -2.8, 0.8, 0.8, 0.8);

  gableRoof(d, L, D, H, pal.roof, pal.wall);
  // a few roof vents for realism
  for (let i = 0; i < units; i += 2) d.cyl('metal', '#6b6b6b', -L / 2 + i * uw + 3, H + (D / 2 - 2.2) * TAN, -2.2, 0.18, 0.6, 6);
  return { units, footprint, height: H };
}

/**
 * Residential cluster: buildings arranged around a shared courtyard. Drawn in the cluster's local
 * frame (origin = courtyard center). Returns metadata used to build courtyards and paths.
 */
export function residentialCluster(d, c, dims, r) {
  const pal = PALETTES[c.palette % PALETTES.length];
  const { longUnits, longUnitWidth, shortUnits, shortUnitWidth, depth, courtX, courtZ, mewsHalf } = dims;
  const sides = c.type === 'mews' ? ['n', 's'] : ['n', 's', 'e', 'w'].filter((s) => s !== c.open);
  const cz = c.type === 'mews' ? mewsHalf : courtZ;
  const place = {
    n: [0, -(cz + depth / 2), 0], s: [0, cz + depth / 2, Math.PI],
    e: [courtX + depth / 2, 0, -Math.PI / 2], w: [-(courtX + depth / 2), 0, Math.PI / 2],
  };
  let units = 0, footprint = 0;
  for (const s of sides) {
    const long = s === 'n' || s === 's';
    const [x, z, ry] = place[s];
    d.at(x, 0, z, ry, () => {
      const res = townhouseBar(d, {
        units: long ? longUnits : shortUnits, uw: long ? longUnitWidth : shortUnitWidth, D: depth,
        stories: (c.stories && c.stories[s]) || 2, pal: s === 'e' || s === 'w' ? { ...pal, wall: pal.wall2, wall2: pal.wall } : pal, r,
      });
      units += res.units; footprint += res.footprint;
    });
  }
  const halfX = c.type === 'mews' ? (longUnits * longUnitWidth) / 2 : courtX;
  return { units, footprint, sides, court: { hx: halfX, hz: cz } };
}

/**
 * Shared community center: Commons Hall (kitchen + multipurpose room), co-work / study wing,
 * tool library, and a covered breezeway on the main pedestrian axis.
 * Local frame: x east, z south; origin at the breezeway center. Returns sign meshes.
 */
export function communityCenter(d, extras, makeSign) {
  const WALL = '#efe7d8', WOOD = '#9a6b45', STONE = '#b4a68f', MET = '#3b3a38';
  // --- North block: Commons Hall (double height) z 3..13
  d.at(0, 0, 8, 0, () => {
    d.block('matte', STONE, 0, 0, 0, 30.2, 1.0, 10.2);
    d.block('stucco', WALL, 4, 0, 0, 22, 7.5, 10);
    // west: full-height glass wall facing the park patio
    d.block('glass', GLASS, -11, 0.2, 0, 0.3, 7.1, 9.4);
    for (let k = 0; k <= 6; k++) d.block('metal', MET, -11.2, 0, -4.7 + k * 1.57, 0.14, 7.5, 0.14);
    d.box('metal', MET, -11.2, 3.4, 0, 0.14, 0.14, 9.4);
    d.block('stucco', WALL, -13.5, 0, -4.4, 5, 7.5, 1.2);
    d.block('stucco', WALL, -13.5, 0, 4.4, 5, 7.5, 1.2);
    // south glazing (to breezeway)
    for (let k = 0; k < 5; k++) windowAt(d, -6 + k * 4.4, -5, Math.PI, 3.6, 2.8, 5.6, '#e8e1d2');
    // north/east windows
    for (let k = 0; k < 5; k++) windowAt(d, -6 + k * 4.4, 5, 0, 4.0, 2.2, 2.4, '#e8e1d2');
    windowAt(d, 15, -2, Math.PI / 2, 2.0, 2.5, 2.2);
    d.at(0, 0, 0, 0, () => gableRoof(d, 30, 10, 7.5, '#a14f37', WALL, { ov: 0.9 }));
    // clerestory monitor
    d.block('glass', GLASS, 2, 7.5 + 5 * TAN - 0.4, 0, 12, 1.0, 1.4);
    d.block('roof', '#8e4632', 2, 7.5 + 5 * TAN + 0.6, 0, 12.6, 0.2, 2.2);
  });
  // --- South block: co-work + study + tool library, flat roof with rooftop solar, z -13..-3
  d.at(0, 0, -8, 0, () => {
    d.block('matte', STONE, 0, 0, 0, 30.2, 0.8, 10.2);
    d.block('stucco', '#e3d8c4', 0, 0, 0, 30, 4.4, 10);
    d.block('wood', WOOD, 0, 4.4, 0, 30.4, 0.5, 10.4);
    for (let k = 0; k < 4; k++) windowAt(d, -15, -3.6 + k * 2.4, -Math.PI / 2, 2.2, 1.9, 2.6, '#e8e1d2');
    for (let k = 0; k < 5; k++) windowAt(d, -11 + k * 4.4, 5, 0, 2.2, 3.0, 2.6, '#e8e1d2');
    for (let k = 0; k < 4; k++) windowAt(d, -9 + k * 4.4, -5, Math.PI, 2.2, 2.6, 2.0, '#e8e1d2');
    // tool library roll-up door (east)
    d.block('metal', '#8a9094', 15.05, 0, 1.5, 0.12, 3.2, 3.6);
    for (let k = 0; k < 10; k++) d.box('metal', '#6f767a', 15.13, 0.2 + k * 0.32, 1.5, 0.04, 0.03, 3.5);
    d.block('wood', WOOD, 15.6, 3.4, 1.5, 1.2, 0.15, 4.4);
    // rooftop solar rows (tilted toward south... here rows run east-west)
    for (let row = 0; row < 4; row++) {
      d.at(0, 4.95, -3.6 + row * 2.4, 0, () => {
        for (let k = 0; k < 24; k++) {
          d.tpl(T.box, 'solar', '#ffffff', -13.2 + k * 1.15, 0.4, 0, 1.1, 0.05, 1.75, 0, -0.17, 0, 0);
          d.box('metal', '#8a8f94', -13.2 + k * 1.15, 0.18, 0.7, 0.05, 0.3, 0.05);
        }
      });
    }
  });
  // --- Breezeway (main axis passes straight through) z -3..3
  d.block('pavers', '#ffffff', 0, 0, 0, 30, 0.06, 6);
  d.block('wood', WOOD, 0, 5.0, 0, 31, 0.35, 6.6);
  d.block('glass', GLASS, 0, 5.35, 0, 30, 0.6, 2);
  d.block('wood', WOOD, 0, 5.95, 0, 31, 0.2, 3);
  for (const x of [-14.5, -5, 5, 14.5]) for (const z of [-2.9, 2.9]) d.cyl('metal', MET, x, 0, z, 0.3, 5.0, 10);
  // --- Patio toward the park (west)
  d.rect('pavers', '#ffffff', -23, 0, 16, 34, 0.07);
  // pergola
  d.at(-23, 0, 0, 0, () => {
    for (const x of [-6, 0, 6]) for (const z of [-10, -3.3, 3.3, 10]) d.block('wood', WOOD, x, 0, z, 0.3, 3.2, 0.3);
    for (const x of [-6, 0, 6]) d.block('wood', WOOD, x, 3.2, 0, 0.25, 0.35, 21);
    for (let k = 0; k < 28; k++) d.block('wood', '#a87a52', 0, 3.55, -10.4 + k * 0.77, 13.4, 0.18, 0.12);
    for (const z of [-6.6, 0, 6.6]) for (const x of [-3, 3]) {
      d.block('wood', WOOD, x, 0.72, z, 1.0, 0.06, 2.4);
      d.block('metal', MET, x, 0, z, 0.08, 0.72, 0.08);
      for (const s of [-1, 1]) d.block('wood', WOOD, x + s * 0.75, 0, z, 0.4, 0.45, 2.2);
    }
  });
  // planters + string of benches along patio edge
  for (const z of [-15, 15]) for (let k = 0; k < 3; k++) {
    d.block('matte', '#c9bfae', -29 + k * 5, 0, z, 3.4, 0.55, 1.2);
    d.sphere('foliage', '#6f8a4a', -29 + k * 5, 0.85, z, 3.0, 0.7, 1.0);
  }
  // mail kiosk + bike racks on the spine side
  d.block('metal', '#4b5a63', 19, 0, -6, 3.2, 1.9, 0.7);
  d.block('metal', '#4b5a63', 19, 1.9, -6, 3.6, 0.12, 1.2);
  for (let k = 0; k < 6; k++) d.tpl(T.box, 'metal', '#2f2f2f', 19 + k * 0.8 - 2, 0.45, 6.5, 0.06, 0.9, 0.7);

  // signage on the west face of the breezeway
  extras.push(makeSign(['COMMONS CENTER', 'Kitchen · Gathering Hall · Co-work · Tool Library'], -15.65, 5.55, 0, -Math.PI / 2, 9, 0.75));
  extras.push(makeSign(['COMMONS CENTER', 'Kitchen · Gathering Hall · Co-work · Tool Library'], 15.65, 5.55, 0, Math.PI / 2, 9, 0.75));
  return { footprint: 30 * 26 };
}

/** Open-air park pavilion with rooftop solar, picnic tables and community BBQ counter. */
export function pavilion(d) {
  const WOOD = '#8f6440', STONE = '#a99a83';
  d.rect('concrete', '#ffffff', 0, 0, 22, 14, 0.08);
  for (const x of [-8, -2.7, 2.7, 8]) for (const z of [-4.5, 4.5]) {
    d.block('matte', STONE, x, 0, z, 0.7, 0.9, 0.7);
    d.block('wood', WOOD, x, 0.9, z, 0.35, 2.9, 0.35);
  }
  d.block('wood', WOOD, 0, 3.8, -4.5, 18, 0.4, 0.3);
  d.block('wood', WOOD, 0, 3.8, 4.5, 18, 0.4, 0.3);
  d.at(0, 0, 0, 0, () => gableRoof(d, 18, 9, 4.2, '#9c4c35', '#c9a77f', { ov: 0.9, ends: true }));
  // rooftop solar on the south slope
  const s = 4.5 + 0.9;
  d.at(0, 4.2 + (4.5 - s / 2) * TAN + 0.2, s / 2 - 0.2, 0, () => {
    for (let k = 0; k < 14; k++) for (const v of [-0.9, 0.9]) d.tpl(T.box, 'solar', '#ffffff', -7.6 + k * 1.17, 0, v, 1.12, 0.05, 1.75, 0, 0, 0, 0);
  }, PITCH);
  // picnic tables underneath
  for (const x of [-5.4, 0, 5.4]) for (const z of [-1.8, 1.8]) picnicTable(d, x, z, 0);
  // BBQ counter on the north side
  d.block('matte', '#b8ab95', 0, 0, -9, 9, 0.9, 1.0);
  d.block('matte', '#d8d2c6', 0, 0.9, -9, 9.2, 0.08, 1.1);
  for (const x of [-2.6, 0, 2.6]) {
    d.block('metal', '#2b2b2b', x, 0.98, -9, 1.2, 0.35, 0.8);
    d.box('metal', '#555', x, 1.38, -9.35, 1.2, 0.5, 0.06, 0, -0.5);
  }
}

export function picnicTable(d, x, z, ry, color = '#9b7350') {
  d.at(x, 0, z, ry, () => {
    d.block('wood', color, 0, 0.72, 0, 2.0, 0.07, 0.85);
    for (const s of [-1, 1]) {
      d.block('wood', color, 0, 0.44, s * 0.72, 2.0, 0.05, 0.3);
      d.box('metal', '#3a3a3a', -0.75, 0.37, s * 0.3, 0.06, 0.8, 0.06, 0, s * 0.55);
      d.box('metal', '#3a3a3a', 0.75, 0.37, s * 0.3, 0.06, 0.8, 0.06, 0, s * 0.55);
    }
  });
}
