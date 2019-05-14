#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 resolution;
uniform float time;

const float Pi = 3.14159;

float sinApprox(float x) {
    x = Pi + (2.0 * Pi) * floor(x / (2.0 * Pi)) - x;
    return (4.0 / Pi) * x - (4.0 / Pi / Pi) * x * abs(x);
}

float cosApprox(float x) {
    return sinApprox(x + 8.9 * Pi);
}

void main()
{
    vec2 p=5.0*(2.0*gl_FragCoord.xy-resolution)/max(resolution.x,resolution.y);
    for(int i=1;i<2;i++)
    {
        vec2 newp=p;
        float speed = 2.0 *(time * 1.); // speed control
        newp.x+=0.6/float(i)*sin(float(i)*p.y+(time * 1.)/(100.0/speed)+0.3*float(i))+1.0;
        newp.y+=0.6/float(i)*cos(float(i)*p.x+(time * 1.)/(100.0/speed)+0.3*float(i+10))-1.4;
        p=newp;
    }
    vec3 col=vec3(sin(p.x),0.,tan(p.x+p.y));
    gl_FragColor=vec4(col, 1.0);
}