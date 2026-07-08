// Data layer: live engine first (via the /api proxy), fixtures as fallback for
// demo resilience. The UI never knows which it got - the contract is the same.
import type {
  ValidationResult,
  DiscoveryMap,
  Pathway,
  Compound,
  CompoundResult,
  Health,
  Synthesis,
  Benchmark,
  SourceRef,
} from "@contract";
import { fxValidation, fxDiscovery, fxPathway, fxCompounds, fxAssess, fxSynthesis, fxBenchmark, fxSources } from "./fixtures";

export type Source = "live" | "fixture";

async function tryLive<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`/api${path}`, { headers: { accept: "application/json" } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function getHealth(): Promise<{ health: Health | null; source: Source }> {
  const live = await tryLive<Health>("/health");
  return live ? { health: live, source: "live" } : { health: null, source: "fixture" };
}

export async function getValidation(): Promise<{ data: ValidationResult; source: Source }> {
  const live = await tryLive<ValidationResult>("/validation");
  return live ? { data: live, source: "live" } : { data: fxValidation, source: "fixture" };
}

export async function getDiscoveryMap(): Promise<{ data: DiscoveryMap; source: Source }> {
  const live = await tryLive<DiscoveryMap>("/discovery-map");
  return live ? { data: live, source: "live" } : { data: fxDiscovery, source: "fixture" };
}

export async function getBenchmark(): Promise<{ data: Benchmark; source: Source }> {
  const live = await tryLive<Benchmark>("/benchmark");
  return live ? { data: live, source: "live" } : { data: fxBenchmark, source: "fixture" };
}

export async function getSources(): Promise<{ data: SourceRef[]; source: Source }> {
  const live = await tryLive<SourceRef[]>("/sources");
  return live ? { data: live, source: "live" } : { data: fxSources, source: "fixture" };
}

export async function getPathway(): Promise<{ data: Pathway; source: Source }> {
  const live = await tryLive<Pathway>("/pathway");
  return live ? { data: live, source: "live" } : { data: fxPathway, source: "fixture" };
}

export async function getCompounds(): Promise<{ data: Compound[]; source: Source }> {
  const live = await tryLive<Compound[]>("/compounds");
  return live ? { data: live, source: "live" } : { data: fxCompounds, source: "fixture" };
}

export async function assess(id: string): Promise<{ data: CompoundResult | null; source: Source }> {
  const live = await tryLive<CompoundResult>(`/assess?id=${encodeURIComponent(id)}`);
  if (live) return { data: live, source: "live" };
  const fx = fxAssess[id.toLowerCase()];
  return { data: fx ?? null, source: "fixture" };
}

export async function synthesize(id: string): Promise<{ data: Synthesis | null; source: Source }> {
  const live = await tryLive<Synthesis>(`/synthesis?id=${encodeURIComponent(id)}`);
  if (live) return { data: live, source: "live" };
  const fx = fxSynthesis[id.toLowerCase()];
  return { data: fx ?? null, source: "fixture" };
}

// resolveCompound maps any identifier (name, CAS, DTXSID, InChIKey, CID) to the
// one salt-form-correct record. Demonstrates the DTXSID-first resolver: e.g. the
// paraquat dichloride CAS 1910-42-5 resolves to the paraquat record.
export async function resolveCompound(id: string): Promise<Compound | null> {
  const live = await tryLive<Compound>(`/resolve?id=${encodeURIComponent(id)}`);
  if (live) return live;
  const q = id.trim().toLowerCase();
  if (!q) return null;
  return (
    fxCompounds.find(
      (c) =>
        c.name.toLowerCase() === q ||
        (c.cas ?? "").toLowerCase() === q ||
        c.dtxsid.toLowerCase() === q ||
        (c.inchikey ?? "").toLowerCase() === q ||
        (c.toxcastCas ?? "").toLowerCase() === q ||
        String(c.cid ?? "") === q,
    ) ?? null
  );
}
