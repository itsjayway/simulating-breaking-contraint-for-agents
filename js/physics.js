
import * as THREE from "three";

/* ==================== Parameters ==================== */
const minimumSize = Math.pow(2, -3);

/* ==================== Constants ==================== */
const epsilon = 0.0001;
const ITERNUM = 3;
const gravity = -2.98;
const breakingThreshold = 200;

const accurateBreaking = false;

/* ==================== Initializers ==================== */

/* 
when new bricks are created because of breaking, they're passed
back to main to be added to the scene
*/
let outputBricks = [];

/* ==================== Functions ==================== */

export function calculate_distance(x1, y1, z1, x2, y2, z2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function createBrick(color, newBrickDimensions) {
  let brickMaterial = new THREE.MeshLambertMaterial({
    color: color,
  });

  const brick = new THREE.Mesh(
    new THREE.BoxGeometry(
      newBrickDimensions.width,
      newBrickDimensions.height,
      newBrickDimensions.depth
    ),
    brickMaterial
  );
  brick.castShadow = true;
  brick.receiveShadow = true;
  return brick;
}

export function step(sceneEntities, world, timestep) {

  let arrayLength = sceneEntities.length;

  function createTwoNewBricks(agent_i) {
    // add checking for accurateBreaking to instead 
    // randomly select a plane to break on
    let side = Math.random();
    if(side < 0.5){
      var brick = createBrick(agent_i.mesh.material.color, {
      height: agent_i.height / 2,
      width: agent_i.width,
      depth: agent_i.depth,
      });
    }
    else{
      var brick = createBrick(agent_i.mesh.material.color, {
      height: agent_i.height,
      width: agent_i.width / 2,
      depth: agent_i.depth,
      });
    }

    // let brick = createBrick(agent_i.mesh.material.color, {
    //   height: agent_i.height / Math.sqrt(2),
    //   width: agent_i.width / Math.sqrt(2),
    //   depth: agent_i.depth / Math.sqrt(2),
    // });

    brick.position.x = agent_i.px;
    brick.position.y = agent_i.py;
    brick.position.z = agent_i.pz;


    for (let i = 0; i < 2; i++) {
      outputBricks.push(brick);
      sceneEntities.push({
        index: sceneEntities.length,
        height: agent_i.height / Math.sqrt(2),
        width: agent_i.width / Math.sqrt(2),
        depth: agent_i.depth / Math.sqrt(2),
        mesh: brick,
        invmass: agent_i.invmass / 2,
        px: brick.position.x + (Math.random() - 0.5) * 0.1,
        py: brick.position.y + (Math.random() - 0.5) * 0.1,
        pz: brick.position.z + (Math.random() - 0.5) * 0.1,
        vx: agent_i.vx + (Math.random() - 0.5) * 0.1,
        vy: agent_i.vy + (Math.random() - 0.5) * 0.1,
        vz: agent_i.vz + (Math.random() - 0.5) * 0.1,
        collidable: true,
        unbreakable: false,
      });
    }
  }

  function updateAgent(agent) {
    agent.height /= 2;
    agent.width /= 2;
    agent.depth /= 2;
    agent.invmass /= 2;

    agent.mesh.scale.x /= 2;
    agent.mesh.scale.y /= 2;
    agent.mesh.scale.z /= 2;
  }

  function applyVelocityIfUnbreakable(agent, nx, ny, nz, j) {
    agent.vx -= j * nx;
    agent.vy -= j * ny;
    agent.vz -= j * nz;
  }

  function calculateForces(j, nx, k, tx) {
    var force_i_n = j * nx / timestep;
    var force_i_t = k * tx / timestep;

    var force_j_n = -j * nx / timestep;
    var force_j_t = -k * tx / timestep;

    return {
      force_i: Math.sqrt(force_i_n * force_i_n + force_i_t * force_i_t),
      force_j: Math.sqrt(force_j_n * force_j_n + force_j_t * force_j_t),
    };
  }

  // function distanceConstraint(agent_i, agent_j, desiredDistance) {
  // }

  // function checkRotationalCollision(agent_i, agent_j, distance) {
  // }

  function collisionConstraint(agent_i, agent_j) {
    const distance = calculate_distance(
      agent_i.px,
      agent_i.py,
      agent_i.pz,
      agent_j.px,
      agent_j.py,
      agent_j.pz
    );

    if (distance < agent_i.width / 2 + agent_j.width / 2 ||
      distance < agent_i.height / 2 + agent_j.height / 2 ||
      distance < agent_i.depth / 2 + agent_j.depth / 2
    ) {

      // determine which dimension is overlapping the most
      const xOverlap = agent_i.width / 2 + agent_j.width / 2 - Math.abs(agent_i.px - agent_j.px);
      const yOverlap = agent_i.height / 2 + agent_j.height / 2 - Math.abs(agent_i.py - agent_j.py);
      const zOverlap = agent_i.depth / 2 + agent_j.depth / 2 - Math.abs(agent_i.pz - agent_j.pz);


      // use max overlap dimension
      const overlapDimensionMatrix = {
        width: xOverlap,
        height: yOverlap,
        depth: zOverlap,
      }

      const maxOverlap = Math.max(xOverlap, yOverlap, zOverlap);

      let dimension = '';
      for (let key in overlapDimensionMatrix) {
        if (overlapDimensionMatrix[key] === maxOverlap) {
          dimension = key;
        }
      }

      const penetration = agent_i[dimension] / 2 + agent_j[dimension] / 2 - distance; // amount of overlap

      // normal vector formed by the two agents
      const nx = (agent_i.px - agent_j.px) / distance;
      const ny = (agent_i.py - agent_j.py) / distance;
      const nz = (agent_i.pz - agent_j.pz) / distance;

      // tangent vector
      const tx = -ny;
      const ty = nx;
      const tz = 0;

      // relative velocity
      const b = (agent_i.vx - agent_j.vx) * nx + (agent_i.vy - agent_j.vy) * ny + (agent_i.vz - agent_j.vz) * nz;
      const d = (agent_i.vx - agent_j.vx) * tx + (agent_i.vy - agent_j.vy) * ty + (agent_i.vz - agent_j.vz) * tz;

      const m1 = 1 / agent_i.invmass;
      const m2 = 1 / agent_j.invmass;

      // coefficient of restitution
      const e = 0.5;

      // calculate impulse
      const j = -(1 + e) * b / (m1 + m2);
      const k = -(1 + e) * d / (m1 + m2);

      // apply impulse to agents' velocities
      agent_i.vx += j * nx + k * tx;
      agent_i.vy += j * ny + k * ty;
      agent_i.vz += j * nz + k * tz;
      agent_j.vx -= j * nx + k * tx;
      agent_j.vy -= j * ny + k * ty;
      agent_j.vz -= j * nz + k * tz;

      // apply undo-penetration to agents' positions
      agent_i.px += nx * penetration / 2;
      agent_i.py += ny * penetration / 2;
      agent_i.pz += nz * penetration / 2;
      agent_j.px -= nx * penetration / 2;
      agent_j.py -= ny * penetration / 2;
      agent_j.pz -= nz * penetration / 2;

      // apply collision recoil to agents
      const f = calculateForces(j, nx, k, tx);

      let i = 0;
      [agent_i, agent_j].forEach((agent) => {
        var currentForce = i++ === 0 ? f.force_i : f.force_j
        if (!agent.unbreakable) {
          if (currentForce > breakingThreshold) {
            if (agent.height < minimumSize || agent.width < minimumSize || agent.depth < minimumSize) {
              return;
            }
            createTwoNewBricks(agent);
            updateAgent(agent);
          }
        }
        else {
          applyVelocityIfUnbreakable(agent, nx, ny, nz, j);
        }
      });

      [agent_i, agent_j].forEach((agent) => {
        // apply friction between agents
        agent.vx *= 0.99;
        agent.vy *= 0.99;
        agent.vz *= 0.99;
      });
    }
  }


  sceneEntities.forEach(function (agent) {
    // apply gravity
    agent.vy += gravity * timestep;

    // apply friction/dampening
    if (agent.py > agent.height / 2) {
      agent.vx *= 0.999;
      agent.vz *= 0.999;
    }
    else {
      agent.vx *= 0.99;
      agent.vz *= 0.99;
    }
    agent.vy *= 0.999;

    // update position
    agent.px += agent.vx * timestep;
    agent.py += agent.vy * timestep;
    agent.pz += agent.vz * timestep;

    /* ========== floor constraints ========== */

    // prevent agent from going through the floor
    if (agent.py < agent.height / 2) {
      agent.py = agent.height / 2;
      agent.vy = -agent.vy * 0.1;
    }

    // bounce off the wall
    if (agent.px < -world.length / 2) {
      agent.px = -world.length / 2;
      agent.vx = -agent.vx * 0.1;
    }

    if (agent.px > world.length / 2) {
      agent.px = world.length / 2;
      agent.vx = -agent.vx * 0.1;
    }

    if (agent.pz < -world.width / 2) {
      agent.pz = -world.width / 2;
      agent.vz = -agent.vz * 0.1;
    }

    if (agent.pz > world.width / 2) {
      agent.pz = world.width / 2;
      agent.vz = -agent.vz * 0.1;
    }

    // update mesh position
    agent.mesh.position.x = agent.px;
    agent.mesh.position.y = agent.py;
    agent.mesh.position.z = agent.pz;

  });

  for (let i = 0; i < ITERNUM; i++) {
    sceneEntities.forEach(function (agent_i) {
      sceneEntities.forEach(function (agent_j) {
        if (agent_i !== agent_j) {
          // distanceConstraint(agent_i, agent_j);
          // if (agent_i.collidable && agent_j.collidable) {
          collisionConstraint(agent_i, agent_j);
          // }
        }
      });
    });
  }

  // return the updated sceneeEntities and the newBricks to render
  return { totalEntities: sceneEntities, newBricks: outputBricks };
}