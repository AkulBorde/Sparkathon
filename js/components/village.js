// Eco-village style housing: small timber-clad 2–3 story buildings (2–4 homes each) with light
// corrugated-metal gable roofs, solar water heaters, pergolas and balconies, scattered along curving
// pedestrian lanes with lush private and shared gardens in between.
import { T } from '../core/batcher.js';
import { smoothPath, pointAt, polylineLength, pointInPolygon, distToPolygonEdge, distToSegment, offsetPolyline } from '../core/geo.js';
import { streetLight } from './furniture.js';
import { NATIVE_SHRUBS, GRASSES } from './vegetation.js';
import { picnicTable, raisedBed, compostBins, person, pathLight, bench } from './furniture.js';

const CLAD = ['#c9a679', '#d4b58c', '#bd9a6c', '#dcc39c', '#c2a07a', '#cfae84'];
const ROOF = '#cfd3d6', TRIM = '#efece4', FRAME = '#5b4732', GLASS = '#4f6676', DECK = '#9c7a54';
const P = (30 * Math.PI) / 180, TN = Math.tan(P), FL = 2.9, PL = 0.4;

function win(d, x, z, ry, yc, w, h) {
  d.at(x, 0, z, ry, () => {
    d.box('wood', FRAME, 0, yc, 0.03, w + 0.16, h + 0.16, 0.08);
    d.box('glass', GLASS, 0, yc, 0.075, w, h, 0.03);
    d.box('wood', FRAME, 0, yc, 0.095, 0.05, h, 0.02);
  });
}

