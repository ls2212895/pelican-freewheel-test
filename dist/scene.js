import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const viewport = document.getElementById('viewport');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const state = { playing: !reducedMotion.matches, speed: 1, orbit: false, view: 'threeQuarter', time: 0 };
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.22;
renderer.domElement.tabIndex = 0;
renderer.domElement.setAttribute('role', 'img');
renderer.domElement.setAttribute('aria-label', '白鹈鹕戴着绿色头盔，骑橙色自行车在海边小岛上兜风。拖动旋转，滚轮或双指缩放，方向键旋转，空格暂停。');
viewport.appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.075;
controls.enablePan = false;
controls.rotateSpeed = 0.7;
controls.zoomSpeed = 0.8;
controls.minDistance = 5.5;
controls.maxDistance = 24;
controls.minPolarAngle = 0.04;
controls.maxPolarAngle = Math.PI / 2 - 0.015;
controls.autoRotateSpeed = 0.65;
controls.target.set(0, 1.35, 0);

scene.add(new THREE.HemisphereLight(0xeafaff, 0xa3aa82, 2.7));
const sunlight = new THREE.DirectionalLight(0xfff2d4, 4.3);
sunlight.position.set(-3.5, 8, 5);
sunlight.castShadow = true;
sunlight.shadow.mapSize.set(2048, 2048);
Object.assign(sunlight.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 0.5, far: 24 });
sunlight.shadow.bias = -0.00035;
sunlight.shadow.normalBias = 0.025;
sunlight.shadow.radius = 3;
scene.add(sunlight);
const rimLight = new THREE.DirectionalLight(0xc0efff, 1.8);
rimLight.position.set(4, 5, -4);
scene.add(rimLight);

const materials = {};
function mat(name, color, roughness = 0.64, metalness = 0) {
  return materials[name] = new THREE.MeshStandardMaterial({ color, roughness, metalness });
}
mat('white', 0xfffdf2); mat('feather', 0xe4ede8); mat('wing', 0xf3f6ed);
mat('ink', 0x173b3e, 0.65); mat('orange', 0xf65d34, 0.3, 0.2);
mat('beak', 0xffbc3f, 0.4); mat('pouch', 0xf5a93d, 0.6);
mat('foot', 0xf28b32, 0.52); mat('teal', 0x1d686a, 0.35, 0.15);
mat('helmetStripe', 0xf6dd87, 0.5); mat('silver', 0xc2d4d0, 0.26, 0.7);
mat('tire', 0x233b3e, 0.9); mat('rim', 0xf6e5bc, 0.75);
mat('sand', 0xf4ddb0, 0.95); mat('sandEdge', 0xdac38f, 0.95);
mat('road', 0x709d9b, 0.94); mat('stripe', 0xe9eee0, 0.88);
mat('grass', 0x6b9a73, 0.91); mat('grassLight', 0x91b98a, 0.9);
mat('stone', 0xe2cfaa, 0.9); mat('cloud', 0xfafff6, 0.97);
mat('water', 0x70c4ca, 0.7); mat('foam', 0xc7ece7, 0.85);

const sphereGeometry = new THREE.SphereGeometry(1, 32, 24);
const cylinderGeometry = new THREE.CylinderGeometry(1, 1, 1, 12);
const v = (x, y, z = 0) => new THREE.Vector3(x, y, z);
function mesh(geometry, material, parent = scene) {
  const item = new THREE.Mesh(geometry, typeof material === 'string' ? materials[material] : material);
  item.castShadow = true;
  item.receiveShadow = true;
  parent.add(item);
  return item;
}
function ellipsoid(parent, material, position, scale, rz = 0) {
  const item = mesh(sphereGeometry, material, parent);
  item.position.set(...position); item.scale.set(...scale); item.rotation.z = rz;
  return item;
}
function fitRod(item, a, b, radius) {
  item.position.copy(a).add(b).multiplyScalar(0.5);
  item.quaternion.setFromUnitVectors(v(0, 1, 0), b.clone().sub(a).normalize());
  item.scale.set(radius, a.distanceTo(b), radius);
}
function rod(parent, material, a, b, radius = 0.035) {
  const item = mesh(cylinderGeometry, material, parent);
  fitRod(item, v(...a), v(...b), radius);
  return item;
}
function curve(parent, material, points, radius = 0.04, segments = 32) {
  const path = new THREE.CatmullRomCurve3(points.map(p => v(...p)));
  return mesh(new THREE.TubeGeometry(path, segments, radius, 10, false), material, parent);
}
function torus(parent, material, radius, thickness, position = [0, 0, 0], arc = Math.PI * 2) {
  const item = mesh(new THREE.TorusGeometry(radius, thickness, 10, 64, arc), material, parent);
  item.position.set(...position);
  return item;
}
function extrude(parent, material, shape, depth, bevel = 0.035) {
  const geometry = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSegments: 3, steps: 1, bevelSize: bevel, bevelThickness: bevel, curveSegments: 24 });
  geometry.translate(0, 0, -depth / 2);
  return mesh(geometry, material, parent);
}

