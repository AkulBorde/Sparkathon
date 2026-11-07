// Perimeter loop road, cantilevered solar carports (UCI-style covered stalls + PV), EV/ADA stalls,
// crosswalks, street lights and vehicles.
import * as THREE from 'three';
import { T, makeTemplate, Batcher, Draw } from '../core/batcher.js';
import { offsetPolyline, polylineLength, pointAt } from '../core/geo.js';
import { streetLight, bench } from './furniture.js';

const STEEL = '#5d6469', DECK = '#d5d8db', CONC = '#cfc9bd';
const TILT = (5 * Math.PI) / 180;

// car greenhouse (cabin) side profile, extruded across the car width
const cabinShape = new THREE.Shape([new THREE.Vector2(-1, 0), new THREE.Vector2(1, 0), new THREE.Vector2(0.5, 1), new THREE.Vector2(-0.72, 1)]);
const CABIN = makeTemplate(new THREE.ExtrudeGeometry(cabinShape, { depth: 1, bevelEnabled: false }).translate(0, 0, -0.5));

export const CAR_COLORS = ['#f2f2f2', '#e8e8e8', '#1c1c1c', '#2b2b2b', '#9aa0a6', '#7c8288', '#b9bdc1', '#8a1c1c', '#1f3a5f', '#3d5a80', '#6b705c', '#c9b38f', '#ffffff', '#5a5a5a', '#9c2f2f', '#2f4f4f'];

/** Low-poly but recognizable vehicle. Local frame: +x = forward, ground at y=0. */
export function car(d, x, z, ry, color, type = 'sedan') {
  d.at(x, 0, z, ry, () => {
    const dims = { sedan: [4.6, 1.82, 0.5, 0.0], suv: [4.8, 1.9, 0.72, -0.1], hatch: [4.0, 1.78, 0.62, -0.25], truck: [5.6, 1.95, 0.7, 0.55] }[type];
    const [L, W, cabH, cabShift] = dims;
    const bodyTop = type === 'suv' || type === 'truck' ? 1.1 : 0.95, bodyBot = 0.32;
    d.box('paint', color, 0, (bodyTop + bodyBot) / 2, 0, L, bodyTop - bodyBot, W);
    d.box('paint', color, L / 2 - 0.35, bodyTop - 0.06, 0, 0.7, 0.12, W - 0.08, 0, 0, -0.18); // hood slope
    if (type === 'truck') {
      const cabL = 2.4;
      d.tpl(CABIN, 'glass', '#2a3540', 0.55, bodyTop, 0, cabL / 2, cabH, W - 0.12);
      d.box('paint', color, 0.55, bodyTop + cabH - 0.03, 0, cabL * 0.62, 0.07, W - 0.1);
      d.box('paint', color, -1.55, bodyTop + 0.25, W / 2 - 0.04, 2.3, 0.5, 0.08);
      d.box('paint', color, -1.55, bodyTop + 0.25, -W / 2 + 0.04, 2.3, 0.5, 0.08);
      d.box('paint', color, -2.76, bodyTop + 0.25, 0, 0.08, 0.5, W);
      d.box('matte', '#2b2b2b', -1.55, bodyTop + 0.02, 0, 2.3, 0.04, W - 0.16);
    } else {
      const cabL = type === 'hatch' ? 2.6 : type === 'suv' ? 3.0 : 2.7;
      d.tpl(CABIN, 'glass', '#26313b', cabShift, bodyTop, 0, cabL / 2, cabH, W - 0.12);
      d.box('paint', color, cabShift - cabL * 0.11, bodyTop + cabH - 0.02, 0, cabL * 0.6, 0.06, W - 0.14);
      // B-pillar
      d.box('paint', color, cabShift, bodyTop + cabH / 2, 0, 0.12, cabH * 0.95, W - 0.1);
    }
    for (const sx of [L / 2 - 0.85, -L / 2 + 0.9]) for (const sz of [W / 2 - 0.12, -W / 2 + 0.12]) {
      d.cyl('matte', '#1b1b1b', sx, 0.34, sz, 0.68, 0.24, 10, 0, Math.PI / 2);
      d.cyl('metal', '#b8bcc0', sx, 0.34, sz + Math.sign(sz) * 0.125, 0.38, 0.02, 10, 0, Math.PI / 2);
    }
    d.box('glow', '#fffbe8', L / 2 + 0.01, bodyTop - 0.18, W / 2 - 0.3, 0.04, 0.12, 0.38);
    d.box('glow', '#fffbe8', L / 2 + 0.01, bodyTop - 0.18, -W / 2 + 0.3, 0.04, 0.12, 0.38);
    d.box('matte', '#a31515', -L / 2 - 0.01, bodyTop - 0.16, W / 2 - 0.25, 0.04, 0.14, 0.4);
    d.box('matte', '#a31515', -L / 2 - 0.01, bodyTop - 0.16, -W / 2 + 0.25, 0.04, 0.14, 0.4);
    d.box('matte', '#2a2a2a', L / 2 + 0.02, 0.45, 0, 0.08, 0.2, W - 0.1);
    d.box('matte', '#2a2a2a', -L / 2 - 0.02, 0.45, 0, 0.08, 0.2, W - 0.1);
  });
}

