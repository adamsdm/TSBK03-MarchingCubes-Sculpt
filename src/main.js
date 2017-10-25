if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var stats;


var camera, controls, scene, renderer;
var volume;

var pathToShaders = '/src/shaders';
var pathToChunks  = '/src/chunks';

var shaders = new ShaderLoader( pathToShaders , pathToChunks );
shaders.load( 'vert' , 'VERT'  , 'vertex'      );
shaders.load( 'frag' , 'FRAG'  , 'fragment'    );

shaders.shaderSetLoaded = function(){
    init();
    animate();
    displayGUI();
}

// Initial parameter values
var parameters = {
    isolation: 20
}

function init() {

    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0x42cbf4 );

    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    var container = document.getElementById('container');
    container.appendChild( renderer.domElement );

    camera = new THREE.PerspectiveCamera( 60, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set(0,0,100);

    controls = new THREE.OrbitControls( camera, renderer.domElement );

    // Marching cubes
    var resolution = 51;
    var size = 51;
    volume = MarchingCubes(size, resolution);
    volume.init();
    volume.scene = scene;
    scene.add( volume.particles );


    // lights
    var light = new THREE.DirectionalLight( 0xffffff );
    light.position.set( 1, 1, 1 );
    scene.add( light );

    var light = new THREE.DirectionalLight( 0x002288 );
    light.position.set( -1, -1, -1 );
    scene.add( light );

    var light = new THREE.AmbientLight( 0x222222 );
    scene.add( light );

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );

}

function displayGUI(){
    var gui = new dat.GUI();
    var jar;


    var simulationFolder = gui.addFolder('Simulation');
    simulationFolder.open();
    var isoVal = simulationFolder.add(parameters, 'isolation').min(10.0).max(25).step(0.01).name('Isolation');


    isoVal.onChange(function(jar){ volume.setISO(jar); })

}

function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize( window.innerWidth, window.innerHeight );

}

function animate() {

    requestAnimationFrame( animate );

    controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true

    stats.update();
    render();

}

function render() {
    renderer.render( scene, camera );
}