// Reusable site furniture and small-scale objects (benches, tables, gardens, play & fitness, people...).
import { T } from '../core/batcher.js';
export { picnicTable } from './buildings.js';

const MET = '#3b3b3b', WOOD = '#9b7350';

export function bench(d, x, z, ry, backrest = true) {
  d.at(x, 0, z, ry, () => {
    d.block('wood', WOOD, 0, 0.42, 0, 1.8, 0.06, 0.45);
    if (backrest) d.box('wood', WOOD, 0, 0.75, -0.24, 1.8, 0.4, 0.05, 0, -0.18);
    for (const sx of [-0.75, 0.75]) d.block('metal', MET, sx, 0, 0, 0.07, 0.42, 0.45);
  });
}

export function umbrellaTable(d, x, z, color = '#e9e2d0', r) {
  d.at(x, 0, z, 0, () => {
    d.cyl('matte', '#e6e2da', 0, 0.72, 0, 1.1, 0.05, 12);
    d.cyl('metal', MET, 0, 0, 0, 0.08, 0.72, 6);
    for (let k = 0; k < 4; k++) {
      const a = (k / 4) * Math.PI * 2 + 0.4;
      d.block('matte', '#5d6d6a', Math.cos(a) * 0.95, 0, Math.sin(a) * 0.95, 0.45, 0.45, 0.45, a);
      d.box('matte', '#5d6d6a', Math.cos(a) * 1.15, 0.7, Math.sin(a) * 1.15, 0.45, 0.5, 0.05, -a + Math.PI / 2);
    }
    d.cyl('metal', '#bbbbbb', 0, 0.72, 0, 0.05, 1.7, 6);
    d.tpl(T.cone, 'canvas', color, 0, 2.55, 0, 2.6, 0.6, 2.6);
  });
}

export function pathLight(d, x, z) {
  d.cyl('metal', '#2f3133', x, 0, z, 0.12, 0.9, 6);
  d.box('glow', '#fff3d1', x, 0.95, z, 0.16, 0.12, 0.16);
}

export function streetLight(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    d.cyl('metal', '#3a3d40', 0, 0, 0, 0.18, 7.2, 8);
    d.box('metal', '#3a3d40', 0, 7.1, -0.9, 0.1, 0.1, 1.8);
    d.box('metal', '#3a3d40', 0, 7.0, -1.7, 0.35, 0.14, 0.6);
    d.box('glow', '#fff6dd', 0, 6.92, -1.7, 0.28, 0.02, 0.5);
  });
}

export function stringLightPost(d, x, z) {
  d.cyl('wood', '#5e4a3a', x, 0, z, 0.18, 4.6, 6);
  d.sphere('glow', '#ffe9b0', x, 4.55, z, 0.18);
}

/** A run of string lights between two points (sagging catenary approximated by segments). */
export function stringLights(d, [x1, z1], [x2, z2], h = 4.4, sag = 0.7) {
  const n = 10;
  let px = x1, pz = z1, py = h;
  for (let i = 1; i <= n; i++) {
    const t = i / n, x = x1 + (x2 - x1) * t, z = z1 + (z2 - z1) * t, y = h - Math.sin(t * Math.PI) * sag;
    const L = Math.hypot(x - px, y - py, z - pz), ry = Math.atan2(x - px, z - pz), rx = -Math.atan2(y - py, Math.hypot(x - px, z - pz));
    d.box('matte', '#222', (x + px) / 2, (y + py) / 2, (z + pz) / 2, 0.025, 0.025, L, ry, rx);
    d.sphere('glow', '#ffe6a8', x, y - 0.12, z, 0.13);
    px = x; py = y; pz = z;
  }
}

