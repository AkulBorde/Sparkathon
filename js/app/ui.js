// Interaction layer: camera flights, picking, highlights, info panel, pins, tours, diagram overlay.
import * as THREE from 'three';
import { INFO, TOURS, CATEGORIES } from '../features.js';
import { STREET_VIEWS, BOUNDARY, CLUSTERS } from '../layout.js';

const $ = (s) => document.querySelector(s);
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const fmt = (n, d = 0) => n.toLocaleString('en-US', { maximumFractionDigits: d, minimumFractionDigits: d });

export const VIEWS = {
  overview: { pos: [-440, 400, 360], target: [10, 0, 0], highlight: null },
  park: { pos: [-300, 150, 175], target: [-140, 0, 40], highlight: 'park', info: 'park' },
  courtyards: { pos: [-40, 120, 150], target: [50, 0, 40], highlight: 'courtyards', info: 'courtyard-garden' },
  solar: { pos: [92, 78, 34], target: [172, 0, -52], highlight: 'solar', info: 'solar' },
  center: { pos: [-168, 52, 108], target: [-102, 2, 34], highlight: 'center', info: 'community-center' },
};

const GROUP_COLORS = { park: '#3fbf5f', courtyards: '#8ddc5a', solar: '#3d8bff', center: '#ff9d2e', homes: '#ff7a4d', walk: '#ffd23d' };

export class UI {
  constructor(stage, world) {
    this.stage = stage; this.world = world;
    this.features = new Map(world.features.map((f) => [f.id, f]));
    this.fly = null; this.street = false; this.tour = null; this.keys = new Set();
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.highlights = new THREE.Group(); this.highlights.name = 'highlights';
    stage.scene.add(this.highlights);
    this.buildHitBoxes();
    this.buildOverlays();
    this.buildPins();

    this.bindControls();
    this.bindPointer();
  }

  // ------------------------------------------------------------------ picking
  buildHitBoxes() {
    this.hitGroup = new THREE.Group();
    this.hitGroup.visible = false;
    const mat = new THREE.MeshBasicMaterial();
    for (const f of this.world.features) {
      if (f.pickable === false) continue;
      const b = f.box;
      const m = new THREE.Mesh(new THREE.BoxGeometry(b.sx, b.sy, b.sz), mat);
      m.position.set(b.x, b.y, b.z);
      m.rotation.y = b.ry || 0;
      m.userData.feature = f;
      m.updateMatrixWorld();
      this.hitGroup.add(m);
    }
    this.stage.scene.add(this.hitGroup);
  }

  pick(clientX, clientY) {
    const rect = this.stage.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((clientX - rect.left) / rect.width) * 2 - 1, -((clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.stage.camera);
    const hits = this.raycaster.intersectObjects(this.hitGroup.children, false);
    if (!hits.length) return null;
    const near = hits[0].distance;
    let best = null, bestVol = Infinity;
    for (const h of hits) {
      if (h.distance > near + 25) break;
      const b = h.object.userData.feature.box, vol = b.sx * b.sy * b.sz;
      if (vol < bestVol) { bestVol = vol; best = h.object.userData.feature; }
    }
    return best;
  }

  bindPointer() {
    const el = this.stage.renderer.domElement;
    let down = null, lastMove = 0;
    el.addEventListener('pointerdown', (e) => { down = [e.clientX, e.clientY]; this.cancelFly(); if (this.tour) this.pauseTour(true); });
    el.addEventListener('pointerup', (e) => {
      if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5) return;
      const f = this.pick(e.clientX, e.clientY);
      if (f) this.select(f.id, { fly: false });
      else this.clearSelection();
    });
    const tip = $('#tooltip');
    el.addEventListener('pointermove', (e) => {
      const now = performance.now();
      if (now - lastMove < 60 || e.buttons) return;
      lastMove = now;
      const f = this.pick(e.clientX, e.clientY);
      el.style.cursor = f ? 'pointer' : '';
      if (f) {
        tip.textContent = this.titleOf(f);
        tip.style.transform = `translate(${e.clientX + 14}px, ${e.clientY + 12}px)`;
        tip.classList.remove('hidden');
      } else tip.classList.add('hidden');
    });
    el.addEventListener('pointerleave', () => tip.classList.add('hidden'));
    this.stage.controls.addEventListener('start', () => this.cancelFly());
    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT') return;
      this.keys.add(e.key.toLowerCase());
      if (e.key === 'Escape') { this.endTour(); this.clearSelection(); }
      if (this.tour && e.key === 'ArrowRight') this.tourStep(1);
      if (this.tour && e.key === 'ArrowLeft') this.tourStep(-1);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
  }

