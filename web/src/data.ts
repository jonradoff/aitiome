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
  Disease,
  DiseaseInfo,
} from "@contract";
import { fxValidation, fxDiscovery, fxPathway, fxCompounds, fxAssess, fxSynthesis, fxBenchmark, fxSources } from "./fixtures";

export type Source = "live" | "fixture";

// dq appends the disease query param (PD is the default, so PD URLs are unchanged
// and the fixtures fallback — which is PD — stays correct for the anchor axis).
const dq = (disease: Disease = "pd", sep = "?") => (disease === "ad" ? `${sep}disease=ad` : "");

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

export async function getDiseases(): Promise<DiseaseInfo[]> {
  const live = await tryLive<DiseaseInfo[]>("/diseases");
  return live ?? DISEASES_FALLBACK;
}

export async function getValidation(disease: Disease = "pd"): Promise<{ data: ValidationResult; source: Source }> {
  const live = await tryLive<ValidationResult>(`/validation${dq(disease)}`);
  if (live) return { data: live, source: "live" };
  // Fixtures cover PD only; AD requires the live engine.
  return { data: disease === "ad" ? EMPTY_VALIDATION : fxValidation, source: "fixture" };
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

export async function getPathway(disease: Disease = "pd"): Promise<{ data: Pathway; source: Source }> {
  // The hero backdrop is the disease's anchor cascade: AOP-3 (PD) / AOP-12 (AD).
  const path = disease === "ad" ? "/pathway?aop=12" : "/pathway";
  const live = await tryLive<Pathway>(path);
  return live ? { data: live, source: "live" } : { data: fxPathway, source: "fixture" };
}

export async function getCompounds(disease: Disease = "pd"): Promise<{ data: Compound[]; source: Source }> {
  const live = await tryLive<Compound[]>(`/compounds${dq(disease)}`);
  if (live) return { data: live, source: "live" };
  return { data: disease === "ad" ? [] : fxCompounds, source: "fixture" };
}

export async function assess(id: string, disease: Disease = "pd"): Promise<{ data: CompoundResult | null; source: Source }> {
  const live = await tryLive<CompoundResult>(`/assess?id=${encodeURIComponent(id)}${dq(disease, "&")}`);
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

const EMPTY_VALIDATION: ValidationResult = {
  summary: {
    positivesRecovered: 0, positivesTotal: 0, negativesRejected: 0, negativesTotal: 0,
    adversarialTotal: 0, adversarialRejected: 0, falsePositives: 0, falseNegatives: 0,
  },
  perCompound: [],
};

const DISEASES_FALLBACK: DiseaseInfo[] = [
  { disease: "pd", label: "Parkinson's disease", short: "Parkinson's", anchorAop: "3", anchorEndorsed: true,
    note: "OECD-endorsed AOP-3 spine. The validated anchor.", compoundCount: 27 },
  { disease: "ad", label: "Alzheimer's disease", short: "Alzheimer's", anchorAop: "12", anchorEndorsed: true,
    note: "Endorsed AOP-12/48 anchor + non-endorsed Tau/amyloid overlay. Second axis; calibrated below PD.", compoundCount: 21 },
];

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
