// Procedural canvas textures + the shared material library. No image assets required.
import * as THREE from 'three';
import { rng } from './geo.js';

function makeCanvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')];
}

function texture(canvas, meters, { srgb = true, repeat = true } = {}) {
  const t = new THREE.CanvasTexture(canvas);
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / meters, 1 / meters);
  }
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  return t;
}

function speckle(ctx, size, n, colors, r, maxSize = 2) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r.pick(colors);
    const s = 0.6 + r() * maxSize;
    ctx.fillRect(r() * size, r() * size, s, s);
  }
}

function blotches(ctx, size, n, colors, r, rad = [10, 50]) {
  for (let i = 0; i < n; i++) {
    const x = r() * size, y = r() * size, R = r.range(rad[0], rad[1]);
    for (const ox of [-size, 0, size]) for (const oy of [-size, 0, size]) {
      const g = ctx.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, R);
      g.addColorStop(0, r.pick(colors)); g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + ox - R, y + oy - R, R * 2, R * 2);
    }
  }
}

function groundTex({ base, blot = [], specks = [], size = 256, nSpeck = 6000, nBlot = 30, meters = 6, seed = 1, rad }) {
  const [c, ctx] = makeCanvas(size);
  const r = rng(seed);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  if (blot.length) blotches(ctx, size, nBlot, blot, r, rad);
  if (specks.length) speckle(ctx, size, nSpeck, specks, r);
  return texture(c, meters);
}

function lawnTex() {
  const size = 512, [c, ctx] = makeCanvas(size);
  const r = rng(4);
  ctx.fillStyle = '#7da04c'; ctx.fillRect(0, 0, size, size);
  // mowing stripes
  ctx.fillStyle = 'rgba(255,255,210,0.07)';
  ctx.fillRect(0, 0, size / 2, size);
  blotches(ctx, size, 26, ['rgba(70,110,40,0.25)', 'rgba(150,170,80,0.18)'], r, [20, 70]);
  speckle(ctx, size, 16000, ['rgba(40,70,25,0.35)', 'rgba(170,190,110,0.3)', 'rgba(90,130,50,0.4)'], r, 1.5);
  return texture(c, 12);
}

function concreteTex(base = '#d2ccc0', joint = 'rgba(90,80,70,0.35)', meters = 3, tiles = 2) {
  const size = 256, [c, ctx] = makeCanvas(size);
  const r = rng(9);
  ctx.fillStyle = base; ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, 20, ['rgba(255,255,255,0.08)', 'rgba(120,110,95,0.08)'], r, [10, 40]);
  speckle(ctx, size, 5000, ['rgba(110,100,90,0.25)', 'rgba(255,255,255,0.25)'], r, 1.2);
  ctx.strokeStyle = joint; ctx.lineWidth = 2;
  const step = size / tiles;
  for (let i = 0; i <= tiles; i++) {
    ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, size); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(size, i * step); ctx.stroke();
  }
  return texture(c, meters);
}

function paverTex() {
  const size = 256, [c, ctx] = makeCanvas(size);
  const r = rng(12);
  ctx.fillStyle = '#9c8a74'; ctx.fillRect(0, 0, size, size);
  const bw = size / 5, bh = size / 10;
  const tones = ['#c2ab8c', '#b79f80', '#cbb596', '#ad9474', '#bea586', '#c8b49a'];
  for (let row = 0; row < 10; row++) for (let col = -1; col < 6; col++) {
    const x = col * bw + (row % 2 ? bw / 2 : 0);
    ctx.fillStyle = r.pick(tones);
    ctx.fillRect(x + 1.5, row * bh + 1.5, bw - 3, bh - 3);
  }
  speckle(ctx, size, 3000, ['rgba(80,60,40,0.2)', 'rgba(255,255,255,0.15)'], r, 1.2);
  return texture(c, 2.4);
}

function roofTileTex() {
  // grayscale barrel tile pattern, tinted per-building by vertex color. 1 texture = 1 m x 1 m.
  const size = 128, [c, ctx] = makeCanvas(size);
  const cols = 5, cw = size / cols;
  for (let i = 0; i < cols; i++) {
    const g = ctx.createLinearGradient(i * cw, 0, (i + 1) * cw, 0);
    g.addColorStop(0, '#9a9a9a'); g.addColorStop(0.45, '#ffffff'); g.addColorStop(0.8, '#d2d2d2'); g.addColorStop(1, '#7a7a7a');
    ctx.fillStyle = g; ctx.fillRect(i * cw, 0, cw, size);
  }
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  for (let k = 0; k < 3; k++) ctx.fillRect(0, (k * size) / 3, size, 3);
  const r = rng(3);
  speckle(ctx, size, 900, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.12)'], r, 1.5);
  return texture(c, 1, { srgb: true });
}