  titleOf(f) {
    if (f.info === 'homes') return `Village homes · ${f.units} units`;
    if (f.id.startsWith('court-')) return `${INFO[f.info].title} (${f.label})`;
    return INFO[f.info]?.title || f.id;
  }

  // ------------------------------------------------------------------ camera
  flyTo(pos, target, duration = 2.2) {
    const c = this.stage.controls;
    const p0 = this.stage.camera.position.clone(), t0 = c.target.clone();
    const p1 = new THREE.Vector3(...pos), t1 = new THREE.Vector3(...target);
    const lift = Math.min(160, p0.distanceTo(p1) * 0.18);
    this.fly = { p0, t0, p1, t1, t: 0, duration, lift };
  }
  cancelFly() { this.fly = null; }
  setStreetMode(on) {
    const c = this.stage.controls;
    this.street = on;
    c.minDistance = on ? 0.2 : 8;
    c.maxPolarAngle = on ? Math.PI * 0.62 : Math.PI * 0.47;
    c.zoomToCursor = !on;
    $('#street-banner').classList.toggle('hidden', !on);
  }
  goTo(name) {
    this.endTour(false);
    if (name === 'street') return this.nextStreetView();
    const v = VIEWS[name];
    this.setStreetMode(false);
    this.setActive(name);
    this.flyTo(v.pos, v.target);
    this.highlightGroup(v.highlight);
    if (v.info) this.showInfo(this.features.get(v.info) || { id: v.info, info: v.info });
    else this.hideInfo();
  }
  nextStreetView() {
    const SV = this.world.streetViews || STREET_VIEWS;
    this.streetIndex = ((this.streetIndex ?? -1) + 1) % SV.length;
    const v = SV[this.streetIndex];
    this.setStreetMode(true);
    this.setActive('street');
    this.hideInfo();
    this.highlightGroup(null);
    const dir = new THREE.Vector3(...v.target).sub(new THREE.Vector3(...v.pos)).normalize();
    const target = new THREE.Vector3(...v.pos).addScaledVector(dir, 1.5);
    this.flyTo(v.pos, target.toArray(), 2.6);
    $('#street-banner').innerHTML = `<b>Street view ${this.streetIndex + 1}/${SV.length}:</b> ${v.name}<span>Drag to look around · W A S D to walk · click “Street View” for the next spot</span>`;
  }
  viewFor(f, offset) {
    const b = f.box;
    if (!offset && f.info === 'solar') {
      // look from inside the neighborhood toward the canopy (homes -> road -> carport)
      const ix = -Math.sin(b.ry || 0), iz = -Math.cos(b.ry || 0), ax = Math.cos(b.ry || 0), az = -Math.sin(b.ry || 0);
      return { pos: [b.x + ix * 44 + ax * 18, 26, b.z + iz * 44 + az * 18], target: [b.x, 1.5, b.z] };
    }
    const o = offset || INFO[f.info]?.view || [-40, 35, 50];
    return { pos: [b.x + o[0], (b.y || 0) + o[1], b.z + o[2]], target: [b.x, Math.max(0, (b.y || 0) - b.sy / 2 + 1), b.z] };
  }

