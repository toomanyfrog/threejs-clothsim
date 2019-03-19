var MASS = 0.1;
var TIMESTEP = 0.06;
var TIMESTEP_2 = TIMESTEP * TIMESTEP;
var restDistance = 25;

var lastTime, elapsedTime;

function getIndex(u,v,cols) {
	// PlaneBufferGeometry iterates v then u
	return u + v*(cols+1);
}

class Cloth {
    constructor(geometry) {
		// a PlaneBufferGeometry object
		var meshVertices = geometry.attributes.position;
        this.width = geometry.parameters.width;
        this.height = geometry.parameters.height;
		this.particles = []; 	//array of VerletParticle
		this.constraints = [];	//array of index pairs and dist-constraint

		var u,v;
		for (v=0; v<=geometry.parameters.heightSegments; v++) {
			for (u=0; u<=geometry.parameters.widthSegments; u++) {
				var i = getIndex(u,v,geometry.parameters.widthSegments);
				var vertPos = [	meshVertices.getX(i),
								meshVertices.getY(i),
								meshVertices.getZ(i)];
				this.particles.push( new VerletParticle(vertPos, MASS) );
			}
		}
		for (v=0; v<height; v++ ) {
			for ( u=0; u<width; u++ ) {
				this.constraints.push([
					this.particles[ index(u,v) ],
					this.particles[ index(u,v+1) ],
					restDistance
				]);
				this.constraints.push([
					this.particles[ index(u,v) ],
					this.particles[ index(u+1,v) ],
					restDistance
				]);
			}
		}
    }

	simulate(time) { // Date.now()
		//add forces, integrate, solve for constraints
		if (!lastTime) {
			lastTime = time;
		}

	}
    satisfyConstraints() {

	}
}


class VerletParticle {
	// position verlet
	constructor(pos, mass) {
		this.position = new THREE.Vector3(pos[0], pos[1], pos[2]);
		this.mass = mass; this.massInv = 1/mass;
		this.previousPos = new THREE.Vector3(pos[0], pos[1], pos[2]); // previous position
		this.acceleration = new THREE.Vector3();
		this.dir = new THREE.Vector3();
	}

	addForce(f) {
		// acceleration = force / mass
		// f is a THREE.Vector3()
		this.acceleration.add(f.multiplyScalar(this.massInv));
	}

	integrate(timeStep2) {
		// squared timestep
		var newPos = new THREE.Vector3();
		this.dir.subVectors(this.position, this.previousPos);
		newPos.add(this.position).add(this.acceleration.multiplyScalar(timeStep2));
		this.previous = this.position;
		this.position = newPos;
		this.acceleration.set(0,0,0);
	}
}
