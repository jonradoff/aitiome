// The single canonical citation list for the app. Every [E#] marker and every
// in-app citation links here (to #ref-<id>), and each entry carries the live
// external link. This aggregates the literature considered across the build:
// the engine's data sources, the reconnaissance, the round-1/round-2 literature
// scans, and the mechanistic-convergence grounding.

export type RefCat = "data" | "pd" | "ad" | "method" | "convergence";

export interface Ref {
  id: string;
  authors: string;
  title: string;
  venue: string; // journal/venue + year (+ vol/pages)
  url: string;
  cat: RefCat;
  preprint?: boolean;
}

export const REF_CATS: { cat: RefCat; label: string }[] = [
  { cat: "data", label: "Data sources & curated resources" },
  { cat: "pd", label: "Parkinson's disease — epidemiology & pathway" },
  { cat: "ad", label: "Alzheimer's disease — epidemiology & pathway" },
  { cat: "method", label: "Exposome framing, method & AI prior art" },
  { cat: "convergence", label: "Mechanistic convergence (adverse-outcome grounding)" },
];

export const REFERENCES: Ref[] = [
  // --- Data sources & curated resources ---
  { id: "ctd", cat: "data", authors: "Davis AP, Wiegers TC, Wiegers J, et al.", title: "Comparative Toxicogenomics Database (CTD): update 2025 — curated chemical–disease DirectEvidence", venue: "Nucleic Acids Research. 2025;53(D1):D1328–D1334", url: "https://ctdbase.org/" },
  { id: "aopwiki", cat: "data", authors: "OECD", title: "Adverse Outcome Pathway Wiki — AOP-3 (mitochondrial complex-I inhibition → parkinsonian motor deficits) and the endorsed neuro-AOP set", venue: "aopwiki.org", url: "https://aopwiki.org/aops/3" },
  { id: "terron2018", cat: "data", authors: "Terron A, Bal-Price A, Paini A, et al.", title: "An adverse outcome pathway for parkinsonian motor deficits associated with mitochondrial complex I inhibition", venue: "Archives of Toxicology. 2018;92:41–82", url: "https://doi.org/10.1007/s00204-017-2133-4" },
  { id: "efsa2024", cat: "data", authors: "European Food Safety Authority", title: "Development of an AOP network for parkinsonian motor symptoms (call NP/EFSA/PREV/2024/02)", venue: "EFSA, 2024", url: "https://www.efsa.europa.eu/en/call/npefsaprev202402-development-aop-network-parkinsonian-motor-symptoms" },
  { id: "toxcast", cat: "data", authors: "U.S. EPA; NICEATM", title: "ToxCast / Tox21 invitroDB (v4.2), accessed via the Integrated Chemical Environment (ICE)", venue: "ice.ntp.niehs.nih.gov", url: "https://ice.ntp.niehs.nih.gov/" },
  { id: "mitocarta", cat: "data", authors: "Rath S, Sharma R, Gupta R, et al.", title: "MitoCarta3.0: an updated mitochondrial proteome with sub-organelle localization and pathway annotations", venue: "Nucleic Acids Research. 2021;49(D1):D1541–D1547", url: "https://www.broadinstitute.org/mitocarta" },
  { id: "kamath2022", cat: "data", authors: "Kamath T, Abdulraouf A, Burris SJ, et al.", title: "Single-cell genomic profiling of human dopamine neurons identifies a population that selectively degenerates in Parkinson's disease", venue: "Nature Neuroscience. 2022;25:588–595", url: "https://doi.org/10.1038/s41593-022-01061-1" },
  { id: "bellenguez2022", cat: "data", authors: "Bellenguez C, Küçükali F, Jansen IE, et al.", title: "New insights into the genetic etiology of Alzheimer's disease and related dementias", venue: "Nature Genetics. 2022;54:412–436", url: "https://doi.org/10.1038/s41588-022-01024-z" },
  { id: "kerenshaul2018", cat: "data", authors: "Keren-Shaul H, Spinrad A, Weiner A, et al.", title: "A unique microglia type associated with restricting development of Alzheimer's disease (DAM signature)", venue: "Cell. 2017;169:1276–1290", url: "https://doi.org/10.1016/j.cell.2017.05.018" },
  { id: "faers", cat: "data", authors: "U.S. FDA; openFDA", title: "FDA Adverse Event Reporting System (FAERS) — drug/event disproportionality API", venue: "open.fda.gov", url: "https://open.fda.gov/apis/drug/event/" },
  { id: "b3db", cat: "data", authors: "Meng F, Xi Y, Huang J, Ayers PW.", title: "A curated diverse molecular database of blood-brain barrier permeability with chemical descriptors (B3DB)", venue: "Scientific Data. 2021;8:289", url: "https://github.com/theochem/B3DB" },
  { id: "dsstox", cat: "data", authors: "U.S. EPA", title: "CompTox Chemicals Dashboard / DSSTox — DTXSID-first, salt-form-correct identity resolution", venue: "comptox.epa.gov", url: "https://comptox.epa.gov/dashboard" },
  { id: "grandjean2014", cat: "data", authors: "Grandjean P, Landrigan PJ.", title: "Neurobehavioural effects of developmental toxicity (established human neurotoxicant list)", venue: "The Lancet Neurology. 2014;13:330–338", url: "https://doi.org/10.1016/S1474-4422(13)70278-3" },
  { id: "jaylet2024", cat: "data", authors: "Jaylet T, Coustillet T, Jornod F, et al.", title: "Comprehensive analysis of the AOP-Wiki database — coverage and gaps for neurodegeneration", venue: "Frontiers in Toxicology. 2024;6:1285768", url: "https://doi.org/10.3389/ftox.2024.1285768" },
  { id: "spinu2019", cat: "data", authors: "Spinu N, Bal-Price A, Cronin MTD, et al.", title: "Development and analysis of an adverse outcome pathway network for human neurotoxicity (NT-AOPn)", venue: "Archives of Toxicology. 2019;93:2759–2772", url: "https://doi.org/10.1007/s00204-019-02551-1" },
  { id: "sachana2026", cat: "data", authors: "Sachana M, Högberg HT, Mangas I, et al.", title: "The OECD developmental neurotoxicity in-vitro battery (DNT-IVB, Guidance Document 377): regulatory role and scope — a developmental-neurotoxicity battery, not an adult-neurodegeneration assay", venue: "Frontiers in Toxicology. 2026;8:1774469", url: "https://doi.org/10.3389/ftox.2026.1774469" },

  // --- Parkinson's ---
  { id: "tanner2011", cat: "pd", authors: "Tanner CM, Kamel F, Ross GW, et al.", title: "Rotenone, paraquat, and Parkinson's disease", venue: "Environmental Health Perspectives. 2011;119:866–872", url: "https://doi.org/10.1289/ehp.1002839" },
  { id: "weisskopf2010", cat: "pd", authors: "Weisskopf MG, Weuve J, Nie H, et al.", title: "Association of cumulative lead exposure with Parkinson's disease", venue: "Environmental Health Perspectives. 2010;118:1609–1613", url: "https://doi.org/10.1289/ehp.1002339" },
  { id: "narayan2013", cat: "pd", authors: "Narayan S, Liew Z, Paul K, et al.", title: "Household organophosphorus pesticide use and Parkinson's disease", venue: "International Journal of Epidemiology. 2013;42:1476–1485", url: "https://doi.org/10.1093/ije/dyt170" },
  { id: "goldman2023", cat: "pd", authors: "Goldman SM, Weaver FM, Stroupe KT, et al.", title: "Risk of Parkinson disease among service members exposed to trichloroethylene (Camp Lejeune)", venue: "JAMA Neurology. 2023;80:673–681", url: "https://doi.org/10.1001/jamaneurol.2023.1394" },
  { id: "nalls2019", cat: "pd", authors: "Nalls MA, Blauwendraat C, Vallerga CL, et al.", title: "Identification of novel risk loci, causal insights, and heritable risk for Parkinson's disease: a meta-analysis of GWAS", venue: "The Lancet Neurology. 2019;18:1091–1102", url: "https://doi.org/10.1016/S1474-4422(19)30320-5" },
  { id: "ball2019", cat: "pd", authors: "Ball N, Teo W-P, Chandra S, Chapman J.", title: "Parkinson's disease and the environment", venue: "Frontiers in Neurology. 2019;10:218", url: "https://doi.org/10.3389/fneur.2019.00218" },
  { id: "bloem2021", cat: "pd", authors: "Bloem BR, Okun MS, Klein C.", title: "Parkinson's disease", venue: "The Lancet. 2021;397:2284–2303", url: "https://doi.org/10.1016/S0140-6736(21)00218-X" },
  { id: "dorsey2025", cat: "pd", authors: "Dorsey ER, et al.", title: "Environmental toxicants and Parkinson's disease: evidence, risks, and prevention", venue: "The Lancet Neurology. 2025", url: "https://doi.org/10.1016/S1474-4422(25)00287-X" },
  { id: "delp2021", cat: "pd", authors: "Delp J, Cediel-Ulloa A, Suciu I, et al.", title: "Neurotoxicity and underlying cellular changes of 21 mitochondrial respiratory chain inhibitors", venue: "Archives of Toxicology. 2021;95:591–615", url: "https://doi.org/10.1007/s00204-020-02970-5" },
  { id: "paul2023", cat: "pd", authors: "Paul KC, Krolewski RC, Lucumi Moreno E, et al.", title: "A pesticide and iPSC dopaminergic neuron screen identifies and classifies Parkinson-relevant pesticides (288-pesticide-wide association study, PEG cohort → iPSC validation)", venue: "Nature Communications. 2023;14:2803", url: "https://doi.org/10.1038/s41467-023-38215-z" },

  // --- Alzheimer's ---
  { id: "richardson2014", cat: "ad", authors: "Richardson JR, Roy A, Shalat SL, et al.", title: "Elevated serum pesticide levels and risk for Alzheimer disease", venue: "JAMA Neurology. 2014;71:284–290", url: "https://doi.org/10.1001/jamaneurol.2013.6030" },
  { id: "singh2013", cat: "ad", authors: "Singh NK, et al.", title: "Organochlorine pesticide levels and risk of Alzheimer's disease in a north Indian population (single case-control; the source of the dieldrin/β-HCH odds ratios quoted by Yan 2016)", venue: "Human & Experimental Toxicology. 2013;32(1):24–30", url: "https://pubmed.ncbi.nlm.nih.gov/22899726/" },
  { id: "minmin2016", cat: "ad", authors: "Min JY, Min KB.", title: "Blood cadmium levels and Alzheimer's disease mortality risk in older US adults", venue: "Environmental Health. 2016;15:69", url: "https://doi.org/10.1186/s12940-016-0155-7" },
  { id: "bakulski2020", cat: "ad", authors: "Bakulski KM, Seo YA, Hickman RC, et al.", title: "Heavy metals exposure and Alzheimer's disease and related dementias", venue: "Journal of Alzheimer's Disease. 2020;76:1215–1242", url: "https://doi.org/10.3233/JAD-200282" },
  { id: "hayden2010", cat: "ad", authors: "Hayden KM, Norton MC, Darcey D, et al.", title: "Occupational exposure to pesticides increases the risk of incident AD: the Cache County Study", venue: "Neurology. 2010;74:1524–1530", url: "https://doi.org/10.1212/WNL.0b013e3181dd4423" },
  { id: "yan2016", cat: "ad", authors: "Yan D, Zhang Y, Liu L, Yan H.", title: "Pesticide exposure and risk of Alzheimer's disease: a systematic review and meta-analysis", venue: "Scientific Reports. 2016;6:32222", url: "https://doi.org/10.1038/srep32222" },
  { id: "rondeau2009", cat: "ad", authors: "Rondeau V, Jacqmin-Gadda H, Commenges D, et al.", title: "Aluminum and silica in drinking water and the risk of Alzheimer's disease (PAQUID, 15-year follow-up)", venue: "American Journal of Epidemiology. 2009;169:489–496", url: "https://doi.org/10.1093/aje/kwn348" },
  { id: "lefevre2024", cat: "ad", authors: "Lefèvre-Arbogast S, Chaker J, Mercier F, Barouki R, Coumoul X, Miller GW, David A, Samieri C.", title: "Epidemiological and experimental evidence relating the chemical exposome to Alzheimer's disease", venue: "Alzheimer's & Dementia. 2025", url: "https://www.ncbi.nlm.nih.gov/pmc/articles/PMC11716385/" },
  { id: "livingston2024", cat: "ad", authors: "Livingston G, Huntley J, Liu KY, et al.", title: "Dementia prevention, intervention, and care: 2024 report of the Lancet standing Commission", venue: "The Lancet. 2024;404:572–628", url: "https://doi.org/10.1016/S0140-6736(24)01296-0" },
  { id: "tsamou2021", cat: "ad", authors: "Tsamou M, Pistollato F, Roggen EL.", title: "A tau-driven adverse outcome pathway blueprint toward memory loss in sporadic AD with MIE plug-ins for environmental neurotoxicants", venue: "Journal of Alzheimer's Disease. 2021;81:459–485", url: "https://doi.org/10.3233/JAD-201418" },
  { id: "sun2023", cat: "ad", authors: "Sun N, Victor MB, Park YP, et al.", title: "Human microglial state dynamics in Alzheimer's disease progression", venue: "Cell. 2023;186:4386–4403", url: "https://doi.org/10.1016/j.cell.2023.08.037" },
  { id: "gerrits2021", cat: "ad", authors: "Gerrits E, Brouwer N, Kooistra SM, et al.", title: "Distinct amyloid-β and tau-associated microglia profiles in Alzheimer's disease", venue: "Acta Neuropathologica. 2021;141:681–696", url: "https://doi.org/10.1007/s00401-021-02263-w" },

  // --- Exposome framing, method & AI prior art ---
  { id: "miller2024", cat: "method", authors: "Lefèvre-Arbogast S, Chaker J, Mercier F, Barouki R, Coumoul X, Miller GW, David A, Samieri C.", title: "Assessing the contribution of the chemical exposome to neurodegenerative disease", venue: "Nature Neuroscience. 2024;27(5):812–821", url: "https://doi.org/10.1038/s41593-024-01627-1" },
  { id: "millerjones2014", cat: "method", authors: "Miller GW, Jones DP.", title: "The nature of nurture: refining the definition of the exposome", venue: "Toxicological Sciences. 2014;137:1–2", url: "https://doi.org/10.1093/toxsci/kft251" },
  { id: "mack2024", cat: "method", authors: "Mack CM, et al.", title: "Identification of neural-relevant ToxCast high-throughput assay intended gene targets", venue: "NeuroToxicology. 2024;103:256–265", url: "https://pubmed.ncbi.nlm.nih.gov/38878836/" },
  { id: "king2012", cat: "method", authors: "King BL, Davis AP, Rosenstein MC, et al.", title: "Ranking transitive chemical-disease inferences using local network topology in the CTD", venue: "PLoS ONE. 2012;7:e46524", url: "https://doi.org/10.1371/journal.pone.0046524" },
  { id: "davis2009", cat: "method", authors: "Davis AP, Murphy CG, Saraceni-Richards CA, et al.", title: "Comparative Toxicogenomics Database: a knowledgebase and discovery tool for chemical–gene–disease networks", venue: "Nucleic Acids Research. 2009;37:D786–D792", url: "https://doi.org/10.1093/nar/gkn580" },
  { id: "comptoxai2022", cat: "method", authors: "Romano JD, Hao Y, Moore JH, Penning TM.", title: "Automating predictive toxicology using ComptoxAI", venue: "Chemical Research in Toxicology. 2022;35:1370–1382", url: "https://doi.org/10.1021/acs.chemrestox.2c00074" },
  { id: "alzkb2024", cat: "method", authors: "Binder J, Ursu O, Bologa C, et al.", title: "The Alzheimer's Knowledge Base: a knowledge graph for Alzheimer disease research", venue: "Journal of Medical Internet Research. 2024;26:e46777", url: "https://doi.org/10.2196/46777" },
  { id: "hetionet2017", cat: "method", authors: "Himmelstein DS, Lizee A, Hessler C, et al.", title: "Systematic integration of biomedical knowledge prioritizes drugs for repurposing (Hetionet)", venue: "eLife. 2017;6:e26726", url: "https://doi.org/10.7554/eLife.26726" },
  { id: "primekg2023", cat: "method", authors: "Chandak P, Huang K, Zitnik M.", title: "Building a knowledge graph to enable precision medicine (PrimeKG)", venue: "Scientific Data. 2023;10:67", url: "https://doi.org/10.1038/s41597-023-01960-3" },
  { id: "deeptox2016", cat: "method", authors: "Mayr A, Klambauer G, Unterthiner T, Hochreiter S.", title: "DeepTox: toxicity prediction using deep learning", venue: "Frontiers in Environmental Science. 2016;3:80", url: "https://doi.org/10.3389/fenvs.2015.00080" },
  { id: "proton2025", cat: "method", preprint: true, authors: "Noori A, Polonuer J, et al.", title: "Graph AI generates neurological hypotheses validated in molecular, organoid, and clinical systems (PROTON)", venue: "arXiv:2512.13724, 2025 [preprint]", url: "https://arxiv.org/abs/2512.13724" },
  { id: "toxpi2018", cat: "method", authors: "Marvel SW, To K, Grimm FA, Wright FA, Rusyn I, Reif DM.", title: "ToxPi Graphical User Interface 2.0 — transparent integration and visualization of diverse chemical-prioritization data (the additive weighted-index lineage)", venue: "BMC Bioinformatics. 2018;19:80", url: "https://doi.org/10.1186/s12859-018-2089-2" },
  { id: "iata_oecd", cat: "method", authors: "OECD", title: "Integrated Approaches to Testing and Assessment (IATA) — combining heterogeneous evidence lines to a testing/prioritization decision", venue: "OECD, Series on Testing and Assessment", url: "https://www.oecd.org/chemicalsafety/risk-assessment/iata-integrated-approaches-to-testing-and-assessment.htm" },
  { id: "toxreason2026", cat: "method", authors: "Park J, Jang W, Kim C, et al.", title: "ToxReason: a benchmark for mechanistic chemical toxicity reasoning via adverse outcome pathway", venue: "Findings of ACL 2026; arXiv:2604.06264", url: "https://arxiv.org/abs/2604.06264" },
  { id: "jeong2024", cat: "method", authors: "Jeong J, Choi J.", title: "Integration of advanced large language models into the construction of adverse outcome pathways: opportunities and challenges", venue: "Environmental Science & Technology. 2024", url: "https://doi.org/10.1021/acs.est.4c07524" },
  { id: "patel2026atlas", cat: "method", authors: "Patel CJ, Ioannidis JPA, Manrai AK, et al.", title: "An atlas of exposome–phenome associations in health and disease risk (619 exposures × 305 phenotypes, NHANES) — carries no neurodegenerative phenotype", venue: "Nature Medicine. 2026", url: "https://doi.org/10.1038/s41591-026-04266-0" },
  { id: "jang2025", cat: "method", authors: "Jang H, Lee J, Nguyen VK, Shin H-M.", title: "Exposome-wide association study of cognitive function in US older adults (229 chemical biomarkers, NHANES)", venue: "Exposome. 2025;5(1):osaf001", url: "https://doi.org/10.1093/exposome/osaf001" },

  // --- Mechanistic convergence (adverse-outcome grounding) ---
  { id: "berthet2014", cat: "convergence", authors: "Berthet A, Margolis EB, Zhang J, et al.", title: "Loss of mitochondrial fission depletes axonal mitochondria in midbrain dopamine neurons", venue: "Journal of Neuroscience. 2014;34:14304–14317", url: "https://doi.org/10.1523/JNEUROSCI.0930-14.2014" },
  { id: "chchd2_2025", cat: "convergence", authors: "Liao SC, Kano K, et al. (Nakamura K)", title: "CHCHD2 mutant mice link mitochondrial deficits to Parkinson's disease pathophysiology", venue: "Science Advances. 2025;11:eadu0726", url: "https://doi.org/10.1126/sciadv.adu0726" },
  { id: "nakamura2011", cat: "convergence", authors: "Nakamura K, Nemani VM, Azarbal F, et al.", title: "Direct membrane association drives mitochondrial fission by the PD-associated protein α-synuclein", venue: "Journal of Biological Chemistry. 2011;286:20710–20726", url: "https://doi.org/10.1074/jbc.M110.213538" },
  { id: "choi2008", cat: "convergence", authors: "Choi WS, Kruse SE, Palmiter RD, Xia Z.", title: "Mitochondrial complex I inhibition is not required for dopaminergic neuron death induced by rotenone, MPP+, or paraquat", venue: "PNAS. 2008;105:15136–15141", url: "https://doi.org/10.1073/pnas.0807581105" },
  { id: "kravitz2010", cat: "convergence", authors: "Kravitz AV, Freeze BS, Parker PRL, et al. (Kreitzer AC)", title: "Regulation of parkinsonian motor behaviours by optogenetic control of basal ganglia circuitry", venue: "Nature. 2010;466:622–626", url: "https://doi.org/10.1038/nature09159" },
  { id: "merlini2019", cat: "convergence", authors: "Merlini M, Rafalski VA, Rios Coronado PE, et al. (Akassoglou K)", title: "Fibrinogen induces microglia-mediated spine elimination and cognitive impairment in an Alzheimer's disease model", venue: "Neuron. 2019;101:1099–1108", url: "https://doi.org/10.1016/j.neuron.2019.01.014" },
  { id: "mendiola2023", cat: "convergence", authors: "Mendiola AS, Yan Z, Dixit K, et al. (Akassoglou K)", title: "Defining blood-induced microglia functions in neurodegeneration through multiomic profiling", venue: "Nature Immunology. 2023;24:1173–1187", url: "https://doi.org/10.1038/s41590-023-01522-0" },
  { id: "blumenfeld2024", cat: "convergence", authors: "Blumenfeld J, Yip O, Kim MJ, Huang Y.", title: "Cell type-specific roles of APOE4 in Alzheimer disease", venue: "Nature Reviews Neuroscience. 2024;25:91–110", url: "https://doi.org/10.1038/s41583-023-00776-9" },
  { id: "rao2025", cat: "convergence", authors: "Rao A, Chen N, Kim MJ, et al. (Huang Y)", title: "Microglia depletion reduces human neuronal APOE4-related pathologies in a chimeric Alzheimer's disease model", venue: "Cell Stem Cell. 2025;32:86–104", url: "https://doi.org/10.1016/j.stem.2024.10.005" },
  { id: "das2021", cat: "convergence", authors: "Das M, Mao W, Shao E, et al. (Mucke L)", title: "Interdependence of neural network dysfunction and microglial alterations in Alzheimer's disease-related models", venue: "iScience. 2021;24:103245", url: "https://doi.org/10.1016/j.isci.2021.103245" },
];

const byId = new Map(REFERENCES.map((r) => [r.id, r]));
export const refNumber = new Map(REFERENCES.map((r, i) => [r.id, i + 1]));
export function getRef(id: string): Ref | undefined { return byId.get(id); }

// Map a synthesis citation kind to its canonical reference id, so an [E#] marker
// links to #ref-<id> on the references page instead of straight out to a source.
export const CITE_KIND_TO_REF: Record<string, string> = {
  curated_mechanism: "ctd",
  assay_corroboration: "toxcast",
  mito_celltype_grounding: "kamath",
  faers: "faers",
  epidemiology: "tanner2011",
  bbb: "b3db",
  identity: "dsstox",
};