// A miniature island keeps the scene readable from every camera angle.
const island = new THREE.Group();
scene.add(island);
const water = mesh(new THREE.CylinderGeometry(4.7, 4.64, 0.14, 96), 'water', island);
water.position.y = -0.37;
const islandBase = mesh(new THREE.CylinderGeometry(4.22, 4.12, 0.25, 96), 'sandEdge', island);
islandBase.position.y = -0.205;
const islandTop = mesh(new THREE.CylinderGeometry(4.22, 4.22, 0.085, 96), 'sand', island);
islandTop.position.y = -0.055;
for (const [radius, y, thickness] of [[4.26, -0.22, 0.025], [4.47, -0.291, 0.019], [4.71, -0.38, 0.022]]) {
  const ring = torus(island, 'foam', radius, thickness, [0, y, 0]);
  ring.rotation.x = Math.PI / 2;
}
const shadowCanvas = document.createElement('canvas');
shadowCanvas.width = shadowCanvas.height = 128;
const shadowContext = shadowCanvas.getContext('2d');
const gradient = shadowContext.createRadialGradient(64, 64, 15, 64, 64, 64);
gradient.addColorStop(0, 'rgba(24,78,85,.22)'); gradient.addColorStop(0.62, 'rgba(24,78,85,.13)'); gradient.addColorStop(1, 'rgba(24,78,85,0)');
shadowContext.fillStyle = gradient; shadowContext.fillRect(0, 0, 128, 128);
const shadow = mesh(new THREE.PlaneGeometry(12, 12), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(shadowCanvas), transparent: true, depthWrite: false }), scene);
shadow.rotation.x = -Math.PI / 2; shadow.position.y = -0.6; shadow.castShadow = false; shadow.receiveShadow = false;

const roadShape = new THREE.Shape();
roadShape.moveTo(-3.45, -0.8); roadShape.lineTo(3.45, -0.8);
roadShape.absarc(3.45, 0, 0.8, -Math.PI / 2, Math.PI / 2, false);
roadShape.lineTo(-3.45, 0.8); roadShape.absarc(-3.45, 0, 0.8, Math.PI / 2, Math.PI * 1.5, false);
const road = mesh(new THREE.ShapeGeometry(roadShape, 32), 'road', island);
road.rotation.x = -Math.PI / 2; road.position.y = -0.008; road.castShadow = false;
for (const z of [-0.73, 0.73]) rod(island, 'stripe', [-3.3, 0, z], [3.3, 0, z], 0.017);
const roadMarks = [];
for (let i = 0; i < 12; i++) {
  const stripe = mesh(new THREE.BoxGeometry(0.28, 0.008, 0.045), 'stripe', island);
  stripe.position.set(i * 0.63 - 3.55, 0.004, 0.45); stripe.castShadow = false;
  roadMarks.push({ mesh: stripe, offset: i * 0.63 });
}

