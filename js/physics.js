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

    // current position is stored in agent.mesh.position
    let curr_i_x = agent_i.mesh.position.x;
    let curr_i_y = agent_i.mesh.position.y;
    let curr_i_z = agent_i.mesh.position.z;

    let curr_j_x = agent_j.mesh.position.x;
    let curr_j_y = agent_j.mesh.position.y;
    let curr_j_z = agent_j.mesh.position.z;

    const agentCentroidDist = xyz_distance(
      curr_i_x, curr_i_y, curr_i_z,
      curr_j_x, curr_j_y, curr_j_z
    );
    
    const agentDist = agentCentroidDist - RADIUS * 2;
    if (agentDist < 0) {
      agent_i.vx = 0;
      agent_i.vy = 0;
      agent_i.vz = 0;

      agent_j.vx = 0;
      agent_j.vy = 0;
      agent_j.vz = 0;
    }
  }


  /*  -----------------------  */



  const AGENTSIZE = RADIUS * 2;
  const epsilon = 0.0001;
  const timestep = 0.003;
  const ITERNUM = 3;
  const gravity = -0.98;


  sceneEntities.forEach(function (agent) {
    // current position is stored in agent.mesh.position 
    agent.vy += gravity * timestep;

    agent.px = agent.mesh.position.x;
    agent.py = agent.mesh.position.y;
    agent.pz = agent.mesh.position.z;

    agent.px += agent.vx * timestep;
    agent.py += agent.vy * timestep;
    agent.pz += agent.vz * timestep;

    if (agent.px > world.width - agent.width / 2) {
      agent.px = world.width - agent.width / 2;
      agent.vx = 0;
    }
    if (agent.px < agent.width / 2) {
      agent.px = agent.width / 2;
      agent.vx = 0;
    }

    if (agent.py > world.height - agent.height / 2) {
      agent.py = world.height - agent.height / 2;
      agent.vy = 0;
    }
    if (agent.py < agent.height / 2) {
      agent.py = agent.height / 2;
      agent.vy = -.1 * agent.vy;
    }

    if (agent.pz > world.length - agent.length / 2) {
      agent.pz = world.length - agent.length / 2;
      agent.vz = 0;
    }
    if (agent.pz < agent.length / 2) {
      agent.pz = agent.length / 2;
      agent.vz = 0;
    }



    agent.mesh.position.x = agent.px + agent.vx * timestep;
    agent.mesh.position.y = agent.py + agent.vy * timestep;
    agent.mesh.position.z = agent.pz + agent.vz * timestep;
  });

  for (let i = 0; i < ITERNUM; i++) {
    sceneEntities.forEach(function (agent_i) {
      sceneEntities.forEach(function (agent_j) {
        if (agent_i !== agent_j) {
          distanceConstraint(agent_i, agent_j, AGENTSIZE);
          if (agent_i.collidable && agent_j.collidable) {
            collisionConstraint(agent_i, agent_j);
          }
        }
      });
    });
  }

}

