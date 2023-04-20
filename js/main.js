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
  length: 80,
  width: 80,
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

/* ========== INIT ========== */

const projectile_init = {
  x: -30,
  y: 8,
  z: 0,
  vx: 50,
  vy: -3,
  vz: 0,
  invmass: 1 / 20
}

const projectileSizeMultiplier = 1.5;


// create a brick object
const brickdepth = 2;
const brickWidth = 2;
const brickHeight = 2;

const brickDimensions = {
  depth: brickdepth,
  width: brickWidth,
  height: brickHeight,
};


export function createBrick(color, num, sizeMultiplier = 1) {
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
      break;
    default:
      brickMaterial.color.setHex(0x808080);
  }

  const brick = new THREE.Mesh(
    // rectangular prism
    new THREE.BoxGeometry(brickWidth * sizeMultiplier, brickHeight * sizeMultiplier, brickdepth * sizeMultiplier),
    brickMaterial
  );
  brick.castShadow = true;
  brick.receiveShadow = true;
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

var raycaster = new THREE.Raycaster();
var mouse = new THREE.Vector2();
var intersected = null;
var selected = null;

function createBallSystem() {
  // Create the suspended point
  var suspendedPointGeometry = new THREE.BoxGeometry(2, 0.5, 2);
  var suspendedPointMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
  var suspendedPoint = new THREE.Mesh(suspendedPointGeometry, suspendedPointMaterial);
  suspendedPoint.position.set(-5, 30, 10);

  scene.add(suspendedPoint);

  // var wb = createWreckingBall();
  var wb = createBrick(0, 1);

  // Initialize the position of the ball
  var initialPosition = new THREE.Vector3(0, -10, 0);
  // wb.position.copy(initialPosition);
  wb.position.set(0, -10, 0);
  // Set the velocity of the ball
  var velocity = new THREE.Vector3(0.03, 0, 0); // move in the negative z direction with speed 0.1

  // Create the animation loop
  function animate() {
    requestAnimationFrame(animate);

    // Update the position of the ball
    wb.position.add(velocity);

    // Render the scene
    renderer.render(scene, camera);
  }

  animate();


  // Create the string container
  var stringContainer = new THREE.Object3D();

  // Create the string
  var stringGeometry = new THREE.CylinderGeometry(0.1, 0.1, 20, 16);
  var stringMaterial = new THREE.MeshBasicMaterial({ color: 0xFF00FF });
  var string = new THREE.Mesh(stringGeometry, stringMaterial);
  string.position.set(0, 0, 0); // Adjust the position to fit your scene
  stringContainer.add(string);

  // Position the string container between the suspended point and the ball
  stringContainer.position.set(-5, 20, 10);

  // Add the wrecking ball to the string container
  wb.position.set(0, -10, 0); // Position the ball relative to the container
  stringContainer.add(wb);
  // scene.add(wb);

  // Add the string container to the scene
  scene.add(stringContainer);

  // Add the suspended point to the scene
  scene.add(suspendedPoint);
}

function positionGenerator(i, j) {
  const x = i * brickWidth;
  const y = j * brickHeight;
  const z = 0;
  const offset = 0;
  return {
    x: x + offset,
    y: y + offset,
    z: z + offset,
  }
}

function createWall() {
  // create a wall of bricks arranged mathematically

  const wall = new THREE.Group();
  const levels = 7;
  const bricksPerLevel = 5;

  let brick_idx = 0;
  var brick_init;
  for (let j = 0; j < levels; j++) {
    for (let i = 0; i < bricksPerLevel; i++) {
      brick_init = positionGenerator(i, j);
      const brick = createBrick(j + i, bricksPerLevel);
      brick.position.x = brick_init.x;
      brick.position.y = brick_init.y;
      brick.position.z = brick_init.z;

      wall.add(brick);
      agentData.push({
        index: brick_idx++,
        height: brickDimensions.height,
        width: brickDimensions.width,
        depth: brickDimensions.depth,
        mesh: brick,
        invmass: 1.1,
        px: brick.position.x,
        py: brick.position.y,
        pz: brick.position.z,
        vx: 0,
        vy: 0,
        vz: 0,
        fx: 0,
        fy: 0,
        fz: 0,
        torque: 0,
        rotation: {
          x: brick.rotation.x,
          y: brick.rotation.y,
          z: brick.rotation.z
        },
        collidable: true,
        unbreakable: false
      });

    }
  }
  return wall;
}

function createProjectile() {
  // create a brick that is 'thrown' at the wall
  let projectile = createBrick(31, 20, projectileSizeMultiplier);
  projectile.position.x = projectile_init.x;
  projectile.position.y = projectile_init.y;
  projectile.position.z = projectile_init.z;
  // projectile.rotation.y = Math.PI / 3;
  projectile.castShadow = true;
  projectile.receiveShadow = true;

  agentData.push({
    index: agentData.length,
    height: brickDimensions.height * projectileSizeMultiplier,
    width: brickDimensions.width * projectileSizeMultiplier,
    depth: brickDimensions.depth * projectileSizeMultiplier,
    mesh: projectile,
    invmass: projectile_init.invmass,
    px: projectile.position.x,
    py: projectile.position.y,
    pz: projectile.position.z,
    vx: projectile_init.vx,
    vy: projectile_init.vy,
    vz: projectile_init.vz,
    rotation: {
      x: projectile.rotation.x,
      y: projectile.rotation.y,
      z: projectile.rotation.z
    },
    collidable: true,
    unbreakable: true
  });

  return projectile;
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
  const geometry = new THREE.PlaneGeometry(world.length, world.width, 10, 10);
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

  // // create wrecking ball
  // var wreckingBall = cre();
  // wreckingBall.position.set(0, 100, 0);
  // scene.add(wreckingBall);

  // create wall
  var wall = createWall();
  scene.add(wall);

  // createBallSystem();
  var projectile = createProjectile();
  scene.add(projectile);


  world.distanceConstraints = [];
  // window.addEventListener("resize", onWindowResize);
  // window.addEventListener("mousedown", onMouseDown, false);
  // window.addEventListener("mousemove", onMouseMove, false);
}

function render() {
  renderer.render(scene, camera);
}

let output;
function animate() {
  let timestep = document.getElementById("timestep").value;
  document.getElementById("timestepValue").innerHTML = timestep;
  output = PHY.step(agentData, world, timestep);

  // update agentData to reflect updated in physics
  agentData = output.totalEntities;

  // update scene array to add new bricks
  output.newBricks.forEach((brick) => {
    scene.add(brick);
  });

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

requestAnimationFrame(animate);