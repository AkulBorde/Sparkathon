// Entry point: builds the stage, the neighborhood model and the UI, then runs the render loop.
import * as THREE from 'three';
import { createStage } from './app/scene.js';
import { createMaterials } from './core/materials.js';
import { buildWorld } from './world.js';
import { UI } from './app/ui.js';

const container = document.getElementById('viewport');
const stage = createStage(container);
const loaderText = document.getElementById('loader-text');

function start() {
  const materials = createMaterials(stage.renderer);
  const world = buildWorld(materials);
  stage.scene.add(world.group);
  const ui = new UI(stage, world);

  console.info('[North Campus Commons] stats', world.stats);
  const clock = new THREE.Clock();
  let frames = 0, fpsT = 0;
  stage.renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.1);
    world.traffic.update(dt);
    ui.update(dt);
    stage.updateShadows();
    stage.renderer.render(stage.scene, stage.camera);
    frames++; fpsT += dt;
    if (fpsT > 1) { window.__fps = frames / fpsT; frames = 0; fpsT = 0; }
  });
  // compile shaders before revealing the scene
  stage.renderer.compile(stage.scene, stage.camera);
  requestAnimationFrame(() => document.getElementById('loader').classList.add('done'));
  // small API for presenting / automated checks
  window.app = {
    stage, world, ui, stats: world.stats,
    goTo: (v) => ui.goTo(v), tour: (n) => ui.startTour(n), select: (id) => ui.select(id),
    info: () => ({ calls: stage.renderer.info.render.calls, triangles: stage.renderer.info.render.triangles, fps: window.__fps }),
  };
  window.__ready = true;
}

loaderText.textContent = 'Building the neighborhood…';
// let the loader paint before the (synchronous) geometry build
setTimeout(() => {
  try { start(); } catch (err) {
    console.error(err);
    loaderText.textContent = `Error while building the model: ${err.message}`;
    window.__error = err.message;
  }
}, 30);
