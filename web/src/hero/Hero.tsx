import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import type { Pathway, CompoundResult, Disease } from "@contract";
import { layoutPathway } from "./layout";
import { pointVert, pointFrag, edgeVert, edgeFrag } from "./shaders";

const CYAN = new THREE.Color("#55d6c6");
const GOLD = new THREE.Color("#e7b168");
const ROSE = new THREE.Color("#e07a8f");
const GREY = new THREE.Color("#39424e");

// A soft radial-gradient texture for the node halo. Rendered as a billboarded
// sprite placed BEHIND the node, so the opaque core occludes its center and the
// glow reads as a halo around the node rather than washing over it.
function makeGlowTexture(): THREE.Texture {
  const s = 128;
  const cv = document.createElement("canvas");
  cv.width = cv.height = s;
  const ctx = cv.getContext("2d")!;
  const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
  // transparent center so the opaque core reads through; soft halo ring around it
  g.addColorStop(0.0, "rgba(255,255,255,0)");
  g.addColorStop(0.28, "rgba(255,255,255,0.22)");
  g.addColorStop(0.5, "rgba(255,255,255,0.7)");
  g.addColorStop(1.0, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, s, s);
  const tex = new THREE.CanvasTexture(cv);
  tex.needsUpdate = true;
  return tex;
}
const GLOW_TEX = makeGlowTexture();

const clamp = (x: number, a = 0, b = 1) => Math.min(b, Math.max(a, x));
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};

type Mode = "recover" | "reject" | "idle";

function modeOf(r: CompoundResult | null): Mode {
  if (!r) return "idle";
  return r.recovery.call === "positive" ? "recover" : "reject";
}

