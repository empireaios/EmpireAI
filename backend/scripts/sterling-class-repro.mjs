/**
 * Sterling-class repro — 3 domains × 3 failure classes. No sealed exam names.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseExecutiveTaskContract } from "../src/orchestration/pillow-host/executive-task-contract.ts";
import {
  assessSectionContract,
  extractTopLevelSectionMarkers,
  enforceExactSectionContract,
} from "../src/orchestration/pillow-host/executive-section-contract.ts";
import {
  enforceClaimEnumeration,
  parseClaimObligationsFromContractTasks,
  assessClaimEnumeration,
} from "../src/orchestration/pillow-host/executive-conclusion-ledger.ts";
import { polishFinalVisibleAnswer } from "../src/orchestration/pillow-host/executive-response-polish.ts";
import { buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function countExplicitVerdicts(text) {
  return (String(text).match(/\*\*Verdict:\*\*/gi) || []).length;
}

const STRUCTURE = [
  {
    id: "struct_logistics",
    pack: [
      "SyntheticStruct-Log — logistics analysis only. Do not mention Mini Fan or Birth.",
      "Answer in exactly six numbered sections:",
      "1. Snapshot table of lane metrics",
      "2. Evidence-strength ranking of lanes (nest the three lanes under this section)",
      "3. Population-scope note",
      "4. Claim audit",
      "5. Recommendation",
      "6. Closing summary",
      "Lane Apex: verified full-population July audit, 200/200 jobs, 94.2%.",
      "Lane Basin: verified full-population July audit, 150/150 jobs, 92.8%.",
      "Lane Cove: random sample 50/250 jobs, 97.1% sample rate; no verified full-population rate.",
      'Claim: "Cove proves the fleet-wide rate is 97.1%."',
    ].join("\n"),
    draft: [
      "1. Snapshot: Apex 94.2%, Basin 92.8%, Cove sample 97.1%.",
      "2. Evidence-strength ranking",
      "3. Apex — full population verified",
      "4. Cove — highest sample percent",
      "5. Basin — full population verified",
      "6. Population: Cove sample must not be treated as fleet-wide.",
      "7. Claim audit incomplete here.",
      "8. Recommendation: Prefer Apex for evidence-backed decisions.",
      "9. Closing: Ranking used observed rates.",
    ].join("\n"),
  },
  {
    id: "struct_hospitality",
    pack: [
      "SyntheticStruct-Hosp — hospitality analysis only. Do not mention Mini Fan or Birth.",
      "Use exactly 6 numbered top-level sections.",
      "1. Occupancy facts",
      "2. Evidence ranking of properties (nested list allowed)",
      "3. Scope limits",
      "4. Separate claim verdicts",
      "5. Decision",
      "6. Residual unknowns",
      "Property Elm: verified census 90/90 rooms, 88% occupied.",
      "Property Fir: verified census 70/70 rooms, 86% occupied.",
      "Property Oak: sample 20/100 rooms, 95% occupied in sample.",
    ].join("\n"),
    draft: [
      "1. Occupancy facts listed.",
      "2. Ranking:",
      "3. Oak",
      "4. Elm",
      "5. Fir",
      "6. Scope: sample ≠ census.",
      "7. Claims omitted.",
      "8. Decision: prefer Oak.",
      "9. Unknowns remain.",
    ].join("\n"),
  },
  {
    id: "struct_energy",
    pack: [
      "SyntheticStruct-Energy — energy analysis only. Do not mention Mini Fan or Birth.",
      "Answer with exactly six numbered sections.",
      "1. Grid status",
      "2. Rank substations by strongest current evidence base (nest items)",
      "3. Sample vs population",
      "4. Claim audit",
      "5. Operating recommendation",
      "6. Summary",
      "Substation Red: verified full-population check 120/120, 91%.",
      "Substation Blue: verified full-population check 100/100, 90%.",
      "Substation Green: random sample 40/200, 96% sample.",
    ].join("\n"),
    draft: [
      "1. Grid status stable.",
      "2. Evidence ranking",
      "3. Green",
      "4. Red",
      "5. Blue",
      "6. Sample ≠ population.",
      "7. Claims later.",
      "8. Recommend Green.",
      "9. Summary done.",
    ].join("\n"),
  },
];