function pickCarType(r) { const v = r(); return v < 0.45 ? 'sedan' : v < 0.75 ? 'suv' : v < 0.88 ? 'hatch' : 'truck'; }

/** A diagonal structural member between two points. */
function strut(d, key, color, [x1, y1, z1], [x2, y2, z2], t = 0.15) {
  const dx = x2 - x1, dy = y2 - y1, dz = z2 - z1;
  const L = Math.hypot(dx, dy, dz);
  d.box(key, color, (x1 + x2) / 2, (y1 + y2) / 2, (z1 + z2) / 2, t, t, L, Math.atan2(dx, dz), -Math.atan2(dy, Math.hypot(dx, dz)));
}

/**
 * Covered solar parking canopy: `n` stalls in local coordinates. Local x runs along the drive aisle,
 * local z points away from the road (stalls from z=3.75 to 9.25). Returns counts for statistics.
 */
export function solarCarport(d, n, opts, r) {
  const { stallWidth: sw, stallDepth } = opts;
  const L = n * sw, zFront = 3.3, zRear = 10.3, yFront = 3.65;
  const yAt = (z) => yFront - (z - zFront) * Math.tan(TILT);
  const res = { stalls: 0, ev: 0, ada: 0, panels: 0, cars: 0 };
  // pavement, striping, wheel stops, curb
  d.rect('asphalt', '#ffffff', L / 2, 6.55, L + 0.2, 5.7, 0.045);
  d.block('matte', CONC, L / 2, 0, 9.55, L + 0.2, 0.16, 0.3);
  for (let k = 0; k <= n; k++) d.rect('markings', '#f1f1f1', k * sw, 6.7, 0.1, 5.0, 0.07);

  const adaStalls = opts.ada ? [0, 2] : [];
  const aisle = opts.ada ? 1 : -1;
  const evStalls = opts.ev ? [n - 1, n - 2] : [];
  for (let k = 0; k < n; k++) {
    const cx = k * sw + sw / 2;
    if (k === aisle) { // hatched accessible access aisle
      for (let h = 0; h < 6; h++) d.rect('markings', '#2a63c7', cx, 4.6 + h * 0.8, 2.6, 0.12, 0.072, 0.6);
      continue;
    }
    res.stalls++;
    d.block('matte', CONC, cx, 0, 8.75, 1.8, 0.14, 0.2);
    const isAda = adaStalls.includes(k), isEv = evStalls.includes(k);
    if (isAda) { res.ada++; d.tpl(T.plane, 'ada', '#ffffff', cx, 0.075, 6.4, 1.4, 1, 1.4, Math.PI / 2, 0, 0, 0); }
    if (isEv) {
      res.ev++;
      d.rect('markings', '#3f9b5c', cx, 6.6, sw - 0.25, 4.9, 0.068);
      d.block('metal', '#eef0f1', cx + 0.9, 0, 9.35, 0.32, 1.45, 0.26);
      d.box('glow', '#7dd3a0', cx + 0.9, 1.15, 9.21, 0.22, 0.28, 0.02);
      d.box('matte', '#222', cx + 0.9, 0.9, 9.2, 0.04, 0.5, 0.04);
    }
    if (r() < opts.occupancy * (isAda ? 0.4 : 1)) {
      res.cars++;
      car(d, cx + r.range(-0.12, 0.12), 6.35 + r.range(-0.2, 0.15), -Math.PI / 2 + r.range(-0.03, 0.03), r.pick(CAR_COLORS), pickCarType(r));
    }
  }
  // structure: columns every two stalls at the rear, cantilevered girders, knee braces
  const colZ = 9.75;
  for (let x = 0; x <= L + 0.01; x += sw * 2) {
    const yTop = yAt(colZ);
    d.block('matte', CONC, x, 0, colZ, 0.7, 0.45, 0.7);
    d.block('metal', STEEL, x, 0, colZ, 0.32, yTop, 0.32);
    const zc = (zFront + zRear) / 2;
    d.box('metal', STEEL, x, (yFront + yAt(zRear)) / 2 - 0.18, zc, 0.22, 0.34, zRear - zFront + 0.05, 0, TILT);
    strut(d, 'metal', STEEL, [x, yTop - 1.1, colZ], [x, yAt(7.6) - 0.3, 7.6], 0.16);
  }
  d.box('metal', STEEL, L / 2, yAt(colZ) - 0.2, colZ, L + 0.3, 0.38, 0.26);
  // light underside deck + fascia
  const zc = (zFront + zRear) / 2, ymid = (yFront + yAt(zRear)) / 2;
  d.box('metal', DECK, L / 2, ymid + 0.06, zc, L + 0.4, 0.1, zRear - zFront + 0.2, 0, TILT);
  d.box('metal', '#c3c8cc', L / 2, yFront + 0.05, zFront - 0.12, L + 0.4, 0.38, 0.08, 0, TILT);
  for (let x = sw; x < L; x += sw * 2) d.box('glow', '#fff8e6', x, ymid - 0.02, zc, 0.6, 0.04, 0.25, 0, TILT);
  // photovoltaic modules following the canopy slope
  d.at(L / 2, ymid + 0.16, zc, 0, () => {
    const cols = Math.floor((L + 0.3) / 1.04), rows = 4;
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) {
      d.tpl(T.box, 'solar', '#ffffff', (i - (cols - 1) / 2) * 1.04, 0, (j - (rows - 1) / 2) * 1.74, 1.0, 0.045, 1.7, 0, 0, 0, 0);
      res.panels++;
    }
  }, TILT);
  return res;
}

