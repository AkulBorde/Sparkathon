// Geometry batcher: thousands of small parts (windows, posts, panels...) are merged into ONE mesh per
// material so the whole neighborhood renders in a few dozen draw calls. Colors are stored per-vertex.
import * as THREE from 'three';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';

export function makeTemplate(geometry) {
  const g = geometry.index ? geometry.toNonIndexed() : geometry;
  if (!g.attributes.normal) g.computeVertexNormals();
  const pos = g.attributes.position.array.slice();
  return {
    pos,
    nor: g.attributes.normal.array.slice(),
    uv: g.attributes.uv ? g.attributes.uv.array.slice() : new Float32Array((pos.length / 3) * 2),
    count: pos.length / 3,
  };
}

function prismGeometry() {
  const s = new THREE.Shape();
  s.moveTo(-0.5, 0); s.lineTo(0.5, 0); s.lineTo(0, 1); s.lineTo(-0.5, 0);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1, bevelEnabled: false });
  g.translate(0, 0, -0.5);
  return g;
}

function blobGeometry(detail = 1, seed = 1, amp = 0.12) {
  let g = new THREE.IcosahedronGeometry(0.5, detail);
  g.deleteAttribute('normal'); g.deleteAttribute('uv');
  g = mergeVertices(g);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const n = Math.sin(x * 12.9 + seed) * Math.cos(y * 9.7 + seed * 2) * Math.sin(z * 11.3 + seed * 3);
    const k = 1 + n * amp;
    p.setXYZ(i, x * k, y * k, z * k);
  }
  g.computeVertexNormals();
  return g;
}

/** Shared unit-sized templates (1 m boxes etc.) that the Draw helper scales into place. */
export const T = {
  box: makeTemplate(new THREE.BoxGeometry(1, 1, 1)),
  cyl6: makeTemplate(new THREE.CylinderGeometry(0.5, 0.5, 1, 6)),
  cyl10: makeTemplate(new THREE.CylinderGeometry(0.5, 0.5, 1, 10)),
  cyl16: makeTemplate(new THREE.CylinderGeometry(0.5, 0.5, 1, 16)),
  taper: makeTemplate(new THREE.CylinderGeometry(0.32, 0.5, 1, 7)),
  cone: makeTemplate(new THREE.ConeGeometry(0.5, 1, 10)),
  cone4: makeTemplate(new THREE.ConeGeometry(0.5, 1, 4, 1).rotateY(Math.PI / 4)),
  sphere: makeTemplate(new THREE.SphereGeometry(0.5, 10, 7)),
  capsule: makeTemplate(new THREE.CapsuleGeometry(0.5, 1, 3, 8)),
  prism: makeTemplate(prismGeometry()),
  blob: makeTemplate(blobGeometry(1, 1)),
  blob2: makeTemplate(blobGeometry(1, 7, 0.16)),
  blobHi: makeTemplate(blobGeometry(2, 3, 0.1)),
  plane: makeTemplate(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)),
};

const colorCache = new Map();
function rgb(color) {
  if (Array.isArray(color)) return color;
  let v = colorCache.get(color);
  if (!v) { const c = new THREE.Color(color); v = [c.r, c.g, c.b]; colorCache.set(color, v); }
  return v;
}

class Bucket {
  constructor() { this.cap = 1 << 14; this.n = 0; this.alloc(); }
  alloc(old) {
    const pos = new Float32Array(this.cap * 3), nor = new Float32Array(this.cap * 3);
    const uv = new Float32Array(this.cap * 2), col = new Float32Array(this.cap * 3);
    if (old) { pos.set(old.pos); nor.set(old.nor); uv.set(old.uv); col.set(old.col); }
    Object.assign(this, { pos, nor, uv, col });
  }
  ensure(k) {
    if (this.n + k <= this.cap) return;
    const old = { pos: this.pos, nor: this.nor, uv: this.uv, col: this.col };
    while (this.cap < this.n + k) this.cap *= 2;
    this.alloc(old);
  }
}

const UV_TEMPLATE = 0, UV_METRIC = 1, UV_WORLD = 2;
export { UV_TEMPLATE, UV_METRIC, UV_WORLD };
const _nm = new THREE.Matrix3();

