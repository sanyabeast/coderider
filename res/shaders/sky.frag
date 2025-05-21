#ifdef GL_ES
precision highp float;
#endif

uniform vec3 skyColor1;
uniform vec3 skyColor2;

varying vec2 vUv;

void main(void) {
    // vUv.y goes from 0.0 (bottom) to 1.0 (top)
    vec3 color = mix(skyColor1, skyColor2, vUv.y);
    gl_FragColor = vec4(color, 1.0);
}
