export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;          // world XZ of the cursor on the surface
  uniform float uMouseStrength; // 0..1, decays when the cursor stops moving
  varying float vHeight;

  float wave(vec2 p, vec2 dir, float k, float s, float a) {
    return a * sin(dot(normalize(dir), p) * k + uTime * s);
  }

  void main() {
    // Undisplaced world XZ — so waves + cursor are in one consistent space
    // (the plane is rotated -90deg about X, so we read world, not local).
    vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;

    // Gentle, varied swell — small amplitudes so it reads as a moving sea
    // surface, not a rigid corrugation.
    float h = 0.0;
    h += wave(wp, vec2(1.0, 0.3), 0.22, 0.6, 0.16);
    h += wave(wp, vec2(-0.5, 1.0), 0.35, 0.8, 0.10);
    h += wave(wp, vec2(0.8, -0.4), 0.70, 1.1, 0.05);
    h += wave(wp, vec2(-0.2, -0.9), 1.40, 1.5, 0.025);
    h += wave(wp, vec2(0.6, 0.7), 2.60, 2.0, 0.012);

    // Finger dragging through the water: a depression centred on the cursor
    // that FOLLOWS it (not a one-off expanding ring), plus a small trailing wake.
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
    // Gentle height tint only — no time-swept glint band (that read as an
    // annoying light sweeping over the water).
    float t = clamp(vHeight * 0.35 + 0.5, 0.0, 1.0);
    vec3 col = mix(uDeep, uShallow, t);
    gl_FragColor = vec4(col, 0.92);
  }
`;