export function raisedBed(d, x, z, ry, r, w = 2.4, dep = 1.2) {
  d.at(x, 0, z, ry, () => {
    d.block('wood', '#8a6745', 0, 0, 0, w, 0.55, dep);
    d.block('matte', '#5b4330', 0, 0.55, 0, w - 0.16, 0.02, dep - 0.16);
    const crops = ['#5d8c3a', '#7aa44a', '#4f7a34', '#8db35a', '#6c8f3d'];
    const crop = r.pick(crops);
    const rows = Math.round(w / 0.45);
    for (let k = 0; k < rows; k++) {
      for (const s of [-0.25, 0.25]) d.sphere('foliage', crop, -w / 2 + 0.3 + k * ((w - 0.6) / Math.max(rows - 1, 1)), 0.68, s * dep * 0.6, 0.38, 0.32, 0.38);
    }
    if (r() < 0.35) for (let k = 0; k < 3; k++) d.sphere('foliage', '#d2412f', -0.6 + k * 0.6, 0.85, 0, 0.12); // tomatoes
    if (r() < 0.3) { d.cyl('wood', '#c2a27a', -w / 2 + 0.2, 0.55, 0, 0.05, 1.5, 4); d.cyl('wood', '#c2a27a', w / 2 - 0.2, 0.55, 0, 0.05, 1.5, 4); d.box('wood', '#c2a27a', 0, 2.0, 0, w - 0.4, 0.04, 0.04); }
  });
}

export function compostBins(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    for (let k = 0; k < 3; k++) {
      const cx = -1.3 + k * 1.3;
      for (let s = 0; s < 4; s++) d.block('wood', '#9a7a52', cx, 0.02 + s * 0.25, -0.6, 1.2, 0.18, 0.06);
      d.block('wood', '#8a6a45', cx - 0.62, 0, 0, 0.08, 1.0, 1.2);
      d.block('matte', ['#5a4330', '#6b4f35', '#4d3a2a'][k], cx, 0, 0, 1.15, 0.45 + k * 0.12, 1.1);
    }
    d.block('wood', '#8a6a45', 1.33, 0, 0, 0.08, 1.0, 1.2);
    d.box('matte', '#2f6b4f', 0, 1.25, -0.62, 1.4, 0.35, 0.03); // sign
  });
}

export function toolShed(d, x, z, ry, color = '#7c8f6a') {
  d.at(x, 0, z, ry, () => {
    d.block('wood', color, 0, 0, 0, 3, 2.3, 2.2);
    d.box('roof', '#6a6560', 0, 2.55, 0, 3.4, 0.12, 2.7, 0, 0, 0.1);
    d.block('wood', '#5d4a38', 0.5, 0, 1.11, 1.2, 2.0, 0.04);
    d.block('metal', '#3e6d8a', -1.75, 0, 0.6, 0.6, 1.1, 0.6); // rain barrel stand
    d.cyl('matte', '#3e6d8a', -1.75, 1.1, 0.6, 0.6, 0.9, 10);
  });
}

export function greenhouse(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    d.block('matte', '#d6d0c4', 0, 0, 0, 8.2, 0.4, 4.2);
    d.block('glass', '#a9c4cc', 0, 0.4, 0, 8, 2.1, 4);
    d.prism('glass', '#a9c4cc', 0, 2.5, 0, 4, 1.4, 8, Math.PI / 2);
    for (let k = 0; k <= 5; k++) d.block('metal', '#e8e8e8', -4 + k * 1.6, 0.4, 0, 0.06, 2.1, 4.05);
    for (let k = 0; k < 6; k++) d.sphere('foliage', '#5c8a3a', -3 + k * 1.2, 1.25, 0, 0.7, 0.5, 2.6);
  });
}

export function fitnessStation(d, x, z, ry, kind = 0) {
  d.at(x, 0, z, ry, () => {
    d.rect('rubber', '#ffffff', 0, 0, 4, 3, 0.05);
    const P = '#2f6b4f';
    if (kind === 0) { // pull-up bars
      for (const xx of [-1.5, 0, 1.5]) d.cyl('metal', P, xx, 0, 0, 0.12, 2.4 - Math.abs(xx) * 0.2, 8);
      d.box('metal', '#bbb', -0.75, 2.3, 0, 1.5, 0.05, 0.05); d.box('metal', '#bbb', 0.75, 2.1, 0, 1.5, 0.05, 0.05);
    } else if (kind === 1) { // parallel bars
      for (const xx of [-1, 1]) for (const zz of [-0.3, 0.3]) d.cyl('metal', P, xx, 0, zz, 0.1, 1.2, 8);
      for (const zz of [-0.3, 0.3]) d.box('metal', '#bbb', 0, 1.2, zz, 2.2, 0.05, 0.05);
    } else { // sit-up bench + step
      d.box('matte', P, 0, 0.45, 0, 1.6, 0.08, 0.5, 0, 0, 0.25);
      for (const xx of [-0.6, 0.6]) d.block('metal', '#888', xx, 0, 0, 0.06, 0.5 + xx * 0.3, 0.4);
      d.block('matte', '#9a9a9a', 1.4, 0, 0, 0.6, 0.35, 0.6);
    }
  });
}

