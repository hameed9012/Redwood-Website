import { waveGlslHeightNormal } from '../waterField';

export const waterVertex = /* glsl */ `
  uniform float uTime;
  varying vec3 vNormal;
  varying vec3 vWorldPos;
  varying float vHeight;

  void main() {
    vec2 wp = (modelMatrix * vec4(position, 1.0)).xz;

    float h = 0.0;
    float dhx = 0.0;
    float dhz = 0.0;
    ${waveGlslHeightNormal()}

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

    // Restrained — small, dim highlights, no eye-searing white.
    float fres = pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
    float spec = pow(max(dot(N, H), 0.0), 120.0);

    vec3 col = base;
    col = mix(col, uSky, fres * 0.14);
    col += spec * uSpec * 0.2;
    gl_FragColor = vec4(col, 0.88);
  }
`;
