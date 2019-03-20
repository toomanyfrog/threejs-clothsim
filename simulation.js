if ( WEBGL.isWebGLAvailable() === false ) {
    document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}

/*
**  Make cloth fall in gravity
**  Make interactive cloth: click and drag to add force
**  Fix rest distance to be dynamic
**  Add different parametric geometry
*/

var container, stats;
var camera, gui, scene, renderer, raycaster;
var mouse = new THREE.Vector2();
var raycastThreshold = 0.1;
var play = false;

var clothMesh, clothGeometry, cloth;
var params = {
    width: 500,
    height: 500,
    slices: 5,
    stacks: 5,
    restart: function() { destroyCloth(); initCloth(); },
    playpause: function() { if (!play) {play = true;} else {play=false} }
}

init();
animate();

function initGUI() {
    gui = new dat.GUI();
    gui.add(params, 'width', 10, 1000);
    gui.add(params, 'height', 10, 1000);
    gui.add(params, 'slices', 5, 80, 5);
    gui.add(params, 'stacks', 5, 80, 5);
    gui.add(params, 'restart');
    gui.add(params, 'playpause')
}

function initCloth() {
    // create cloth
    clothGeometry = new THREE.ParametricBufferGeometry(
                        THREE.ParametricGeometries.plane(params.width,params.height), params.slices, params.stacks );
    clothGeometry = new THREE.ParametricBufferGeometry(plane45(params.width,params.height, 100),
                        params.slices, params.stacks );
    //clothGeometry = new THREE.ParametricBufferGeometry(THREE.ParametricGeometries.klein, 50, 50 );
    //clothGeometry.scale(20,20,20);

    var material = new THREE.MeshBasicMaterial( {color: 0x000000, side: THREE.DoubleSide, wireframe: true} );
    clothMesh = new THREE.Mesh( clothGeometry, material );
    clothMesh.position.set( 0, 50, 0 );
    clothMesh.castShadow = true;
    scene.add( clothMesh );
    cloth = new Cloth(clothMesh);
}
function destroyCloth() {
    scene.remove(clothMesh);
    clothGeometry.dispose();
}

function init() {
    initGUI();
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    scene();
    initCloth();
    models();

    // renderer

    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );

    container.appendChild( renderer.domElement );

    renderer.gammaInput = true;
    renderer.gammaOutput = true;

    renderer.shadowMap.enabled = true;

    // controls
    var controls = new THREE.OrbitControls( camera, renderer.domElement );
    controls.maxPolarAngle = Math.PI;
    controls.minDistance = 1000;
    controls.maxDistance = 5000;

    //raycaster
    raycaster = new THREE.Raycaster();

    // performance monitor
    stats = new Stats();
    container.appendChild( stats.dom );
    //
    window.addEventListener( 'resize', onWindowResize, false );
    document.addEventListener( 'mousedown', onDocumentMouseDown, false );
}

function animate() {
    requestAnimationFrame( animate );
    var time = Date.now();
    if (play)  cloth.simulate( time );
    render();
    stats.update();
}

function render() {

    for (var i=0; i<cloth.particles.length; i++) {
        p = cloth.particles[i];
        clothGeometry.getAttribute('position').setXYZ(i, p.position.x, p.position.y, p.position.z);
    }
    clothGeometry.attributes.position.needsUpdate = true;
    renderer.render( scene, camera );
}

function scene() {
    // scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color( 0xcce0ff );
    scene.fog = new THREE.Fog( 0xcce0ff, 500, 10000 );

    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 1000, 50, 1500 );

    // lights
    scene.add( new THREE.AmbientLight( 0x666666 ) );
    var light = new THREE.DirectionalLight( 0xdfebff, 1 );
    light.position.set( 50, 200, 100 );
    light.position.multiplyScalar( 1.3 );
    light.castShadow = true;
    light.shadow.mapSize.width = 1024;
    light.shadow.mapSize.height = 1024;

    var d = 300;
    light.shadow.camera.left = - d;
    light.shadow.camera.right = d;
    light.shadow.camera.top = d;
    light.shadow.camera.bottom = - d;
    light.shadow.camera.far = 1000;

    scene.add( light );
}

function yPlane( width, height ) {
	return function ( u, v, target ) {
		var x = ( u - 0.5 ) * width;
		var y = ( v + 0.5 ) * height;
		var z = 0;
		target.set( x, y, z );
	};
}
function plane45( width, height, depth ) {
	return function ( u, v, target ) {
		var x = ( u - 0.5 ) * width;
		var y = ( v + 0.5 ) * height;
		var z = v * depth;
		target.set( x, y, z );
	};
}

function models() {
    //create ground
    var mesh = new THREE.Mesh(  new THREE.PlaneBufferGeometry( 20000, 20000 ),
                                new THREE.MeshBasicMaterial( {color: 0x555555 } ) );
    mesh.position.y = - 250;
    mesh.rotation.x = - Math.PI / 2;
    mesh.receiveShadow = true;
    scene.add( mesh );

    //object.customdepthmaterial
}

function onDocumentMouseDown( event ) {
	event.preventDefault();
	mouse.x = ( event.clientX / window.innerWidth ) * 2 - 1;
	mouse.y = - ( event.clientY / window.innerHeight ) * 2 + 1;
    raycaster.setFromCamera(mouse,camera);
    var intersects = raycaster.intersectObject( clothMesh );
    if (intersects.length > 0) {
        console.log("intersected");
        var intersect = intersects[0];
        console.log(intersect.uv);
        console.log(intersect.face);
    }
}
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
