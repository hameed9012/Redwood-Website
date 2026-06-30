import { waveGlslHeightNormal } from '../waterField';

export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;          // world XZ of the cursor on the surface
  uniform float uMouseStrength; // 0..1, decays when the cursor stops moving
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;

  void main() {
    vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;

    float h = 0.0;
    float dhx = 0.0;
    float dhz = 0.0;
    ${waveGlslHeightNormal()}

    // Finger dragging the water: a depression that FOLLOWS the cursor + a wake.
    float md = distance(wp, uMouse);
    float dip = exp(-md * md * 1.1) * uMouseStrength * 0.6;
    h -= dip;
    h += sin(md * 6.0 - uTime * 5.0) * exp(-md * 1.6) * uMouseStrength * 0.12;
    // perturb the normal near the cursor so the dip catches light too
    vec2 toM = normalize(wp - uMouse + 1e-5);
    dhx += toM.x * dip * 1.5;
    dhz += toM.y * dip * 1.5;

    // Surface normal from the analytic slope (y is up in world).
    vNormal = normalize(vec3(-dhx, 1.0, -dhz));
    vHeight = h;

    vec3 pos = position;
    pos.z += h;
    vec4 world = modelMatrix * vec4(pos, 1.0);
    vWorldPos = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

export const waterFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uDeep;
  uniform vec3 uShallow;
  uniform vec3 uSky;      // cool reflected-sky tint at grazing angles
  uniform vec3 uSpec;     // specular glint colour
  uniform vec3 uCameraPos;
  uniform vec3 uLightDir; // FIXED key dir → glints shimmer with the waves, no sweeping band
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = normalize(uLightDir);
    vec3 H = normalize(L + V);

    // Body colour: deeper troughs darker, crests lighter.
    vec3 base = mix(uDeep, uShallow, clamp(vHeight * 0.5 + 0.5, 0.0, 1.0));

    // Fresnel — from straight above it's low, brightening toward grazing.
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 4.0);

    // Sharp specular glints that shimmer as wave normals tilt through the light.
    float spec = pow(max(dot(N, H), 0.0), 90.0);

    vec3 col = base;
    col = mix(col, uSky, fres * 0.5);
    col += spec * uSpec * 0.8;
    gl_FragColor = vec4(col, 0.86);
  }
`;