  update(dt) {
    const cam = this.stage.camera, c = this.stage.controls;
    if (this.fly) {
      const F = this.fly;
      F.t = Math.min(1, F.t + dt / F.duration);
      const k = ease(F.t);
      cam.position.lerpVectors(F.p0, F.p1, k);
      cam.position.y += Math.sin(Math.PI * k) * F.lift;
      c.target.lerpVectors(F.t0, F.t1, k);
      if (F.t >= 1) this.fly = null;
    }
    if (this.street && this.keys.size) {
      const fwd = new THREE.Vector3().subVectors(c.target, cam.position).setY(0).normalize();
      const right = new THREE.Vector3(-fwd.z, 0, fwd.x);
      const mv = new THREE.Vector3();
      if (this.keys.has('w') || this.keys.has('arrowup')) mv.add(fwd);
      if (this.keys.has('s') || this.keys.has('arrowdown')) mv.sub(fwd);
      if (this.keys.has('d')) mv.add(right);
      if (this.keys.has('a')) mv.sub(right);
      if (mv.lengthSq()) { mv.normalize().multiplyScalar(dt * (this.keys.has('shift') ? 12 : 4.5)); cam.position.add(mv); c.target.add(mv); }
    }
    c.update();
    // keep the camera above ground
    if (cam.position.y < 1.2) cam.position.y = 1.2;
    // highlight pulse
    const pulse = 0.5 + 0.5 * Math.sin(performance.now() / 380);
    this.highlights.children.forEach((h) => { if (h.material.userData.base != null) h.material.opacity = h.material.userData.base * (0.55 + 0.45 * pulse); });
    this.updatePins();
    this.updateCompass();
    if (this.tour && !this.tour.paused && !this.fly) {
      this.tour.timer += dt;
      $('#tour-progress-bar').style.width = `${Math.min(100, (this.tour.timer / this.tour.dwell) * 100)}%`;
      if (this.tour.timer >= this.tour.dwell) this.tourStep(1);
    }
  }

