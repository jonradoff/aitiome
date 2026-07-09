// Contract-shaped fixtures dumped from the live engine (make fixtures). The viz
// runs entirely on these; the data layer swaps in live engine responses when the
// core is up. Single source of truth: contract/fixtures.
import type {
  ValidationResult,
  DiscoveryMap,
  Pathway,
  Compound,
  CompoundResult,
  Synthesis,
  Benchmark,
  SourceRef,
  DiseaseInfo,
} from "@contract";

import validation from "@fixtures/validation.json";
import discovery from "@fixtures/discovery-map.json";
import pathway from "@fixtures/pathway-aop3.json";
import compounds from "@fixtures/compounds.json";
import benchmark from "@fixtures/benchmark.json";
import sources from "@fixtures/sources.json";

import synRotenone from "@fixtures/synthesis/rotenone.json";
import synParaquat from "@fixtures/synthesis/paraquat.json";
import synMptp from "@fixtures/synthesis/mptp.json";
import synOhda from "@fixtures/synthesis/6-hydroxydopamine.json";
import synChlorpyrifos from "@fixtures/synthesis/chlorpyrifos.json";
import synSimvastatin from "@fixtures/synthesis/simvastatin.json";
import synTroglitazone from "@fixtures/synthesis/troglitazone.json";
import synWarfarin from "@fixtures/synthesis/warfarin.json";
import synFenofibrate from "@fixtures/synthesis/fenofibrate.json";
import synProchloraz from "@fixtures/synthesis/prochloraz.json";
import synPropiconazole from "@fixtures/synthesis/propiconazole.json";
import synAcetaminophen from "@fixtures/synthesis/acetaminophen.json";

import rotenone from "@fixtures/assess/rotenone.json";
import paraquat from "@fixtures/assess/paraquat.json";
import mptp from "@fixtures/assess/mptp.json";
import ohda from "@fixtures/assess/6-hydroxydopamine.json";
import chlorpyrifos from "@fixtures/assess/chlorpyrifos.json";
import simvastatin from "@fixtures/assess/simvastatin.json";
import troglitazone from "@fixtures/assess/troglitazone.json";
import warfarin from "@fixtures/assess/warfarin.json";
import fenofibrate from "@fixtures/assess/fenofibrate.json";
import prochloraz from "@fixtures/assess/prochloraz.json";
import propiconazole from "@fixtures/assess/propiconazole.json";
import acetaminophen from "@fixtures/assess/acetaminophen.json";

import validationAd from "@fixtures/validation-ad.json";
import diseases from "@fixtures/diseases.json";
import adDde from "@fixtures/assess-ad/dde.json";
import adLead from "@fixtures/assess-ad/lead-acetate.json";
import adCadmium from "@fixtures/assess-ad/cadmium-chloride.json";
import adAluminum from "@fixtures/assess-ad/aluminum-chloride.json";
import adStrepto from "@fixtures/assess-ad/streptozocin.json";
import adCurcumin from "@fixtures/assess-ad/curcumin.json";
import adDonepezil from "@fixtures/assess-ad/donepezil.json";
import adEgcg from "@fixtures/assess-ad/epigallocatechin-gallate.json";
import adMethyleneBlue from "@fixtures/assess-ad/methylene-blue.json";

export const fxValidation = validation as unknown as ValidationResult;
export const fxValidationAD = validationAd as unknown as ValidationResult;
export const fxDiseases = diseases as unknown as DiseaseInfo[];
export const fxDiscovery = discovery as unknown as DiscoveryMap;
export const fxPathway = pathway as unknown as Pathway;
export const fxCompounds = compounds as unknown as Compound[];
export const fxBenchmark = benchmark as unknown as Benchmark;
export const fxSources = sources as unknown as SourceRef[];

const adList = [
  adDde, adLead, adCadmium, adAluminum, adStrepto,
  adCurcumin, adDonepezil, adEgcg, adMethyleneBlue,
] as unknown as CompoundResult[];

export const fxAssessAD: Record<string, CompoundResult> = Object.fromEntries(
  adList.map((r) => [r.compound.name.toLowerCase(), r]),
);

const list = [
  rotenone, paraquat, mptp, ohda, chlorpyrifos,
  simvastatin, troglitazone, warfarin, fenofibrate, prochloraz, propiconazole, acetaminophen,
] as unknown as CompoundResult[];

export const fxAssess: Record<string, CompoundResult> = Object.fromEntries(
  list.map((r) => [r.compound.name.toLowerCase(), r]),
);

const synList = [
  synRotenone, synParaquat, synMptp, synOhda, synChlorpyrifos,
  synSimvastatin, synTroglitazone, synWarfarin, synFenofibrate, synProchloraz, synPropiconazole, synAcetaminophen,
] as unknown as Synthesis[];

export const fxSynthesis: Record<string, Synthesis> = Object.fromEntries(
  synList.map((s) => [s.compound.toLowerCase(), s]),
);
