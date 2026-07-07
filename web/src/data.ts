// Data layer: live engine first (via the /api proxy), fixtures as fallback for
// demo resilience. The UI never knows which it got - the contract is the same.
import type {
  ValidationResult,
  DiscoveryMap,
  Pathway,
  Compound,
  CompoundResult,
  Health,
} from "@contract";
import { fxValidation, fxDiscovery, fxPathway, fxCompounds, fxAssess } from "./fixtures";

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