/** Island between canopies: tree, shrubs, sometimes a trash/recycling enclosure or bike racks. */
function parkingIsland(d, forest, r, kind, gap) {
  const mid = gap / 2;
  d.block('matte', CONC, mid, 0, 6.6, gap, 0.16, 5.8);
  d.rect('mulch', '#ffffff', mid, 6.6, gap - 0.4, 5.4, 0.17);
  if (kind === 'trash') {
    d.block('matte', '#b5a58c', mid, 0.16, 7.2, gap - 0.8, 1.8, 0.25);
    d.block('matte', '#b5a58c', mid - (gap - 0.8) / 2, 0.16, 5.9, 0.25, 1.8, 2.6);
    d.block('matte', '#b5a58c', mid + (gap - 0.8) / 2, 0.16, 5.9, 0.25, 1.8, 2.6);
    d.block('metal', '#5b6266', mid, 0.16, 4.65, gap - 0.8, 1.6, 0.08);
    return null;
  }
  const [wx, wz] = d.world(mid, 6.8);
  forest.add(r.pick(['sycamore', 'oak', 'oak']), wx, wz, 0.7 + r() * 0.2);
  for (let k = 0; k < 3; k++) {
    const [sx, sz] = d.world(mid + r.range(-1.6, 1.6), r.range(4.6, 8.8));
    forest.add('shrub', sx, sz, 0.8 + r() * 0.4, undefined, r.pick(['#7d8c5a', '#93a07a', '#a3a88a', '#8a7ab0']));
  }
  return [wx, wz];
}