let randomSeed = 817;
function random() { randomSeed = (randomSeed * 1664525 + 1013904223) >>> 0; return randomSeed / 4294967296; }
for (let i = 0; i < 40; i++) {
  const x = (random() - 0.5) * 7.7, z = (random() - 0.5) * 7.7;
  if (Math.abs(z) < 1.02 || Math.hypot(x, z) > 3.9) continue;
  const tuft = new THREE.Group(); tuft.position.set(x, 0, z); island.add(tuft);
  for (let j = 0; j < 4; j++) {
    const height = 0.16 + random() * 0.3;
    const blade = ellipsoid(tuft, j % 2 ? 'grass' : 'grassLight', [(j - 1.5) * 0.05, height / 2, (random() - 0.5) * 0.09], [0.025, height / 2, 0.05], (j - 1.5) * 0.23);
    blade.rotation.x = (random() - 0.5) * 0.7;
  }
  if (i % 3 === 0) ellipsoid(island, 'stone', [x + 0.15, 0.04, z + 0.12], [0.15, 0.08, 0.11]);
}
for (const [x, z, s] of [[-3.45, 1.25, .3], [2.9, -1.6, .4], [3.2, 1.65, .2], [-2.3, -2.5, .23]]) {
  ellipsoid(island, 'stone', [x, .08, z], [s, s * .45, s * .7]);
  ellipsoid(island, 'white', [x + .18, .055, z + .21], [s * .5, s * .3, s * .45]);
}

// Small clouds are actual geometry, so their perspective follows the camera.
const clouds = [];
for (const [x, y, z, scale] of [[-3.5, 3.05, -2.5, .62], [2.2, 4.05, -3.4, .63], [4.4, 2.3, 1.1, .42]]) {
  const cloud = new THREE.Group(); cloud.position.set(x, y, z); cloud.scale.setScalar(scale); scene.add(cloud);
  ellipsoid(cloud, 'cloud', [0, 0, 0], [.7, .31, .36]);
  ellipsoid(cloud, 'cloud', [-.4, -.015, 0], [.38, .27, .3]);
  ellipsoid(cloud, 'cloud', [.02, .23, 0], [.34, .37, .32]);
  ellipsoid(cloud, 'cloud', [.44, .035, .02], [.33, .27, .31]);
  cloud.traverse(m => { if (m.isMesh) { m.castShadow = false; m.receiveShadow = false; } });
  clouds.push({ mesh: cloud, y, phase: clouds.length * 2 });
}

const rider = new THREE.Group(); scene.add(rider);
const bike = new THREE.Group(); rider.add(bike);
const wheels = [];
for (const x of [-1.18, 1.18]) {
  const wheel = new THREE.Group(); wheel.position.set(x, .655, 0); bike.add(wheel); wheels.push(wheel);
  torus(wheel, 'tire', .585, .07);
  torus(wheel, 'rim', .54, .026);
  torus(wheel, 'silver', .505, .013);
  for (let i = 0; i < 16; i++) {
    const angle = i * Math.PI * 2 / 16;
    rod(wheel, 'silver', [0, 0, 0], [Math.cos(angle) * .495, Math.sin(angle) * .495, 0], .006);
  }
  rod(wheel, 'silver', [0, 0, -.13], [0, 0, .13], .055);
  ellipsoid(wheel, 'orange', [.36, .25, .018], [.045, .025, .025]);
  const fender = torus(bike, 'orange', .69, .032, [x, .655, 0], Math.PI * .92);
  fender.rotation.z = Math.PI * .04;
}
const rear = [-1.18, .655, 0], crankPosition = [-.12, .79, 0], seat = [-.54, 1.6, 0], head = [.79, 1.58, 0];
for (const [a, b] of [[seat, crankPosition], [crankPosition, head], [head, seat]]) rod(bike, 'orange', a, b, .052);
for (const z of [-.13, .13]) {
  rod(bike, 'orange', [-1.18, .655, z], [-.54, 1.6, z * .4], .033);
  rod(bike, 'orange', [-1.18, .655, z], [-.12, .79, z], .037);
  rod(bike, 'orange', [.79, 1.58, z * .5], [1.18, .655, z], .042);
}
rod(bike, 'silver', [-.54, 1.57, 0], [-.6, 1.88, 0], .037);
ellipsoid(bike, 'ink', [-.6, 1.85, 0], [.33, .077, .2]);
rod(bike, 'silver', [.79, 1.55, 0], [.7, 1.95, 0], .036);
curve(bike, 'silver', [[.7, 1.94, 0], [.76, 2.03, 0], [.89, 2.035, -.33], [.68, 2.025, -.43]], .029);
curve(bike, 'silver', [[.7, 1.94, 0], [.76, 2.03, 0], [.89, 2.035, .33], [.68, 2.025, .43]], .029);
for (const z of [-.43, .43]) rod(bike, 'ink', [.66, 2.026, z], [.81, 2.03, z * .93], .048);
ellipsoid(bike, 'helmetStripe', [.8, 2.105, .27], [.07, .035, .07]);
curve(bike, 'ink', [[.86, 1.98, .22], [1.04, 1.86, .18], [.94, 1.43, .13]], .009);
const lamp = ellipsoid(bike, 'teal', [1.035, 1.5, 0], [.11, .09, .1]);
ellipsoid(bike, 'helmetStripe', [1.125, 1.5, 0], [.025, .073, .071]);
const chainPath = new THREE.CatmullRomCurve3([v(-.12, 1.005, .17), v(-1.18, .76, .17), v(-1.28, .655, .17), v(-1.18, .55, .17), v(-.12, .575, .17), v(.09, .79, .17)], true, 'centripetal');
mesh(new THREE.TubeGeometry(chainPath, 64, .016, 6, true), 'ink', bike);
const crank = new THREE.Group(); crank.position.set(...crankPosition); bike.add(crank);
torus(crank, 'silver', .195, .019, [0, 0, .19]);
for (let i = 0; i < 5; i++) {
  const a = i * Math.PI * 2 / 5;
  rod(crank, 'silver', [0, 0, .19], [Math.cos(a) * .18, Math.sin(a) * .18, .19], .014);
}
for (const side of [-1, 1]) rod(crank, 'silver', [0, 0, side * .2], [side * .245, 0, side * .2], .024);

