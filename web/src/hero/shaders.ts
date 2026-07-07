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
    gl_PointSize = uSize * aScale * (1.0 + uIgnite * 1.6) * (300.0 / -mv.z);
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
    gl_FragColor = vec4(uColor * (0.7 + vTwinkle), a * uOpacity * vTwinkle);
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
    float base = 0.10 + 0.25 * uConfidence;
    // travelling band along length (u)
    float head = fract(uTime * 0.45);
    float band = smoothstep(0.12, 0.0, abs(vUv.x - head));
    float lit = uReach;
    float intensity = base * lit + band * lit * 0.9;
    vec3 col = uColor * (0.6 + intensity * 1.8);
    gl_FragColor = vec4(col, radial * (0.12 + intensity));
  }
`;
