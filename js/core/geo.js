// 2D planning helpers. Plan coordinates are [x, z] in meters: +x = east, +z = south.
import * as THREE from 'three';

/** Deterministic random generator so the model looks the same on every load. */
export function rng(seed = 1) {
  let s = (seed >>> 0) || 1;
  const r = () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; };
  r.range = (a, b) => a + (b - a) * r();
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

export function polygonArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return Math.abs(a) / 2;
}

export function pointInPolygon(x, z, pts) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j];
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function distToSegment(px, pz, [ax, az], [bx, bz]) {
  const dx = bx - ax, dz = bz - az;
  const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz || 1), 0, 1);
  return Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
}

export function distToPolygonEdge(x, z, pts) {
  let d = Infinity;
  for (let i = 0; i < pts.length; i++) d = Math.min(d, distToSegment(x, z, pts[i], pts[(i + 1) % pts.length]));
  return d;
}

function lineIntersect(p, r, q, s) {
  const rxs = r[0] * s[1] - r[1] * s[0];
  if (Math.abs(rxs) < 1e-9) return null;
  const t = ((q[0] - p[0]) * s[1] - (q[1] - p[1]) * s[0]) / rxs;
  return [p[0] + t * r[0], p[1] + t * r[1]];
}

/**
 * Offset a polyline sideways. Positive d = to the LEFT of the direction of travel.
 * (Travel direction (dx,dz) -> left normal (dz,-dx) in this x-east / z-south plan.)
 */
export function offsetPolyline(pts, d, closed = false) {
  const n = pts.length, out = [];
  const seg = (i) => {
    const a = pts[i], b = pts[(i + 1) % n];
    const dx = b[0] - a[0], dz = b[1] - a[1], L = Math.hypot(dx, dz) || 1;
    const nx = dz / L, nz = -dx / L;
    return { p: [a[0] + nx * d, a[1] + nz * d], r: [dx, dz], nx, nz };
  };
  for (let i = 0; i < n; i++) {
    const hasPrev = closed || i > 0, hasNext = closed || i < n - 1;
    if (!hasPrev) { const s = seg(0); out.push([pts[0][0] + s.nx * d, pts[0][1] + s.nz * d]); continue; }
    if (!hasNext) { const s = seg(n - 2); out.push([pts[n - 1][0] + s.nx * d, pts[n - 1][1] + s.nz * d]); continue; }
    const s0 = seg((i - 1 + n) % n), s1 = seg(i);
    const hit = lineIntersect(s0.p, s0.r, s1.p, s1.r);
    out.push(hit || [pts[i][0] + s1.nx * d, pts[i][1] + s1.nz * d]);
  }
  return out;
}

export function polylineLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

/** Point + unit direction at arc-length s along a polyline. */
export function pointAt(pts, s) {
  for (let i = 1; i < pts.length; i++) {
    const [ax, az] = pts[i - 1], [bx, bz] = pts[i];
    const L = Math.hypot(bx - ax, bz - az);
    if (s <= L || i === pts.length - 1) {
      const t = clamp(s / (L || 1), 0, 1);
      return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, dx: (bx - ax) / L, dz: (bz - az) / L, seg: i - 1 };
    }
    s -= L;
  }
  return { x: pts[0][0], z: pts[0][1], dx: 1, dz: 0, seg: 0 };
}

/** Smooth a list of control points with a Catmull-Rom spline. */
export function smoothPath(ctrl, samples = 64, closed = false) {
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, z]) => new THREE.Vector3(x, 0, z)), closed, 'centripetal');
  return curve.getSpacedPoints(samples).map((v) => [v.x, v.z]).slice(0, closed ? samples : samples + 1);
}

export function ellipsePts(cx, cz, rx, rz, n = 48) {
  const pts = [];
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push([cx + Math.cos(a) * rx, cz + Math.sin(a) * rz]); }
  return pts;
}

export function rectPts(cx, cz, w, d, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [[-w / 2, -d / 2], [w / 2, -d / 2], [w / 2, d / 2], [-w / 2, d / 2]].map(([x, z]) => [cx + x * c + z * s, cz - x * s + z * c]);
}

export function roundedRectPts(cx, cz, w, d, r, seg = 6) {
  const pts = [];
  const corners = [[w / 2 - r, d / 2 - r, 0], [-w / 2 + r, d / 2 - r, Math.PI / 2], [-w / 2 + r, -d / 2 + r, Math.PI], [w / 2 - r, -d / 2 + r, 1.5 * Math.PI]];
  for (const [ox, oz, a0] of corners) for (let i = 0; i <= seg; i++) {
    const a = a0 + (i / seg) * (Math.PI / 2);
    pts.push([cx + ox + Math.cos(a) * r, cz + oz + Math.sin(a) * r]);
  }
  return pts;
}

/** Rotate a local [x,z] offset by a plan heading ry (same convention as THREE rotation.y). */
export function rotXZ(x, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  return [x * c + z * s, -x * s + z * c];
}