/**
 * The perimeter loop road plus all parking along its outer edge.
 * Returns geometry stats, the road centerline and carport hit-boxes for interaction.
 */
export function buildPerimeter(d, forest, r, { boundary, road, parking, crossings }) {
  const inner = offsetPolyline(boundary, -road.centerOffset, true);
  // boundary order: A,B,C,D,E,F,G,H. Road runs SW entrance -> G' F' E' D' C' B' -> NW entrance.
  const [, B, C, D, E, F, G] = inner;
  const pts = [[road.entranceX, G[1]], G, F, E, D, C, B, [road.entranceX, B[1]]];
  const hw = road.width / 2;
  d.ribbon('asphalt', '#ffffff', pts, road.width, 0.04);
  d.dashes('markings', '#e8c34a', pts, 0.12, 3, 4, 0.075);
  d.ribbon('markings', '#eeeeee', offsetPolyline(pts, hw - 0.25), 0.1, 0.074);
  // raised curb + inner sidewalk (pedestrian side) + parkway
  // inner sidewalk runs behind the inner row of carports
  const walk = offsetPolyline(pts, hw + 7.1);
  d.ribbon('concrete', '#ffffff', walk, 2.0, 0.13);

  const total = polylineLength(pts);
  const stats = { stalls: 0, ev: 0, ada: 0, panels: 0, cars: 0, canopies: 0, roadArea: total * road.width, parkingArea: 0 };
  const hitBoxes = [];

  // crosswalk positions (arc-length along road) from pedestrian connectors
  const reserved = [];
  const sOf = (x, z) => {
    let best = 0, bd = Infinity, acc = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      const L = Math.hypot(bx - ax, bz - az);
      const t = Math.max(0, Math.min(1, ((x - ax) * (bx - ax) + (z - az) * (bz - az)) / (L * L)));
      const dd = Math.hypot(x - (ax + t * (bx - ax)), z - (az + t * (bz - az)));
      if (dd < bd) { bd = dd; best = acc + t * L; }
      acc += L;
    }
    return best;
  };
  for (const [x, z] of crossings) {
    const s = sOf(x, z);
    reserved.push([s - 4, s + 4]);
    const p = pointAt(pts, s);
    d.at(p.x, 0, p.z, Math.atan2(-p.dz, p.dx), () => {
      for (let k = 0; k < 7; k++) d.rect('markings', '#f4f4f4', 0, -3.0 + k * 1.0, 3.0, 0.5, 0.078);
    });
  }

  // walk each straight segment, filling it with canopies separated by planted islands
  let acc = 0, islandCount = 0, canopyCount = 0;
  const modLen = parking.stallsPerCanopy * parking.stallWidth;
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const L = Math.hypot(bx - ax, bz - az), ux = (bx - ax) / L, uz = (bz - az) / L;
    const ry = Math.atan2(-uz, ux);
    let s0 = 12, s1 = L - 12;
    if (i === 1) s0 = Math.max(s0, 14);
    if (i === pts.length - 1) s1 = L - 14;
    // fill both sides of the road: outer (toward the property line) and inner (toward the homes)
    for (const inner of [false, true]) {
      let s = s0;
      while (s < s1 - parking.stallWidth * 3) {
        const gs = acc + s;
        const block = reserved.find(([a, b]) => gs < b && gs + modLen > a);
        let n = parking.stallsPerCanopy;
        if (block) {
          const room = Math.floor((block[0] - gs) / parking.stallWidth);
          if (room >= 3) n = Math.min(n, room); else { s = block[1] - acc + 1; continue; }
        }
        n = Math.min(n, Math.floor((s1 - s) / parking.stallWidth));
        if (n < 3) break;
        const len = n * parking.stallWidth;
        // inner side: same module rotated 180°, anchored at the far end so it covers [s, s+len]
        const px = ax + ux * (inner ? s + len : s), pz = az + uz * (inner ? s + len : s);
        const fry = inner ? ry + Math.PI : ry;
        d.at(px, 0, pz, fry, () => {
          const ev = canopyCount % parking.evEvery === 1;
          const res = solarCarport(d, n, { ...parking, ada: canopyCount % 6 === 0, ev }, r);
          for (const k of Object.keys(res)) stats[k] += res[k];
          const [cx, cz] = d.world(len / 2, 6.8);
          const evPos = ev ? d.world((n - 1) * parking.stallWidth, 6.8) : null;
          hitBoxes.push({ x: cx, y: 2, z: cz, sx: len + 0.6, sy: 4.2, sz: 7.4, ry: fry, ev, evPos, stalls: res.stalls, panels: res.panels });
          if (!inner) d.at(len, 0, 0, 0, () => parkingIsland(d, forest, r, islandCount++ % 7 === 3 ? 'trash' : 'tree', parking.canopyGap));
          else d.at(-parking.canopyGap, 0, 0, 0, () => parkingIsland(d, forest, r, 'tree', parking.canopyGap));
        });
        stats.parkingArea += len * 7;
        stats.canopies++; canopyCount++;
        s += len + parking.canopyGap;
      }
    }
    // street lights + street trees on the pedestrian (inner) side
    for (let t = 8; t < L - 8; t += 30) {
      const nx = uz, nz = -ux; // left normal
      const lx = ax + ux * t - nx * (hw + 7.2), lz = az + uz * t - nz * (hw + 7.2);
      d.at(lx, 0, lz, ry, () => streetLight(d, 0, 0, 0));
      const gs = acc + t + 15;
      if (!reserved.some(([a, b]) => gs > a - 3 && gs < b + 3) && t + 15 < L - 6) {
        forest.add('sycamore', ax + ux * (t + 15) + nx * (hw + 9.2), az + uz * (t + 15) + nz * (hw + 9.2), 0.8 + r() * 0.25);
      }
    }
    acc += L;
  }
  return { stats, hitBoxes, roadPts: pts, walkPts: walk };
}