  // ------------------------------------------------------------------ highlights + info
  highlightBoxes(list, color, strong = false) {
    for (const f of list) {
      const b = f.box;
      const geo = new THREE.BoxGeometry(b.sx + 1, b.sy + 0.6, b.sz + 1);
      const fill = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: strong ? 0.22 : 0.16, depthWrite: false }));
      fill.material.userData.base = strong ? 0.22 : 0.16;
      fill.position.set(b.x, b.y, b.z); fill.rotation.y = b.ry || 0;
      fill.renderOrder = 5;
      const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.95 }));
      edges.material.userData.base = 0.95;
      edges.position.copy(fill.position); edges.rotation.copy(fill.rotation);
      this.highlights.add(fill, edges);
    }
  }
  clearHighlights() {
    for (const h of [...this.highlights.children]) { h.geometry.dispose(); h.material.dispose(); this.highlights.remove(h); }
  }
  highlightGroup(group) {
    this.clearHighlights();
    if (!group) return;
    const list = this.world.features.filter((f) => f.group === group && f.pickable !== false);
    this.highlightBoxes(list, GROUP_COLORS[group] || '#fff');
  }
  select(id, { fly = true } = {}) {
    const f = this.features.get(id);
    if (!f) return;
    this.clearHighlights();
    this.highlightBoxes([f], GROUP_COLORS[f.group] || '#ffffff', true);
    this.showInfo(f);
    if (fly) { const v = this.viewFor(f); this.flyTo(v.pos, v.target); }
  }
  clearSelection() { this.clearHighlights(); this.hideInfo(); }

  showInfo(f) {
    const info = INFO[f.info] || INFO[f.id];
    if (!info) return;
    const cat = CATEGORIES[info.cat];
    const s = this.world.stats;
    let facts = [...info.facts];
    let title = info.title;
    if (f.info === 'solar') {
      const cp = f.carport;
      if (cp) facts.push(`This canopy: ${cp.stalls} covered stalls · ${cp.panels} PV modules ≈ ${fmt((cp.panels * 0.4), 1)} kW`);
      facts.push(`${s.canopies} canopies · ${fmt(s.stalls)} covered stalls (${fmt(s.parkingRatio, 2)} per home)`);
      facts.push(`${fmt(s.panels)} PV modules ≈ ${fmt(s.kw / 1000, 2)} MW DC`);
      facts.push(`≈ ${fmt(Math.round(s.mwh / 10) * 10)} MWh per year (planning-level estimate)`);
      facts.push(`${s.ev} EV-charging stalls · ${s.ada} accessible stalls`);
    }
    if (f.info === 'homes') {
      title = `Village Homes · Building ${f.id.split('-')[1]}`;
      facts = [`${f.units} homes · ${f.stories} stories${f.stories === 3 ? ' (ground-floor flats + 2-story townhomes above)' : ' (attached townhomes)'}`, 'Timber cladding, metal roof, solar hot water / skylights', 'Front pergola or balcony on the lane · private deck and garden behind', `${this.world.stats.units} homes in ${this.world.stats.buildings} small buildings across the site`];
    }
    if (f.id.startsWith('court-')) title = `${info.title} — Cluster ${f.label}`;
    $('#info-cat').textContent = cat.label;
    $('#info-cat').style.setProperty('--cat', cat.color);
    $('#info-title').textContent = title;
    $('#info-text').textContent = info.text;
    $('#info-facts').innerHTML = facts.map((x) => `<li>${x}</li>`).join('');
    $('#info-note').textContent = info.note || '';
    $('#info-note').classList.toggle('hidden', !info.note);
    $('#info').classList.remove('hidden');
    $('#info-fly').onclick = () => { const v = this.viewFor(f); this.flyTo(v.pos, v.target); };
  }
  hideInfo() { $('#info').classList.add('hidden'); }

  // ------------------------------------------------------------------ pins + labels
  buildPins() {
    const pinDefs = [
      ['plaza', 1], ['event-lawn', 2], ['playground', 3], ['pavilion', 4], ['community-center', 5], ['spine', 6], ['rec-green', 7],
      ['courtyard-social-first', 8], ['courtyard-garden-first', 9], ['courtyard-recreation-first', 10], ['courtyard-relax-first', 11],
      ['garden', 12], ['solar-east', 13], ['soccer', 14], ['courts', 15], ['pocket-1', 16], ['pocket-2', 17],
    ];
    const root = $('#pins');
    this.pins = [];
    for (const [id, n] of pinDefs) {
      const f = this.features.get(id);
      if (!f) continue;
      const info = INFO[f.info];
      const el = document.createElement('button');
      el.className = 'pin';
      el.style.setProperty('--cat', CATEGORIES[info.cat].color);
      el.innerHTML = `<span class="pin-dot">${n}</span><span class="pin-label">${info.title.replace(/^Courtyard [A-D] · /, '')}</span>`;
      el.addEventListener('click', (e) => { e.stopPropagation(); this.endTour(false); this.select(id === 'solar-east' ? this.nearestSolar(f).id : id); });
      root.appendChild(el);
      const b = f.box;
      const y = f.id === 'community-center' ? 14 : f.info === 'solar' ? 8 : b.y + b.sy / 2 + 6;
      this.pins.push({ el, pos: new THREE.Vector3(b.x, y, b.z), important: true });
    }
    for (const l of this.world.labels) {
      const el = document.createElement('div');
      el.className = 'ctx-label';
      el.textContent = l.text;
      root.appendChild(el);
      this.pins.push({ el, pos: new THREE.Vector3(...l.pos), ctx: true });
    }
    this.showLabels = true;
  }
  nearestSolar(f) {
    let best = null, bd = Infinity;
    for (const g of this.world.features) if (g.group === 'solar') { const d = Math.hypot(g.box.x - f.box.x, g.box.z - f.box.z); if (d < bd) { bd = d; best = g; } }
    return best || f;
  }
  updatePins() {
    const cam = this.stage.camera, w = window.innerWidth, h = window.innerHeight;
    const v = new THREE.Vector3();
    const dist = cam.position.distanceTo(this.stage.controls.target);
    for (const p of this.pins) {
      v.copy(p.pos).project(cam);
      const camDist = cam.position.distanceTo(p.pos);
      const visible = this.showLabels && v.z < 1 && Math.abs(v.x) < 1.05 && Math.abs(v.y) < 1.05 && (p.ctx ? dist > 250 : camDist < 1300 && !this.street);
      if (!visible) { p.el.style.display = 'none'; continue; }
      p.el.style.display = '';
      p.el.style.transform = `translate(${((v.x + 1) / 2) * w}px, ${((1 - v.y) / 2) * h}px)`;
      p.el.classList.toggle('compact', camDist > 430 || p.pos.distanceTo(this.stage.controls.target) > 230);
    }
  }
  updateCompass() {
    const c = this.stage.camera.position, t = this.stage.controls.target;
    const ang = Math.atan2(c.x - t.x, c.z - t.z);
    $('#compass-needle').style.transform = `rotate(${ang}rad)`;
  }

  // ------------------------------------------------------------------ overlays (diagram + boundary)
  buildOverlays() {
    const scene = this.stage.scene;
    // land-use diagram: translucent color fields
    this.diagram = new THREE.Group();
    this.diagram.visible = false;
    const add = (shapePts, color, y = 1.2, opacity = 0.5) => {
      const shape = new THREE.Shape(shapePts.map(([x, z]) => new THREE.Vector2(x, -z)));
      const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
      const m = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, side: THREE.DoubleSide }));
      m.position.y = y; m.renderOrder = 4;
      this.diagram.add(m);
    };
    const rect = (b, color, y, op) => {
      const c = Math.cos(b.ry || 0), s = Math.sin(b.ry || 0);
      const pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([u, v]) => { const x = (u * b.sx) / 2, z = (v * b.sz) / 2; return [b.x + x * c + z * s, b.z - x * s + z * c]; });
      add(pts, color, y, op);
    };
    for (const f of this.world.features) {
      if (f.id === 'park') rect(f.box, '#2fae4f', 1.0, 0.45);
      else if (f.group === 'courtyards') rect(f.box, '#9be35b', 1.3, 0.6);
      else if (f.group === 'solar') rect(f.box, '#2d7dff', 5.0, 0.6);
      else if (f.group === 'center') rect(f.box, '#ff9d2e', 11, 0.65);
      else if (f.group === 'homes') rect(f.box, '#f2e6d0', f.box.sy + 0.6, 0.55);
      else if (f.group === 'walk') rect(f.box, '#ffd23d', 1.2, 0.55);
    }
    // vehicle loop road
    const road = this.world.roadPts;
    if (road) {
      const pts = [];
      for (let i = 0; i < road.length - 1; i++) pts.push(new THREE.Vector3(road[i][0], 1.4, road[i][1]), new THREE.Vector3(road[i + 1][0], 1.4, road[i + 1][1]));
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      this.diagram.add(new THREE.LineSegments(geo, new THREE.LineBasicMaterial({ color: '#e0463c' })));
      for (let i = 0; i < road.length - 1; i++) {
        const [ax, az] = road[i], [bx, bz] = road[i + 1];
        const L = Math.hypot(bx - ax, bz - az);
        const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 7.5).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e0463c', transparent: true, opacity: 0.55, depthWrite: false }));
        m.position.set((ax + bx) / 2, 1.35, (az + bz) / 2); m.rotation.y = Math.atan2(-(bz - az), bx - ax); m.renderOrder = 4;
        this.diagram.add(m);
      }
    }
    scene.add(this.diagram);

    // site boundary (31.5 ac) — dashed glowing line
    const bpts = [...BOUNDARY, BOUNDARY[0]].map(([x, z]) => new THREE.Vector3(x, 1.0, z));
    const bgeo = new THREE.BufferGeometry().setFromPoints(bpts);
    this.boundary = new THREE.Line(bgeo, new THREE.LineDashedMaterial({ color: '#ffffff', dashSize: 6, gapSize: 4 }));
    this.boundary.computeLineDistances();
    this.boundary.visible = true;
    scene.add(this.boundary);
  }

  // ------------------------------------------------------------------ tours
  startTour(name) {
    const T = TOURS[name];
    this.setStreetMode(false);
    this.hideInfo();
    this.setActive(`tour-${name}`);
    this.tour = { name, T, i: -1, timer: 0, dwell: 9, paused: false };
    $('#tour').classList.remove('hidden');
    $('#tour-title').textContent = T.title;
    $('#tour-dots').innerHTML = T.stops.map(() => '<i></i>').join('');
    this.tourStep(1);
  }
  tourStep(dir) {
    const tr = this.tour;
    if (!tr) return;
    const n = tr.T.stops.length;
    tr.i = tr.i + dir;
    if (tr.i >= n) { this.endTour(); this.goTo('overview'); return; }
    tr.i = Math.max(0, tr.i);
    tr.timer = 0;
    const stop = tr.T.stops[tr.i];
    $('#tour-step').textContent = `${tr.i + 1} / ${n}`;
    $('#tour-stop').textContent = stop.title;
    $('#tour-text').textContent = stop.text;
    [...$('#tour-dots').children].forEach((d, k) => d.classList.toggle('on', k <= tr.i));
    this.clearHighlights();
    if (stop.id === 'overview') {
      const v = VIEWS.overview;
      this.flyTo(v.pos, v.target, 2.6);
      if (tr.name === 'sustainability') this.highlightGroup('solar'); else { this.highlightGroup('courtyards'); }
      return;
    }
    const f = this.features.get(stop.id);
    if (!f) return this.tourStep(dir || 1);
    const v = this.viewFor(f, stop.view);
    this.flyTo(v.pos, v.target, 2.4);
    if (f.info === 'solar') this.highlightGroup('solar');
    else this.highlightBoxes([f], GROUP_COLORS[f.group] || '#ffffff', true);
  }
  pauseTour(force) {
    if (!this.tour) return;
    this.tour.paused = force === true ? true : !this.tour.paused;
    $('#tour-pause').textContent = this.tour.paused ? '▶' : '❚❚';
  }
  endTour(reset = true) {
    if (!this.tour) return;
    this.tour = null;
    $('#tour').classList.add('hidden');
    if (reset) this.clearHighlights();
  }

  // ------------------------------------------------------------------ DOM controls
  setActive(name) {
    document.querySelectorAll('[data-view],[data-tour]').forEach((b) => {
      const key = b.dataset.view || `tour-${b.dataset.tour}`;
      b.classList.toggle('active', key === name);
    });
  }
  bindControls() {
    document.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', () => this.goTo(b.dataset.view)));
    document.querySelectorAll('[data-tour]').forEach((b) => b.addEventListener('click', () => this.startTour(b.dataset.tour)));
    $('#info-close').addEventListener('click', () => this.clearSelection());
    $('#tour-next').addEventListener('click', () => this.tourStep(1));
    $('#tour-prev').addEventListener('click', () => this.tourStep(-1));
    $('#tour-pause').addEventListener('click', () => this.pauseTour());
    $('#tour-close').addEventListener('click', () => { this.endTour(); this.setActive(''); });
    $('#t-labels').addEventListener('change', (e) => { this.showLabels = e.target.checked; });
    $('#t-diagram').addEventListener('change', (e) => { this.diagram.visible = e.target.checked; $('#legend').classList.toggle('hidden', !e.target.checked); });
    $('#t-boundary').addEventListener('change', (e) => { this.boundary.visible = e.target.checked; });
    $('#t-rotate').addEventListener('change', (e) => { this.stage.controls.autoRotate = e.target.checked; this.stage.controls.autoRotateSpeed = 0.5; });
    $('#t-quality').addEventListener('change', (e) => this.stage.setQuality(e.target.checked));
    const sun = $('#sun');
    const label = () => {
      const h = Number(sun.value), hh = Math.floor(h), mm = Math.round((h - hh) * 60);
      $('#sun-label').textContent = `${((hh + 11) % 12) + 1}:${String(mm).padStart(2, '0')} ${hh < 12 ? 'AM' : 'PM'}`;
    };
    sun.addEventListener('input', () => { this.stage.setHour(Number(sun.value)); label(); });
    label();
    $('#panel-toggle').addEventListener('click', () => document.body.classList.toggle('panel-collapsed'));
  }

  renderStats() {
    const s = this.world.stats;
    const items = [
      [fmt(s.acres, 1), 'acres (golf course parcel)'],
      [fmt(s.units), `homes · ${fmt(s.density, 1)} per acre`],
      [`${fmt(s.openPct)}%`, 'green & pedestrian space'],
      [fmt(s.stalls), 'covered solar stalls'],
      [`≈${fmt(s.kw / 1000, 2)} MW`, 'carport solar (DC)'],
      [fmt(s.ev), 'EV-charging stalls'],
      ['0', 'parking lots inside the neighborhood'],
    ];
    $('#stats').innerHTML = items.map(([v, l]) => `<div class="stat"><b>${v}</b><span>${l}</span></div>`).join('');
  }
}

export { CLUSTERS };
