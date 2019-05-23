#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 camera;

uniform vec3 diffuse;
uniform vec3 diffuseB;
uniform float grid;
uniform float waves;
uniform float amplitude;

varying vec2 vUv;
varying float cameraX;

void main( void ) {
	float gridS = grid;
	float layer = ceil( (vUv.y + 0.5) * gridS ) / gridS;
	float parallax = 500.;
	float speed = 0.0000025;
	float cameraOffset = camera.x * speed * ( 1./pow(layer, 2.) * parallax );
	float offset = (sin((vUv.x + cameraOffset) * ((waves * layer) + layer)) / ( waves * layer )) * ( amplitude * layer ) + 0.2;
	float y = mod( ( mod( vUv.y + offset, 1. ) ), ( 1. / (gridS) ) ) * (gridS);



	gl_FragColor = vec4( mix(diffuse.xyz, diffuseB.xyz, y ), 1.0 );
}