function stuccoTex() {
  const size = 256, [c, ctx] = makeCanvas(size);
  const r = rng(21);
  ctx.fillStyle = '#f4f4f4'; ctx.fillRect(0, 0, size, size);
  blotches(ctx, size, 40, ['rgba(0,0,0,0.035)', 'rgba(255,255,255,0.4)'], r, [8, 40]);
  speckle(ctx, size, 9000, ['rgba(0,0,0,0.06)', 'rgba(255,255,255,0.5)'], r, 1.2);
  return texture(c, 3);
}

function claddingTex() {
  // vertical timber boards (grayscale, tinted per building). 1 texture = 1.2 m.
  const size = 256, [c, ctx] = makeCanvas(size);
  const r = rng(31);
  const boards = 8, bw = size / boards;
  for (let i = 0; i < boards; i++) {
    const v = 215 + Math.floor(r() * 40);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(i * bw, 0, bw, size);
    for (let k = 0; k < 14; k++) { // grain
      ctx.fillStyle = `rgba(90,70,50,${0.04 + r() * 0.06})`;
      ctx.fillRect(i * bw + r() * bw, 0, 0.8 + r() * 1.2, size);
    }
    ctx.fillStyle = 'rgba(40,30,20,0.45)';
    ctx.fillRect(i * bw, 0, 2, size);
  }
  return texture(c, 1.2);
}

function metalRoofTex() {
  // corrugated metal: ribs running down the slope
  const size = 128, [c, ctx] = makeCanvas(size);
  const ribs = 6, w = size / ribs;
  for (let i = 0; i < ribs; i++) {
    const g = ctx.createLinearGradient(i * w, 0, (i + 1) * w, 0);
    g.addColorStop(0, '#9c9c9c'); g.addColorStop(0.3, '#ffffff'); g.addColorStop(0.6, '#e2e2e2'); g.addColorStop(1, '#8a8a8a');
    ctx.fillStyle = g; ctx.fillRect(i * w, 0, w, size);
  }
  return texture(c, 1);
}

function solarTex() {
  // one photovoltaic module: aluminum frame + 6 x 10 mono cells
  const w = 120, h = 200, [c, ctx] = makeCanvas(w, h);
  ctx.fillStyle = '#c8ccd0'; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#0d1626'; ctx.fillRect(4, 4, w - 8, h - 8);
  const cw = (w - 12) / 6, ch = (h - 12) / 10;
  for (let i = 0; i < 6; i++) for (let j = 0; j < 10; j++) {
    const x = 6 + i * cw, y = 6 + j * ch;
    const g = ctx.createLinearGradient(x, y, x + cw, y + ch);
    g.addColorStop(0, '#1d3a6b'); g.addColorStop(1, '#14284d');
    ctx.fillStyle = g; ctx.fillRect(x + 0.8, y + 0.8, cw - 1.6, ch - 1.6);
    ctx.fillStyle = 'rgba(160,180,220,0.18)';
    ctx.fillRect(x + cw / 3, y + 1, 0.7, ch - 2); ctx.fillRect(x + (2 * cw) / 3, y + 1, 0.7, ch - 2);
  }
  const t = texture(c, 1, { repeat: false });
  return t;
}

