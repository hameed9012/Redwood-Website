export const causticsVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Voronoi-ish animated caustics; looping but not obviously (spec §6.6).
export const causticsFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;

  vec2 hash2(vec2 p) {
    p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
    return fract(sin(p) * 43758.5453);
  }

  float voronoi(vec2 p) {
    vec2 n = floor(p);
    vec2 f = fract(p);
    float md = 1.0;
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        vec2 g = vec2(float(i), float(j));
        vec2 o = hash2(n + g);
        o = 0.5 + 0.5 * sin(uTime * 0.6 + 6.2831 * o);
        vec2 r = g + o - f;
        md = min(md, dot(r, r));
      }
    }
    return md;
  }

  void main() {
    vec2 uv = vUv * 6.0;
    float v = voronoi(uv);
    float caustic = pow(1.0 - v, 3.0);
    vec3 col = uColor * caustic * uIntensity;
    gl_FragColor = vec4(col, caustic * uIntensity);
  }
`;
