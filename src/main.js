if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var stats;


var camera, controls, scene, renderer;
var volume, raycaster, mouse;

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
    renderFaceNorms: false,
    wireframe: false,
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
    var resolution = 70;
    var size = 141;
    volume = MarchingCubes(size, resolution);
    volume.init();
    volume.scene = scene;
    volume.parameters = parameters;

    // Raycasting
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    //var helperGeometry = new THREE.CylinderGeometry( 0, 2, 4, 3 );
    var helperGeometry = new THREE.SphereGeometry( 6, 16, 16);
    helperGeometry.translate( 0, 0, 0 );
    helperGeometry.rotateX( Math.PI / 2 );
    helper = new THREE.Mesh( helperGeometry, new THREE.MeshBasicMaterial( {transparent: true, opacity: 0.7,color: 0xffffff} ) );
    scene.add( helper );

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
    container.addEventListener( 'mousemove', onMouseMove, false );

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
    var showFaceNorms = debugFolder.add( parameters, 'renderFaceNorms' ).name('Face. norms');
    var wireframe = debugFolder.add( parameters, 'wireframe' ).name('Wireframe');
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

    showFaceNorms.onChange(function(jar){
        if(jar){
            scene.add(volume.meshFaceNormals);
        } else {
            scene.remove(volume.meshFaceNormals);
        }
    });

    wireframe.onChange(function(jar){
        volume.volumeMaterial.wireframe = jar;
    })

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


function onMouseMove( event ) {    

    mouse.x = ( event.clientX / renderer.domElement.clientWidth ) * 2 - 1;
    mouse.y = - ( event.clientY / renderer.domElement.clientHeight ) * 2 + 1;

    raycaster.setFromCamera( mouse, camera );
    // See if the ray from the camera into the world hits one of our meshes
    var intersects = raycaster.intersectObject( mesh );
    // Toggle rotation bool for meshes that we clicked
    if ( intersects.length > 0 ) {
   
        helper.position.set( 0, 0, 0 );
        helper.lookAt( intersects[ 0 ].face.normal );
        helper.position.copy( intersects[ 0 ].point );    

    }
}