/** One small timber building in local coords: length along x, front (+z) faces the lane. */
export function cottage(d, { units, uw, D, stories, r }) {
  const L = units * uw, H = PL + stories * FL, zf = D / 2, zb = -D / 2;
  const clad = r.pick(CLAD);
  d.block('matte', '#b5aea2', 0, 0, 0, L + 0.1, 0.4, D + 0.1);
  d.block('clad', clad, 0, 0.4, 0, L, H - 0.4, D);
  for (let i = 0; i < units; i++) {
    const x0 = -L / 2 + i * uw, cx = x0 + uw / 2;
    if (i > 0) d.block('wood', '#a58457', x0, 0.4, 0, 0.14, H - 0.4, D + 0.06);
    // front: door + french doors + upper windows
    d.box('wood', '#6e4f33', x0 + 1.1, PL + 1.05, zf + 0.04, 0.95, 2.1, 0.06);
    win(d, x0 + uw * 0.64, zf, 0, PL + 1.1, 1.9, 2.0);
    for (let f = 1; f < stories; f++) {
      win(d, x0 + 1.25, zf, 0, PL + f * FL + 1.45, 0.9, 1.3);
      win(d, x0 + uw * 0.64, zf, 0, PL + f * FL + 1.45, 1.7, 1.3);
    }
    if (i % 2 === 0 || units === 2) { // timber pergola over the front patio
      const pz = zf + 2.3;
      for (const px of [x0 + 0.35, x0 + uw - 0.35]) d.block('wood', DECK, px, 0, pz, 0.15, 2.6, 0.15);
      d.block('wood', DECK, cx, 2.6, pz, uw - 0.3, 0.18, 0.12);
      for (let k = 0; k < 6; k++) d.block('wood', '#ad8a60', x0 + 0.5 + k * ((uw - 1) / 5), 2.78, zf + 1.15, 0.08, 0.12, 2.6);
      d.block('wood', DECK, cx, 0, zf + 1.2, uw - 0.4, 0.2, 2.4);
    } else if (stories >= 2) { // upper balcony
      const y = PL + FL;
      d.box('wood', DECK, cx, y - 0.08, zf + 0.75, uw - 0.8, 0.16, 1.5);
      d.box('wood', '#8a6a45', cx, y + 0.95, zf + 1.48, uw - 0.8, 0.07, 0.07);
      for (let k = 0; k <= 8; k++) d.box('wood', '#8a6a45', cx - (uw - 0.8) / 2 + (k * (uw - 0.8)) / 8, y + 0.5, zf + 1.48, 0.05, 0.9, 0.05);
      for (const s of [-1, 1]) d.box('wood', DECK, cx + s * (uw / 2 - 0.5), y / 2, zf + 1.4, 0.12, y, 0.12);
    }
    // back: big window + upper windows + small deck
    win(d, cx, zb, Math.PI, PL + 1.1, 2.4, 1.8);
    for (let f = 1; f < stories; f++) win(d, cx, zb, Math.PI, PL + f * FL + 1.45, 1.6, 1.3);
    d.block('wood', DECK, cx, 0, zb - 1.2, uw - 0.4, 0.25, 2.4);
  }
  for (const side of [-1, 1]) for (let f = 0; f < stories; f++) win(d, side * L / 2, 0, side * Math.PI / 2, PL + f * FL + 1.45, 1.0, 1.3);

  // corrugated metal gable roof
  const ov = 0.6, s = D / 2 + ov, sl = s / Math.cos(P), Lr = L + 1.0, yc = H + (D / 2 - s / 2) * TN + 0.06;
  d.tpl(T.box, 'metalroof', ROOF, 0, yc, s / 2, Lr, 0.1, sl, 0, P, 0);
  d.tpl(T.box, 'metalroof', ROOF, 0, yc, -s / 2, Lr, 0.1, sl, 0, -P, 0);
  d.box('metal', '#b8bcbf', 0, H + (D / 2) * TN + 0.08, 0, Lr, 0.12, 0.4);
  for (const side of [-1, 1]) d.prism('clad', clad, side * (L / 2 - 0.05), H, 0, D, (D / 2) * TN, 0.12, Math.PI / 2);
  d.box('wood', TRIM, 0, H - ov * TN, s - 0.03, Lr, 0.22, 0.05);
  d.box('wood', TRIM, 0, H - ov * TN, -s + 0.03, Lr, 0.22, 0.05);

  for (let i = 0; i < units; i++) {
    const cx = -L / 2 + i * uw + uw / 2;
    // front cross-gable on some units (as in the reference photo)
    if (r() < 0.35) {
      const gw = uw - 1.2, hs = gw / 2 + 0.4, zb2 = zf - 3, zfr = zf + ov, zl = zfr - zb2, zc = (zfr + zb2) / 2;
      const sw = hs / Math.cos(P), ycs = H + (gw / 2 - hs / 2) * TN + 0.06;
      d.tpl(T.box, 'metalroof', ROOF, cx - hs / 2, ycs, zc, sw, 0.1, zl, 0, 0, P);
      d.tpl(T.box, 'metalroof', ROOF, cx + hs / 2, ycs, zc, sw, 0.1, zl, 0, 0, -P);
      d.prism('clad', clad, cx, H, zf - 0.05, gw, (gw / 2) * TN, 0.12);
      win(d, cx, zf + 0.02, 0, H + 0.55, 0.9, 0.7);
    } else if (r() < 0.65) {
      // solar hot-water collector + tank, or a skylight, on the front slope
      d.at(cx, H + (D / 4) * TN + 0.12, D / 4, 0, () => {
        d.box('glass', '#1d2a38', 0, 0, 0, 1.9, 0.08, 1.2);
        d.box('metal', '#c9ccce', 0, 0, 0, 2.0, 0.06, 1.3);
        d.box('glass', '#1d2a38', 0, 0.04, 0, 1.9, 0.04, 1.2);
        if (r() < 0.6) d.cyl('metal', '#e2e4e5', 0, 0.3, -0.75, 0.45, 1.9, 12, 0, 0, Math.PI / 2);
      }, P);
    }
  }
  return { footprint: L * D, H };
}

