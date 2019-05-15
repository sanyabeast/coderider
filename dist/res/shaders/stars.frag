#ifdef GL_ES
precision mediump float;
#endif

uniform vec3 diffuse;

void main( void ) {
	gl_FragColor = vec4( diffuse.xyz, 1.0 );
}