// The pelican's bill and throat pouch are sculpted profiles, not a flat texture.
const bird = new THREE.Group(); rider.add(bird);
ellipsoid(bird, 'white', [-.41, 2.37, 0], [.73, .65, .46], -.27);
ellipsoid(bird, 'white', [-.87, 2.51, 0], [.39, .39, .38], -.4);
for (let i = 0; i < 4; i++) {
  ellipsoid(bird, i % 2 ? 'feather' : 'white', [-1.05 - i * .07, 2.25 + i * .065, (i - 1.5) * .1], [.43, .105, .13], -.27 - i * .065);
}
curve(bird, 'white', [[-.15, 2.5, 0], [.21, 2.71, 0], [.32, 2.99, 0], [.29, 3.25, 0], [.48, 3.45, 0]], .18, 40);
ellipsoid(bird, 'white', [.015, 2.75, 0], [.3, .42, .28], -.43);
ellipsoid(bird, 'white', [.52, 3.48, 0], [.39, .35, .32], -.05);
const bill = new THREE.Shape();
bill.moveTo(.72, 3.53); bill.bezierCurveTo(1.05, 3.58, 1.83, 3.46, 2.14, 3.34);
bill.bezierCurveTo(2.21, 3.3, 2.18, 3.21, 2.13, 3.24); bill.lineTo(2.07, 3.3);
bill.bezierCurveTo(1.63, 3.34, 1.13, 3.35, .75, 3.37); bill.closePath();
extrude(bird, 'beak', bill, .2, .025);
const pouch = new THREE.Shape();
pouch.moveTo(.77, 3.35); pouch.bezierCurveTo(1.2, 3.34, 1.83, 3.31, 2.06, 3.30);
pouch.bezierCurveTo(1.78, 3.17, 1.28, 2.93, 1.03, 3.04);
pouch.bezierCurveTo(.84, 3.11, .81, 3.22, .77, 3.35); pouch.closePath();
extrude(bird, 'pouch', pouch, .21, .036);
for (const side of [-1, 1]) {
  curve(bird, 'foot', [[.84, 3.366, side * .13], [1.32, 3.36, side * .13], [1.82, 3.321, side * .11], [2.08, 3.30, side * .08]], .009);
  ellipsoid(bird, 'beak', [.66, 3.55, side * .293], [.115, .12, .028]);
  ellipsoid(bird, 'ink', [.68, 3.57, side * .318], [.065, .074, .027]);
  ellipsoid(bird, 'white', [.694, 3.596, side * .34], [.018, .021, .009]);
}
const helmet = mesh(new THREE.SphereGeometry(1, 40, 24, 0, Math.PI * 2, 0, Math.PI / 2), 'teal', bird);
helmet.position.set(.5, 3.62, 0); helmet.scale.set(.435, .3, .36); helmet.rotation.z = -.08;
const helmetRim = torus(bird, 'teal', .375, .033, [.5, 3.617, 0]); helmetRim.rotation.x = Math.PI / 2; helmetRim.scale.x = 1.13;
curve(bird, 'helmetStripe', [[.11, 3.66, 0], [.22, 3.83, 0], [.49, 3.919, 0], [.74, 3.84, 0], [.9, 3.65, 0]], .038);
for (const side of [-1, 1]) {
  curve(bird, 'ink', [[.29, 3.63, side * .29], [.35, 3.3, side * .27], [.6, 3.25, side * .2], [.76, 3.61, side * .26]], .017);
  for (const x of [.34, .56]) ellipsoid(bird, 'ink', [x, 3.8, side * .245], [.06, .026, .037], -.1);
}
const scarf = torus(bird, 'orange', .19, .065, [.28, 3.02, 0]); scarf.rotation.x = Math.PI / 2; scarf.rotation.z = -.12;
const scarfTail = new THREE.Group(); scarfTail.position.set(.17, 3.01, -.03); bird.add(scarfTail);
curve(scarfTail, 'orange', [[0, 0, 0], [-.35, .06, -.04], [-.68, .015, .04], [-.91, .12, .03]], .085);
curve(scarfTail, 'orange', [[-.08, -.06, .01], [-.31, -.16, .06], [-.59, -.12, .13]], .059);

