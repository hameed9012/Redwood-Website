export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uRippleOrigin;
  uniform float uRippleTime;
  uniform float uRippleStrength;
  varying vec3 vWorld;
  varying float vHeight;

  float wave(vec2 p, vec2 d, float k, float s, float a) {
    return a * sin(dot(normalize(d), p) * k + uTime * s);
  }

  void main() {
    vec3 pos = position;
    vec2 p = pos.xy; // local XY (before the -90deg X rotation) -> world XZ
    float h = 0.0;
    h += wave(p, vec2(1.0, 0.2), 0.55, 0.9, 0.35);
    h += wave(p, vec2(-0.4, 1.0), 0.8, 1.1, 0.22);
    h += wave(p, vec2(0.7, -0.6), 1.3, 1.6, 0.12);
    h += wave(p, vec2(0.2, 0.9), 2.1, 2.2, 0.06);

    float d = distance(p, uRippleOrigin);
    float ring = sin(d * 3.0 - uRippleTime * 6.0) * exp(-d * 0.35) * exp(-uRippleTime * 1.2);
    h += ring * uRippleStrength * 0.8;

    pos.z += h;
    vHeight = h;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const waterFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying vec3 vWorld;
  varying float vHeight;

  void main() {
    float t = clamp(vHeight * 0.6 + 0.5, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, t);
    float glint = smoothstep(0.86, 1.0, sin(vWorld.x * 0.15 + vWorld.z * 0.1 + uTime * 0.4));
    col += glint * 0.18;
    gl_FragColor = vec4(col, 0.92);
  }
`;
