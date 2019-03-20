var MASS = 0.1;
var TIMESTEP = 0.1;
var TIMESTEP_2 = TIMESTEP * TIMESTEP;
var CONSTRAINT_ALPHA = 0.1;
var restDistance = 100;
var GRAVITY = 9.81;
var WEIGHT = new THREE.Vector3( 0, -GRAVITY, 0 ).multiplyScalar( MASS );

var lastTime;
var elapsedTime = 0;
var leftoverTime = 0;

function index(u,v,cols) {
	// PlaneBufferGeometry iterates v then u
	return u + v*(cols+1);
}

class Cloth {
    constructor(mesh) {
		// a PlaneBufferGeometry object
		var geometry = mesh.geometry;
		var meshVertices = geometry.getAttribute('position');
        this.width = geometry.parameters.slices;
        this.height = geometry.parameters.stacks;
	//	this.restDistance =
		this.particles = []; 	//array of VerletParticle
		this.constraints = [];	//array of index pairs and dist-constraint
		var u,v;

		for (v=0; v<=this.height; v++) {
			for (u=0; u<=this.width; u++) {
				var i = index(u,v,this.width);
				var vertPos = new THREE.Vector3();
				vertPos.set(meshVertices.getX(i),
							meshVertices.getY(i),
							meshVertices.getZ(i));
				this.particles.push( new VerletParticle(vertPos, MASS) );
			}
		}

		// Structural constraints
		for (v=0; v<this.height; v++ ) {
			for ( u=0; u<this.width; u++ ) {
				this.constraints.push([
					this.particles[index(u,v,this.width)],
					this.particles[index(u,v+1,this.width)],
					restDistance]);
				this.constraints.push([
					this.particles[index(u,v,this.width)],
					this.particles[index(u+1,v,this.width)],
					restDistance]);
			}
		}
		for (v=0; v<this.height; v++) {
			this.constraints.push([	this.particles[index(this.width, v, this.width)],
									this.particles[index(this.width, v+1, this.width)],
									restDistance] );
		}
		for (u=0; u<this.width; u++) {
			this.constraints.push([	this.particles[index(u, this.height, this.width)],
									this.particles[index(u+1, this.height, this.width)],
									restDistance] );
		}

		//Shear constraints
		var diagonalDistance = Math.sqrt(restDistance*restDistance*2);
		for (v=0; v<this.height; v++ ) {
			for ( u=0; u<this.width; u++ ) {
				this.constraints.push([
					this.particles[index(u,v,this.width)],
					this.particles[index(u+1,v+1,this.width)],
					diagonalDistance]);
				this.constraints.push([
					this.particles[index(u+1,v,this.width)],
					this.particles[index(u,v+1,this.width)],
					diagonalDistance]);
			}
		}




    }
	addForce(f, opt) {
		switch(opt) {
			case "uniform":
				for (var i=0; i<this.particles.length; i++) {
					this.particles[i].addForce(f);
				}
				break;
			case "array":
				for (var i=0; i<this.particles.length; i++) {
					this.particles[i].addForce(f[i]);
				}
				break;
			case "aero":
				//loop over triangles and use face normal
				break;
			default:
		}
	}
	integrationStep() {
		for (var i=0; i<this.particles.length; i++) {
			this.particles[i].integrate();
		}
	}
	simulate(time) { // Date.now()
		//add forces, integrate, solve for constraints

		if (!lastTime) {
			lastTime = time;
			return;
		}
		this.addForce(WEIGHT, "uniform");

		this.integrationStep();
		this.satisfyConstraints(5);
		for ( var i = 0; i < this.particles.length; i ++ ) {
			var pos = this.particles[i].position;
			if ( pos.y < - 250 ) {
				pos.y = - 250;
			}
		}
		/*
		elapsedTime = time - lastTime + leftoverTime;
		lastTime = time;
		var numSteps = Math.floor(elapsedTime/TIMESTEP);
		leftoverTime = elapsedTime - numSteps*TIMESTEP;
		for (var i=0; i<numSteps; i++) {
			this.integrationStep();
			//this.satisfyConstraints(5);
			for ( var i = 0; i < this.particles.length; i ++ ) {
				var pos = this.particles[i].position;
				if ( pos.y < - 250 ) {
					pos.y = - 250;
				}
			}
		}*/

	}
    satisfyConstraints(iterations) {
		var diff = new THREE.Vector3();
		function fix(p1, p2, restLength) {
			diff.subVectors(p2.position, p1.position);
			var currentDist = diff.length();
			if (currentDist === 0) return;
			var correction = diff.multiplyScalar(1 - restLength/currentDist)
								.multiplyScalar(0.5)
								.multiplyScalar(CONSTRAINT_ALPHA);
			p1.position.add(correction);
			p2.position.sub(correction);
		}
		for (var iteration=0; iteration < iterations; iteration++) {
			for (var i=0; i<this.constraints.length; i++) {
				fix(this.constraints[i][0], this.constraints[i][1], this.constraints[i][2]);
			}
		}
	}
}


class VerletParticle {
	// position verlet
	constructor(pos, mass) {
		this.position = pos;
		this.mass = mass; this.massInv = 1/mass;
		this.previousPos = pos.clone(); // previous position
		this.acceleration = new THREE.Vector3();
		this.direction = new THREE.Vector3();
		this.force = new THREE.Vector3();
	}

	addForce(f) {
		// acceleration = force / mass
		// f is a THREE.Vector3()
		this.acceleration.add(
			this.force.copy(f).multiplyScalar(this.massInv)
		);
	}

	integrate() {
		// squared timestep
		var newPos = this.direction.subVectors(this.position, this.previousPos);
		newPos.add(this.position).add(this.acceleration.multiplyScalar(TIMESTEP_2));
		this.direction = this.previousPos;
		this.previousPos = this.position;
		this.position = newPos;
		this.acceleration.set(0,0,0);
	}
}
