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
var bgCol = 0x374A5A;
var matStdObjects;

var clothMesh, clothGeometry, cloth, floorMesh;
var clothMat = new THREE.MeshStandardMaterial({color:0x200311});
var constraintTypes = "";
var params = {
    width: 500,
    height: 500,
    slices: 5,
    stacks: 5,
    clothmodel: "constraints",
    stretch: true,
    shear: true,
    bend: true,
    restart: function() { destroyCloth(); initCloth(); },
    playpause: function() { if (!play) {play = true;} else {play=false} },
    floorheight: -250,
    pinCenter: false,
    pinTopLeft: true,
    pinTopRight: false
}
var pinOptions = {
    center: [Math.floor(params.slices/2), Math.floor(params.stacks/2)],
    topleft: [0,0],
    topright: [params.slices, 0]
};
function recalculatePins() {
    pinOptions = {
        center: [Math.floor(params.slices/2), Math.floor(params.stacks/2)],
        topleft: [0,0],
        topright: [params.slices, 0]
    };
}
var materialProperties = {
    wireframe: true,
    roughness: 0.8,
    metalness: 0,
    'color': clothMat.color.getHex()
};

init();
animate();

function initGUI() {
    gui = new dat.GUI();
    var f1 = gui.addFolder('Cloth');
    f1.add(params, 'width', 10, 1000);
    f1.add(params, 'height', 10, 1000);
    f1.add(params, 'slices', 5, 80, 5);
    f1.add(params, 'stacks', 5, 80, 5);
    var f1a = gui.addFolder('Material');
    f1a.add(materialProperties, 'wireframe');
    f1a.add(materialProperties, 'roughness', 0, 1);
    f1a.add(materialProperties, 'metalness', 0, 1);
    f1a.addColor(materialProperties, 'color').onChange(function(val) {
        clothMat.color.setHex(val);
        render();
    });
    var f2 = gui.addFolder('Simulation');
    f2.add(params, 'clothmodel', ["constraints", "springmass"]);
    f2.add(params, 'stretch');
    f2.add(params, 'shear');
    f2.add(params, 'bend');
    var f3 = gui.addFolder('Constants');
    f3.add(CONSTANTS, 'MASS', 0.1, 2).onChange(function() { recalculateDependentConstants(); });
    f3.add(CONSTANTS, 'TIMESTEP', 0.01, 1).onChange(function() { recalculateDependentConstants(); });
    f3.add(CONSTANTS, 'CONSTRAINT_ALPHA', 0, 1);
    f3.add(CONSTANTS, 'CONSTRAINT_ITERS', 3, 30);
    f3.add(CONSTANTS, 'SPRING_CONST', 0, 5);
    f3.add(CONSTANTS, 'DAMPING_CONST', 0.01, 5);
    f3.add(CONSTANTS, 'GRAVITY').onChange(function() { recalculateDependentConstants(); });
    var f4 = gui.addFolder('Environment');
    f4.add(params, 'floorheight', -500, 500);
    f4.add(params, 'pinCenter').onChange(function(b) { if (b) {cloth.addPin(pinOptions.center); } else { cloth.removePin(pinOptions.center)} });
    f4.add(params, 'pinTopLeft').onChange(function(b) { if (b) {cloth.addPin(pinOptions.topleft); } else { cloth.removePin(pinOptions.topleft)} });
    f4.add(params, 'pinTopRight').onChange(function(b) { if (b) {cloth.addPin(pinOptions.topright); } else { cloth.removePin(pinOptions.topright)} });
    gui.add(params, 'restart');
    gui.add(params, 'playpause');
}

