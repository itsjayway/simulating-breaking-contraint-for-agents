
import * as THREE from "three";

let outputBricks = [];

const brickdepth = 8;
const brickWidth = 8;
const brickHeight = 8;


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



export function step(brickDimensions, sceneEntities, world) {

  let arrayLength = sceneEntities.length;

  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM = 3;
  const gravity = -0.98;
  const breakingThreshold = 12.5;
  const minimumSize = 0.125;


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

    let multiplier = 2;

    if ((distance <= agent_i.width / 2 + agent_j.width / 2) ||
      (distance <= agent_i.depth / 2 + agent_j.depth / 2) ||
      (distance <= agent_i.height / 2 + agent_j.height / 2)
    ) {// bricks are touching
      // console.log("collision detected");

      const penetration = agent_i.width / 2 + agent_j.width / 2 - distance;
      const nx = (agent_i.px - agent_j.px) / distance;
      const ny = (agent_i.py - agent_j.py) / distance;
      const nz = (agent_i.pz - agent_j.pz) / distance;
      const tx = -ny;
      const ty = nx;
      const tz = 0;
      const b = (agent_i.vx - agent_j.vx) * nx + (agent_i.vy - agent_j.vy) * ny + (agent_i.vz - agent_j.vz) * nz;
      const d = (agent_i.vx - agent_j.vx) * tx + (agent_i.vy - agent_j.vy) * ty + (agent_i.vz - agent_j.vz) * tz;
      const m1 = 1 / agent_i.mass;
      const m2 = 1 / agent_j.mass;
      const e = 0.5;
      const j = -(1 + e) * b / (m1 + m2);
      const k = -(1 + e) * d / (m1 + m2);
      agent_i.vx += j * nx + k * tx;
      agent_i.vy += j * ny + k * ty;
      agent_i.vz += j * nz + k * tz;
      agent_j.vx -= j * nx + k * tx;
      agent_j.vy -= j * ny + k * ty;
      agent_j.vz -= j * nz + k * tz;
      agent_i.px += nx * penetration / 2;
      agent_i.py += ny * penetration / 2;
      agent_i.pz += nz * penetration / 2;
      agent_j.px -= nx * penetration / 2;
      agent_j.py -= ny * penetration / 2;
      agent_j.pz -= nz * penetration / 2;

      const force_i_n = j * nx / timestep;
      const force_i_t = k * tx / timestep;

      const force_j_n = j * nx / timestep;
      const force_j_t = k * tx / timestep;

      // Calculate the magnitudes of the forces acting on each agent
      const force_i = Math.sqrt(force_i_n * force_i_n + force_i_t * force_i_t);
      const force_j = Math.sqrt(force_j_n * force_j_n + force_j_t * force_j_t);

      if (force_i > breakingThreshold) {
        if (agent_i.height < minimumSize || agent_i.width < minimumSize || agent_i.depth < minimumSize) {
          return;
        }
        // console.log("breaking agent_i");
        // console.log(agent_i);
        const brick = createBrick(agent_i.mesh.material.color, {
          height: agent_i.height / 2,
          width: agent_i.width / 2,
          depth: agent_i.depth / 2,
        });
        brick.position.x = agent_i.px - agent_i.width / 4;
        brick.position.y = agent_i.py - agent_i.height / 4;
        brick.position.z = agent_i.pz - agent_i.depth / 4;

        console.log(brick);

        outputBricks.push(brick);

        sceneEntities.push({
          index: sceneEntities.length,
          height: agent_i.height / 2,
          width: agent_i.width / 2,
          depth: agent_i.depth / 2,
          mesh: brick,
          mass: agent_i.mass / 2,
          px: brick.position.x,
          py: brick.position.y,
          pz: brick.position.z,
          vx: agent_i.vx,
          vy: agent_i.vy,
          vz: agent_i.vz,
          collidable: true,
        });

        agent_i.height /= 2;
        agent_i.width /= 2;
        agent_i.depth /= 2;
        agent_i.mass /= 2;
        agent_i.mesh.scale.x /= 2;
        agent_i.mesh.scale.y /= 2;
        agent_i.mesh.scale.z /= 2;

      }

      if (force_j > breakingThreshold) {
        if (agent_j.height < minimumSize || agent_j.width < minimumSize || agent_j.depth < minimumSize) {
          return;
        }
        // console.log("breaking agent_j");

        const brick = createBrick(agent_j.mesh.material.color, {
          height: agent_j.height / 2,
          width: agent_j.width / 2,
          depth: agent_j.depth / 2,
        });
        brick.position.x = agent_j.px + nx * penetration / 2;
        brick.position.y = agent_j.py + ny * penetration / 2;
        brick.position.z = agent_j.pz + nz * penetration / 2;

        // console.log(brick);

        outputBricks.push(brick);

        sceneEntities.push({
          index: sceneEntities.length,
          height: agent_j.height / 2,
          width: agent_j.width / 2,
          depth: agent_j.depth / 2,
          mesh: brick,
          mass: agent_j.mass / 2,
          px: brick.position.x,
          py: brick.position.y,
          pz: brick.position.z,
          vx: agent_j.vx,
          vy: agent_j.vy,
          vz: agent_j.vz,
          collidable: true,
        });

        agent_j.height /= 2;
        agent_j.width /= 2;
        agent_j.depth /= 2;
        agent_j.mass /= 2;


        agent_j.mesh.scale.x /= 2;
        agent_j.mesh.scale.y /= 2;
        agent_j.mesh.scale.z /= 2;

      }
    }
  }


  sceneEntities.forEach(function (agent) {
    // gravity

    agent.vy += gravity * timestep;

    // update position

    agent.vx *= 0.995;
    agent.vy *= 0.995;
    agent.vz *= 0.995;
    // if (agent.vx < 0.1) agent.vx = 0.1;

    agent.px += agent.vx * timestep;
    agent.py += agent.vy * timestep;
    agent.pz += agent.vz * timestep;

    // floor constraint

    if (agent.py < agent.height / 2) {
      agent.py = agent.height / 2;
      agent.vy = -agent.vy * 0.5;
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
