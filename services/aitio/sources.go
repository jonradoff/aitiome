package aitio

import (
	"context"
	"net/url"

	contract "aitiome/contract/goapi"
)

// The primary data sources / methods, as research-style citations with links to
// the original material. This is the authoritative source registry; the [E#]
// citation markers link into it and the References view lists it.
var sourceRegistry = []contract.SourceRef{
	{
		Key:  "ctd", Name: "Comparative Toxicogenomics Database (CTD)", Role: "diagnostic",
		Kinds:     []string{"curated_mechanism"},
		Reference: "Davis AP, Wiegers TC, Johnson RJ, et al. Comparative Toxicogenomics Database (CTD): update 2023. Nucleic Acids Research. 2023;51(D1):D1257-D1262.",
		URL:       "https://ctdbase.org/",
	},
	{
		Key:  "aopwiki", Name: "OECD AOP-Wiki (AOP-3 + complex-family network)", Role: "diagnostic",
		Kinds:     []string{"curated_mechanism"},
		Reference: "OECD Adverse Outcome Pathway Wiki. AOP-3 (WPHA/WNT Endorsed): inhibition of mitochondrial complex I of nigro-striatal neurons leads to parkinsonian motor deficits (Terron A, Bal-Price A, et al. Arch Toxicol. 2018;92:41-82). AOP-3 anchors a convergent mitochondrial-complex family — complex II/III/IV and redox cycling (AOPs 588/587/589/593, under development) — whose formal expansion EFSA funded in 2024 (call NP/EFSA/PREV/2024/02). For Alzheimer's: the endorsed AOP-12/48 (aging neurodegeneration + memory) anchor with a non-endorsed Tau/amyloid overlay (AOP-429/475).",
		URL:       "https://aopwiki.org/aops/3",
	},
	{
		Key:  "ice_toxcast", Name: "EPA ToxCast / invitroDB via NICEATM ICE", Role: "corroboration",
		Kinds:     []string{"assay_corroboration"},
		Reference: "U.S. EPA ToxCast/Tox21 invitroDB (v4.2), accessed through the NICEATM Integrated Chemical Environment (ICE). Active hitcalls only; queried on the salt-form-correct record.",
		URL:       "https://ice.ntp.niehs.nih.gov/",
	},
	{
		Key:  "mitocarta", Name: "MitoCarta3.0", Role: "grounding",
		Kinds:     []string{"mito_celltype_grounding"},
		Reference: "Rath S, Sharma R, Gupta R, et al. MitoCarta3.0: an updated mitochondrial proteome now with sub-organelle localization and pathway annotations. Nucleic Acids Research. 2021;49(D1):D1541-D1547.",
		URL:       "https://www.broadinstitute.org/mitocarta",
	},
	{
		Key:  "kamath", Name: "Kamath 2022 (SN dopaminergic atlas)", Role: "grounding",
		Kinds:     []string{"mito_celltype_grounding"},
		Reference: "Kamath T, Abdulraouf A, Burris SJ, et al. Single-cell genomic profiling of human dopamine neurons identifies a population that selectively degenerates in Parkinson's disease. Nature Neuroscience. 2022;25(5):588-595.",
		URL:       "https://doi.org/10.1038/s41593-022-01061-1",
	},
	{
		Key:  "faers", Name: "FDA FAERS (openFDA)", Role: "corroboration",
		Kinds:     []string{"faers"},
		Reference: "U.S. FDA Adverse Event Reporting System (FAERS), via the openFDA drug/event API. Disproportionality (ROR) for the parkinsonism MedDRA cluster.",
		URL:       "https://open.fda.gov/apis/drug/event/",
	},
	{
		Key:  "epidemiology", Name: "Human epidemiology (published cohorts / meta-analyses)", Role: "corroboration",
		Kinds:     []string{"epidemiology"},
		Reference: "Quantified PD/AD exposure risk curated from published cohorts and meta-analyses (e.g., Tanner et al. 2011, Environmental Health Perspectives; Pezzoli & Cereda 2013, Neurology).",
		URL:       "https://pubmed.ncbi.nlm.nih.gov/",
	},
	{
		Key:  "b3db", Name: "B3DB + BOILED-Egg (brain exposure)", Role: "corroboration",
		Kinds:     []string{"bbb"},
		Reference: "Meng F, Xi Y, Huang J, Ayers PW. A curated diverse molecular database of blood-brain barrier permeability with chemical descriptors (B3DB). Scientific Data. 2021;8:289. Daina A, Zoete V. A BOILED-Egg to predict gastrointestinal absorption and brain access of small molecules. ChemMedChem. 2016;11(11):1117-1121.",
		URL:       "https://github.com/theochem/B3DB",
	},
	{
		Key:  "dsstox", Name: "EPA CompTox Chemicals Dashboard / DSSTox", Role: "identity",
		Kinds:     []string{"identity"},
		Reference: "U.S. EPA CompTox Chemicals Dashboard (DSSTox). DTXSID-first identity resolution with the salt-form-correct registered substance.",
		URL:       "https://comptox.epa.gov/dashboard",
	},
}

// Sources returns the full source registry for the References view.
func (s *Service) Sources(ctx context.Context) []contract.SourceRef {
	out := make([]contract.SourceRef, len(sourceRegistry))
	copy(out, sourceRegistry)
	return out
}

func sourceByKey(key string) contract.SourceRef {
	for _, s := range sourceRegistry {
		if s.Key == key {
			return s
		}
	}
	return contract.SourceRef{}
}

// citationRefFor maps a strand kind (and its detail + the compound) to a
// research-style reference and a link to the original material.
func citationRefFor(kind, detail, compound string) (reference, link string) {
	switch kind {
	case "curated_mechanism":
		ctd, aop := sourceByKey("ctd"), sourceByKey("aopwiki")
		return ctd.Reference + " Mechanistic scaffold: " + aop.Reference, ctd.URL
	case "assay_corroboration":
		s := sourceByKey("ice_toxcast")
		return s.Reference, s.URL
	case "mito_celltype_grounding":
		mc, ka := sourceByKey("mitocarta"), sourceByKey("kamath")
		return mc.Reference + " " + ka.Reference, ka.URL
	case "faers":
		s := sourceByKey("faers")
		return s.Reference, s.URL
	case "epidemiology":
		s := sourceByKey("epidemiology")
		// Link to a PubMed search for this compound's PD epidemiology.
		q := url.QueryEscape(compound + " Parkinson disease epidemiology")
		return detail + " " + s.Reference, "https://pubmed.ncbi.nlm.nih.gov/?term=" + q
	case "bbb":
		s := sourceByKey("b3db")
		return s.Reference, s.URL
	default:
		return "", ""
	}
}
