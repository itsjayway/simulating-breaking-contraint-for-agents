
import * as THREE from "three";

let outputBricks = [];

const brickdepth = 2;
const brickWidth = 2;
const brickHeight = 2;


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




export function calculate_distance(x1, y1, z1, x2, y2, z2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}


const epsilon = 0.0001;
const timestep = 0.003;
const ITERNUM = 3;
const gravity = -0.98;
const breakingThreshold = 20;
const minimumSize = 0.0625;


export function step(brickDimensions, sceneEntities, world, multiplier) {

  let arrayLength = sceneEntities.length;


  function distanceConstraint(agent_i, agent_j, desiredDistance) {
  }

  function collisionConstraint(agent_i, agent_j) {
    const distance = calculate_distance(
      agent_i.px,
      agent_i.py,
      agent_i.pz,
      agent_j.px,
      agent_j.py,
      agent_j.pz
    );

    // Calculate the relative position vector of agent_j with respect to agent_i
    const relativePos = new THREE.Vector3(
      agent_j.px - agent_i.px,
      agent_j.py - agent_i.py,
      agent_j.pz - agent_i.pz
    );

    // Rotate the relative position vector based on the rotation of agent_i
    const rotation_i = new THREE.Quaternion().setFromEuler(agent_i.mesh.rotation);
    relativePos.applyQuaternion(rotation_i);

    // Rotate the relative position vector based on the rotation of agent_j
    const rotation_j = new THREE.Quaternion().setFromEuler(agent_j.mesh.rotation);
    relativePos.applyQuaternion(rotation_j);

    // Calculate the rotated distance between the two agents
    const rotatedDistance = relativePos.length();

    if (rotatedDistance < agent_i.width / 2 + agent_j.width / 2 + epsilon) {
      // Calculate the collision normal and tangent vectors
      const nx = relativePos.x / rotatedDistance;
      const ny = relativePos.y / rotatedDistance;
      const nz = relativePos.z / rotatedDistance;
      const tx = -ny;
      const ty = nx;
      const tz = 0;

      // Calculate the relative velocity between the two agents
      const dvx = agent_i.vx - agent_j.vx;
      const dvy = agent_i.vy - agent_j.vy;
      const dvz = agent_i.vz - agent_j.vz;
      const b = dvx * nx + dvy * ny + dvz * nz;
      const d = dvx * tx + dvy * ty + dvz * tz;

      // Calculate the impulse magnitude
      const m1 = 1 / agent_i.invmass;
      const m2 = 1 / agent_j.invmass;
      const e = 0.5;
      const j = -(1 + e) * b / (m1 + m2);
      const k = -(1 + e) * d / (m1 + m2);

      // Update the velocities of the agents
      agent_i.vx += j * nx + k * tx;
      agent_i.vy += j * ny + k * ty;
      agent_i.vz += j * nz + k * tz;

      agent_j.vx -= j * nx + k * tx;
      agent_j.vy -= j * ny + k * ty;
      agent_j.vz -= j * nz + k * tz;

      // Resolve the overlap
      const penetration = agent_i.width / 2 + agent_j.width / 2 - rotatedDistance;
      agent_i.px += nx * penetration / 2;
      agent_i.py += ny * penetration / 2;
      agent_i.pz += nz * penetration / 2;

      agent_j.px -= nx * penetration / 2;
      agent_j.py -= ny * penetration / 2;
      agent_j.pz -= nz * penetration / 2;

      // Calculate the forces acting on each agent
      const force_i_n = j * nx / timestep;
      const force_i_t = k * tx / timestep;
      const force_j_n = j * nx / timestep;
      const force_j_t = k * tx / timestep;

      // apply the forces to the agents
      agent_i.fx += force_i_n * nx + force_i_t * tx;
      agent_i.fy += force_i_n * ny + force_i_t * ty;
      agent_i.fz += force_i_n * nz + force_i_t * tz;

      agent_j.fx += force_j_n * nx + force_j_t * tx;
      agent_j.fy += force_j_n * ny + force_j_t * ty;
      agent_j.fz += force_j_n * nz + force_j_t * tz;

      // Calculate the torque acting on each agent
      const torque_i_n = force_i_n * agent_i.width / 2;

      const torque_j_n = force_j_n * agent_j.width / 2;

      // apply the torque to the agents
      agent_i.torque += torque_i_n;
      agent_j.torque += torque_j_n;
    }
  }



  sceneEntities.forEach(function (agent) {
    // gravity

    agent.vy += gravity * timestep;

    // update position

    if (agent.py > agent.height / 2) {
      agent.vx *= 0.999;
      agent.vz *= 0.999;
    }
    else {
      agent.vx *= 0.97;
      agent.vz *= 0.97;
    }
    agent.vy *= 0.999;
    // if (agent.vx < 0.1) agent.vx = 0.1;

    agent.px += agent.vx * timestep;
    agent.py += agent.vy * timestep;
    agent.pz += agent.vz * timestep;

    // update rotation

    agent.rotation += agent.torque * timestep;
    agent.torque *= 0.9;
    
    // update mesh

    agent.mesh.position.set(agent.px, agent.py, agent.pz);
    agent.mesh.rotation.set(0, agent.rotation, 0);




    // floor constraint

    if (agent.py < agent.height / 2) {
      agent.py = agent.height / 2;
      agent.vy = -agent.vy * 0.1;
    }

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
          distanceConstraint(agent_i, agent_j);
          if (agent_i.collidable && agent_j.collidable) {
            collisionConstraint(agent_i, agent_j);
          }
        }
      });
    });
  }

  return { totalEntities: sceneEntities, newBricks: outputBricks };
}