/** A handful of animated cars driving the loop (separate meshes so they can move). */
export function createTraffic(materials, roadPts, count = 6, seed = 5) {
  const lanes = [offsetPolyline(roadPts, -1.9), offsetPolyline([...roadPts].reverse(), -1.9)];
  const cars = [];
  for (let i = 0; i < count; i++) {
    const b = new Batcher(), d = new Draw(b);
    const types = ['sedan', 'suv', 'hatch', 'truck'];
    car(d, 0, 0, 0, CAR_COLORS[(i * 5 + seed) % CAR_COLORS.length], types[i % 4]);
    const group = b.build(materials, 'traffic');
    group.children.forEach((m) => { m.matrixAutoUpdate = true; m.castShadow = true; });
    const lane = lanes[i % 2];
    cars.push({ group, lane, len: polylineLength(lane), s: (i / count) * polylineLength(lane), speed: 6 + (i % 3) * 1.5 });
  }
  return {
    cars,
    update(dt) {
      for (const c of cars) {
        c.s = (c.s + c.speed * dt) % c.len;
        const p = pointAt(c.lane, c.s);
        c.group.position.set(p.x, 0, p.z);
        const target = Math.atan2(-p.dz, p.dx);
        let delta = target - c.group.rotation.y;
        delta = Math.atan2(Math.sin(delta), Math.cos(delta));
        c.group.rotation.y += delta * Math.min(1, dt * 4);
      }
    },
  };
}
