import * as THREE from "three";
import * as PHY from "simplePhysics";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import Stats from "three/addons/libs/stats.module.js";

let renderer, scene, camera;
let world = {
  x: 80,
  z: 80,
};
let agentData = [];
let grid;

let topTexture;
const RADIUS = 1;
// const brickMaterial = new THREE.MeshLambertMaterial({
//   color: 0xff0000,
// });
const wreckingBallMaterial = new THREE.MeshLambertMaterial({
  // grey
  color: 0x808080,
});

const stats = new Stats();
document.body.appendChild(stats.dom);

// create a brick object
const brickLength = 4;
const brickWidth = 2;
const brickHeight = 2;
function createBrick(color, num) {
  let brickMaterial = new THREE.MeshLambertMaterial({
    color: 0xff0000,
  });
  const switcher = color % num;
  switch (switcher) {
    case 0:
      brickMaterial.color.setHex(0xff0000);
      break;
    case 1:
      brickMaterial.color.setHex(0x00ff00);
      break;
    case 2:
      brickMaterial.color.setHex(0x0000ff);
      break;
    case 3:
      brickMaterial.color.setHex(0xffff00);
      break;
    case 4:
      brickMaterial.color.setHex(0xff00ff);
      break;
    case 5:
      brickMaterial.color.setHex(0x00ffff);
      break;
    case 6:
      brickMaterial.color.setHex(0x000000);
      break;
    case 7:
      brickMaterial.color.setHex(0xffffff);
  }

  const brick = new THREE.Mesh(
    // rectangular prism
    new THREE.BoxGeometry(brickWidth, brickHeight, brickLength),
    brickMaterial
  );
  brick.castShadow = true;
  brick.receiveShadow = true;
  return brick;
}


init();
render();

function init() {
  // renderer
  renderer = new THREE.WebGLRenderer();
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap; //
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.body.appendChild(renderer.domElement);

  // scene
  scene = new THREE.Scene();
  // camera
  camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

  camera.position.set(-67.26, 54.07, -3.77);
  camera.rotation.order = "YXZ";
  camera.rotation.y = -1.6267;
  camera.rotation.x = -0.46;

  // controls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.addEventListener("change", render);
  controls.enableZoom = false;
  controls.enablePan = false;
  controls.maxPolarAngle = Math.PI / 2;

  // light
  const light = new THREE.PointLight(0xffffff, 0.9, 0, 100000);
  light.position.set(0, 50, 120);
  light.castShadow = true;
  light.shadow.mapSize.width = 512; // default
  light.shadow.mapSize.height = 512; // default
  light.shadow.camera.near = 0.5; // default
  light.shadow.camera.far = 5000; // default

  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
  directionalLight.castShadow = true;
  directionalLight.position.set(-5, 20, 4);
  directionalLight.target.position.set(9, 0, -9);
  directionalLight.shadow.camera.left *= 9;
  directionalLight.shadow.camera.right *= 9;
  directionalLight.shadow.camera.top *= 9;
  directionalLight.shadow.camera.bottom *= 9;

  scene.add(directionalLight);

  // axes
  scene.add(new THREE.AxesHelper(40));
  const loader = new THREE.TextureLoader();
  const texture = loader.load("resources/OIP.jpg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  const repeats = 40 / 32;
  texture.repeat.set(repeats, repeats);

  topTexture = loader.load("resources/triangle2.png");
  //topTexture.wrapS = THREE.RepeatWrapping;
  //topTexture.wrapT = THREE.RepeatWrapping;
  topTexture.magFilter = THREE.NearestFilter;
  topTexture.repeat.set(3, 3);
  //topTexture.rotation = -Math.PI / 2;
  // grid
  const geometry = new THREE.PlaneGeometry(world.x, world.z, 10, 10);
  const material = new THREE.MeshPhongMaterial({
    map: texture,
    //side: THREE.DoubleSide,
  });
  grid = new THREE.Mesh(geometry, material);
  grid.castShadow = true; //default is false
  grid.receiveShadow = true; //default
  grid.rotation.order = "YXZ";
  grid.rotation.y = -Math.PI / 2;
  grid.rotation.x = -Math.PI / 2;
  scene.add(grid);


  const brickLayout = [];

  const levels = 4;
  const rows = 1;
  const cols = 5;

  for (let level = 0; level < levels; level++) {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        brickLayout.push({
          x: i * brickWidth + 0.1 * i,
          y: 10 + brickHeight / 2 + level * brickHeight + 2 * level,
          z: j * brickLength + 0.1 * j,
        });
      }
    }
  }
  let brick_idx = 0;
  brickLayout.forEach((brick) => {
    const currBrick = createBrick(brick_idx, 6);
    currBrick.position.set(brick.x, brick.y, brick.z);

    agentData.push({
      index: brick_idx++,
      height: brickHeight,
      mesh: currBrick,
      px: 0,
      py: 0,
      pz: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      collidable: true,
    });
    scene.add(currBrick);

  });

  // sphere with grey lambert material
  // it's also part of the collision detection
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS * 8, 32, 32),
    new THREE.MeshLambertMaterial({
      color: 0x888888,
    })
  );
  const last_brick_height = 10 + brickHeight / 2 + levels * brickHeight + 2 * levels;
  sphere.position.set(0, last_brick_height + RADIUS * 8, 0);
  sphere.castShadow = true;
  sphere.receiveShadow = true;
  scene.add(sphere);
  agentData.push({
    index: brick_idx++,
    height: last_brick_height + brickHeight / 2,
    mesh: sphere,
    px: 0,
    py: 0,
    pz: 0,
    vx: 0,
    vy: 0,
    vz: 0,
    collidable: true,
  });

  world.distanceConstraints = [];
  window.addEventListener("resize", onWindowResize);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);
  PHY.step(RADIUS, agentData, world);
  renderer.render(scene, camera);
  stats.update();
}

animate();
