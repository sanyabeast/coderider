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
	float layer = floor( (vUv.y+0.5) * gridS ) / gridS;
	float parallax = 30.;
	float speed = 0.000001;
	float cameraOffset = ( camera.x / ( 1. / (speed) ) ) * ( gridS / (( pow(layer, 6.))) * parallax );
	float offset = (sin((vUv.x+cameraOffset) * (waves + layer)) / ( waves )) * ( amplitude * layer );
	float y = mod( ( mod( vUv.y + offset, 1. ) ), ( 1. / (gridS) ) ) * (gridS);



	gl_FragColor = vec4( mix(diffuse.xyz, diffuseB.xyz, y ), 1.0 );
}