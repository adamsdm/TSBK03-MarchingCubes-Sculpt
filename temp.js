if ( ! Detector.webgl ) Detector.addGetWebGLMessage();

var container, stats;
var camera, scene, renderer, controls;
var mesh;
var uniforms;


var pathToShaders = '/src/shaders';
var pathToChunks  = '/src/chunks';

var shaders = new ShaderLoader( pathToShaders , pathToChunks );
shaders.load( 'vert' , 'VERT'  , 'vertex'      );
shaders.load( 'frag' , 'FRAG'  , 'fragment'    );

shaders.shaderSetLoaded = function(){
    init();
    animate();
}

function init() {
    camera = new THREE.PerspectiveCamera( 45, window.innerWidth / window.innerHeight, 1, 1000 );
    camera.position.z = 1;
    scene = new THREE.Scene();
    
    renderer = new THREE.WebGLRenderer();
    renderer.setPixelRatio( window.devicePixelRatio );
    
    
    stats = new Stats();
    document.body.appendChild( renderer.domElement );
    document.body.appendChild( stats.dom );
    window.addEventListener( 'resize', onWindowResize, false );

    // controls
    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.maxPolarAngle = Math.PI * 0.5;
    controls.minDistance = 1000;
    controls.maxDistance = 7500;
    
    uniforms = {
        time:       { value: 1.0 },
        resolution: { value: new THREE.Vector2() }
    };

    var geometry = new THREE.BoxGeometry( 1, 1, 1 );
    var material = new THREE.ShaderMaterial( {
        uniforms: uniforms,
        vertexShader: shaders.vs.VERT,
        fragmentShader: shaders.fs.FRAG
    } );

    mesh = new THREE.Mesh( geometry, material );
    scene.add( mesh );



    onWindowResize();
}
function onWindowResize( event ) {
    renderer.setSize( window.innerWidth, window.innerHeight );
    uniforms.resolution.value.x = renderer.domElement.width;
    uniforms.resolution.value.y = renderer.domElement.height;
}
//
function animate() {
    requestAnimationFrame( animate );
    render();
    controls.update(); // required if controls.enableDamping = true, or if controls.autoRotate = true
    stats.update();
}
function render() {
    uniforms.time.value += 0.05;
    renderer.render( scene, camera );
}