for (const side of [-1, 1]) {
  ellipsoid(bird, 'wing', [-.32, 2.4, side * .395], [.41, .39, .15], .5);
  curve(bird, 'wing', [[-.45, 2.48, side * .43], [-.11, 2.32, side * .48], [.32, 2.15, side * .45], [.71, 2.065, side * .43]], .105);
  for (let i = 0; i < 3; i++) {
    ellipsoid(bird, i === 2 ? 'feather' : 'white', [-.3 + i * .025, 2.23 - i * .075, side * (.49 - i * .014)], [.32, .065, .072], -.47);
  }
  ellipsoid(bird, 'white', [.7, 2.085, side * .425], [.15, .083, .1], -.1);
}

const legs = [];
const footShape = new THREE.Shape();
footShape.moveTo(-.1, -.055); footShape.lineTo(.12, -.18);
footShape.quadraticCurveTo(.21, -.19, .28, -.12); footShape.lineTo(.24, -.04);
footShape.lineTo(.3, .03); footShape.quadraticCurveTo(.27, .12, .2, .14);
footShape.lineTo(.12, .1); footShape.lineTo(.08, .17); footShape.quadraticCurveTo(-.03, .14, -.1, .055); footShape.closePath();
for (const side of [-1, 1]) {
  const upper = rod(rider, 'foot', [0, 0, 0], [0, 1, 0], .038);
  const lower = rod(rider, 'foot', [0, 0, 0], [0, 1, 0], .033);
  const knee = ellipsoid(rider, 'foot', [0, 0, 0], [.052, .054, .052]);
  const pedal = mesh(new THREE.BoxGeometry(.21, .058, .17), 'ink', rider);
  const foot = extrude(rider, 'foot', footShape, .025, .018);
  foot.rotation.x = Math.PI / 2;
  legs.push({ side, upper, lower, knee, pedal, foot });
}
function animateRider(time) {
  const angle = -time * 3.7;
  const bob = Math.sin(time * 7.4) * .014;
  bird.position.y = bob;
  scarfTail.rotation.x = Math.sin(time * 7) * .12;
  scarfTail.rotation.y = Math.sin(time * 4.5) * .13;
  rider.rotation.x = Math.sin(time * 3.7) * .012;
  crank.rotation.z = angle;
  wheels.forEach(wheel => { wheel.rotation.z = angle * 1.5; });
  for (const leg of legs) {
    const a = angle + (leg.side === 1 ? 0 : Math.PI);
    const footPosition = v(crankPosition[0] + Math.cos(a) * .245, crankPosition[1] + Math.sin(a) * .245 + .072, leg.side * .24);
    const hip = v(-.39, 2.03 + bob, leg.side * .28);
    const difference = footPosition.clone().sub(hip); difference.z = 0;
    const distance = difference.length(), upperLength = .75, lowerLength = .72;
    const along = (upperLength ** 2 - lowerLength ** 2 + distance ** 2) / (2 * distance);
    const bend = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
    const direction = difference.normalize();
    const kneePosition = hip.clone().addScaledVector(direction, along).addScaledVector(v(-direction.y, direction.x, 0), bend);
    kneePosition.z = leg.side * .31;
    fitRod(leg.upper, hip, kneePosition, .039);
    fitRod(leg.lower, kneePosition, footPosition, .033);
    leg.knee.position.copy(kneePosition);
    leg.foot.position.copy(footPosition);
    leg.pedal.position.copy(footPosition).add(v(.015, -.066, 0));
  }
  const roadDistance = time * 3.7 * 1.5 * .655;
  for (const mark of roadMarks) mark.mesh.position.x = ((mark.offset - roadDistance) % 7.56 + 7.56) % 7.56 - 3.78;
  for (const cloud of clouds) cloud.mesh.position.y = cloud.y + Math.sin(time * .45 + cloud.phase) * .075;
}