const CLAIMS = [
  {
    id: "claims_mfg",
    pack: [
      "SyntheticClaim-Mfg — manufacturing analysis only. Do not mention Mini Fan or Birth.",
      "Audit these five claims separately with verdict and reason each:",
      '1. "Line Alpha never had a downtime event."',
      '2. "Line Beta shortage is unrelated to Line Alpha because Beta never lost staff."',
      '3. "Forecast equals realised for batch M9."',
      '4. "All 20 cells demonstrate the 8% yield gain."',
      '5. "Certificate CX-9 is currently blocked."',
      "Line Alpha had a staffing shortage. Work reassigned to Line Beta. Beta shortage resulted from that commitment. Beta never lost staff to attrition.",
      "Forecast for batch M9 was $50. Realised is $22.",
      "Exactly 8 of 20 cells received the upgrade.",
      "CX-9 is ACTIVE and currently authorised.",
    ].join("\n"),
    draft: [
      "### Claim 1",
      '"Line Alpha never had a downtime event."',
      "### Claim 2",
      "**Verdict:** Supported",
      '"Line Beta shortage is unrelated to Line Alpha because Beta never lost staff."',
      "### Claim 3",
      '"Forecast equals realised for batch M9."',
      "### Claim 4",
      '"All 20 cells demonstrate the 8% yield gain."',
      "### Claim 5",
      '"Certificate CX-9 is currently blocked."',
    ].join("\n"),
  },
  {
    id: "claims_fin",
    pack: [
      "SyntheticClaim-Fin — finance analysis only. Do not mention Mini Fan or Birth.",
      "Give separate verdicts on each of these five claims:",
      '1. "Ledger L1 equals realised cash."',
      '2. "Depot West shortage has nothing to do with Depot East because West never lost staff."',
      '3. "Completion for job J-4 never historically occurred."',
      '4. "All 15 sites show the saving."',
      '5. "Permit P-2 is currently ineligible."',
      "Forecast ledger L1 $30; realised cash $12.",
      "East staffing failure; work redirected to West; West shortage resulted. West never lost staff.",
      "Job J-4 was completed and recorded complete.",
      "9 of 15 sites measured.",
      "Permit P-2 is ACTIVE and currently eligible.",
    ].join("\n"),
    draft: [
      '1. "Ledger L1 equals realised cash."',
      "### Claim 2",
      "**Verdict:** Supported",
      '"Depot West shortage has nothing to do with Depot East because West never lost staff."',
      "3–5 listed without verdicts.",
    ].join("\n"),
  },
  {
    id: "claims_ops",
    pack: [
      "SyntheticClaim-Ops — ops analysis only. Do not mention Mini Fan or Birth.",
      "Assess this claim set (5) with Claim N + Verdict each:",
      '1. "Hub One shortage is unrelated to Hub Two."',
      '2. "Hub One shortage is unrelated to Hub Two because One never had a staffing failure."',
      '3. "Forecast equals realised for SKU-Q."',
      '4. "All 12 routes demonstrate on-time."',
      '5. "Badge B-11 is currently blocked."',
      "Hub Two staffing failure; work to Hub One; One shortage resulted. One never had staffing failure.",
      "Forecast SKU-Q $25; realised $9.",
      "7 of 12 routes measured.",
      "Badge B-11 is ACTIVE and authorised.",
    ].join("\n"),
    draft: [
      "### Claim 1",
      '"Hub One shortage is unrelated to Hub Two."',
      "### Claim 2",
      "**Verdict:** Supported",
      '"Hub One shortage is unrelated to Hub Two because One never had a staffing failure."',
      "### Claim 3",
      '"Forecast equals realised for SKU-Q."',
      "### Claim 4",
      '"All 12 routes demonstrate on-time."',
      "### Claim 5",
      '"Badge B-11 is currently blocked."',
    ].join("\n"),
  },
];

