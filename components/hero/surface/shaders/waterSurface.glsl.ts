import { waveGlsl } from '../waterField';

export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;          // world XZ of the cursor on the surface
  uniform float uMouseStrength; // 0..1, decays when the cursor stops moving
  varying float vHeight;

  void main() {
    // Undisplaced world XZ — same space the floating objects use (waterField.ts),
    // so the surface and the things on it move on one consistent water field.
    vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;

    float h = 0.0;
    ${waveGlsl()}

    // Finger dragging through the water: a depression centred on the cursor that
    // FOLLOWS it (not a one-off expanding ring), plus a small trailing wake.
    float d = distance(wp, uMouse);
    h -= exp(-d * d * 1.1) * uMouseStrength * 0.6;
    h += sin(d * 6.0 - uTime * 5.0) * exp(-d * 1.6) * uMouseStrength * 0.12;

    vec3 pos = position;
    pos.z += h;
    vHeight = h;
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(pos, 1.0);
  }
`;

export const waterFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  varying float vHeight;

  void main() {
    // Gentle height tint only — no time-swept glint band.
    float t = clamp(vHeight * 0.32 + 0.5, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, t);
    gl_FragColor = vec4(col, 0.92);
  }
`;