export class Batcher {
  constructor() { this.buckets = new Map(); }
  bucket(key) {
    let b = this.buckets.get(key);
    if (!b) { b = new Bucket(); this.buckets.set(key, b); }
    return b;
  }

  /** Append a transformed copy of a template. uvMode: template UVs, metric (meters, needs scale) or world XZ. */
  add(tpl, key, m, color, uvMode = UV_TEMPLATE, scale = null) {
    const b = this.bucket(key);
    b.ensure(tpl.count);
    const e = m.elements;
    _nm.getNormalMatrix(m);
    const ne = _nm.elements;
    const [cr, cg, cb] = rgb(color);
    const tp = tpl.pos, tn = tpl.nor, tu = tpl.uv;
    let o3 = b.n * 3, o2 = b.n * 2;
    for (let i = 0; i < tpl.count; i++) {
      const i3 = i * 3, x = tp[i3], y = tp[i3 + 1], z = tp[i3 + 2];
      const wx = e[0] * x + e[4] * y + e[8] * z + e[12];
      const wy = e[1] * x + e[5] * y + e[9] * z + e[13];
      const wz = e[2] * x + e[6] * y + e[10] * z + e[14];
      const a = tn[i3], c = tn[i3 + 1], d = tn[i3 + 2];
      let nx = ne[0] * a + ne[3] * c + ne[6] * d, ny = ne[1] * a + ne[4] * c + ne[7] * d, nz = ne[2] * a + ne[5] * c + ne[8] * d;
      const L = Math.hypot(nx, ny, nz) || 1; nx /= L; ny /= L; nz /= L;
      b.pos[o3] = wx; b.pos[o3 + 1] = wy; b.pos[o3 + 2] = wz;
      b.nor[o3] = nx; b.nor[o3 + 1] = ny; b.nor[o3 + 2] = nz;
      b.col[o3] = cr; b.col[o3 + 1] = cg; b.col[o3 + 2] = cb;
      if (uvMode === UV_WORLD) { b.uv[o2] = wx; b.uv[o2 + 1] = wz; }
      else if (uvMode === UV_METRIC) {
        const ax = Math.abs(a), ay = Math.abs(c), az = Math.abs(d);
        if (ay >= ax && ay >= az) { b.uv[o2] = x * scale[0]; b.uv[o2 + 1] = z * scale[2]; }
        else if (ax >= az) { b.uv[o2] = z * scale[2]; b.uv[o2 + 1] = y * scale[1]; }
        else { b.uv[o2] = x * scale[0]; b.uv[o2 + 1] = y * scale[1]; }
      } else { b.uv[o2] = tu[i * 2]; b.uv[o2 + 1] = tu[i * 2 + 1]; }
      o3 += 3; o2 += 2;
    }
    b.n += tpl.count;
  }

  /** Append flat, upward-facing triangles given in world space (plan polygons), with world XZ UVs. */
  addFlat(tris, key, color) {
    const count = tris.length / 3;
    const b = this.bucket(key);
    b.ensure(count);
    const [cr, cg, cb] = rgb(color);
    for (let i = 0; i < count; i++) {
      const o3 = (b.n + i) * 3, o2 = (b.n + i) * 2;
      b.pos[o3] = tris[i * 3]; b.pos[o3 + 1] = tris[i * 3 + 1]; b.pos[o3 + 2] = tris[i * 3 + 2];
      b.nor[o3] = 0; b.nor[o3 + 1] = 1; b.nor[o3 + 2] = 0;
      b.col[o3] = cr; b.col[o3 + 1] = cg; b.col[o3 + 2] = cb;
      b.uv[o2] = tris[i * 3]; b.uv[o2 + 1] = tris[i * 3 + 2];
    }
    b.n += count;
  }

  toGeometry(key) {
    const b = this.buckets.get(key);
    const g = new THREE.BufferGeometry();
    if (!b) return g;
    g.setAttribute('position', new THREE.BufferAttribute(b.pos.slice(0, b.n * 3), 3));
    g.setAttribute('normal', new THREE.BufferAttribute(b.nor.slice(0, b.n * 3), 3));
    g.setAttribute('uv', new THREE.BufferAttribute(b.uv.slice(0, b.n * 2), 2));
    g.setAttribute('color', new THREE.BufferAttribute(b.col.slice(0, b.n * 3), 3));
    g.computeBoundingSphere();
    return g;
  }