export function bocceCourt(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    d.rect('sand', '#ffffff', 0, 0, 3.6, 18, 0.06);
    for (const s of [-1, 1]) {
      d.block('wood', '#7d5d3f', s * 1.85, 0, 0, 0.12, 0.25, 18.2);
      d.block('wood', '#7d5d3f', 0, 0, s * 9.05, 3.8, 0.25, 0.12);
    }
    for (const [bx, bz, c] of [[0.3, 3, '#c0392b'], [-0.4, 3.6, '#2e86c1'], [0.1, 4.2, '#c0392b'], [0, 4.5, '#f4f4f4']]) d.sphere('paint', c, bx, 0.12, bz, 0.13);
  });
}

export function pingPong(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    d.block('matte', '#1f5b46', 0, 0.72, 0, 2.74, 0.06, 1.52);
    d.box('matte', '#ffffff', 0, 0.76, 0, 2.74, 0.005, 0.03);
    d.block('matte', '#eeeeee', 0, 0.78, 0, 0.03, 0.15, 1.6);
    for (const s of [-1, 1]) d.block('matte', '#777', s * 0.9, 0, 0, 0.2, 0.72, 1.2);
  });
}

export function halfCourt(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    d.rect('concrete', '#9fb3c0', 0, 0, 15, 14, 0.06);
    const W = '#f4f4f4';
    d.rect('markings', W, 0, -6.95, 15, 0.08, 0.075);
    d.rect('markings', W, -7.45, 0, 0.08, 14, 0.075); d.rect('markings', W, 7.45, 0, 0.08, 14, 0.075);
    d.rect('markings', W, 0, 6.95, 15, 0.08, 0.075);
    d.rect('markings', '#c46a3b', 0, 3.6, 4.9, 5.8, 0.072);
    d.cyl('metal', '#333', 0, 0, 7.6, 0.18, 3.4, 8);
    d.box('metal', '#333', 0, 3.4, 7.1, 0.12, 0.12, 1.0);
    d.box('matte', '#ffffff', 0, 3.4, 6.55, 1.8, 1.05, 0.05);
    d.cyl('paint', '#d35400', 0, 3.05, 6.25, 0.46, 0.03, 12);
  });
}

export function boulder(d, x, z, s, color = '#a59c8c') {
  d.tpl(T.blob2, 'matte', color, x, s * 0.25, z, s * 1.3, s * 0.75, s);
}

export function fountain(d, x, z, r = 2.2) {
  d.cyl('matte', '#c8bfae', x, 0, z, r * 2 + 0.6, 0.5, 16);
  d.cyl('water', '#5d8fa3', x, 0.05, z, r * 2, 0.48, 16);
  d.cyl('matte', '#c8bfae', x, 0, z, 0.9, 1.1, 10);
  d.cyl('water', '#9cc4d4', x, 1.1, z, 0.6, 0.4, 10);
}

export function trashBin(d, x, z) {
  d.cyl('metal', '#3d4a44', x, 0, z, 0.6, 0.95, 10);
  d.cyl('metal', '#2f6b4f', x + 0.7, 0, z, 0.6, 0.95, 10);
}

export function bikeRack(d, x, z, ry, n = 4) {
  d.at(x, 0, z, ry, () => {
    for (let k = 0; k < n; k++) {
      const xx = (k - (n - 1) / 2) * 0.9;
      d.block('metal', '#4a4a4a', xx, 0, -0.3, 0.05, 0.8, 0.05);
      d.block('metal', '#4a4a4a', xx, 0, 0.3, 0.05, 0.8, 0.05);
      d.box('metal', '#4a4a4a', xx, 0.8, 0, 0.05, 0.05, 0.65);
    }
  });
}

