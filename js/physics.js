export function step(RADIUS, sceneEntities, world) {
    const AGENTSIZE = RADIUS * 2;
    const timestep = 0.015;
    const epsilon = 0.001;
    const ITERNUM = 3;
    const gravity = -5.98;
    let soundEvent;


    //start 
    // dragged ball has 
    // item.invmass =0
    // task 1: make the balls less bouncy as they hit the floor. balls should 
    // .       be on top of the floor, not intersect the floor 
    // task 2: make all balls attracted to the dragged ball

    sceneEntities.forEach(function(item) {
        //item.vx = item.vx + timestep*gravity; 
        //item.vz = item.vz + timestep*gravity; 
        item.vy = item.vy + timestep * gravity;

        // damping
        item.vx = item.vx * 0.9999;
        item.vy = item.vy * 0.9999;
        item.vz = item.vz * 0.9999;
        // predicted positions
        item.px = item.x + timestep * item.vx;
        item.pz = item.z + timestep * item.vz;
        item.py = item.y + timestep * item.vy;

    });

    //epilouge
    sceneEntities.forEach(function(item) {
        item.vx = (item.px - item.x) / timestep;
        item.vz = (item.pz - item.z) / timestep;
        item.vy = (item.py - item.y) / timestep;
        item.x = item.px;
        item.z = item.pz;
        item.y = item.py;


        if (item.x < -world.x / 2) {
            item.x = -world.x / 2;
        } else if (item.x > world.x / 2) {
            item.x = world.x / 2;
        }

        if (item.z < -world.z / 2) {
            item.z = -world.z / 2;
        } else if (item.z > world.z / 2) {
            item.z = world.z / 2;
        }

        if (item.y < 0.0) {
            item.vy = -item.vy
            /* 
            TODO add code as needed 
            soundEvent = new CustomEvent("jumpEvent", {
                detail: {
                    object: item
                }
            });

            ...dispatchEvent(soundEvent);
            */
        }
    });




    /*  -----------------------  */
}