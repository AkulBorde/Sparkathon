// Renderer, camera, sky, sun/shadows and orbit controls.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { Sky } from 'three/addons/objects/Sky.js';

export function createStage(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, logarithmicDepthBuffer: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.3, 9000);
  camera.position.set(-440, 400, 360);

  // ---- sky + image-based lighting from the sky
  const sky = new Sky();
  sky.scale.setScalar(7000);
  const su = sky.material.uniforms;
  su.turbidity.value = 4.5; su.rayleigh.value = 1.2; su.mieCoefficient.value = 0.004; su.mieDirectionalG.value = 0.8;
  scene.add(sky);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  const envSky = new Sky();
  envSky.scale.setScalar(1000);
  Object.assign(envSky.material.uniforms.turbidity, { value: 4.5 });
  envScene.add(envSky);
  let envRT = null;

  scene.fog = new THREE.Fog(0xc9d4dc, 1400, 4200);

  const hemi = new THREE.HemisphereLight(0xdde8f5, 0x6f6450, 0.55);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xfff0dc, 2.6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.bias = -0.0003;
  sun.shadow.normalBias = 0.08;
  const sc = sun.shadow.camera;
  sc.near = 10; sc.far = 1600;
  scene.add(sun, sun.target);
  const sunDir = new THREE.Vector3();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.maxPolarAngle = Math.PI * 0.47;
  controls.minDistance = 8;
  controls.maxDistance = 1500;
  controls.screenSpacePanning = false;
  controls.zoomToCursor = true;
  controls.target.set(10, 0, 0);
  controls.update();

  function setHour(hour) {
    const t = (hour - 6.5) / 12;
    const el = THREE.MathUtils.degToRad(Math.max(6, 66 * Math.sin(Math.PI * Math.min(Math.max(t, 0), 1))));
    const az = THREE.MathUtils.degToRad(90 + 180 * t);
    sunDir.set(Math.sin(az) * Math.cos(el), Math.sin(el), -Math.cos(az) * Math.cos(el)).normalize();
    su.sunPosition.value.copy(sunDir);
    envSky.material.uniforms.sunPosition.value.copy(sunDir);
    const warm = 1 - Math.min(1, Math.sin(el) * 1.6);
    sun.color.setRGB(1, 0.95 - warm * 0.18, 0.88 - warm * 0.35);
    sun.intensity = 1.2 + Math.sin(el) * 1.9;
    hemi.intensity = 0.35 + Math.sin(el) * 0.3;
    if (envRT) envRT.dispose();
    envRT = pmrem.fromScene(envScene, 0, 1, 2000);
    scene.environment = envRT.texture;
    scene.environmentIntensity = 0.55;
  }
  setHour(10.5);

  let shadowExtent = 0;
  function updateShadows() {
    const dist = camera.position.distanceTo(controls.target);
    const ext = THREE.MathUtils.clamp(Math.round(dist * 0.55 / 10) * 10, 50, 330);
    if (ext !== shadowExtent) {
      shadowExtent = ext;
      sc.left = -ext; sc.right = ext; sc.top = ext; sc.bottom = -ext;
      sc.updateProjectionMatrix();
    }
    // snap target to shadow texels to avoid shimmering
    const step = (ext * 2) / sun.shadow.mapSize.x * 4;
    const tx = Math.round(controls.target.x / step) * step, tz = Math.round(controls.target.z / step) * step;
    sun.target.position.set(tx, 0, tz);
    sun.position.set(tx + sunDir.x * 700, sunDir.y * 700, tz + sunDir.z * 700);
  }

  function resize() {
    const w = container.clientWidth, h = container.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  function setQuality(high) {
    renderer.setPixelRatio(high ? Math.min(window.devicePixelRatio, 2) : 1);
    renderer.shadowMap.enabled = true;
    sun.castShadow = high;
    scene.traverse((o) => { if (o.material) o.material.needsUpdate = true; });
    resize();
  }

  return { renderer, scene, camera, controls, sun, setHour, updateShadows, setQuality, resize };
}