const presets = { threeQuarter: [5.9, 4.4, 9.9], side: [0, 3.1, 11.6], front: [11.7, 3.2, 0.1], top: [.01, 12.9, .01] };
let cameraTransition = null;
function cameraDestination(view) {
  const result = v(...presets[view]);
  const narrow = viewport.clientWidth / viewport.clientHeight < .9;
  const multiplier = narrow ? 1.47 : 1.08;
  return result.sub(controls.target).multiplyScalar(multiplier).add(controls.target);
}
function setView(view, immediate = false) {
  if (!(view in presets)) throw new Error('Unknown camera view.');
  state.view = view;
  setOrbit(false);
  const destination = cameraDestination(view);
  if (immediate || reducedMotion.matches) { camera.position.copy(destination); cameraTransition = null; controls.update(); }
  else cameraTransition = { start: camera.position.clone(), end: destination, elapsed: 0 };
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.view === view)));
}
function setPlaying(playing) {
  state.playing = playing;
  document.getElementById('play').setAttribute('aria-label', playing ? '暂停骑行' : '继续骑行');
  document.getElementById('status-text').textContent = playing ? '兜风中' : '歇一会儿';
  document.getElementById('play-icon').innerHTML = playing ? '<path d="M8 6v12M16 6v12"/>' : '<path d="m9 6 9 6-9 6Z" fill="currentColor" stroke-width="1"/>';
}
function setSpeed(value) {
  if (!Number.isFinite(value) || value < .25 || value > 2) throw new Error('Speed must be between 0.25 and 2.');
  state.speed = value;
  document.getElementById('speed').value = String(value);
  document.getElementById('speed-value').value = value.toFixed(2).replace(/0$/, '') + '×';
  const percent = (value - .25) / 1.75 * 100;
  document.getElementById('speed').style.background = `linear-gradient(to right,var(--ink) ${percent}%,#d6e4e3 ${percent}%)`;
}
function setOrbit(enabled) {
  state.orbit = enabled; controls.autoRotate = enabled;
  document.getElementById('orbit').setAttribute('aria-pressed', String(enabled));
  if (enabled) { cameraTransition = null; state.view = 'free'; document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', 'false')); }
}
document.getElementById('play').addEventListener('click', () => setPlaying(!state.playing));
document.getElementById('speed').addEventListener('input', event => setSpeed(Number(event.target.value)));
document.getElementById('orbit').addEventListener('click', () => setOrbit(!state.orbit));
document.getElementById('reset').addEventListener('click', () => setView('threeQuarter'));
document.querySelectorAll('[data-view]').forEach(button => button.addEventListener('click', () => setView(button.dataset.view)));
controls.addEventListener('start', () => {
  cameraTransition = null; state.view = 'free'; setOrbit(false);
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  document.getElementById('orbit-hint').style.opacity = '.25';
});
window.addEventListener('keydown', event => {
  if (event.target.closest('button,input,textarea,select,[contenteditable=true]')) return;
  if (event.code === 'Space') { event.preventDefault(); setPlaying(!state.playing); }
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Equal', 'Minus'].includes(event.code)) return;
  event.preventDefault(); cameraTransition = null; setOrbit(false); state.view = 'free';
  document.querySelectorAll('[data-view]').forEach(button => button.setAttribute('aria-pressed', 'false'));
  if (event.code === 'ArrowLeft') controls.rotateLeft(.12);
  if (event.code === 'ArrowRight') controls.rotateLeft(-.12);
  if (event.code === 'ArrowUp') controls.rotateUp(.1);
  if (event.code === 'ArrowDown') controls.rotateUp(-.1);
  if (event.code === 'Equal') controls.dollyIn(1.1);
  if (event.code === 'Minus') controls.dollyOut(1.1);
  controls.update();
});
function resize() {
  const width = viewport.clientWidth, height = viewport.clientHeight;
  renderer.setPixelRatio(Math.min(devicePixelRatio, width < 640 ? 1.5 : 2));
  camera.aspect = width / height; camera.updateProjectionMatrix(); renderer.setSize(width, height);
  if (state.view in presets) setView(state.view, true);
  document.querySelector('#orbit-hint span').textContent = matchMedia('(pointer:coarse)').matches ? '单指旋转 · 双指缩放' : '拖动旋转 · 滚轮缩放';
}
new ResizeObserver(resize).observe(viewport);
setPlaying(state.playing); setView('threeQuarter', true); resize(); animateRider(0);
let lastTime = performance.now();
let frameCount = 0;
function render(now) {
  const delta = Math.min((now - lastTime) / 1000, .06); lastTime = now;
  if (!document.hidden) {
    if (state.playing) { state.time += delta * state.speed; animateRider(state.time); }
    if (cameraTransition) {
      cameraTransition.elapsed += delta;
      const progress = Math.min(cameraTransition.elapsed / .75, 1);
      camera.position.lerpVectors(cameraTransition.start, cameraTransition.end, progress * progress * (3 - 2 * progress));
      if (progress === 1) cameraTransition = null;
    }
    controls.update(delta); renderer.render(scene, camera); frameCount++;
    if (frameCount === 1) { document.getElementById('loading').hidden = true; document.documentElement.dataset.ready = 'true'; }
  }
  requestAnimationFrame(render);
}
requestAnimationFrame(render);
renderer.domElement.addEventListener('webglcontextlost', event => {
  event.preventDefault(); document.getElementById('error-card').hidden = false;
  document.getElementById('error-message').textContent = '浏览器暂停了 3D 画面。点击重新打开即可再试一次。';
});

// The same actions back the buttons and the optional browser tool interface.
if (document.modelContext?.registerTool) {
  const lifecycle = new AbortController();
  const tool = {
    name: 'configure_pelican_ride', title: '调整鹈鹕骑行动画',
    description: '设置动画播放、骑行速度、观察视角和自动环绕，并返回当前状态。',
    inputSchema: { type: 'object', properties: { playing: { type: 'boolean' }, speed: { type: 'number', minimum: .25, maximum: 2 }, view: { type: 'string', enum: Object.keys(presets) }, orbit: { type: 'boolean' } }, additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Expected an object.');
      if (Object.keys(input).some(key => !['playing', 'speed', 'view', 'orbit'].includes(key))) throw new Error('Unexpected property.');
      if ('playing' in input && typeof input.playing !== 'boolean') throw new Error('playing must be boolean.');
      if ('orbit' in input && typeof input.orbit !== 'boolean') throw new Error('orbit must be boolean.');
      if ('speed' in input && (!Number.isFinite(input.speed) || input.speed < .25 || input.speed > 2)) throw new Error('Invalid speed.');
      if ('view' in input && !Object.hasOwn(presets, input.view)) throw new Error('Invalid view.');
      if ('playing' in input) setPlaying(input.playing);
      if ('speed' in input) setSpeed(input.speed);
      if ('view' in input) setView(input.view, true);
      if ('orbit' in input) setOrbit(input.orbit);
      renderer.render(scene, camera);
      return { playing: state.playing, speed: state.speed, view: state.view, orbit: state.orbit };
    }
  };
  try { Promise.resolve(document.modelContext.registerTool(tool, { signal: lifecycle.signal })).catch(error => console.warn('Browser tool registration unavailable', error)); }
  catch (error) { console.warn('Browser tool registration unavailable', error); }
  window.addEventListener('pagehide', () => lifecycle.abort(), { once: true });
}

// Read-only evidence for checking camera motion, frame progress and joint alignment.
window.pelicanRide = Object.freeze({
  inspect: () => ({ ...state, frames: frameCount, camera: camera.position.toArray(), target: controls.target.toArray(), wheelAngles: wheels.map(w => w.rotation.z), feet: legs.map(l => l.foot.position.toArray()), pedals: legs.map(l => l.pedal.position.toArray()), drawCalls: renderer.info.render.calls, triangles: renderer.info.render.triangles, ready: document.documentElement.dataset.ready === 'true' })
});