function initCloth() {
    // create cloth
    clothGeometry = new THREE.ParametricBufferGeometry(
                        THREE.ParametricGeometries.plane(params.width,params.height), params.slices, params.stacks );
    clothGeometry = new THREE.ParametricBufferGeometry(plane45(params.width,params.height, 100),
                        params.slices, params.stacks );
    //clothGeometry = new THREE.ParametricBufferGeometry(THREE.ParametricGeometries.klein, 50, 50 );
    //clothGeometry.scale(20,20,20);

    clothMat = new THREE.MeshStandardMaterial({ color:materialProperties.color, side: THREE.DoubleSide,
									metalness: materialProperties.metalness,
									roughness: materialProperties.roughness,
                                    wireframe: materialProperties.wireframe} );
    //var material = new THREE.MeshPhongMaterial( {color: 0x2194ce, side: THREE.DoubleSide, wireframe: params.wireframe} );
    clothMesh = new THREE.Mesh( clothGeometry, clothMat );
    clothMesh.position.set( 0, 50, 0 );
    clothMesh.castShadow = true;
    clothMesh.receiveShadow = true;
    scene.add( clothMesh );

    // constraint types
    constraintTypes = "";
    if (params.stretch) constraintTypes += "st";
    if (params.shear) constraintTypes += "sh";
    if (params.bend) constraintTypes += "b";
    cloth = new Cloth(clothMesh, constraintTypes);
    if (params.pinCenter) cloth.addPin(pinOptions.center);
    if (params.pinTopLeft) cloth.addPin(pinOptions.topleft);
    if (params.pinTopRight) cloth.addPin(pinOptions.topright);
    //cloth.addPin([Math.floor(params.slices/2), Math.floor(params.stacks/2)]);
    pinOptions = {
        center: [Math.floor(params.slices/2), Math.floor(params.stacks/2)],
        topleft: [0,0],
        topright: [params.slices, 0]
    }
}
function destroyCloth() {
    scene.remove(clothMesh);
    clothGeometry.dispose();
}

function init() {
    initGUI();
    container = document.createElement( 'div' );
    document.body.appendChild( container );
    // camera
    camera = new THREE.PerspectiveCamera( 30, window.innerWidth / window.innerHeight, 1, 10000 );
    camera.position.set( 1000, 50, 1500 );

    scene2();
    lights();
    initCloth();
    models();

    // renderer
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setSize( window.innerWidth, window.innerHeight );
    renderer.gammaInput = true;
    renderer.gammaOutput = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild( renderer.domElement );


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
    //document.addEventListener( 'mousedown', onDocumentMouseDown, false );
}

function animate() {
    requestAnimationFrame( animate );
    var time = Date.now();
    if (play)  cloth.simulate( time, params.floorheight, params.clothmodel );
    render();
    stats.update();
}

function render() {

    for (var i=0; i<cloth.particles.length; i++) {
        p = cloth.particles[i];
        clothGeometry.getAttribute('position').setXYZ(i, p.position.x, p.position.y, p.position.z);
    }
    clothGeometry.attributes.position.needsUpdate = true;
    floorMesh.position.y = params.floorheight;

    renderer.render( scene, camera );
}

function lights() {
    // scene
    //scene = new THREE.Scene();
    //scene.background = new THREE.Color( bgCol );
    //scene.fog = new THREE.Fog( bgCol, 500, 10000 );
	var ambientLight = new THREE.AmbientLight( bgCol );
	scene.add( ambientLight );
	var lights = [];
	lights[ 0 ] = new THREE.PointLight( 0xffffff, 1, 0 );
	lights[ 1 ] = new THREE.PointLight( 0xffffff, 1, 0 );
	lights[ 2 ] = new THREE.PointLight( 0xffffff, 1, 0 );
	lights[ 0 ].position.set( 0, 200, 0 );
	lights[ 1 ].position.set( 100, 200, 100 );
	lights[ 2 ].position.set( - 100, - 200, - 100 );
	scene.add( lights[ 0 ] );
	scene.add( lights[ 1 ] );
	scene.add( lights[ 2 ] );
}
function scene2() {
	scene = new THREE.Scene();
	var ambient = new THREE.AmbientLight( 0xffffff, 0.1 );
	scene.add( ambient );
	rectLight = new THREE.RectAreaLight( 0xffffff, 2, 7000, 7000 );
	rectLight.position.set( 0, 500, 2000 );
    rectLight.rotateY(Math.PI/4);
	scene.add( rectLight );
	var rectLightMesh = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { side: THREE.BackSide } ) );
	rectLightMesh.scale.x = rectLight.width;
	rectLightMesh.scale.y = rectLight.height;
	rectLight.add( rectLightMesh );
	//var rectLightMeshBack = new THREE.Mesh( new THREE.PlaneBufferGeometry(), new THREE.MeshBasicMaterial( { color: 0x080808 } ) );
	//rectLightMesh.add( rectLightMeshBack );

	matStdObjects = new THREE.MeshStandardMaterial( { color: 0xA00000, roughness: 0, metalness: 0, side: THREE.DoubleSide} );
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
    floorMesh = new THREE.Mesh(  new THREE.PlaneBufferGeometry( 20000, 20000 ),
                                new THREE.MeshStandardMaterial( {color: 0x555555, roughness:0, metalness: 0} ) );
    floorMesh.position.y = - 250;
    floorMesh.rotation.x = - Math.PI / 2;
    floorMesh.receiveShadow = true;
    scene.add( floorMesh );

    //object.customdepthmaterial
}
/*
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
} */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}
