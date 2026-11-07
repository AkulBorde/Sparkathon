// Trees, shrubs and grasses rendered with GPU instancing (one draw call per species).
import * as THREE from 'three';
import { Batcher, Draw, T } from '../core/batcher.js';

const BARK = '#5b4636';

/** Each species builds a 1x reference model in local coordinates (ground at y=0). */
const SPECIES = {
  oak: (d) => { // coast live oak — broad, dark, umbrella crown
    d.cyl('m', BARK, 0, 0, 0, 0.5, 3.4, 7);
    d.cyl('m', BARK, 0.6, 2.6, 0.2, 0.25, 1.6, 6, 0, 0, -0.7);
    d.cyl('m', BARK, -0.5, 2.6, -0.3, 0.25, 1.6, 6, 0, 0.6, 0.6);
    d.tpl(T.blob, 'm', '#4b6832', 0, 4.8, 0, 5.8, 3.4, 5.6);
    d.tpl(T.blob2, 'm', '#55733a', 1.9, 4.3, 0.9, 3.8, 2.8, 3.6);
    d.tpl(T.blob, 'm', '#46622f', -1.8, 4.4, -0.9, 4.0, 2.9, 3.8);
    d.tpl(T.blob2, 'm', '#5a783e', 0.3, 5.9, -0.6, 3.6, 2.4, 3.4);
    d.tpl(T.blob, 'm', '#4f6c35', -0.9, 4.2, 1.8, 3.2, 2.4, 3.0);
  },
  sycamore: (d) => { // California sycamore — tall, pale bark, lighter crown
    d.cyl('m', '#d6cfbf', 0, 0, 0, 0.45, 5.5, 7);
    d.cyl('m', '#cfc6b4', 0.5, 4.5, 0, 0.25, 2.5, 6, 0, 0, -0.5);
    d.tpl(T.blob, 'm', '#79964a', 0, 7.4, 0, 5.2, 4.6, 5.2);
    d.tpl(T.blob2, 'm', '#86a253', 1.4, 6.3, 1.0, 3.6, 3.2, 3.6);
    d.tpl(T.blob, 'm', '#6f8c44', -1.3, 6.6, -0.8, 3.8, 3.4, 3.6);
    d.tpl(T.blob2, 'm', '#80a050', 0.2, 8.9, 0.3, 3.2, 2.6, 3.0);
  },
  jacaranda: (d) => {
    d.cyl('m', BARK, 0, 0, 0, 0.35, 3.2, 7);
    d.tpl(T.blob, 'm', '#9583c7', 0, 4.6, 0, 5.4, 2.8, 5.4);
    d.tpl(T.blob2, 'm', '#a08fd0', 1.4, 4.3, 0.6, 3.2, 2.2, 3.2);
    d.tpl(T.blob, 'm', '#8a78bb', -1.2, 4.5, -0.7, 3.4, 2.4, 3.2);
    d.tpl(T.blob2, 'm', '#6f8a4a', 0, 3.9, 0, 4.2, 1.2, 4.2);
  },
  olive: (d) => {
    d.cyl('m', '#6e6458', 0, 0, 0, 0.32, 1.9, 6, 0, 0.12, 0.08);
    d.tpl(T.blob, 'm', '#8b9a6c', 0, 2.9, 0, 3.4, 2.1, 3.2);
    d.tpl(T.blob2, 'm', '#97a679', 0.9, 2.6, 0.4, 2.0, 1.6, 2.0);
    d.tpl(T.blob, 'm', '#80905f', -0.8, 2.8, -0.4, 2.2, 1.6, 2.0);
  },
  citrus: (d) => {
    d.cyl('m', BARK, 0, 0, 0, 0.18, 0.9, 6);
    d.tpl(T.blobHi, 'm', '#3f6a2c', 0, 1.9, 0, 2.4, 2.2, 2.4);
    for (const [x, y, z] of [[0.9, 2.0, 0.6], [-0.8, 1.6, 0.7], [0.3, 2.7, -0.8], [-0.6, 2.3, -0.8], [1.0, 1.5, -0.3]]) d.sphere('m', '#f0a02a', x, y, z, 0.2);
  },
  cypress: (d) => {
    d.cyl('m', BARK, 0, 0, 0, 0.25, 1.2, 6);
    d.tpl(T.blobHi, 'm', '#3c5430', 0, 4.6, 0, 1.6, 8.6, 1.6);
  },
  palm: (d) => { // Mexican fan palm
    d.tpl(T.taper, 'm', '#8a7660', 0, 6, 0, 0.55, 12, 0.55);
    d.tpl(T.blob, 'm', '#7d6a50', 0, 11.6, 0, 1.3, 1.6, 1.3);
    for (let k = 0; k < 11; k++) {
      const a = (k / 11) * Math.PI * 2;
      d.at(0, 12.2, 0, a, () => d.box('m', k % 2 ? '#5f7f3b' : '#6c8c44', 0, 0.1, 1.5, 0.9, 0.06, 3.2, 0, 0.45, 0));
    }
    for (let k = 0; k < 5; k++) {
      const a = (k / 5) * Math.PI * 2 + 0.3;
      d.at(0, 12.6, 0, a, () => d.box('m', '#76944a', 0, 0.3, 1.0, 0.8, 0.06, 2.2, 0, -0.25, 0));
    }
  },
  ctx: (d) => { // context / background tree
    d.cyl('m', BARK, 0, 0, 0, 0.45, 3, 6);
    d.tpl(T.blob, 'm', '#55703a', 0, 4.8, 0, 5.4, 4.2, 5.4);
    d.tpl(T.blob2, 'm', '#4d6634', 1.2, 4.2, 0.8, 3.4, 3.0, 3.4);
  },
  shrub: (d) => { d.tpl(T.blob, 'm', '#ffffff', 0, 0.42, 0, 1.3, 0.95, 1.3); },
  grass: (d) => { // ornamental bunch grass
    for (const [x, z, s] of [[0, 0, 1], [0.2, 0.15, 0.8], [-0.2, 0.1, 0.85], [0.05, -0.2, 0.8]]) d.tpl(T.cone, 'm', '#ffffff', x, 0.45 * s, z, 0.55 * s, 0.9 * s, 0.55 * s);
  },
  scrub: (d) => { // coastal sage scrub for context land
    d.tpl(T.blob2, 'm', '#ffffff', 0, 0.5, 0, 2.2, 1.2, 2.0);
    d.tpl(T.blob, 'm', '#ffffff', 0.8, 0.4, 0.5, 1.4, 0.9, 1.3);
  },
};

