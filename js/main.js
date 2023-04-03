/* This project simulates a wrecking ball hitting a wall of bricks.
  * The bricks are arranged mathematically
  * The wrecking ball is a sphere
  * Collision is handled in physics.js
  * The wrecking ball is controlled by the mouse
  * The camera is controlled by the mouse
  * The wall is made of bricks
*/


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

const wreckingBallMaterial = new THREE.MeshLambertMaterial({
  color: 0x808080,
});

const stats = new Stats();
document.body.appendChild(stats.dom);

// create a brick object
const brickLength = 2;
const brickWidth = 4;
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
  brick.rotation.y = Math.PI / 2;
  return brick;
}

function createWreckingBall() {
  const wreckingBall = new THREE.Mesh(
    new THREE.SphereGeometry(RADIUS, 32, 32),
    wreckingBallMaterial
  );
  wreckingBall.castShadow = true;
  wreckingBall.receiveShadow = true;
  return wreckingBall;
}

function createWall() {
  // create a wall of bricks arranged mathematically
  // each row is offset by half a brick

  const wall = new THREE.Group();
  const levels = 7;
  const bricksPerLevel = 5;
  const offset = brickWidth / 2;
  const brick = createBrick(0, 0);

  let brick_idx = 0;
  for (let j = 0; j < levels; j++) {
    for (let i = 0; i < bricksPerLevel; i++) {
      const brick = createBrick(j + i, bricksPerLevel);
      if (j % 2 === 0) {
        // brick.rotation.y = Math.PI / 2;
        brick.position.z = i * brickWidth + offset;
      }
      else {
        brick.position.z = i * brickWidth + offset + brickWidth; // change this to just brickwidth
      }
      brick.position.y = j * brickHeight + brickHeight / 2;
      wall.add(brick);
      agentData.push({
        index: brick_idx++,
        height: brickHeight,
        mesh: brick,
        px: 0,
        py: 0,
        pz: 0,
        vx: 0,
        vy: 0,
        vz: 0,
        collidable: true,
      });
    }
  }
  return wall;
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

  // create wrecking ball
  var wreckingBall = createWreckingBall();
  wreckingBall.position.set(0, 100, 0);
  scene.add(wreckingBall);

  // create wall
  var wall = createWall();
  scene.add(wall);


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