// ---- Exposome background field ----
function ExposomeField() {
  const mat = useRef<THREE.ShaderMaterial>(null!);
  const geo = useMemo(() => {
    const n = 1400;
    const pos = new Float32Array(n * 3);
    const scale = new Float32Array(n);
    const seed = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 40;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 22;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 26 - 6;
      scale[i] = 0.4 + Math.random() * 1.6;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    return g;
  }, []);
  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uSize: { value: 1.7 },
      uIgnite: { value: 0 },
      uColor: { value: new THREE.Color("#8fb6c4") },
      uOpacity: { value: 0.32 },
    }),
    [],
  );
  useFrame((s) => {
    if (mat.current) mat.current.uniforms.uTime.value = s.clock.elapsedTime;
  });
  return (
    <points geometry={geo}>
      <shaderMaterial
        ref={mat}
        vertexShader={pointVert}
        fragmentShader={pointFrag}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

interface EdgeObj {
  geo: THREE.TubeGeometry;
  mat: THREE.ShaderMaterial;
  downstreamLayer: number;
  isLoop: boolean;
  confidence: number;
}

function useScene(pathway: Pathway) {
  const layout = useMemo(() => layoutPathway(pathway), [pathway]);
  const layerOf = useMemo(() => {
    const m = new Map<string, number>();
    pathway.nodes.forEach((n) => m.set(n.eventId, n.layer));
    return m;
  }, [pathway]);

  const edges = useMemo<EdgeObj[]>(() => {
    return pathway.edges.map((e) => {
      const up = layout.pos.get(e.upstream)!;
      const down = layout.pos.get(e.downstream)!;
      const mid = up.clone().add(down).multiplyScalar(0.5);
      // bow the curve; loop edges bow much more so the feedback reads as a loop
      const bow = e.isLoop ? 3.2 : 0.9;
      mid.y += (e.isLoop ? 1 : Math.sign(mid.y || 1)) * bow;
      mid.z += e.isLoop ? 1.5 : 0.4;
      const curve = new THREE.QuadraticBezierCurve3(up, mid, down);
      const geo = new THREE.TubeGeometry(curve, 48, e.isLoop ? 0.045 : 0.07, 10, false);
      const mat = new THREE.ShaderMaterial({
        vertexShader: edgeVert,
        fragmentShader: edgeFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uReach: { value: 0 },
          uConfidence: { value: e.confidence },
          uColor: { value: CYAN.clone() },
        },
      });
      return { geo, mat, downstreamLayer: layerOf.get(e.downstream) ?? 0, isLoop: e.isLoop, confidence: e.confidence };
    });
  }, [pathway, layout, layerOf]);

  const nodes = useMemo(() => {
    return pathway.nodes.map((n) => {
      const p = layout.pos.get(n.eventId)!;
      const base = n.role === "AO" ? GOLD.clone() : n.eventId === "188" ? CYAN.clone().multiplyScalar(0.7) : CYAN.clone();
      const r = n.role === "MIE" || n.role === "AO" ? 0.26 : 0.18;
      const core = new THREE.MeshBasicMaterial({ color: base.clone().multiplyScalar(0.4) });
      const glow = new THREE.SpriteMaterial({
        map: GLOW_TEX,
        color: base,
        transparent: true,
        opacity: 0.05,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });
      return { node: n, p, base, r, core, glow };
    });
  }, [pathway, layout]);

  // neuron terminal cluster near the adverse outcome
  const neuron = useMemo(() => {
    const n = 420;
    const pos = new Float32Array(n * 3);
    const scale = new Float32Array(n);
    const seed = new Float32Array(n);
    const c = layout.aoPos;
    for (let i = 0; i < n; i++) {
      // clustered blob with a couple of dendritic streaks
      const r = Math.pow(Math.random(), 0.6) * 1.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = c.x + r * Math.sin(ph) * Math.cos(th);
      pos[i * 3 + 1] = c.y + r * Math.cos(ph) * 0.8;
      pos[i * 3 + 2] = c.z + r * Math.sin(ph) * Math.sin(th) * 0.8;
      scale[i] = 0.5 + Math.random() * 1.8;
      seed[i] = Math.random();
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    g.setAttribute("aScale", new THREE.BufferAttribute(scale, 1));
    g.setAttribute("aSeed", new THREE.BufferAttribute(seed, 1));
    const uniforms = {
      uTime: { value: 0 },
      uSize: { value: 1.2 },
      uIgnite: { value: 0 },
      uColor: { value: GOLD.clone() },
      uOpacity: { value: 0.9 },
    };
    return { geo: g, uniforms };
  }, [layout]);

  // dendritic streaks fanning from the AO node into the neuron population
  const dendrites = useMemo(() => {
    const c = layout.aoPos;
    const arr: { geo: THREE.TubeGeometry; mat: THREE.ShaderMaterial }[] = [];
    for (let i = 0; i < 7; i++) {
      const start = new THREE.Vector3(c.x, c.y, c.z);
      const ang = (i / 7) * Math.PI * 2;
      const end = new THREE.Vector3(
        c.x + Math.cos(ang) * 1.7,
        c.y + Math.sin(ang) * 1.25,
        c.z + Math.sin(ang * 1.3) * 0.8,
      );
      const mid = start.clone().lerp(end, 0.5);
      mid.y += Math.sin(i * 2.1) * 0.5;
      mid.z += Math.cos(i * 1.7) * 0.35;
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      const geo = new THREE.TubeGeometry(curve, 24, 0.022, 6, false);
      const mat = new THREE.ShaderMaterial({
        vertexShader: edgeVert,
        fragmentShader: edgeFrag,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        uniforms: {
          uTime: { value: 0 },
          uReach: { value: 0 },
          uConfidence: { value: 1 },
          uColor: { value: GOLD.clone() },
        },
      });
      arr.push({ geo, mat });
    }
    return arr;
  }, [layout]);

  return { layout, edges, nodes, neuron, dendrites };
}

function Cascade({ pathway, result, onStep, labelRefs }: { pathway: Pathway; result: CompoundResult | null; onStep: (s: string) => void; labelRefs: React.MutableRefObject<(HTMLDivElement | null)[]> }) {
  const { layout, edges, nodes, neuron, dendrites } = useScene(pathway);
  const group = useRef<THREE.Group>(null!);
  const neuronMat = useRef<THREE.ShaderMaterial>(null!);
  const rej = useRef<THREE.Group>(null!);
  const prog = useRef(0);
  const lastStep = useRef(-1);
  const tmp = useMemo(() => new THREE.Vector3(), []);
  const mode = modeOf(result);

  useEffect(() => {
    prog.current = 0;
    lastStep.current = -1;
  }, [result?.compound.name]);

  // rejection markers near the MIE (curated / bbb / faers)
  const rejLines = result?.rejection?.lines ?? [];

  useFrame((s, dt) => {
    prog.current = Math.min(1, prog.current + dt / 2.8);
    const t = s.clock.elapsedTime;
    const front = prog.current * (layout.maxLayer + 1.2);

    // gentle drift of the whole assembly
    if (group.current) group.current.rotation.y = Math.sin(t * 0.12) * 0.12;

    edges.forEach((e) => {
      e.mat.uniforms.uTime.value = t;
      if (mode === "recover") {
        const reach = clamp(front - e.downstreamLayer + 1);
        e.mat.uniforms.uReach.value = reach;
        e.mat.uniforms.uColor.value = e.downstreamLayer >= layout.maxLayer ? GOLD : CYAN;
      } else {
        e.mat.uniforms.uReach.value = 0.06;
        e.mat.uniforms.uColor.value = GREY;
      }
    });

    let reachedIdx = -1;
    nodes.forEach(({ node, p, base, glow, core }, i) => {
      let lit: number;
      if (mode === "recover") {
        lit = clamp(front - node.layer);
        if (lit > 0.5) reachedIdx = Math.max(reachedIdx, node.layer);
      } else if (mode === "reject") {
        lit = 0.1;
      } else {
        lit = 0.35 + 0.15 * Math.sin(t + i);
      }
      glow.opacity = 0.03 + lit * 0.3;
      core.color.copy(base).multiplyScalar(0.4 + lit * 1.0);

      // project world position to screen and drive the HTML label
      const el = labelRefs.current[i];
      if (el) {
        tmp.copy(p);
        if (group.current) tmp.applyMatrix4(group.current.matrixWorld);
        tmp.project(s.camera);
        const x = (tmp.x * 0.5 + 0.5) * s.size.width;
        const y = (-tmp.y * 0.5 + 0.5) * s.size.height;
        el.style.transform = `translate(-50%, 0) translate(${x}px, ${y + 20}px)`;
        el.style.opacity = String(0.18 + lit * 0.82);
        el.style.color = node.role === "AO" ? "var(--neuron)" : "var(--ink-dim)";
      }
    });

    // neuron ignites as the cascade completes
    const ignite = mode === "recover" ? smooth(0.72, 1.0, prog.current) : 0;
    if (neuronMat.current) {
      neuronMat.current.uniforms.uTime.value = t;
      neuronMat.current.uniforms.uIgnite.value = ignite;
      neuronMat.current.uniforms.uOpacity.value = 0.04 + ignite * 0.18;
    }
    // dendrites light up with the ignition
    dendrites.forEach((d) => {
      d.mat.uniforms.uTime.value = t;
      d.mat.uniforms.uReach.value = ignite;
    });

    // rejection lines reveal one by one
    if (rej.current) {
      rej.current.children.forEach((m, i) => {
        const on = mode === "reject" ? smooth((i + 0.4) / (rejLines.length + 1), (i + 1) / (rejLines.length + 1), prog.current) : 0;
        const mesh = m as THREE.Mesh;
        const mm = mesh.material as THREE.MeshBasicMaterial;
        mm.opacity = on * 0.9;
        mesh.scale.setScalar(0.7 + on * 0.5);
        mesh.rotation.z = t * 0.6 + i;
      });
    }

    // caption / step reporting (throttled to step changes)
    let step = -1;
    let label = "";
    if (mode === "recover") {
      step = reachedIdx;
      const n = nodes.find((x) => x.node.layer === reachedIdx);
      label = ignite > 0.5 ? "Resolves into the SOX6 / AGTR1 vulnerable dopaminergic neurons" : n ? n.node.title : "Reconstructing the endorsed cascade";
    } else if (mode === "reject") {
      step = Math.floor(prog.current * (rejLines.length + 1));
      label = rejLines[Math.min(step, rejLines.length - 1)]?.kind
        ? rejLineLabel(rejLines[Math.min(step, rejLines.length - 1)].kind)
        : "Withheld: no curated diagnostic signal";
    }
    if (step !== lastStep.current) {
      lastStep.current = step;
      if (label) onStep(label);
    }
  });

  return (
    <group ref={group}>
      {edges.map((e, i) => (
        <mesh key={i} geometry={e.geo} material={e.mat} />
      ))}
      {dendrites.map((d, i) => (
        <mesh key={`d${i}`} geometry={d.geo} material={d.mat} />
      ))}
      {nodes.map(({ node, p, r, core, glow }) => (
        <group key={node.eventId} position={[p.x, p.y, p.z]}>
          {/* halo sprite centered on the node (rotation-safe); its transparent
              center lets the opaque core read through, so the glow reads as a
              ring around the node rather than washing over it */}
          <sprite material={glow} scale={[r * 7, r * 7, 1]} />
          <mesh material={core}>
            <icosahedronGeometry args={[r, 1]} />
          </mesh>
        </group>
      ))}
      <points geometry={neuron.geo}>
        <shaderMaterial
          ref={neuronMat}
          vertexShader={pointVert}
          fragmentShader={pointFrag}
          uniforms={neuron.uniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </points>

      <group ref={rej} position={[layout.miePos.x - 1.4, layout.miePos.y, layout.miePos.z]}>
        {rejLines.map((_, i) => (
          <mesh key={i} position={[0, i * 1.4 - (rejLines.length - 1) * 0.7, 0]}>
            <torusGeometry args={[0.55, 0.05, 12, 40]} />
            <meshBasicMaterial color={ROSE} transparent opacity={0} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function rejLineLabel(kind: string): string {
  switch (kind) {
    case "curated_mechanism": return "Rejected: no curated diagnostic signal";
    case "bbb": return "Rejected: low brain exposure";
    case "faers": return "Rejected: no real-world parkinsonism signal";
    default: return "Rejected";
  }
}

const SHORT_LABEL: Record<string, string> = {
  "888": "complex-I binding",
  "887": "complex-I inhibition",
  "177": "mito dysfunction",
  "889": "proteostasis",
  "890": "DA degeneration",
  "188": "neuroinflammation",
  "896": "parkinsonian deficits",
};

export function Hero({ pathway, result, height = 460, disease = "pd" }: { pathway: Pathway; result: CompoundResult | null; height?: number; disease?: Disease }) {
  const [caption, setCaption] = useState<string>("");
  const anchorLabel = disease === "ad" ? "AOP-12" : "AOP-3";
  const mode = modeOf(result);
  const labelRefs = useRef<(HTMLDivElement | null)[]>([]);
  return (
    <div className="hero-canvas" style={{ position: "relative", height, borderRadius: 14, overflow: "hidden", border: "1px solid var(--line)", background: "radial-gradient(120% 100% at 20% 10%, #0f151d 0%, #090b0f 70%)" }}>
      <Canvas camera={{ position: [0, 0.4, 20.5], fov: 40 }} dpr={[1, 2]} gl={{ antialias: true }}>
        <ExposomeField />
        <Cascade pathway={pathway} result={result} onStep={setCaption} labelRefs={labelRefs} />
      </Canvas>
      {pathway.nodes.map((n, i) => (
        <div
          key={n.eventId}
          ref={(el) => (labelRefs.current[i] = el)}
          className="mono"
          style={{
            position: "absolute", left: 0, top: 0, pointerEvents: "none",
            fontSize: 11, letterSpacing: "0.02em", whiteSpace: "nowrap",
            textShadow: "0 1px 5px rgba(4,6,9,0.95), 0 0 3px rgba(4,6,9,0.95)",
            color: "var(--ink-dim)", opacity: 0, willChange: "transform, opacity",
          }}
        >
          {SHORT_LABEL[n.eventId] ?? n.title.slice(0, 16)}
        </div>
      ))}
      <div style={{ position: "absolute", left: 20, bottom: 18, display: "flex", alignItems: "center", gap: 10, pointerEvents: "none" }}>
        <span className={`chip ${mode === "recover" ? "recovered" : mode === "reject" ? "reject" : "signal"}`}>
          <span className="dot" />
          {result ? result.compound.name : anchorLabel}
        </span>
        <span className="mono" style={{ fontSize: 13, color: "var(--ink-dim)" }}>{caption}</span>
      </div>
    </div>
  );
}