/** Shade structure: tensioned fabric sail on three posts. */
export function shadeSail(d, x, z, ry, size = 7, color = '#efe8d8') {
  d.at(x, 0, z, ry, () => {
    for (const [px, pz, h] of [[-size / 2, -size / 3, 3.6], [size / 2, -size / 3, 3.0], [0, size / 2, 3.4]]) d.cyl('metal', '#555', px, 0, pz, 0.16, h, 8);
    d.tpl(T.box, 'canvas', color, 0, 3.2, 0, size * 0.85, 0.04, size * 0.75, 0.2, 0.06, -0.05);
  });
}

/** Plan points where no figure should stand (e.g. street-view camera spots). Filled by world.js. */
export const PERSON_EXCLUDE = [];

/** Simple human figure for scale. */
export function person(d, x, z, ry, r, sitting = false) {
  if (PERSON_EXCLUDE.length) {
    const [wx, wz] = d.world(x, z);
    if (PERSON_EXCLUDE.some(([ex, ez]) => Math.hypot(wx - ex, wz - ez) < 4)) return;
  }
  const shirt = r.pick(['#c0392b', '#2e86c1', '#f4d03f', '#27ae60', '#ecf0f1', '#8e44ad', '#e67e22', '#34495e', '#d98880', '#1abc9c']);
  const pants = r.pick(['#2c3e50', '#34495e', '#5d4037', '#212121', '#7f8c8d', '#1f3a5f']);
  const skin = r.pick(['#f1c27d', '#e0ac69', '#c68642', '#8d5524', '#ffdbac']);
  const h = 0.9 + r() * 0.12;
  d.at(x, 0, z, ry, () => {
    const s = h;
    if (sitting) {
      d.block('matte', pants, 0, 0.45 * s, 0.15, 0.38 * s, 0.14, 0.5 * s);
      d.block('matte', pants, 0, 0, 0.38, 0.36 * s, 0.45 * s, 0.14);
      d.block('matte', shirt, 0, 0.55 * s, -0.05, 0.42 * s, 0.6 * s, 0.24 * s);
      d.sphere('matte', skin, 0, 1.33 * s, -0.04, 0.24 * s, 0.27 * s, 0.24 * s);
      return;
    }
    d.block('matte', pants, -0.09 * s, 0, 0, 0.15 * s, 0.86 * s, 0.17 * s);
    d.block('matte', pants, 0.09 * s, 0, 0, 0.15 * s, 0.86 * s, 0.17 * s);
    d.block('matte', shirt, 0, 0.84 * s, 0, 0.44 * s, 0.62 * s, 0.25 * s);
    d.block('matte', shirt, -0.27 * s, 0.86 * s, 0, 0.1 * s, 0.56 * s, 0.12 * s);
    d.block('matte', shirt, 0.27 * s, 0.86 * s, 0, 0.1 * s, 0.56 * s, 0.12 * s);
    d.sphere('matte', skin, 0, 1.62 * s, 0, 0.23 * s, 0.27 * s, 0.24 * s);
    d.sphere('matte', r.pick(['#2b1d14', '#5a3b22', '#1a1a1a', '#a87c4f', '#d6c3a0']), 0, 1.68 * s, -0.02, 0.24 * s, 0.17 * s, 0.25 * s);
  });
}

