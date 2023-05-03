# cs485-wreckingBall

Andrew Snedeker & Jibran Absarulislam

Instructions: 
1) Run server.py, and connect to http://localhost:1337/
2) From this page, click on the link "Wrecking Ball Project." This will load the simulation in your browser window.
3) In order to start the script, click "Start Script" at the top of the page.<br><br>
  a) There are sliders that adjust the values of the timestep variable and breakingThreshold variable. The default values are optimal. Increasing the timestep      will make the simulation run faster. Reducing the breaking threshold will make the bricks easier to break. Increasing the breaking threshold will make        the bricks hard to break.<br><br>
  b) There are five predefined structures that can be implemented. In order to simulate each structure, the layoutPreset variable needs to be modified.              This variable can be found in main.js on line 57. The following is a a list of each value and the corresponding structures associated with those values:
  
     const layoutPreset = 1;  Wall laid flat, resembling a paved area of bricks <br>
     const layoutPreset = 2;  Wall standing straight up <br>
     const layoutPreset = 3;  Pillars arranged diagonally, forming a diagonal wall <br>
     const layoutPreset = 4;  Pyramid structure <br>
     const layoutpreset = 5;  4x4x4 cube <br>
     