const RANKING = [
  {
    id: "rank_retail",
    expected: ["Pine", "Maple", "Birch"],
    pack: [
      "SyntheticRank-Retail — retail analysis only. Do not mention Mini Fan or Birth.",
      "Rank stores from strongest to weakest CURRENT EVIDENCE BASE for performance (not by highest observed % alone).",
      "Store Pine: verified full-population July audit, 240/240 jobs, 95.0%.",
      "Store Maple: verified full-population July audit, 180/180 jobs, 93.9%.",
      "Store Birch: random sample 60/300 jobs, 98.3% sample rate; no verified full-population rate.",
    ].join("\n"),
  },
  {
    id: "rank_clinic",
    expected: ["WardA", "WardB", "WardC"],
    pack: [
      "SyntheticRank-Clinic — clinic analysis only. Do not mention Mini Fan or Birth.",
      "Rank wards by strongest current evidence strength/completeness supporting current performance.",
      "WardA: verified census 200/200 encounters, 94%.",
      "WardB: verified census 160/160 encounters, 92%.",
      "WardC: random sample 55/280 encounters, 97% sample; no full-population verified rate.",
    ].join("\n"),
  },
  {
    id: "rank_wh",
    expected: ["DockX", "DockY", "DockZ"],
    pack: [
      "SyntheticRank-WH — warehouse analysis only. Do not mention Mini Fan or Birth.",
      "Order docks by strength of the supplied evidence base (coverage + verification), not raw rate alone.",
      "DockX: verified full-population audit 210/210 picks, 94.5%.",
      "DockY: verified full-population audit 170/170 picks, 93.1%.",
      "DockZ: random sample 48/260 picks, 98.0% sample; no verified population rate.",
    ].join("\n"),
  },
];

const structureRows = [];
for (const c of STRUCTURE) {
  const contract = parseExecutiveTaskContract(c.pack);
  const polished = polishFinalVisibleAnswer(c.draft, c.pack);
  const before = assessSectionContract(c.draft, contract.expectedTopLevelSections);
  const after = assessSectionContract(polished, contract.expectedTopLevelSections);
  const enforced = enforceExactSectionContract(c.draft, contract.expectedTopLevelSections);
  structureRows.push({
    id: c.id,
    REQUESTED_SECTION_COUNT: contract.expectedTopLevelSections,
    RENDERED_TOP_LEVEL_SECTION_COUNT_DRAFT: before.visible,
    markersDraft: before.markers,
    RENDERED_AFTER_POLISH: after.visible,
    markersPolish: after.markers,
    enforcedVisible: enforced.report.visible,
    mismatch: after.visible !== contract.expectedTopLevelSections,
  });
  console.log(JSON.stringify(structureRows[structureRows.length - 1]));
}

const claimRows = [];
for (const c of CLAIMS) {
  const contract = parseExecutiveTaskContract(c.pack);
  const claims = parseClaimObligationsFromContractTasks(contract.tasks);
  const can = buildCanonicalCaseState(c.pack);
  const enumBefore = assessClaimEnumeration(c.draft, claims);
  const enforced = enforceClaimEnumeration(c.draft, claims, {
    userMessage: c.pack,
    canonical: can,
  });
  const polished = polishFinalVisibleAnswer(c.draft, c.pack);
  const enumAfter = assessClaimEnumeration(polished, claims);
  claimRows.push({
    id: c.id,
    EXPLICIT_CLAIM_COUNT: claims.length,
    EXPLICIT_VERDICT_COUNT_DRAFT: countExplicitVerdicts(c.draft),
    enumBefore,
    EXPLICIT_VERDICT_COUNT_POLISH: countExplicitVerdicts(polished),
    enumAfter,
    missingAfter: enumAfter.missing,
    verdictsEnforced: countExplicitVerdicts(enforced.message),
  });
  console.log(JSON.stringify(claimRows[claimRows.length - 1]));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(
  path.join(OUT, "STERLING_CLASS_REPRO.json"),
  JSON.stringify(
    {
      generatedAt: new Date().toISOString(),
      structureRows,
      claimRows,
      rankingPacks: RANKING.map((r) => ({
        id: r.id,
        expected: r.expected,
        note: "ranking objective evidence-strength; assess after implement",
      })),
    },
    null,
    2,
  ),
);
console.log("WROTE STERLING_CLASS_REPRO.json");
