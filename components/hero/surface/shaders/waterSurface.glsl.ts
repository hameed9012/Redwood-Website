import { waveGlslHeightNormal } from '../waterField';

export const waterVertex = /* glsl */ `
  uniform float uTime;
  uniform vec2 uMouse;          // world XZ of the cursor on the surface
  uniform vec2 uMouseDir;       // normalized drag direction
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

    // Finger dragging ACROSS the water: an elongated trench oriented along the
    // drag direction, trailing BEHIND the cursor (a wake) — NOT a concentric
    // ring (that would be a dropped object).
    vec2 rel = wp - uMouse;
    float along = dot(rel, uMouseDir);                          // + ahead, - behind
    float perp = dot(rel, vec2(-uMouseDir.y, uMouseDir.x));     // across the path
    float lenAlong = along < 0.0 ? 3.4 : 0.8;                   // long trailing wake
    float trench = exp(-(perp * perp) / 0.6) * exp(-(along * along) / (lenAlong * lenAlong));
    float cut = trench * uMouseStrength * 0.45;
    h -= cut;
    // tilt the trench walls so they catch light (perp gradient)
    vec2 perpDir = vec2(-uMouseDir.y, uMouseDir.x);
    dhx += perp * cut * 1.5 * perpDir.x;
    dhz += perp * cut * 1.5 * perpDir.y;

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
  uniform vec3 uSky;
  uniform vec3 uSpec;
  uniform vec3 uCameraPos;
  uniform vec3 uLightDir;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;

  void main() {
    vec3 N = normalize(vNormal);
    vec3 V = normalize(uCameraPos - vWorldPos);
    vec3 L = normalize(uLightDir);
    vec3 H = normalize(L + V);

    vec3 base = mix(uDeep, uShallow, clamp(vHeight * 0.5 + 0.5, 0.0, 1.0));

    // Kept deliberately restrained — small, dim highlights, no eye-searing white.
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
    float spec = pow(max(dot(N, H), 0.0), 120.0);

    vec3 col = base;
    col = mix(col, uSky, fres * 0.14);
    col += spec * uSpec * 0.2;
    gl_FragColor = vec4(col, 0.88);
  }
`;
