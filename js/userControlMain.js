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
const brickMaterial = new THREE.MeshLambertMaterial({
  color: 0xff0000,
});
const wreckingBallMaterial = new THREE.MeshLambertMaterial({
  // grey
  color: 0x808080,
});

const stats = new Stats();
document.body.appendChild(stats.dom);

// create a brick object
const brickHeight = 2;
function createBrick() {
  const brick = new THREE.Mesh(
    // rectangular prism
    new THREE.BoxGeometry(2, brickHeight, 4),
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

  // bricks
  agentData.push({
    height: brickHeight,
    index: 0,
    x: 0,
    y: 50,
    z: 0,
    goal_x: 0,
    goal_y: 0,
    goal_z: 0,
    vx: 0.0,
    vy: 0.0,
    vz: 0.0,
    px: 0.0,
    py: 50,
    pz: 0.0,
    v_pref: 0.5,
    radius: RADIUS,
    invmass: 0.5,
    group_id: 1,
  });

  agentData.forEach((agent) => {
    const currBrick = createBrick();
    currBrick.position.set(agent.x, agent.y, agent.z);
    agent.mesh = currBrick;
    scene.add(agent.mesh);
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