// -------- playground
export function playStructure(d, x, z, ry) {
  const POST = '#2c6e8f', DECK = '#e3a72f', ROOF = '#c4462f', SLIDE = '#e3c22f';
  d.at(x, 0, z, ry, () => {
    const tower = (tx, tz, h) => {
      for (const [px, pz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) d.cyl('metal', POST, tx + px, 0, tz + pz, 0.16, h + 2.6, 8);
      d.block('matte', DECK, tx, h, tz, 2.2, 0.1, 2.2);
      d.tpl(T.cone4, 'paint', ROOF, tx, h + 3.0, tz, 3.2, 1.1, 3.2);
      for (const s of [-1, 1]) d.block('matte', POST, tx + s * 1.0, h + 0.1, tz, 0.05, 0.9, 2);
    };
    tower(-3.5, 0, 1.5); tower(3.5, 0, 2.0);
    d.block('wood', '#9b7350', 0, 1.7, 0, 4.8, 0.1, 1.2);
    for (const s of [-1, 1]) d.block('metal', '#2c6e8f', 0, 1.8, s * 0.6, 4.8, 0.8, 0.04);
    d.box('paint', SLIDE, 3.5, 1.15, 3.4, 0.8, 0.08, 4.0, 0, 0.55);
    for (const s of [-1, 1]) d.box('paint', SLIDE, 3.5 + s * 0.42, 1.3, 3.4, 0.06, 0.25, 4.0, 0, 0.55);
    d.box('paint', '#4a9b5f', -3.5, 0.9, -2.7, 1.8, 2.2, 0.1, 0, -0.35); // climbing wall
    for (let k = 0; k < 6; k++) d.sphere('paint', ['#e74c3c', '#f1c40f', '#3498db'][k % 3], -4.1 + (k % 3) * 0.6, 0.5 + Math.floor(k / 3) * 0.8, -2.85 + Math.floor(k / 3) * 0.28, 0.15);
  });
}

export function swingSet(d, x, z, ry) {
  d.at(x, 0, z, ry, () => {
    for (const s of [-1, 1]) {
      d.box('metal', '#2c6e8f', s * 3.2, 1.25, -0.6, 0.12, 2.7, 0.12, 0, 0.45);
      d.box('metal', '#2c6e8f', s * 3.2, 1.25, 0.6, 0.12, 2.7, 0.12, 0, -0.45);
    }
    d.box('metal', '#2c6e8f', 0, 2.5, 0, 6.6, 0.14, 0.14);
    for (const sx of [-2, 0, 2]) {
      for (const o of [-0.25, 0.25]) d.box('metal', '#999', sx + o, 1.5, 0, 0.02, 1.95, 0.02);
      d.block('matte', '#222', sx, 0.5, 0, 0.6, 0.05, 0.25);
    }
  });
}

export function springRider(d, x, z, color) {
  d.cyl('metal', '#999', x, 0, z, 0.2, 0.5, 6);
  d.sphere('paint', color, x, 0.75, z, 0.9, 0.5, 0.4);
}

/** Soccer field (local frame: length along z). Mowing stripes, white lines, goals with nets. */
export function soccerField(d, w, l) {
  const n = 10;
  for (let k = 0; k < n; k++) d.rect('lawn', k % 2 ? '#ffffff' : '#dcebc9', 0, -l / 2 + (k + 0.5) * (l / n), w, l / n, 0.036);
  const W = '#f7f7f7', y = 0.046, t = 0.12;
  d.rect('markings', W, -w / 2, 0, t, l, y); d.rect('markings', W, w / 2, 0, t, l, y);
  d.rect('markings', W, 0, -l / 2, w, t, y); d.rect('markings', W, 0, l / 2, w, t, y);
  d.rect('markings', W, 0, 0, w, t, y);
  const circle = [];
  for (let i = 0; i < 40; i++) { const a = (i / 40) * Math.PI * 2; circle.push([Math.cos(a) * 6, Math.sin(a) * 6]); }
  d.ribbon('markings', W, circle, t, y, true);
  d.disc('markings', W, 0, 0, 0.25, y + 0.002, 10);
  for (const s of [-1, 1]) {
    const zl = s * l / 2;
    // penalty box + goal box
    for (const [bw, bd] of [[18, 8], [8, 3]]) {
      d.rect('markings', W, -bw / 2, zl - s * bd / 2, t, bd, y); d.rect('markings', W, bw / 2, zl - s * bd / 2, t, bd, y);
      d.rect('markings', W, 0, zl - s * bd, bw, t, y);
    }
    d.disc('markings', W, 0, zl - s * 6, 0.2, y + 0.002, 10);
    // goal: posts, crossbar, net
    for (const x of [-3, 3]) d.cyl('paint', '#ffffff', x, 0, zl, 0.12, 2.1, 8);
    d.box('paint', '#ffffff', 0, 2.1, zl, 6.12, 0.12, 0.12);
    d.box('canvas', '#e9eef0', 0, 1.05, zl + s * 1.1, 6, 2.1, 0.02);
    d.box('canvas', '#e9eef0', 0, 2.1, zl + s * 0.55, 6, 0.02, 1.1);
    for (const x of [-3, 3]) d.box('canvas', '#e9eef0', x, 1.05, zl + s * 0.55, 0.02, 2.1, 1.1);
  }
}

/** Community pool: lap pool, wading pool, deck with loungers, pool house with rooftop solar, fence. */
export function communityPool(d, r) {
  d.rect('concrete', '#f1ece2', 0, 0, 40, 26, 0.07);
  // lap pool (6 lanes)
  d.block('matte', '#e8e4dc', 0, 0, 1, 26, 0.16, 11);
  d.rect('water', '#3fa9d6', 0, 1, 25, 10, 0.17);
  for (let k = 1; k < 6; k++) d.rect('markings', '#1f6f9a', 0, -4 + k * (10 / 6), 23, 0.12, 0.175);
  for (let k = 0; k <= 6; k++) d.box('paint', k % 2 ? '#e74c3c' : '#ffffff', 0, 0.7, -4 + k * (10 / 6), 0.05, 0.05, 0.05);
  for (const x of [-12.5, 12.5]) d.box('matte', '#333', x, 0.7, 1, 0.04, 0.04, 10);
  // wading pool
  d.block('matte', '#e8e4dc', 16, 0, 4.5, 6.6, 0.16, 6.6);
  d.rect('water', '#7cc9e6', 16, 4.5, 6, 6, 0.17);
  // swimmers
  for (let i = 0; i < 9; i++) d.sphere('matte', r.pick(['#e0ac69', '#8d5524', '#f1c27d', '#c68642']), r.range(-11, 11), 0.25, r.range(-3, 5), 0.26);
  // pool house with rooftop solar
  d.block('stucco', '#efe7d8', 0, 0, -10.6, 16, 3.4, 4.4);
  d.block('wood', '#9a6b45', 0, 3.4, -10.6, 16.6, 0.3, 5);
  for (let k = 0; k < 13; k++) d.tpl(T.box, 'solar', '#ffffff', -7.2 + k * 1.2, 3.95, -10.6, 1.12, 0.05, 1.75, 0, -0.17, 0, 0);
  for (const x of [-5, 0, 5]) d.block('glass', '#5f7b90', x, 0.3, -8.38, 2.2, 2.2, 0.05);
  // loungers + umbrellas along the south side
  for (let k = 0; k < 9; k++) {
    const x = -16 + k * 3.6;
    d.at(x, 0, 9.6, 0, () => {
      d.block('matte', '#ffffff', 0, 0.3, 0.3, 0.7, 0.1, 1.4);
      d.box('matte', '#ffffff', 0, 0.6, -0.55, 0.7, 0.1, 0.7, 0, -0.6);
      d.block('metal', '#999', 0, 0, 0.3, 0.6, 0.3, 1.2);
    });
    if (k % 2 === 0) { d.cyl('metal', '#bbbbbb', x + 1.8, 0, 9.6, 0.06, 2.4, 6); d.tpl(T.cone, 'canvas', r.pick(['#f2c14e', '#f78154', '#4d9de0', '#ffffff']), x + 1.8, 2.5, 9.6, 3.0, 0.6, 3.0); }
  }
  // glass pool fence with gate gap on the west side
  const F = (x, z, w, dd) => { d.block('glass', '#bcd6df', x, 0, z, w, 1.2, dd); d.box('metal', '#555', x, 1.2, z, w, 0.05, Math.max(dd, 0.06)); };
  F(0, -13, 40, 0.05); F(0, 13, 40, 0.05); F(20, 0, 0.05, 26); F(-20, -7.5, 0.05, 11); F(-20, 7.5, 0.05, 11);
  for (let i = 0; i < 10; i++) person(d, r.range(-18, 18), r.range(7, 12), r() * 6, r, r() < 0.5);
}

/** Small neighborhood park: lawn, loop path, gazebo, benches, play pieces. Trees are added by the caller. */
export function gazebo(d, x, z, rad = 3.2) {
  d.cyl('matte', '#d6cfc2', x, 0, z, rad * 2 + 0.6, 0.3, 8);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; d.cyl('wood', '#f2efe8', x + Math.cos(a) * rad, 0.3, z + Math.sin(a) * rad, 0.18, 2.7, 6); }
  d.tpl(T.cone, 'metalroof', '#cfd3d6', x, 3.7, z, rad * 2 + 1.2, 1.9, rad * 2 + 1.2);
  d.cyl('wood', '#8f6440', x, 0.3, z, rad * 2 - 0.6, 0.45, 8);
}