function obbOverlap(a, b) {
  const axes = [a, b].flatMap((o) => [[Math.cos(o.ry), -Math.sin(o.ry)], [Math.sin(o.ry), Math.cos(o.ry)]]);
  const proj = (o, ax, az) => {
    const c = o.x * ax + o.z * az;
    const e = o.hx * Math.abs(Math.cos(o.ry) * ax - Math.sin(o.ry) * az) + o.hz * Math.abs(Math.sin(o.ry) * ax + Math.cos(o.ry) * az);
    return [c - e, c + e];
  };
  for (const [ax, az] of axes) {
    const [a0, a1] = proj(a, ax, az), [b0, b1] = proj(b, ax, az);
    if (a1 < b0 || b1 < a0) return false;
  }
  return true;
}
const corners = (o) => [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => [
  o.x + Math.cos(o.ry) * o.hx * u + Math.sin(o.ry) * o.hz * v,
  o.z - Math.sin(o.ry) * o.hx * u + Math.cos(o.ry) * o.hz * v,
]);

/**
 * Lays out the whole village. cfg: { boundary, parkX1, avoid: [{x,z,w,d}], minEdge, target }
 */
export function buildVillage(d, forest, r, cfg) {
  const { boundary, parkX1, avoid, minEdge = 26, target = 500 } = cfg;
  const inside = (x, z, m = minEdge) => pointInPolygon(x, z, boundary) && distToPolygonEdge(x, z, boundary) >= m && x > parkX1 + 2
    && !avoid.some((a) => Math.abs(x - a.x) < a.w / 2 && Math.abs(z - a.z) < a.d / 2);

  // ---- pedestrian network: curving east-west lanes + a few north-south links
  const trim = (pts) => {
    let a = 0, b = pts.length - 1;
    while (a < b && !inside(pts[a][0], pts[a][1], 23)) a++;
    while (b > a && !inside(pts[b][0], pts[b][1], 23)) b--;
    return pts.slice(a, b + 1);
  };
  const lanes = [];
  for (const z of [-166, -134, -102, -70, -38, -4, 34, 66, 98, 130, 156]) {
    const ctrl = [];
    for (let x = -84; x <= 166; x += 36) ctrl.push([x, z + (z === 34 && x < -40 ? 0 : r.range(-4, 4))]);
    ctrl.push([168, z]);
    if (z === 34) ctrl[0] = [-80, 34];
    const pts = trim(smoothPath(ctrl, 90));
    if (pts.length > 4) lanes.push(pts);
  }
  const links = [];
  for (const x of [-40, 38, 118]) {
    const ctrl = [];
    for (let z = -186; z <= 162; z += 40) ctrl.push([x + r.range(-8, 8), z]);
    const pts = trim(smoothPath(ctrl, 90));
    if (pts.length > 4) links.push(pts);
  }
  const allPaths = [...lanes, ...links];
  for (const p of lanes) d.ribbon('concrete', '#ffffff', p, 2.6, 0.06);
  for (const p of links) d.ribbon('concrete', '#ffffff', p, 2.2, 0.061);
  // ---- neighborhood street(s) through part of the village
  const roads = (cfg.roads || []).map((c) => smoothPath(c, 70));
  const nearRoad = (x, z, w) => roads.some((p) => { for (let i = 1; i < p.length; i++) if (distToSegment(x, z, p[i - 1], p[i]) < w) return true; return false; });
  for (const p of roads) {
    d.ribbon('asphalt', '#ffffff', p, 7.2, 0.068);
    d.dashes('markings', '#e8c34a', p, 0.12, 3, 4, 0.08);
    for (const s of [-1, 1]) {
      d.ribbon('concrete', '#dcd6ca', offsetPolyline(p, s * 3.75), 0.3, 0.075);
      d.ribbon('concrete', '#ffffff', offsetPolyline(p, s * 4.9), 2.0, 0.066);
    }
    const len = polylineLength(p);
    for (let s = 10; s < len - 10; s += 16) {
      const q = pointAt(p, s), side = Math.floor(s / 16) % 2 ? 1 : -1;
      forest.add('sycamore', q.x + q.dz * 6.8 * side, q.z - q.dx * 6.8 * side, 0.75 + r() * 0.2);
      if (Math.floor(s / 16) % 2 === 0) streetLight(d, q.x - q.dz * 6.4 * side, q.z + q.dx * 6.4 * side, Math.atan2(-q.dz * side, q.dx * side));
    }
    // crosswalks where village lanes cross the street
    for (const lane of lanes.concat(links)) {
      let best = null, bd = 2.5;
      for (const [x, z] of lane) for (let i = 1; i < p.length; i++) {
        const dd = distToSegment(x, z, p[i - 1], p[i]);
        if (dd < bd) { bd = dd; best = i; }
      }
      if (best == null) continue;
      let hit = null, hd = Infinity;
      for (const [x, z] of lane) { const dd = distToSegment(x, z, p[best - 1], p[best]); if (dd < hd) { hd = dd; hit = [x, z]; } }
      const ax = p[best][0] - p[best - 1][0], az = p[best][1] - p[best - 1][1];
      d.at(hit[0], 0, hit[1], Math.atan2(-az, ax), () => { for (let k = 0; k < 7; k++) d.rect('markings', '#f4f4f4', 0, -3.0 + k * 1.0, 3.0, 0.5, 0.082); });
    }
  }
  const nearPath = (x, z, w) => allPaths.some((p) => { for (let i = 1; i < p.length; i++) if (distToSegment(x, z, p[i - 1], p[i]) < w) return true; return false; });

  // ---- buildings along both sides of every lane
  const placed = [], features = [];
  let units = 0, footprint = 0, n = 0;
  const D = 8.2, setback = 3.6;
  const valid = (o) => corners(o).every(([x, z]) => inside(x, z)) && inside(o.x, o.z)
    && !corners({ ...o, hx: o.hx - 0.6, hz: o.hz - 0.6 }).some(([x, z]) => nearPath(x, z, 1.6)) && !nearPath(o.x, o.z, 3)
    && !corners(o).some(([x, z]) => nearRoad(x, z, 7.5)) && !nearRoad(o.x, o.z, 9)
    && !placed.some((p) => obbOverlap(o, p));
  const pocket = (o) => { // shared garden pocket between buildings
    d.at(o.x, 0, o.z, o.ry, () => {
      d.rect('dg', '#ffffff', 0, 0, o.hx * 2 - 1, o.hz * 2 - 1, 0.05);
      for (let k = 0; k < 4; k++) raisedBed(d, -3.2 + (k % 2) * 6.4 * 0.5 + (k > 1 ? 3.2 : 0), -2 + (k % 2) * 3, 0, r, 2.2, 1.1);
      picnicTable(d, 2.5, 2.5, 0.2);
      compostBins(d, -3.5, 3.2, 0);
      for (let k = 0; k < 3; k++) person(d, r.range(-3, 3), r.range(-3, 3), r() * 6, r);
    });
    const [cx, cz] = [o.x, o.z];
    forest.add('citrus', cx + Math.cos(o.ry) * (o.hx - 1), cz - Math.sin(o.ry) * (o.hx - 1), 0.9);
    features.push({ id: `pocket-${features.length}`, info: 'courtyard-garden', box: { x: cx, z: cz, sx: o.hx * 2, sz: o.hz * 2, y: 1.2, sy: 2.4, ry: o.ry }, group: 'courtyards', label: 'shared garden' });
  };

  for (let pass = 0; pass < 3 && units < target; pass++) {
    for (const lane of lanes) {
      const len = polylineLength(lane);
      for (const side of [1, -1]) {
        let s = r.range(1, 6) + pass * 7;
        while (s < len - 4 && units < target) {
          const nu = r.pick([3, 3, 4, 4, 5, 2]), uw = 6.0, L = nu * uw;
          const p = pointAt(lane, s + L / 2);
          const lx = p.dz, lz = -p.dx; // left normal
          const off = setback + D / 2 + r.range(-0.3, 0.6);
          const fx = -lx * side, fz = -lz * side; // front faces the lane
          const ry = Math.atan2(fx, fz) + r.range(-0.06, 0.06);
          const o = { x: p.x + lx * side * off, z: p.z + lz * side * off, hx: L / 2 + 0.6, hz: D / 2 + 2.5, ry };
          if (pass === 0 && r() < 0.05) { // leave room for a shared garden
            const g = { x: p.x + lx * side * 9, z: p.z + lz * side * 9, hx: 6, hz: 5.5, ry };
            if (valid(g)) { placed.push(g); pocket(g); s += 15; continue; }
          }
          if (!valid(o)) { s += 2.5; continue; }
          placed.push(o);
          const stories = r() < 0.85 ? 3 : 2;
          const homes = stories === 3 ? nu * 2 : nu; // 3-story = ground-floor flat + 2-story townhome per bay
          let res;
          // shift so the building's front sits at the setback line, back deck behind
          d.at(o.x, 0, o.z, ry, () => { res = cottage(d, { units: nu, uw, D, stories, r }); });
          units += homes; footprint += res.footprint; n++;
          features.push({ id: `homes-${n}`, info: 'homes', box: { x: o.x, z: o.z, sx: L + 0.6, sz: D + 0.8, y: (res.H + 3) / 2, sy: res.H + 3, ry }, group: 'homes', units: homes, stories });
          // front garden planting along the lane
          for (let k = 0; k < nu * 2; k++) {
            const t = r.range(-L / 2, L / 2), q = r.range(1.6, 3.2);
            const wx = p.x + p.dx * t + lx * side * q, wz = p.z + p.dz * t + lz * side * q;
            forest.add(r() < 0.75 ? 'shrub' : 'grass', wx, wz, 0.6 + r() * 0.7, undefined, r.pick([...NATIVE_SHRUBS, '#5d7d3c', '#4f7034', '#8fae5a']));
          }
          s += L + r.range(2, 5);
        }
      }
    }
  }

  // ---- lush gardens everywhere else: fruit trees, natives, shrubs
  const blocked = (x, z, m) => !inside(x, z) || nearRoad(x, z, 6) || placed.some((o) => obbOverlap({ x, z, hx: m, hz: m, ry: 0 }, { ...o, hz: o.hz - 1.5 })) || nearPath(x, z, 1.8);
  let trees = 0, shrubs = 0;
  for (let i = 0; i < 16000 && (trees < 650 || shrubs < 3200); i++) {
    const x = r.range(parkX1, 170), z = r.range(-190, 192);
    const v = r();
    if (v < 0.22 && trees < 650) {
      if (blocked(x, z, 1.5)) continue;
      forest.add(r.pick(['olive', 'citrus', 'oak', 'sycamore', 'jacaranda', 'olive', 'oak']), x, z, 0.55 + r() * 0.4);
      trees++;
    } else if (shrubs < 3200) {
      if (blocked(x, z, 0.4)) continue;
      forest.add(r() < 0.8 ? 'shrub' : 'grass', x, z, 0.6 + r() * 0.9, undefined, r.pick([...NATIVE_SHRUBS, ...GRASSES, '#55763a', '#4a6b32', '#6d8f45', '#3f6230']));
      shrubs++;
    }
  }
  // lane lights, benches, people
  for (const lane of lanes) {
    const len = polylineLength(lane);
    for (let s = 6; s < len; s += 24) {
      const p = pointAt(lane, s);
      pathLight(d, p.x + p.dz * 1.8, p.z - p.dx * 1.8);
      if (r() < 0.25) bench(d, p.x - p.dz * 2.2, p.z + p.dx * 2.2, Math.atan2(p.dz, -p.dx) + Math.PI);
      if (r() < 0.5) person(d, p.x + r.range(-0.8, 0.8), p.z, Math.atan2(p.dx, p.dz), r);
    }
  }
  return { units, footprint, buildings: n, features, lanes, links, roads };
}
