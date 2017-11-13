if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var stats;
var clock = new THREE.Clock(true);
var waterMaterial;

var camera, controls, scene, renderer;
var volume, raycaster, mouse;

var pathToShaders = './src/shaders';
var pathToChunks  = './src/chunks';

var shaders = new ShaderLoader( pathToShaders , pathToChunks );
shaders.load( 'vert' , 'VERT'  , 'vertex'      );
shaders.load( 'frag' , 'FRAG'  , 'fragment'    );
shaders.load( 'waterFrag', 'WATERFRAG', 'fragment' );

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


    var time = 1.0;
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
    var helperGeometry = new THREE.SphereGeometry(2, 32, 32);

    helper = new THREE.Mesh(helperGeometry, new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.7, color: 0xffffff }) );
    scene.add( helper );

    //water plane
    var waterPlane = new THREE.PlaneGeometry(size,size,20,20);

    waterMaterial = new THREE.ShaderMaterial( {
            uniforms: {
                lightPos: { value: pointLight.position },
                cameraPos: { value: camera.position },
                time: {type: 'f', value: time}
            },

            vertexShader: shaders.vertexShaders.VERT,
            fragmentShader: shaders.fragmentShaders.WATERFRAG
        }
    );
    waterMaterial.transparent = true;

    var water = new THREE.Mesh(waterPlane, waterMaterial);
    water.rotateX(-Math.PI/2);
    water.position.y = -33;
    scene.add(water);

    stats = new Stats();
    container.appendChild( stats.dom );

    window.addEventListener( 'resize', onWindowResize, false );
    container.addEventListener( 'mousemove', onMouseMove, false );
    container.addEventListener('mousedown', onMouseClick, false);
    

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
    waterMaterial.uniforms.time.value += clock.getDelta();
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

function onMouseClick(event){
    mouse.x = (event.clientX / renderer.domElement.clientWidth) * 2 - 1;
    mouse.y = - (event.clientY / renderer.domElement.clientHeight) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);
    
    var intersects = raycaster.intersectObject(mesh);
    var x,y,z, i,j,k;
    if (intersects.length > 0) {

        // x,y,z position
        x = intersects[0].point.x;
        y = intersects[0].point.y;
        z = intersects[0].point.z;

        //console.log(volume.resolution);

        i = Math.round((x / volume.dx) + (volume.resolution / 2));
        j = Math.round((y / volume.dy) + (volume.resolution / 2));
        k = Math.round((z / volume.dz) + (volume.resolution / 2));

        console.log(i,j,k);

        volume.paint(i,j,k);


    }
}