const CAST = { oak: true, sycamore: true, jacaranda: true, olive: true, citrus: true, cypress: true, palm: true, ctx: true, shrub: false, grass: false, scrub: false };

export class Forest {
  constructor() { this.items = {}; this.count = 0; }
  /** Add one plant. color (optional) tints the instance; scale multiplies the reference size. */
  add(species, x, z, scale = 1, ry = Math.random() * Math.PI * 2, color = null, y = 0) {
    (this.items[species] ||= []).push({ x, z, s: scale, ry, color, y });
    if (species !== 'grass' && species !== 'shrub' && species !== 'scrub') this.count++;
  }
  build(seed = 1) {
    const group = new THREE.Group();
    group.name = 'vegetation';
    const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3(), c = new THREE.Color();
    let k = seed;
    for (const [name, list] of Object.entries(this.items)) {
      const b = new Batcher(), d = new Draw(b);
      SPECIES[name](d);
      const geo = b.toGeometry('m');
      const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.88 });
      const mesh = new THREE.InstancedMesh(geo, mat, list.length);
      list.forEach((t, i) => {
        q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), t.ry);
        p.set(t.x, t.y, t.z);
        const sy = t.s * (0.92 + (((k = (k * 16807) % 2147483647) / 2147483647) * 0.16));
        s.set(t.s, sy, t.s);
        m4.compose(p, q, s);
        mesh.setMatrixAt(i, m4);
        const v = 0.86 + ((k = (k * 16807) % 2147483647) / 2147483647) * 0.24;
        if (t.color) c.set(t.color).multiplyScalar(v * 0.95 + 0.05); else c.setRGB(v, v * (0.97 + (k % 7) / 100), v * 0.95);
        mesh.setColorAt(i, c);
      });
      mesh.instanceMatrix.needsUpdate = true;
      if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
      mesh.castShadow = CAST[name];
      mesh.receiveShadow = true;
      mesh.computeBoundingSphere();
      mesh.name = `trees:${name}`;
      group.add(mesh);
    }
    return group;
  }
}

/** Plant palettes for drought-tolerant / native landscaping. */
export const NATIVE_SHRUBS = ['#7d8c5a', '#93a07a', '#6b7a4a', '#a3a88a', '#8a7ab0', '#9c8fbf', '#b8a05a', '#6f8a52', '#c7b56d'];
export const GRASSES = ['#c9b56f', '#b9a865', '#9fae6a', '#d4c48a'];
