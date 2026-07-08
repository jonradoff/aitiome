// Aitiome contract v1 — the core⟂visualization seam.
// These TypeScript types mirror contract/goapi (same JSON shape). Keep in lockstep
// with contract/VERSION. The viz + web streams import ONLY from here.

export const CONTRACT_VERSION = "1.2.0";

export type Role = "positive" | "negative";

// Disease axis. PD is the endorsed, validated anchor; AD is a second axis on a
// weaker (partly endorsed) scaffold — honesty via calibration, not less rigor.
export type Disease = "pd" | "ad";

export type ConfidenceTier =
  | "assay_mechanism_recovered"
  | "curated_anchored_only"
  | "adversarial_negative"
  | "clean_negative"
  | "weak_negative"
  | "analogy_only"
  // AD tiers
  | "curated_anchored_ad"
  | "curated_anchored_ad_contested"
  | "aop_anchored_ad"
  | "model_toxin_ad";

export interface DiseaseInfo {
  disease: Disease;
  label: string;
  short: string;
  anchorAop: string;
  anchorEndorsed: boolean;
  note: string;
  compoundCount: number;
}

export interface DiseaseVerdict {
  disease: Disease;
  label: string;
  call: "positive" | "negative";
  confidenceTier?: ConfidenceTier;
  rationale?: string;
}

export type EngineMode = "validation" | "discovery";
export type EventRole = "MIE" | "KE" | "AO";

export interface Health {
  status: string;
  contractVersion: string;
  compoundsLoaded: number;
}

export interface Compound {
  name: string;
  role: Role;
  confidenceTier: ConfidenceTier;
  mech: string;
  note?: string;
  cid?: number;
  cas?: string;
  inchikey?: string;
  smiles?: string;
  dtxsid: string;
  toxcastCas?: string;
  pdDirect: number;
  adDirect: number;
  aopStressorOf: string[];
  aop3Stressor: boolean;
  inNeurotoxkb: boolean;
  toxcastTested: number;
  toxcastActive: number;
  mitoActive: number;
  mmpActive: number;
  oxStressActive: number;
  neuroActive: number;
  mechActiveTotal: number;
  geneIxnsHuman?: number;
  aop3GeneHits?: number;
  coverageGrade?: string;
}

export interface Grounding {
  genes?: string[];
  cellTypes?: string[];
  source?: string;
  kind?: "mie_genes" | "ao_celltype";
}

export interface PathwayNode {
  eventId: string;
  title: string;
  role: EventRole;
  layer: number;
  grounding?: Grounding;
}

export interface PathwayEdge {
  kerId: string;
  upstream: string;
  downstream: string;
  isLoop: boolean;
  confidence: number;
}

export interface Pathway {
  aopId: string;
  title: string;
  oecdEndorsed: boolean;
  url?: string;
  nodes: PathwayNode[];
  edges: PathwayEdge[];
}

export interface RecoveryPredicate {
  ctdPdDirectEvidence: boolean;
  neuroAopStressor: boolean;
}

export interface Corroboration {
  assayActive: boolean;
  mitoActive: number;
  mechActiveTotal: number;
  note: string;
  antiDiagnostic: boolean;
}

export interface RecoveryDecision {
  call: "positive" | "negative";
  disease?: Disease;
  predicate: RecoveryPredicate;
  diagnostic: boolean;
  gatedOnAssay: boolean;
  corroboration: Corroboration;
  rationale: string;
}

export type StrandKind =
  | "curated_mechanism"
  | "assay_corroboration"
  | "mito_celltype_grounding"
  | "faers"
  | "epidemiology"
  | "bbb";

export type StrandStatus = "supports" | "absent" | "refutes" | "not_assessable";

export interface EvidenceStrand {
  kind: StrandKind;
  status: StrandStatus;
  detail: string;
  source: string;
  provenance: string; // the access route (auditable "how this was obtained")
  isGate: boolean; // always false
}

export interface Rejection {
  lines: EvidenceStrand[];
  count: number;
}

export type TraceKind =
  | "resolve"
  | "predicate_eval"
  | "node_enter"
  | "edge_fire"
  | "ao_resolve"
  | "strand"
  | "reject_line"
  | "verdict";

export interface TraceEvent {
  kind: TraceKind;
  compound?: string;
  resolvedForm?: string;
  term?: "ctd_pd_direct" | "neuro_aop_stressor";
  hit?: boolean;
  eventId?: string;
  title?: string;
  kerId?: string;
  confidence?: number;
  cellTypes?: string[];
  strandKind?: string;
  strandStatus?: string;
  line?: string;
  call?: string;
  tier?: string;
  label?: string;
}

export interface CompoundResult {
  mode: EngineMode;
  disease?: Disease;
  compound: Compound;
  role: Role;
  confidenceTier: ConfidenceTier;
  recovery: RecoveryDecision;
  pathway?: Pathway;
  strands?: EvidenceStrand[];
  rejection?: Rejection;
  trace?: TraceEvent[];
  crossDisease?: DiseaseVerdict[];
}

export interface ValidationSummary {
  positivesRecovered: number;
  positivesTotal: number;
  negativesRejected: number;
  negativesTotal: number;
  adversarialTotal: number;
  adversarialRejected: number;
  falsePositives: number;
  falseNegatives: number;
}

export interface ValidationResult {
  summary: ValidationSummary;
  perCompound: CompoundResult[];
}

export interface DiscoveryAxis {
  name: string;
  verdict: "coverage_killed" | "confounder_killed" | "qualified_lead" | "conditional_lead" | "skip";
  metric?: string;
  coverage?: string;
  reason: string;
  isLead: boolean;
}

export interface DiscoveryMap {
  headline: string;
  axes: DiscoveryAxis[];
  liveLeads: string[];
  note: string;
}

export interface Discriminator {
  name: string;
  aurocVsAdversarial: number;
  aurocVsAllNegatives: number;
  coverage?: string;
}

export interface Confusion {
  tp: number;
  fp: number;
  fn: number;
  tn: number;
  accuracy: number;
}

export interface SourceAblation {
  ctdName: string;
  aopName: string;
  ctdRecovered: number;
  aopRecovered: number;
  unionRecovered: number;
  positives: number;
  ctdFalsePos: number;
  aopFalsePos: number;
  negatives: number;
  note: string;
}

export interface Benchmark {
  curatedRule: Confusion;
  bioactivity: Discriminator[];
  ablation: SourceAblation;
  positives: number;
  adversarial: number;
  allNegatives: number;
  interpretation: string;
}

export interface Citation {
  marker: string;
  kind: string;
  detail: string;
  source: string;
  reference?: string;
  url?: string;
}

export interface SourceRef {
  key: string;
  name: string;
  reference: string;
  url: string;
  role: "diagnostic" | "corroboration" | "grounding" | "identity";
  kinds: string[];
}

export interface Synthesis {
  compound: string;
  call: string;
  tier: string;
  prose: string;
  citations: Citation[];
  model: string;
  source: "claude" | "direct";
}
