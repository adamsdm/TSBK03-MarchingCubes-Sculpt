if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var stats;


var camera, controls, scene, renderer;
var volume, raycaster, mouse;

var pathToShaders = './src/shaders';
var pathToChunks  = './src/chunks';

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
    isolation: 0,
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

    // lights
    var pointLight = new THREE.PointLight(0xff0000, 1, 100);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    var sphereSize = 1;
    var pointLightHelper = new THREE.PointLightHelper(pointLight, sphereSize);
    scene.add(pointLightHelper);

    // Marching cubes
    var resolution = 71;
    var size = 101;
    volume = MarchingCubes(size, resolution);
    var volumeMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                lightPos: { value: pointLight.position },
                cameraPos: { value: camera.position },
            },

            vertexShader: shaders.vertexShaders.VERT,        
            fragmentShader: shaders.fragmentShaders.FRAG
        } 
    );

    volume.init(volumeMaterial);
    volume.scene = scene;
    volume.parameters = parameters;

    // Raycasting
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    var helperGeometry = new THREE.CylinderGeometry( 0, 2, 4, 3 );
    helperGeometry.translate( 0, 2, 0 );
    helperGeometry.rotateX( Math.PI / 2 );
    helper = new THREE.Mesh( helperGeometry, new THREE.MeshNormalMaterial() );
    scene.add( helper );


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
    var isoVal = simulationFolder.add(parameters, 'isolation').min(-10.0).max(40).step(0.01).name('Iso-value');

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