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
    isolation: 20,
    renderVertNorms: false,
    renderBillboards: false
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
    var resolution = 20;
    var size = 51;
    volume = MarchingCubes(size, resolution);
    volume.init();
    volume.scene = scene;
    volume.parameters = parameters;


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
    var isoVal = simulationFolder.add(parameters, 'isolation').min(10.0).max(40).step(0.01).name('Iso-value');

    var debugFolder = gui.addFolder('Debug');
    debugFolder.open();
    var showVertNorms = debugFolder.add( parameters, 'renderVertNorms' ).name('Vert. norms');
    var showBillboards = debugFolder.add( parameters, 'renderBillboards' ).name('Render billboards');
    


    isoVal.onChange(function(jar){ 
        volume.setISO(jar); 
    });

    showVertNorms.onChange(function(jar){
        if(jar){
            scene.add(volume.meshVertNormals);
        } else {
            scene.remove(volume.meshVertNormals);
        }
    });

    showBillboards.onChange(function(jar){
        if(jar){
            scene.add(volume.particles);
        } else {
            scene.remove(volume.particles)
        }
        volume.parameters = parameters;
    });

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