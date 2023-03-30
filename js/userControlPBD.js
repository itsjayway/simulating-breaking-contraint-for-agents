export function distance(x1, y1, x2, y2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1));
}

export function xyz_distance(x1, y1, z1, x2, y2, z2) {
  return Math.sqrt((x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1));
}

export function step(RADIUS, sceneEntities, world) {



  /*  -----------------------  */
  function distanceConstraint(agent_i, agent_j, desiredDistance) {
    const agentCentroidDist = distance(agent_i.px, agent_i.pz,
      agent_j.px, agent_j.pz);
    const agentDist = agentCentroidDist - desiredDistance;
    const dir_x = (agent_j.px - agent_i.px) / agentCentroidDist;
    const dir_z = (agent_j.pz - agent_i.pz) / agentCentroidDist;
    const agent_i_scaler = 0.1 * agent_i.invmass / (agent_i.invmass + agent_j.invmass) * agentDist;
    const agent_j_scaler = 0.1 * agent_j.invmass / (agent_i.invmass + agent_j.invmass) * agentDist;
    if (Math.abs(agentDist) > epsilon) {
      agent_i.px += agent_i_scaler * dir_x
      agent_i.pz += agent_i_scaler * dir_z
      agent_j.px += - agent_j_scaler * dir_x
      agent_j.pz += - agent_j_scaler * dir_z
    }
  }

  function collisionConstraint(agent_i, agent_j) {
// TODO: implement collision constraint in 3D

  }


  /*  -----------------------  */



  const AGENTSIZE = RADIUS * 2;
  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM = 3;
  const gravity = -0.98;


  sceneEntities.forEach(function (agent) {
    agent.vy += gravity * timestep;

    const x_store = agent.x + agent.vx * timestep;
    const y_store = agent.y + agent.vy * timestep;
    const z_store = agent.z + agent.vz * timestep;

    if (x_store > world.x_max) {
      agent.x = world.x_max;
      agent.vx = -agent.vx;
    } else {
      agent.x = x_store;
      agent.px = agent.x;
    }

    if (x_store < world.x_min) {
      agent.x = world.x_min;
      agent.vx = -agent.vx;
    } else {
      agent.x = x_store;
      agent.px = agent.x;
    }

    if (y_store > world.y_max) {
      agent.y = world.y_max;
      agent.vy = -agent.vy;
    } else {
      agent.y = y_store;
      agent.py = agent.y;
    }

    if (y_store <= agent.height / 2) {
      agent.y = agent.height / 2;
      agent.vy = -agent.vy * 0.1;
    } else {
      agent.y = y_store;
      agent.py = agent.y;
    }

    if (z_store > world.z_max) {
      agent.z = world.z_max;
      agent.vz = -agent.vz;
    } else {
      agent.z = z_store;
      agent.pz = agent.z;
    }

    if (z_store < world.z_min) {
      agent.z = world.z_min;
      agent.vz = -agent.vz;
    } else {
      agent.z = z_store;
      agent.pz = agent.z;
    }
    agent.mesh.position.set(agent.x, agent.y, agent.z);
  });

  for (let i = 0; i < ITERNUM; i++) {
    sceneEntities.forEach(function (agent_i) {
      sceneEntities.forEach(function (agent_j) {
        if (agent_i !== agent_j) {
          distanceConstraint(agent_i, agent_j, AGENTSIZE);
          collisionConstraint(agent_i, agent_j);
        }
      });
    });
  }

}

