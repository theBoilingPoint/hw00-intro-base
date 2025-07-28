import {vec3, vec4} from 'gl-matrix';
const Stats = require('stats-js');
import * as DAT from 'dat.gui';
import Icosphere from './geometry/Icosphere';
import Square from './geometry/Square';
import Cube from './geometry/Cube';
import OpenGLRenderer from './rendering/gl/OpenGLRenderer';
import Camera from './Camera';
import {setGL} from './globals';
import ShaderProgram, {Shader} from './rendering/gl/ShaderProgram';
import Drawable from './rendering/gl/Drawable';

// Define an object with application parameters and button callbacks
// This will be referred to by dat.GUI's functions that add GUI elements.
const controls = {
  geometry: 'icosphere',
  center: { x: 0, y: 0, z: 0 },
  tesselations: 5,
  albedo: [255, 0, 0],
  'Load Scene': loadScene, // A function pointer, essentially
};

const defaultCenter = vec3.fromValues(0, 0, 0);
const savedCenter: Record<string, vec3> = {
  icosphere: vec3.fromValues(0, 0, 0),
  square:    vec3.fromValues(0, 0, 0),
  cube:      vec3.fromValues(0, 0, 0),
};
let icosphere: Icosphere;
let square: Square;
let cube: Cube;
let prevTesselations: number = 5;

function guiToVec3(): vec3 {
  // controls.center is {x,y,z}
  return vec3.fromValues(
    controls.center.x,
    controls.center.y,
    controls.center.z
  );
}

function updateCenter() {
  const newPos = guiToVec3();

  // move the active mesh
  switch (controls.geometry) {
    case 'icosphere': icosphere.updateCenter(newPos); break;
    case 'square':    square.updateCenter(newPos);    break;
    case 'cube':      cube.updateCenter(newPos);      break;
  }
  // remember it
  vec3.copy(savedCenter[controls.geometry], newPos);
}

function currentGeometryList(): Drawable[] {
  switch (controls.geometry) {
    case 'icosphere': return [icosphere];
    case 'square':    return [square];
    case 'cube':      return [cube];
    default: return [];
  }
}

function loadScene() {
  icosphere = new Icosphere(defaultCenter, 1, controls.tesselations);
  square = new Square(defaultCenter);
  cube = new Cube(defaultCenter);
  
  icosphere.create();
  square.create();
  cube.create();
}

function main() {
  // Initial display for framerate
  const stats = Stats();
  stats.setMode(0);
  stats.domElement.style.position = 'absolute';
  stats.domElement.style.left = '0px';
  stats.domElement.style.top = '0px';
  document.body.appendChild(stats.domElement);

  // Add controls to the gui
  const gui = new DAT.GUI();
  const geomCtrl = gui.add(controls, 'geometry', ['icosphere', 'square', 'cube']);
  const centerFold = gui.addFolder('center');
  const cxCtrl = centerFold.add(controls.center, 'x').onChange(updateCenter);
  const cyCtrl = centerFold.add(controls.center, 'y').onChange(updateCenter);
  const czCtrl = centerFold.add(controls.center, 'z').onChange(updateCenter);
  const tessCtrl = gui.add(controls, 'tesselations', 0, 8).step(1);
  gui.addColor(controls, 'albedo').onChange((color) => {
    renderer.setAlbedo(
      color[0],
      color[1],
      color[2]
    );
  });
  gui.add(controls, 'Load Scene');

  function refreshCenterSliders(v: vec3): void {
    controls.center.x = v[0];
    controls.center.y = v[1];
    controls.center.z = v[2];
    cxCtrl.updateDisplay();
    cyCtrl.updateDisplay();
    czCtrl.updateDisplay();
  }

  const tessRow = tessCtrl.domElement.parentElement as HTMLElement; // the <li> element
  function updateGuiVisibility() {
    tessRow.style.display = controls.geometry === 'icosphere' ? '' : 'none';
  }

  geomCtrl.onChange((newGeom: string) => {
    refreshCenterSliders(savedCenter[newGeom]);
    updateCenter();
    updateGuiVisibility();
  });

  // get canvas and webgl context
  const canvas = <HTMLCanvasElement> document.getElementById('canvas');
  const gl = <WebGL2RenderingContext> canvas.getContext('webgl2');
  if (!gl) {
    alert('WebGL 2 not supported!');
  }
  // `setGL` is a function imported above which sets the value of `gl` in the `globals.ts` module.
  // Later, we can import `gl` from `globals.ts` to access it
  setGL(gl);

  // Initial call to load scene
  loadScene();

  const camera = new Camera(vec3.fromValues(0, 0, 5), vec3.fromValues(0, 0, 0));

  const renderer = new OpenGLRenderer(canvas);
  renderer.setClearColor(0.2, 0.2, 0.2, 1);
  renderer.setAlbedo(
    controls.albedo[0], 
    controls.albedo[1], 
    controls.albedo[2]);
  gl.enable(gl.DEPTH_TEST);

  const lambert = new ShaderProgram([
    new Shader(gl.VERTEX_SHADER, require('./shaders/lambert-vert.glsl')),
    new Shader(gl.FRAGMENT_SHADER, require('./shaders/lambert-frag.glsl')),
  ]);

  // This function will be called every frame
  function tick() {
    camera.update();
    stats.begin();
    gl.viewport(0, 0, window.innerWidth, window.innerHeight);
    renderer.clear();
    if(controls.tesselations != prevTesselations)
    {
      prevTesselations = controls.tesselations;
      icosphere = new Icosphere(vec3.fromValues(0, 0, 0), 1, prevTesselations);
      icosphere.create();
    }
    renderer.render(camera, lambert, currentGeometryList());
    stats.end();

    // Tell the browser to call `tick` again whenever it renders a new frame
    requestAnimationFrame(tick);
  }

  window.addEventListener('resize', function() {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.setAspectRatio(window.innerWidth / window.innerHeight);
    camera.updateProjectionMatrix();
  }, false);

  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.setAspectRatio(window.innerWidth / window.innerHeight);
  camera.updateProjectionMatrix();

  // Start the render loop
  tick();
}

main();