function adaTex() {
  const size = 128, [c, ctx] = makeCanvas(size);
  ctx.fillStyle = '#1f5fbf'; ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = 9; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(58, 26, 9, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.moveTo(56, 42); ctx.lineTo(56, 74); ctx.lineTo(84, 74); ctx.lineTo(96, 100); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(56, 54); ctx.lineTo(80, 54); ctx.stroke();
  ctx.lineWidth = 7; ctx.beginPath(); ctx.arc(56, 82, 24, Math.PI * 0.55, Math.PI * 1.55); ctx.stroke();
  return texture(c, 1, { repeat: false });
}

export function textTexture(lines, { w = 1024, h = 256, bg = '#2f3a33', fg = '#f3eee2', font = 'Georgia, serif', size = 92, sub = 40 } = {}) {
  const [c, ctx] = makeCanvas(w, h);
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = fg; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.font = `600 ${size}px ${font}`;
  ctx.fillText(lines[0], w / 2, lines[1] ? h * 0.4 : h / 2);
  if (lines[1]) { ctx.font = `500 ${sub}px ${font}`; ctx.fillText(lines[1], w / 2, h * 0.76); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

/** Creates every shared material. userData.castShadow tells the batcher whether meshes cast shadows. */
export function createMaterials(renderer) {
  const aniso = renderer.capabilities.getMaxAnisotropy();
  const std = (opts, cast = true, receive = true) => {
    const m = new THREE.MeshStandardMaterial({ vertexColors: true, ...opts });
    if (m.map) m.map.anisotropy = aniso;
    m.userData.castShadow = cast; m.userData.receiveShadow = receive;
    return m;
  };
  const ground = (map, rough = 0.95) => std({ map, roughness: rough, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1 }, false, true);

  const M = {
    // architecture & objects
    matte: std({ roughness: 0.88 }),
    stucco: std({ roughness: 0.92, map: stuccoTex() }),
    roof: std({ roughness: 0.8, map: roofTileTex() }),
    clad: std({ roughness: 0.85, map: claddingTex() }),
    metalroof: std({ roughness: 0.42, metalness: 0.55, map: metalRoofTex(), envMapIntensity: 1.1 }),
    paint: std({ roughness: 0.32, metalness: 0.35, envMapIntensity: 1.1 }),
    metal: std({ roughness: 0.38, metalness: 0.75 }),
    glass: std({ roughness: 0.06, metalness: 0.15, envMapIntensity: 1.6 }),
    solar: std({ roughness: 0.22, metalness: 0.35, map: solarTex(), envMapIntensity: 1.3 }),
    wood: std({ roughness: 0.85 }),
    glow: std({ roughness: 0.5, emissive: new THREE.Color('#fff2c4'), emissiveIntensity: 0.6 }, false),
    water: std({ roughness: 0.05, metalness: 0.2, envMapIntensity: 1.4 }, false),
    canvas: std({ roughness: 0.9, side: THREE.DoubleSide }),
    foliage: std({ roughness: 0.9 }),
    // ground layers (world-space UVs in meters)
    grass: ground(groundTex({ base: '#6e8c45', blot: ['rgba(60,95,35,0.35)', 'rgba(140,160,80,0.25)', 'rgba(110,120,60,0.2)'], specks: ['rgba(40,70,25,0.35)', 'rgba(160,180,100,0.3)'], meters: 14, seed: 2, nSpeck: 12000, nBlot: 40, rad: [15, 60] }), 1),
    lawn: ground(lawnTex(), 1),
    dry: ground(groundTex({ base: '#a7a07c', blot: ['rgba(125,125,90,0.18)', 'rgba(185,172,135,0.16)'], specks: ['rgba(95,90,60,0.16)', 'rgba(200,190,155,0.14)'], size: 512, meters: 90, seed: 5, nSpeck: 14000, nBlot: 70, rad: [20, 110] }), 1),
    scrub: ground(groundTex({ base: '#8e8c66', blot: ['rgba(95,105,65,0.22)', 'rgba(165,155,120,0.2)'], specks: ['rgba(75,85,50,0.2)', 'rgba(185,175,140,0.16)'], size: 512, meters: 80, seed: 8, nSpeck: 14000, nBlot: 80, rad: [20, 110] }), 1),
    asphalt: ground(groundTex({ base: '#4a4c4f', blot: ['rgba(30,30,30,0.25)', 'rgba(120,120,120,0.12)'], specks: ['rgba(20,20,20,0.5)', 'rgba(150,150,150,0.35)'], meters: 4, seed: 6, nSpeck: 9000 }), 0.9),
    concrete: ground(concreteTex(), 0.9),
    pavers: ground(paverTex(), 0.9),
    dg: ground(groundTex({ base: '#cdb88f', blot: ['rgba(150,120,80,0.2)', 'rgba(240,225,190,0.25)'], specks: ['rgba(110,85,55,0.45)', 'rgba(250,240,215,0.45)'], meters: 4, seed: 7 }), 1),
    mulch: ground(groundTex({ base: '#6b513a', blot: ['rgba(40,25,15,0.3)', 'rgba(140,110,80,0.2)'], specks: ['rgba(30,20,10,0.5)', 'rgba(160,120,80,0.4)'], meters: 3, seed: 10 }), 1),
    rubber: ground(groundTex({ base: '#4d8f8a', blot: ['rgba(255,255,255,0.05)'], specks: ['rgba(20,60,60,0.4)', 'rgba(200,230,220,0.3)'], meters: 3, seed: 11 }), 0.95),
    sand: ground(groundTex({ base: '#dcc9a0', specks: ['rgba(140,120,80,0.35)', 'rgba(255,250,230,0.5)'], meters: 2, seed: 13 }), 1),
    soil: ground(groundTex({ base: '#5e4633', specks: ['rgba(30,20,10,0.5)', 'rgba(140,110,80,0.4)'], meters: 2, seed: 14 }), 1),
    markings: std({ roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }, false, true),
    ada: std({ roughness: 0.7, map: adaTex(), polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }, false, true),
  };
  return M;
}
