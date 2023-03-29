import * as THREE from "three";
import * as PHY from "simplePhysics";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import Stats from "three/addons/libs/stats.module.js";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

import { GUI } from "three/addons/libs/lil-gui.module.min.js";

let renderer, scene, camera, fpsCamera;
let world = {
  x: 80,
  z: 80,
};
let agentData = [];
let trees = [];
let pickableObjects = [];
let selected = null;
let mouse = new THREE.Vector2();
const raycaster = new THREE.Raycaster();
let grid, ring;
let clock = new THREE.Clock();

let tree;
let treePositions = [];

let gui,
  previousAction = "Random",
  activeAction;

let plane,
  dist,
  angle,
  sceneEntities = [];

const api = {
  state: "Noise",
  camera: "Camera",
};
let activeCamera;

let topTexture;
const RADIUS = 1;
const blueAgentMaterial = new THREE.MeshLambertMaterial({
  color: 0x0000ff,
});
const redAgentMaterial = new THREE.MeshLambertMaterial({
  color: 0xff0000,
});

const stats = new Stats();
document.body.appendChild(stats.dom);

//possionDiscSamples(15,15,1,5);

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
  activeCamera = camera;

  fpsCamera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    1,
    1000
  );

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
  const texture = loader.load("resources/grass.jpeg");
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.magFilter = THREE.NearestFilter;
  texture.rotation = Math.PI * 0.3;
  const repeats = 340 / 32;
  texture.repeat.set(repeats, repeats);

  topTexture = loader.load("resources/triangle2.png");
  topTexture.magFilter = THREE.NearestFilter;
  topTexture.repeat.set(3, 3);
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

  const ringGeometry = new THREE.RingGeometry(1, 3, 12);
  const ringMaterial = new THREE.MeshBasicMaterial({
    color: 0xffff00,
    side: THREE.DoubleSide,
  });
  ring = new THREE.Mesh(ringGeometry, ringMaterial);
  scene.add(ring);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y += 0.01;

  let i = 0;
  let startX, startY, goalX, goalY;
  startX = -25;
  goalX = -25;
  startY = -20;
  goalY = 20;
  world.distanceConstraints = [];

  generateTrees(previousAction);
  const glbLoader = new GLTFLoader();
  glbLoader.load(
    "resources/pinetree.glb",
    function (gltf) {
      tree = gltf.scene;
      const box = new THREE.Box3().setFromObject(gltf.scene);
      const size = box.getSize(new THREE.Vector3());
      let clonedTree,
        i = 0;
      while (i < treePositions.length) {
        clonedTree = tree.clone(true);
        scene.add(clonedTree);
        clonedTree.userIndex = i;
        clonedTree.position.y = size.y * 0.7;
        trees.push(clonedTree);
        i += 1;
      }
      renderTrees();
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  glbLoader.load(
    "resources/plane.glb",
    function (gltf) {
      plane = gltf.scene;
      gltf.scene.scale.set(3, 3, 3);
      gltf.scene.traverse(function (child) {
        if (child.isMesh) {
          child.scale.set(3, 3, 3);
        }
      });
      const box = new THREE.Box3().setFromObject(gltf.scene);
      scene.add(plane);
      plane.position.y = 20;
      plane.position.x = 20;
      plane.scale;
      sceneEntities.push(plane);
    },
    undefined,
    function (error) {
      console.error(error);
    }
  );

  createGUI();

  window.addEventListener("resize", onWindowResize);
  window.addEventListener("mousedown", mouseDown, false);
  window.addEventListener("mousemove", mouseMove, false);
}

function renderTrees() {
  trees.forEach(function (tree) {
    if (treePositions[tree.userIndex] != undefined) {
      tree.visible = true;
      tree.position.x = treePositions[tree.userIndex].x;
      tree.position.z = treePositions[tree.userIndex].z;
    } else {
      tree.visible = false;
    }
  });
}

function generateTrees(expr) {
  let treeCtr = 0,
    totalTreeNum = 500,
    zPos,
    xPos,
    spacing = 22;
  treePositions = [];
  switch (expr) {
    case "Random":
      while (treeCtr < totalTreeNum) {
        zPos =
          -world.z / 2 + (Math.floor(treeCtr / spacing) * world.z) / spacing;
        xPos = -world.x / 2 + ((treeCtr % spacing) * world.x) / spacing;
        treePositions.push({
          x: Math.random() * world.x - world.x / 2,
          y: 0,
          z: Math.random() * world.z - world.z / 2,
        });
        treeCtr += 1;
      }
      break;
    case "Blue Noise":
      let pnts = blueNoise(world);
      while (treeCtr < pnts.length) {
        treePositions.push({
          x: pnts[treeCtr][0] - world.x / 2,
          y: 0,
          z: pnts[treeCtr][1] - world.z / 2,
        });
        treeCtr += 1;
      }
      while (treeCtr < totalTreeNum) {
        treePositions.push(undefined);
        treeCtr += 1;
      }
      break;
    /* 
    TODO add your noise here:
    case 'ANovelNoise':
        while(treeCtr<totalTreeNum)
        {
            treePositions.push(undefined);
            treeCtr+=1; 
        }
        break;
    */
    case "Gaussian":
      let getGaussian = () => {
        let u1 = Math.random();
        let u2 = Math.random();
        // https://en.wikipedia.org/wiki/Box%E2%80%93Muller_transform
        let num = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
        // fit the result to be within  world size
        num = num / 10.0 + 0.5;
        return num * world.x - world.x / 2;
      };

      while (treeCtr < totalTreeNum) {
        treePositions.push({
          x: getGaussian(),
          y: 0,
          z: getGaussian(),
        });
        treeCtr += 1;
      }
      break;
    case "Rule-Based":
      while (treeCtr < totalTreeNum) {
        zPos =
          -world.z / 2 + (Math.floor(treeCtr / spacing) * world.z) / spacing;
        xPos = -world.x / 2 + ((treeCtr % spacing) * world.x) / spacing;
        treePositions.push({
          x: xPos,
          y: 0,
          z: zPos,
        });
        treeCtr += 1;
      }
      break;
    default:
      console.log(isRandom, " expression not supported");
  }
}

function switchNoise(name) {
  activeAction = name;
  if (previousAction !== activeAction) {
    generateTrees(activeAction);
    previousAction = activeAction;
    renderTrees();
  }
}

function createGUI() {
  // TODO append your noise name to the states list below
  const states = ["Rule-Based", "Random", "Blue Noise", "Gaussian"];
  const cameras = ["Top View", "FPS"];
  gui = new GUI();
  const statesFolder = gui.addFolder("States");
  const camerasFolder = gui.addFolder("Cameras");
  const clipCtrl = statesFolder.add(api, "state").options(states);
  const cameraCtrl = camerasFolder.add(api, "camera").options(cameras);
  cameraCtrl.onChange(function () {
    if (api.camera == "FPS" && fpsCamera != undefined) {
      /*  TODO add code here
       */

      // set camera position to be above the origin of plane
      fpsCamera.position.set(
        plane.position.x,
        plane.position.y + 5,
        plane.position.z
      );
      fpsCamera.lookAt(plane.position.x, plane.position.y, plane.position.z);

      activeCamera = fpsCamera;
    } else {
      activeCamera = camera;
    }
  });
  clipCtrl.onChange(function () {
    switchNoise(api.state);
  });
  statesFolder.open();
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function mouseMove(event) {
  event.preventDefault();
}

function mouseDown(event) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
}

function render() {
  renderer.render(scene, camera);
}

function animate() {
  requestAnimationFrame(animate);

  for (var i = 0; i < sceneEntities.length; i++) {
    dist = Math.sqrt(
      sceneEntities[i].position.z * sceneEntities[i].position.z +
        sceneEntities[i].position.x * sceneEntities[i].position.x
    );
    angle = Math.atan2(
      sceneEntities[i].position.z,
      sceneEntities[i].position.x
    );
    angle += 0.005;
    sceneEntities[i].position.x = dist * Math.cos(angle);
    sceneEntities[i].position.z = dist * Math.sin(angle);
    sceneEntities[i].rotation.y = Math.PI - angle;
    /*
        TODO add code here:
        fpsCamera.position.set(x,y,z);
        fpsCamera.lookAt(lookX,lookY,lookZ); 
         */

    // set camera position to be roughly in the plane seat
    fpsCamera.position.x = plane.position.x;
    fpsCamera.position.y = plane.position.y + 3;
    fpsCamera.position.z = plane.position.z;

    // https://threejs.org/docs/#api/en/math/Quaternion

    const point = new THREE.Vector3(0, 0, -3);

    // rotate the vector by the plane's quaternion (rotation that it's currently facing)
    point.applyQuaternion(plane.quaternion);

    // add the plane's position to the vector so that it is in front of the plane
    point.x += plane.position.x;
    point.y += plane.position.y;
    point.z += plane.position.z;

    fpsCamera.lookAt(point.x, point.y, point.z);
  }

  PHY.step(RADIUS, agentData, world);
  agentData.forEach(function (member) {
    member.agent.position.x = member.x;
    member.agent.position.y = member.y;
    member.agent.position.z = member.z;
    member.agent.material = redAgentMaterial;
  });
  renderer.render(scene, activeCamera);
  stats.update();
}

function blueNoise(world) {
  let pnts = [];

  var ratio = world.x / world.z,
    width = world.x,
    height = world.z,
    radius = 1.5 * ratio,
    x0 = radius,
    y0 = radius,
    x1 = width - radius,
    y1 = height - radius,
    active = -1,
    k = 5;

  pnts = reset(2 * radius, width / 2, height / 2);
  return pnts;

  function reset(r, x, y) {
    var id = ++active,
      inner2 = r * r,
      A = 4 * r * r - inner2,
      cellSize = r * Math.SQRT1_2,
      gridWidth = Math.ceil(width / cellSize),
      gridHeight = Math.ceil(height / cellSize),
      grid = new Array(gridWidth * gridHeight),
      queue = [],
      n = 0;
    emitSample([x, y]);
    while (id === active) {
      if (id !== active) return true;
      do {
        var i = (Math.random() * n) | 0,
          p = queue[i];

        for (var j = 0; j < k; ++j) {
          var q = generateAround(p);
          if (withinExtent(q) && !near(q)) {
            emitSample(q);
            break;
          }
        }
        // No suitable candidate found; remove from active queue.
        if (j === k) (queue[i] = queue[--n]), queue.pop();
      } while (n);
      return pnts;
    }

    function emitSample(p) {
      queue.push(p), ++n;
      grid[gridWidth * ((p[1] / cellSize) | 0) + ((p[0] / cellSize) | 0)] = p;
      pnts.push(p);
    }

    // Generate point chosen uniformly from spherical annulus between radius r
    // and 2r from p.
    function generateAround(p) {
      var θ = Math.random() * 2 * Math.PI,
        r = Math.sqrt(Math.random() * A + inner2); // http://stackoverflow.com/a/9048443/64009
      return [p[0] + r * Math.cos(θ), p[1] + r * Math.sin(θ)];
    }

    function near(p) {
      var n = 2,
        x = (p[0] / cellSize) | 0,
        y = (p[1] / cellSize) | 0,
        x0 = Math.max(x - n, 0),
        y0 = Math.max(y - n, 0),
        x1 = Math.min(x + n + 1, gridWidth),
        y1 = Math.min(y + n + 1, gridHeight);
      for (var y = y0; y < y1; ++y) {
        var o = y * gridWidth;
        for (var x = x0; x < x1; ++x) {
          var g = grid[o + x];
          if (g && distance2(g, p) < inner2) return true;
        }
      }
      return false;
    }
  }

  function withinExtent(p) {
    var x = p[0],
      y = p[1];
    return x0 <= x && x <= x1 && y0 <= y && y <= y1;
  }

  function distance2(a, b) {
    var dx = b[0] - a[0],
      dy = b[1] - a[1];
    return dx * dx + dy * dy;
  }
}

animate();
