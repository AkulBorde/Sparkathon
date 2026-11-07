// Assembles the whole neighborhood from layout.js and returns meshes, interactive features and stats.
import * as THREE from 'three';
import { Batcher, Draw } from './core/batcher.js';
import { rng, polygonArea, pointAt, polylineLength } from './core/geo.js';
import { textTexture } from './core/materials.js';
import { Forest } from './components/vegetation.js';
import { communityCenter } from './components/buildings.js';
import { buildPark, buildNorthGarden, pocketPark } from './components/landscape.js';
import { buildVillage } from './components/village.js';
import { buildPerimeter, createTraffic } from './components/parking.js';
import { buildContext } from './components/context.js';
import * as L from './layout.js';
import { PERSON_EXCLUDE } from './components/furniture.js';

export function buildWorld(materials) {
  const t0 = performance.now();
  const batch = new Batcher(), d = new Draw(batch), forest = new Forest(), r = rng(2026);
  const extras = [], features = [];
  PERSON_EXCLUDE.length = 0;
  for (const v of L.STREET_VIEWS) PERSON_EXCLUDE.push([v.pos[0], v.pos[2]]);
  const signMats = [];

  /** Text sign (separate mesh) placed relative to the Draw frame active at call time. */
  const makeSign = (lines, x, y, z, ry, w, h, bg = '#2f3a33') => {
    const mat = new THREE.MeshStandardMaterial({ map: textTexture(lines, { bg }), roughness: 0.6 });
    signMats.push(mat);
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    const [wx, wz, wy] = d.world(x, z, y);
    mesh.position.set(wx, wy, wz);
    mesh.rotation.y = ry + d.heading();
    mesh.receiveShadow = true;
    return mesh;
  };
  const feature = (id, info, box, extra = {}) => features.push({ id, info, box: { y: 2, sy: 4, ry: 0, ...box }, ...extra });

  // ---------------- context + site ground
  const ctx = buildContext(d, forest, r, { boundary: L.BOUNDARY, road: L.ROAD });

  // ---------------- park + community center
  const park = buildPark(d, forest, r, L.PARK, extras, makeSign);
  const PB = L.PARK.bounds;
  feature('park', 'park', { x: (PB.x0 + PB.x1) / 2, z: (PB.z0 + PB.z1) / 2, sx: PB.x1 - PB.x0, sz: PB.z1 - PB.z0, y: 0.6, sy: 1.2 }, { group: 'park', pickable: false });
  feature('event-lawn', 'event-lawn', { ...park.features.lawn, y: 0.5, sy: 1 }, { group: 'park' });
  feature('playground', 'playground', { ...park.features.playground, y: 2, sy: 4.5 }, { group: 'park' });
  feature('pavilion', 'pool', { ...park.features.pavilion, y: 2, sy: 4 }, { group: 'park' });
  feature('plaza', 'plaza', { x: L.PARK.plaza.x, z: L.PARK.plaza.z, sx: 20, sz: 34, y: 1, sy: 2 }, { group: 'park' });
  feature('park-meadow', 'park', { x: (L.PARK.meadow.x0 + L.PARK.meadow.x1) / 2, z: (L.PARK.meadow.z0 + L.PARK.meadow.z1) / 2, sx: 66, sz: 24, y: 0.5, sy: 1 }, { group: 'park', pickable: false });

  const CC = L.COMMUNITY_CENTER;
  d.at(CC.x, 0, CC.z, 0, () => communityCenter(d, extras, makeSign));
  feature('community-center', 'community-center', { x: CC.x - 7, z: CC.z, sx: 46, sz: 34, y: 4.5, sy: 9.5 }, { group: 'center' });

  const NG = L.AMENITIES.northGarden;
  buildNorthGarden(d, forest, r, NG);
  feature('garden', 'garden', { x: NG.x, z: NG.z, sx: NG.w, sz: NG.d, y: 1.5, sy: 3 }, { group: 'courtyards' });

  // ---------------- eco-village housing
  const village = buildVillage(d, forest, r, {
    boundary: L.BOUNDARY, parkX1: PB.x1, target: L.VILLAGE.targetHomes,
    avoid: [{ x: CC.x - 8, z: CC.z, w: 52, d: 44 }, { x: NG.x, z: NG.z, w: NG.w + 4, d: NG.d + 4 }, ...L.VILLAGE.parks.map((p) => ({ ...p, w: p.w + 2, d: p.d + 2 }))],
    roads: L.VILLAGE.roads,
  });
  for (const p of L.VILLAGE.parks) {
    pocketPark(d, forest, r, p);
    feature(p.id, 'pocket-park', { x: p.x, z: p.z, sx: p.w, sz: p.d, y: 2, sy: 4 }, { group: 'park' });
  }
  feature('soccer', 'soccer', { ...park.features.soccer, y: 1.1, sy: 2.2 }, { group: 'park' });
  feature('courts', 'courts', { ...park.features.courts, y: 1.8, sy: 3.6 }, { group: 'park' });
  for (const f of village.features) features.push(f);
  const firstPocket = village.features.find((f) => f.group === 'courtyards');
  if (firstPocket) feature('courtyard-garden-first', 'courtyard-garden', firstPocket.box, { pickable: false });

  // crossings where lanes / links meet the loop road
  const off = L.ROAD.centerOffset, Bd = L.BOUNDARY, crossings = [];
  for (const rd of L.VILLAGE.roads) crossings.push(rd[0], rd[rd.length - 1]);
  for (const p of village.lanes) { const e = p[p.length - 1]; if (e[0] > 150) crossings.push([Bd[3][0] - off, e[1]]); }
  for (const p of village.links) {
    const a = p[0], b = p[p.length - 1];
    crossings.push([a[0], Bd[3][1] + off]);
    crossings.push([b[0], b[0] > 2 ? Bd[4][1] - off : Bd[6][1] - off]);
  }

  // ---------------- perimeter road + solar carports
  const per = buildPerimeter(d, forest, r, { boundary: L.BOUNDARY, road: L.ROAD, parking: L.PARKING, crossings });
  per.hitBoxes.forEach((h, i) => feature(`solar-${i}`, 'solar', h, { group: 'solar', carport: h }));
  const east = per.hitBoxes.filter((h) => h.x > 150).sort((a, b) => Math.abs(a.z + 40) - Math.abs(b.z + 40))[0];
  if (east) feature('solar-east', 'solar', east, { pickable: false });
  const evBox = per.hitBoxes.find((h) => h.ev && h.x > 150) || per.hitBoxes.find((h) => h.ev);
  if (evBox) feature('solar-ev', 'solar', { ...evBox, x: evBox.evPos[0], z: evBox.evPos[1], sx: 6, sz: 7 }, { pickable: false });

  // street-level viewpoints along real lanes
  const laneView = (lane, frac, name) => {
    const len = polylineLength(lane), a = pointAt(lane, len * frac), b = pointAt(lane, len * frac + 30);
    return { name, pos: [a.x, 1.7, a.z], target: [b.x, 2.6, b.z] };
  };
  const mid = village.lanes[Math.floor(village.lanes.length / 2)];
  const streetViews = [
    L.STREET_VIEWS[0],
    laneView(mid, 0.02, 'Main lane from the Commons Center'),
    laneView(village.lanes[2], 0.45, 'Garden lane between homes'),
    laneView(village.lanes[6] || mid, 0.6, 'Village lane'),
    L.STREET_VIEWS.find((v) => v.name.includes('carports')),
  ];

  // ---------------- build meshes
  const group = new THREE.Group();
  group.name = 'world';
  group.add(batch.build(materials, 'site'));
  group.add(forest.build());
  extras.forEach((m) => group.add(m));
  const traffic = createTraffic(materials, per.roadPts, 7);
  traffic.cars.forEach((c) => group.add(c.group));

  // ---------------- statistics (derived from the generated model)
  const siteArea = polygonArea(L.BOUNDARY);
  const ps = per.stats;
  const kw = (ps.panels * L.PARKING.panelWatts) / 1000;
  const paved = ps.roadArea + ps.parkingArea;
  const footprint = village.footprint + 30 * 26;
  const units = village.units;
  const stats = {
    acres: siteArea / 4046.86, units, buildings: village.buildings,
    density: units / (siteArea / 4046.86),
    stalls: ps.stalls, ev: ps.ev, ada: ps.ada, canopies: ps.canopies,
    parkingRatio: ps.stalls / units,
    panels: ps.panels, kw, mwh: (kw * L.PARKING.annualKWhPerKW) / 1000,
    trees: forest.count,
    buildingPct: (footprint / siteArea) * 100,
    pavedPct: (paved / siteArea) * 100,
    openPct: 100 - ((footprint + paved) / siteArea) * 100,
    vertices: batch.vertexCount,
    buildMs: performance.now() - t0,
  };
  return { group, features, stats, traffic, labels: ctx.labels, signMats, roadPts: per.roadPts, streetViews };
}
