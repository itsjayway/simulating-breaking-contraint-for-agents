export function calculate_distance(x1, y1, z1, x2, y2, z2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  const dz = z1 - z2;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

export function step(brickDimensions, sceneEntities, world) {
  const epsilon = 0.0001;
  const timestep = 0.04;
  const ITERNUM = 3;
  const gravity = -0.98;


  function distanceConstraint(agent_i, agent_j, desiredDistance) {
  }

  function collisionConstraint(agent_i, agent_j) {
    // implement collision constraint

    const distance = calculate_distance(
      agent_i.px,
      agent_i.py,
      agent_i.pz,
      agent_j.px,
      agent_j.py,
      agent_j.pz
    );
    if (distance < brickDimensions.height / 2 + brickDimensions.width / 2
      ) { // bricks are touching
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


    }
  }

  sceneEntities.forEach(function (agent) {
    // gravity

    agent.vy += gravity * timestep;

    // update position

    agent.vx *= 0.99;
    agent.vy *= 0.99;
    agent.vz *= 0.99;

    agent.px += agent.vx * timestep;
    agent.py += agent.vy * timestep;
    agent.pz += agent.vz * timestep;

    // floor constraint

    if (agent.py < brickDimensions.height / 2) {
      agent.py = brickDimensions.height / 2;
      agent.vy = 0;
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
}
