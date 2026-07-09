package aitio

import (
	"context"

	contract "aitiome/contract/goapi"
)

// DiscoveryMap returns the honest negative-results map: seven discovery axes
// tested during recon, each coverage- or confounder-killed for this chemical
// class, plus the two live leads. Values are the settled recon findings
// (docs/recon-learnings-summary.md, docs/recon/discovery-axes-scorecard.md).
func (s *Service) DiscoveryMap(ctx context.Context) contract.DiscoveryMap {
	return contract.DiscoveryMap{
		Headline: "No shippable unsupervised-discovery signal exists for this chemical class on public data — and mapping exactly why is itself the contribution.",
		Axes: []contract.DiscoveryAxis{
			{Name: "LINCS L1000 (transcriptomic signatures)", Verdict: "coverage_killed",
				Coverage: "3/12 positives", Reason: "Drug/tool-compound library; environmental toxicants (pesticides, metals, MPTP/MPP+) are largely absent — wrong chemical universe."},
			{Name: "EPA HTTr (whole-transcriptome TempO-Seq)", Verdict: "coverage_killed",
				Coverage: "4/12 positives", Reason: "Non-neuronal cell lines (MCF7/U-2 OS); sparse for our positives; cytotoxicity confound."},
			{Name: "EPA HTPP (Cell Painting morphology)", Verdict: "coverage_killed",
				Coverage: "4/12 positives", Reason: "Same non-neuronal screens as HTTr; visually rich but underpowered here."},
			{Name: "Structure / QSAR (fingerprint similarity)", Verdict: "confounder_killed",
				Metric: "AUROC 0.47 (chance)", Coverage: "12/12", Reason: "Positives share a mechanism class, not a scaffold; only trivial analog pairs hit."},
			{Name: "Full ToxCast fingerprint (multi-assay bioactivity)", Verdict: "confounder_killed",
				Metric: "0.76 vs inert → 0.53 vs adversarials", Coverage: "native", Reason: "Separates positives from inert but collapses against the adversarial decoys after cytotox control — the confound is GENERAL bioactivity, not just cytotoxicity. The deepest negative result."},
			{Name: "ComptoxAI + Alzheimer's KG (link prediction)", Verdict: "coverage_killed",
				Reason: "Public graph empty, ML layer is stub code — and circular: edges are CTD/AOP-derived, the same provenance as our recovery predicate."},
			{Name: "PrimeKG / Hetionet (biomedical KGs)", Verdict: "skip",
				Coverage: "~1/12 positives", Reason: "DrugBank-keyed; rich for drugs, poor for environmental chemicals. CTD + AOP-Wiki already ground all 12 better."},
			{Name: "Neural-specific ToxCast subset (DNT battery)", Verdict: "qualified_lead",
				Metric: "AUROC 0.72 (excl. viability), perm-p 0.155", Coverage: "7/12", Reason: "The one axis that partly held — directionally right but underpowered (CI includes chance); developmental != adult neurodegeneration. Worth it only with a materially larger reference set. Confirmed mid-2026: the OECD DNT-IVB (Guidance Document 377) remains a ~400-chemical DEVELOPMENTAL battery, not an adult-neurodegeneration assay (Sachana et al., Front. Toxicol. 2026).", IsLead: true},
			{Name: "Boltz-2 target engagement (physics-based Complex-I binding)", Verdict: "conditional_lead",
				Reason: "The only basis that is neither annotation nor bioactivity — physics. Prepped to one step (5XTD Q-site ND1/NDUFS2/NDUFS7 + 19-ligand benchmark); needs a ~48 GB GPU; not run. Report with explicit N if attempted. 2025 corroboration: a consensus-docking study of the Complex-I quinone (Qd) site between NDUFS2/NDUFS7 that accommodates rotenone (Chem. Res. Toxicol. 2025) independently validates this MIE anchor — but independent evals find Boltz-2 affinity can be insensitive to binding-site mutations, so it stays bounded and non-load-bearing.", IsLead: true},
		},
		LiveLeads: []string{"Neural-specific ToxCast subset (needs a larger reference set)", "Boltz-2 Q-site engagement benchmark (bounded, optional, non-load-bearing)"},
		Note:      "Discovery is represented honestly as a map, not shipped as a predictor. Novel candidates would be analogy-based hypotheses benchmarked against the adversarial-negative set as a permanent false-positive control — leads for lab follow-up, never claims. Mid-2026 check (round-3 literature scan), stated precisely: exposure-wide EPIDEMIOLOGY of neurodegeneration does exist and is valuable — Paul & Ritz screened 288 pesticides against Parkinson's in the PEG cohort (Nat Commun 2023; 10 confirmed dopaminergic-toxic in an iPSC screen), and NHANES cognition ExWAS exists (Jang et al., Exposome 2025). But (a) the flagship multi-disease exposome atlases still carry NO neurodegeneration phenotype (Patel & Manrai, 619 exposures × 305 phenotypes, Nature Medicine 2026), and (b) none of that is a predictor of whether an ARBITRARY chemical is a neurotoxicant from its structure/bioactivity — which is the distinct thing this map shows is coverage-/confounder-killed. Population exposure-disease inference is not per-chemical neurotoxicity prediction; the map stands.",
	}
}
