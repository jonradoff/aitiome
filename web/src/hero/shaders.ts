// GLSL for the hero. Kept small and legible; every effect serves comprehension:
// soft particles = the exposome field, a travelling band on each edge = evidence
// energy flowing down the cascade, a warm bloom = the vulnerable neuron igniting.

export const pointVert = /* glsl */ `
  attribute float aScale;
  attribute float aSeed;
  uniform float uTime;
  uniform float uSize;
  uniform float uIgnite;   // 0..1 brightness gate (neuron cluster)
  varying float vTwinkle;
  varying float vSeed;
  void main() {
    vSeed = aSeed;
    vec3 p = position;
    // gentle drift
    p.x += sin(uTime * 0.15 + aSeed * 6.2831) * 0.12;
    p.y += cos(uTime * 0.12 + aSeed * 6.2831) * 0.12;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    float twinkle = 0.6 + 0.4 * sin(uTime * 1.4 + aSeed * 20.0);
    vTwinkle = twinkle * (0.5 + 0.5 * uIgnite);
    gl_PointSize = uSize * aScale * (1.0 + uIgnite * 1.1) * (300.0 / -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const pointFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uOpacity;
  varying float vTwinkle;
  varying float vSeed;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    a *= a; // softer core
    gl_FragColor = vec4(uColor * (0.5 + vTwinkle * 0.6), a * uOpacity * vTwinkle);
  }
`;

// Edge tube: a base glow plus a bright band that travels from upstream to
// downstream, gated by how far the cascade has been reconstructed (uReach).
export const edgeVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// ---- Alzheimer's terminal frame: disease-associated microglia ----
// A schematic microglia glyph drawn procedurally: a cell body + radiating
// processes whose length RETRACTS as activation rises (ramified -> amoeboid),
// with a cool-slate -> warm-amber colour ramp. Shared by both variants.
const MICROGLIA_GLSL = /* glsl */ `
  // uv centred in [-0.5, 0.5]; act 0 = ramified/homeostatic, 1 = amoeboid/activated
  float microgliaGlyph(vec2 uv, float act, float seed) {
    float rad = length(uv);
    float ang = atan(uv.y, uv.x);
    float bodyR = 0.085 + act * 0.07;
    float body = smoothstep(bodyR, bodyR * 0.25, rad);
    float NP = 7.0;
    float procLen = mix(0.46, 0.15, act);          // long when ramified -> retracted
    float sector = 6.28318530 / NP;
    float a2 = mod(ang + seed * 6.2831, sector) - sector * 0.5;
    float spokeW = 0.045 + 0.05 * act;
    float withinLen = step(bodyR * 0.7, rad) * smoothstep(procLen, procLen * 0.65, rad);
    float spoke = smoothstep(spokeW, 0.0, abs(a2)) * withinLen;
    float taper = 1.0 - smoothstep(bodyR, procLen, rad);
    float proc = spoke * taper * mix(0.95, 0.45, act);   // processes dim as they retract
    return clamp(body + proc, 0.0, 1.0);
  }
  vec3 microgliaColor(float act) {
    vec3 SLATE = vec3(0.40, 0.49, 0.58);
    vec3 AMBER = vec3(0.906, 0.694, 0.408);
    vec3 EMBER = vec3(0.878, 0.478, 0.561);
    vec3 c = mix(SLATE, AMBER, act);
    return mix(c, EMBER, smoothstep(0.72, 1.0, act) * 0.35);
  }
`;

// The AD terminal frame: legible microglia as billboarded instanced quads
// (normal alpha blend -> reads as distinct cells, not glow), morphing
// ramified -> amoeboid and converging on the neuroinflammation focus.
export const microgliaInstVert = /* glsl */ `
  attribute vec3 aOffset;
  attribute float aScale;
  attribute float aSeed;
  uniform float uTime;
  uniform float uActivation;
  uniform vec3  uFocus;
  uniform float uQuadSize;
  varying vec2 vUv;
  varying float vSeed;
  varying float vAct;
  void main() {
    vUv = uv;
    vSeed = aSeed;
    float act = clamp(uActivation * 1.25 - aSeed * 0.22, 0.0, 1.0);
    vAct = act;
    vec3 base = aOffset;
    float drift = 1.0 - act;
    base.x += sin(uTime * 0.5 + aSeed * 6.2831) * 0.16 * drift;
    base.y += cos(uTime * 0.42 + aSeed * 6.2831) * 0.12 * drift;
    base = mix(base, uFocus, act * 0.34);
    vec4 mv = modelViewMatrix * vec4(base, 1.0);
    mv.xy += position.xy * uQuadSize * aScale;      // billboard the quad
    gl_Position = projectionMatrix * mv;
  }
`;
export const microgliaInstFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uOpacity;
  varying vec2 vUv;
  varying float vSeed;
  varying float vAct;
  ${MICROGLIA_GLSL}
  void main() {
    float g = microgliaGlyph(vUv - 0.5, vAct, vSeed);
    if (g <= 0.004) discard;
    float pulse = 0.9 + 0.1 * sin(uTime * 1.5 + vSeed * 6.2831);
    float bright = mix(0.6, 1.15, vAct) * pulse;
    gl_FragColor = vec4(microgliaColor(vAct) * bright, g * uOpacity);
  }
`;

export const edgeFrag = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uReach;     // 0..1 how "lit" this edge is
  uniform float uConfidence;
  varying vec2 vUv;
  void main() {
    // radial falloff across the tube thickness (v) for a soft glowing cord
    float radial = smoothstep(0.5, 0.0, abs(vUv.y - 0.5));
    float base = 0.08 + 0.16 * uConfidence;
    // two travelling bands along length (u), upstream -> downstream
    float head1 = fract(uTime * 0.5);
    float b1 = smoothstep(0.10, 0.0, abs(vUv.x - head1));
    float head2 = fract(uTime * 0.5 + 0.5);
    float b2 = smoothstep(0.07, 0.0, abs(vUv.x - head2)) * 0.5;
    float band = b1 + b2;
    float lit = uReach;
    float intensity = base * lit + band * lit * 0.8;
    vec3 col = uColor * (0.5 + intensity * 1.15);
    gl_FragColor = vec4(col, radial * (0.08 + intensity * 0.7));
  }
`;
