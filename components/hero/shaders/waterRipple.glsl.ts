export const waterRippleVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Cursor-reactive ripple/refraction distortion across the water layer (spec §9.1).
export const waterRippleFragment = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uMouse;       // 0..1 cursor position
  uniform float uStrength;
  uniform sampler2D uScene;  // what's behind the water layer

  void main() {
    float d = distance(vUv, uMouse);
    float ripple = sin(d * 40.0 - uTime * 4.0) * exp(-d * 6.0);
    vec2 offset = normalize(vUv - uMouse + 1e-5) * ripple * uStrength;
    vec4 col = texture2D(uScene, vUv + offset);
    gl_FragColor = col;
  }
`;
