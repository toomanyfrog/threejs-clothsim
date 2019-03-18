if ( WEBGL.isWebGLAvailable() === false ) {
  document.body.appendChild( WEBGL.getWebGLErrorMessage() );
}

var container, stats;
var camera, scene, renderer;

var clothGeometry;

init();
animate();

function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );
  scene();
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
  controls.maxPolarAngle = Math.PI * 0.5;
  controls.minDistance = 1000;
  controls.maxDistance = 5000;

  // performance monitor

  stats = new Stats();
  container.appendChild( stats.dom );

  //

  window.addEventListener( 'resize', onWindowResize, false );
}

function animate() {
  requestAnimationFrame( animate );
  var time = Date.now();
//  simulate( time );
  render();
  stats.update();
}

function render() {

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

function models() {
  // create models here
  var loader = new THREE.TextureLoader();

  var groundTexture = loader.load( 'textures/terrain/grasslight-big.jpg' );
  groundTexture.wrapS = groundTexture.wrapT = THREE.RepeatWrapping;
  groundTexture.repeat.set( 25, 25 );
  groundTexture.anisotropy = 16;

  var groundMaterial = new THREE.MeshLambertMaterial( { map: groundTexture } );

  var mesh = new THREE.Mesh( new THREE.PlaneBufferGeometry( 20000, 20000 ), groundMaterial );
  mesh.position.y = - 250;
  mesh.rotation.x = - Math.PI / 2;
  mesh.receiveShadow = true;
  scene.add( mesh );

}


function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
