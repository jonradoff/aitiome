import * as THREE from "three";
import type { Pathway } from "@contract";

// Position the AOP cascade left-to-right along layers: MIE at left, adverse
// outcome at right. The main spine curves gently; branch events (proteostasis,
// neuroinflammation) sit above/below so the fork reads clearly.
const Y_OFFSET: Record<string, number> = {
  "888": 0.0,   // MIE
  "887": 0.3,
  "177": -0.1,
  "889": 2.9,   // proteostasis branch (up)
  "890": 0.1,
  "188": -3.1,  // neuroinflammation branch (down)
  "896": 0.4,   // AO
};

const SPAN_X = 18;

export interface Layout {
  pos: Map<string, THREE.Vector3>;
  aoPos: THREE.Vector3;
  miePos: THREE.Vector3;
  maxLayer: number;
}

export function layoutPathway(p: Pathway): Layout {
  const maxLayer = Math.max(1, ...p.nodes.map((n) => n.layer));
  const pos = new Map<string, THREE.Vector3>();
  let aoPos = new THREE.Vector3(SPAN_X / 2, 0, 0);
  let miePos = new THREE.Vector3(-SPAN_X / 2, 0, 0);

  for (const n of p.nodes) {
    const t = n.layer / maxLayer; // 0..1
    const x = -SPAN_X / 2 + t * SPAN_X;
    const y = Y_OFFSET[n.eventId] ?? 0;
    const z = Math.sin(hash(n.eventId) * 6.283) * 0.6;
    const v = new THREE.Vector3(x, y, z);
    pos.set(n.eventId, v);
    if (n.role === "AO") aoPos = v.clone();
    if (n.role === "MIE") miePos = v.clone();
  }
  return { pos, aoPos, miePos, maxLayer };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 1000;
  return h / 1000;
}
