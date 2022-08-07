import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as THREE from 'three';
import * as dat from 'dat.gui';
import './style.css';
import { CharacterControls } from './CharControls';
import { KeyDisplay } from './utils';

const gui = new dat.GUI();
const canvas = document.querySelector('canvas.webgl')!;
const scene = new THREE.Scene();

const renderer = new THREE.WebGLRenderer({
  canvas: canvas,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  100,
);
camera.position.set(0, 0.5, 4);
scene.add(camera);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.minDistance = 5;
controls.maxDistance = 15;
controls.enablePan = false;
controls.maxPolarAngle = Math.PI / 2 - 0.05;
controls.update();

const floor = new THREE.Mesh(
  new THREE.PlaneBufferGeometry(10, 10),
  new THREE.MeshStandardMaterial({ color: '#aaaaaa' }),
);
floor.rotation.set(-Math.PI / 2, 0, 0);
floor.receiveShadow = true;
scene.add(floor);

var characterControls: CharacterControls;
new GLTFLoader().load('models/Xbot.glb', (gltf) => {
  const model = gltf.scene;
  model.rotation.set(0, Math.PI, 0);
  model.traverse((object) => {
    if (object instanceof THREE.Mesh) object.castShadow = true;
  });
  scene.add(model);

  const anims = gltf.animations;
  const mixer = new THREE.AnimationMixer(model);
  const animsMap = new Map();
  anims.forEach((a: THREE.AnimationClip) => {
    animsMap.set(a.name, mixer.clipAction(a));
  });

  characterControls = new CharacterControls(
    model,
    mixer,
    animsMap,
    controls,
    camera,
    'idle',
  );
});

const keysPressed = {};
const keyDisplayQueue = new KeyDisplay();
document.addEventListener(
  'keydown',
  (event) => {
    keyDisplayQueue.down(event.key);
    if (event.shiftKey && characterControls) {
      characterControls.runToggle();
    } else {
      (keysPressed as any)[event.key.toLowerCase()] = true;
    }
  },
  false,
);
document.addEventListener(
  'keyup',
  (event) => {
    keyDisplayQueue.up(event.key);
    (keysPressed as any)[event.key.toLowerCase()] = false;
  },
  false,
);

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();

  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
});

const dLight = new THREE.DirectionalLight(0xffffff, 1);
dLight.position.set(0, 2, 0);
dLight.castShadow = true;
scene.add(dLight);
// scene.add(new THREE.CameraHelper(dLight.shadow.camera));

const clock = new THREE.Clock();

const tick = () => {
  let mixerUpdateDelta = clock.getDelta();
  if (characterControls) {
    characterControls.update(mixerUpdateDelta, keysPressed);
  }
  controls.update();
  renderer.render(scene, camera);
  window.requestAnimationFrame(tick);
};
tick();