  /** Build one Mesh per material key. */
  build(materials, name = 'batch') {
    const group = new THREE.Group();
    group.name = name;
    for (const [key, b] of this.buckets) {
      if (!b.n) continue;
      const mat = materials[key];
      if (!mat) { console.warn('Missing material', key); continue; }
      const mesh = new THREE.Mesh(this.toGeometry(key), mat);
      mesh.name = `${name}:${key}`;
      mesh.castShadow = !!mat.userData.castShadow;
      mesh.receiveShadow = mat.userData.receiveShadow !== false;
      mesh.matrixAutoUpdate = false;
      group.add(mesh);
    }
    return group;
  }

  get vertexCount() { let n = 0; for (const b of this.buckets.values()) n += b.n; return n; }
}

const _m = new THREE.Matrix4(), _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _e = new THREE.Euler();

/** Drawing helper with a transform stack, so components can be written in local coordinates. */
export class Draw {
  constructor(batcher) { this.b = batcher; this.stack = [new THREE.Matrix4()]; }
  get M() { return this.stack[this.stack.length - 1]; }
  push(x = 0, y = 0, z = 0, ry = 0, rx = 0, rz = 0, s = 1) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(s, s, s));
    this.stack.push(this.M.clone().multiply(_m));
    return this;
  }
  pop() { if (this.stack.length > 1) this.stack.pop(); return this; }
  /** Convert a local plan point to world plan coordinates [x, z] (and y). */
  world(x, z, y = 0) {
    const e = this.M.elements;
    return [e[0] * x + e[4] * y + e[8] * z + e[12], e[2] * x + e[6] * y + e[10] * z + e[14], e[1] * x + e[5] * y + e[9] * z + e[13]];
  }
  /** World heading of the current frame (rotation about Y). */
  heading() { const e = this.M.elements; return Math.atan2(e[8], e[10]); }
  /** Run fn inside a local frame. */
  at(x, y, z, ry, fn, rx = 0, rz = 0) { this.push(x, y, z, ry, rx, rz); try { fn(); } finally { this.pop(); } }

  matrix(x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) {
    _m.compose(_p.set(x, y, z), _q.setFromEuler(_e.set(rx, ry, rz, 'YXZ')), _s.set(sx, sy, sz));
    return new THREE.Matrix4().multiplyMatrices(this.M, _m);
  }
  tpl(tpl, key, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0, uvMode = UV_METRIC) {
    this.b.add(tpl, key, this.matrix(x, y, z, sx, sy, sz, ry, rx, rz), color, uvMode, [sx, sy, sz]);
  }
  /** Box centered at (x,y,z). */
  box(key, color, x, y, z, sx, sy, sz, ry = 0, rx = 0, rz = 0) { this.tpl(T.box, key, color, x, y, z, sx, sy, sz, ry, rx, rz); }
  /** Box resting on y (bottom face at y). */
  block(key, color, x, y, z, sx, sy, sz, ry = 0) { this.tpl(T.box, key, color, x, y + sy / 2, z, sx, sy, sz, ry); }
  /** Vertical cylinder with its base at y. */
  cyl(key, color, x, y, z, diam, h, segs = 10, ry = 0, rx = 0, rz = 0) {
    const t = segs <= 6 ? T.cyl6 : segs <= 10 ? T.cyl10 : T.cyl16;
    if (rx || rz) this.tpl(t, key, color, x, y, z, diam, h, diam, ry, rx, rz);
    else this.tpl(t, key, color, x, y + h / 2, z, diam, h, diam, ry);
  }
  sphere(key, color, x, y, z, sx, sy = sx, sz = sx) { this.tpl(T.sphere, key, color, x, y, z, sx, sy, sz); }
  /** Triangular prism: base width along local x, apex height up, thickness along local z. Base sits at y. */
  prism(key, color, x, y, z, base, height, thick, ry = 0) { this.tpl(T.prism, key, color, x, y, z, base, height, thick, ry); }

  /** Flat plan polygon [[x,z],...] (local frame) at height y. Triangulated, world-XZ UVs. */
  poly(key, color, pts, y = 0) {
    const contour = pts.map(([x, z]) => new THREE.Vector2(x, z));
    const tris = THREE.ShapeUtils.triangulateShape(contour, []);
    const e = this.M.elements;
    const W = pts.map(([x, z]) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]]);
    const out = [];
    for (const [a, b, c] of tris) {
      const A = W[a], B = W[b], C = W[c];
      const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
      if (ny >= 0) out.push(...A, ...B, ...C); else out.push(...A, ...C, ...B);
    }
    this.b.addFlat(out, key, color);
  }
  rect(key, color, cx, cz, w, d, y = 0, ry = 0) {
    const c = Math.cos(ry), s = Math.sin(ry);
    this.poly(key, color, [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]), y);
  }
  disc(key, color, cx, cz, r, y = 0, n = 28) {
    const pts = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * r, cz + Math.sin(a) * r]); }
    this.poly(key, color, pts, y);
  }
  /** Flat strip following a plan polyline (roads, sidewalks, paths) with mitered joints. */
  ribbon(key, color, pts, width, y = 0, closed = false) {
    const n = pts.length;
    if (n < 2) return;
    const hw = width / 2, L = [], R = [];
    for (let i = 0; i < n; i++) {
      const prev = closed ? pts[(i - 1 + n) % n] : pts[Math.max(i - 1, 0)];
      const next = closed ? pts[(i + 1) % n] : pts[Math.min(i + 1, n - 1)];
      const cur = pts[i];
      let d1x = cur[0] - prev[0], d1z = cur[1] - prev[1], d2x = next[0] - cur[0], d2z = next[1] - cur[1];
      const l1 = Math.hypot(d1x, d1z) || 1, l2 = Math.hypot(d2x, d2z) || 1;
      d1x /= l1; d1z /= l1; d2x /= l2; d2z /= l2;
      if (i === 0 && !closed) { d1x = d2x; d1z = d2z; }
      if (i === n - 1 && !closed) { d2x = d1x; d2z = d1z; }
      let tx = d1x + d2x, tz = d1z + d2z;
      const tl = Math.hypot(tx, tz) || 1; tx /= tl; tz /= tl;
      const nx = tz, nz = -tx;
      const miter = Math.min(hw / Math.max(nx * d2z - nz * d2x, 0.35), hw * 2.5);
      L.push([cur[0] + nx * miter, cur[1] + nz * miter]);
      R.push([cur[0] - nx * miter, cur[1] - nz * miter]);
    }
    const e = this.M.elements;
    const tw = ([x, z]) => [e[0] * x + e[4] * y + e[8] * z + e[12], e[1] * x + e[5] * y + e[9] * z + e[13], e[2] * x + e[6] * y + e[10] * z + e[14]];
    const out = [];
    const quad = (a, b, c, d) => {
      for (const [A, B, C] of [[a, b, c], [a, c, d]]) {
        const ny = (B[2] - A[2]) * (C[0] - A[0]) - (B[0] - A[0]) * (C[2] - A[2]);
        if (ny >= 0) out.push(...A, ...B, ...C); else out.push(...A, ...C, ...B);
      }
    };
    const segs = closed ? n : n - 1;
    for (let i = 0; i < segs; i++) {
      const j = (i + 1) % n;
      quad(tw(L[i]), tw(L[j]), tw(R[j]), tw(R[i]));
    }
    this.b.addFlat(out, key, color);
  }
  /** Dashed strip (lane lines, boundary). */
  dashes(key, color, pts, width, dash, gap, y = 0) {
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
      const L = Math.hypot(bx - ax, bz - az), dx = (bx - ax) / L, dz = (bz - az) / L;
      let s = (dash + gap) - (total % (dash + gap));
      if (s > dash + gap - 1e-6) s = 0;
      for (; s < L; s += dash + gap) {
        const e = Math.min(s + dash, L);
        if (e - s > 0.1) this.ribbon(key, color, [[ax + dx * s, az + dz * s], [ax + dx * e, az + dz * e]], width, y);
      }
      total += L;
    }
  }
}
