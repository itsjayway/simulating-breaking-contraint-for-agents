export function distance(x1, y1, x2, y2) {
      return Math.sqrt((x2-x1)*(x2-x1)+(y2-y1)*(y2-y1));
}

export function step(RADIUS,sceneEntities,world) {


  /*  -----------------------  */
  /*  TODO modify lines below  */
  /*  -----------------------  */
  function distanceConstraint(agent_i,agent_j, desiredDistance)
  {
    const agentCentroidDist = distance(agent_i.px, agent_i.pz, 
                agent_j.px, agent_j.pz );
    const agentDist = agentCentroidDist - desiredDistance;
    const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist; 
    const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist; 
    const agent_i_scaler = 0.1*agent_i.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;
    const agent_j_scaler = 0.1*agent_j.invmass/(agent_i.invmass+agent_j.invmass) * agentDist;
    if(Math.abs(agentDist) > epsilon )
    {
        agent_i.px +=  agent_i_scaler * dir_x
        agent_i.pz +=  agent_i_scaler * dir_z
        agent_j.px += - agent_j_scaler * dir_x
        agent_j.pz += - agent_j_scaler * dir_z
    } 
  }

  function collisionConstraint(agent_i,agent_j)
  {
    const agentCentroidDist = distance(agent_i.px, agent_i.pz, 
                agent_j.px, agent_j.pz );
    const agentDist = agentCentroidDist - AGENTSIZE;
    const dir_x = (agent_j.px- agent_i.px)/agentCentroidDist; 
    const dir_z = (agent_j.pz- agent_i.pz)/agentCentroidDist;
    const agent_i_scaler = agent_i.invmass/(agent_i.invmass+agent_j.invmass) * agentDist
    const agent_j_scaler = agent_j.invmass/(agent_i.invmass+agent_j.invmass) * agentDist 
    if(agentDist < 0)
    {
        agent_i.px += agent_i_scaler * dir_x
        agent_i.pz += agent_i_scaler * dir_z
        agent_j.px += - agent_j_scaler * dir_x
        agent_j.pz += - agent_j_scaler * dir_z
    } 
  }

  function agentVelocityPlanner()  {
    sceneEntities.forEach(function (agent_i) {
      const distToGoal = distance(agent_i.x, agent_i.z, 
                        agent_i.goal_x, agent_i.goal_z );
      if(distToGoal > RADIUS)
      {
        const dir_x = (agent_i.goal_x- agent_i.x)/distToGoal; 
        const dir_z = (agent_i.goal_z- agent_i.z)/distToGoal;
        agent_i.vx = agent_i.v_pref * dir_x;
        agent_i.vz = agent_i.v_pref * dir_z;
      }
      agent_i.vx = 0.9999*agent_i.vx;
      agent_i.vz = 0.9999*agent_i.vz;      
    });

  }

  /*  -----------------------  */



  const AGENTSIZE = RADIUS * 2; 
  const epsilon = 0.0001;
  const timestep = 0.03;
  const ITERNUM =3;

  agentVelocityPlanner();

  sceneEntities.forEach(function (item) {
    item.px = item.x + timestep*item.vx; 
    item.pz = item.z + timestep*item.vz; 
    item.py = item.y + timestep*item.vy;
  });


  let pbdIters = 0;
  var agent_a, agent_b, desDistance, i,j, idx = 0;

  while(pbdIters<ITERNUM)
  {
      idx = 0;
      while(idx < world.distanceConstraints.length)
      {
          desDistance = world.distanceConstraints[idx].distance;
          agent_a = sceneEntities[world.distanceConstraints[idx].idx_a]
          agent_b = sceneEntities[world.distanceConstraints[idx].idx_b]         
          distanceConstraint(agent_a,agent_b, desDistance);
          idx+=1; 
      }  
      i=0;
      while(i<sceneEntities.length)
      {
          j=i+1;
          while(j<sceneEntities.length)
          {
            collisionConstraint(sceneEntities[i],sceneEntities[j])
            j+=1;
          }
          i+=1
      }
    pbdIters+=1;
  }


  sceneEntities.forEach(function (item) {
    item.vx = (item.px-item.x)/timestep;
    item.vz = (item.pz-item.z)/timestep;
    item.vy = (item.py-item.y)/timestep;
    item.x = item.px; 
    item.z = item.pz; 
    item.y = item.py; 

    if(item.x < -world.x/2)
    {
      item.x = -world.x/2;
    }
    else if(item.x > world.x/2)
    {
      item.x = world.x/2; 
    }
    if(item.z < -world.z/2)
    {
      item.z = -world.z/2;
    }
    else if(item.z > world.z/2)
    {
      item.z= world.z/2; 
    }
  });

}
