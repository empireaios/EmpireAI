/**
 * Harbour-class repro — 3+ new domains, no sealed names.
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { extractQuotedClaimsOnly, buildCanonicalCaseState } from "../src/orchestration/pillow-host/executive-canonical-state.ts";
import { assessClaimAgainstCanonical } from "../src/orchestration/pillow-host/executive-claim-proposition.ts";
import { polishFinalVisibleAnswer } from "../src/orchestration/pillow-host/executive-response-polish.ts";
import { releaseExecutiveAnswer } from "../src/orchestration/pillow-host/executive-release-gate.ts";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(ROOT, "docs/audits/complete-state");

function truth() {
  return {
    product: { name: "EmpireAI", firstSale: false, realisedOrders: 0, publishedListings: 0, expectedProfitDisplay: "$2", expectedProfitTruthClass: "ESTIMATED", realisedTruthClass: "CURRENT_VERIFIED" },
    financial: { realisedOrders: 0, realisedRevenue: 0, realisedTruthClass: "CURRENT_VERIFIED" },
    birth: { status: "TECHNICALLY_READY_AWAITING_GRAND_KING", technicallyReady: true, birthTimestamp: null, gatesPassedCount: 12, gatesTotal: 12, truthClass: "CURRENT_VERIFIED" },
    deploy: { gitCommitSha: "deadbeef", serviceOnlineHint: "assume_online_if_answering", truthClass: "CURRENT_VERIFIED" },
    authority: { pillowMayPublish: false, pillowMaySupplierSpend: false, pillowMayAuthoriseBirth: false, pillowMayExecuteProductionDeploy: false, chatHasToolCallingLoop: false, executableNow: ["Answer"], requiresGrandKing: ["Birth"], truthClass: "CURRENT_VERIFIED" },
    demandEvidence: "UNKNOWN",
    notes: [],
  };
}

function explicitVerdict(text) {
  const m = /Claim\s*1[\s\S]{0,400}?\*\*Verdict:\*\*\s*(?:\*\*)?(Supported|Contradicted|Unproven|Unknown)/i.exec(text);
  if (m) return m[1];
  const soft = /\*\*Verdict:\*\*\s*(?:\*\*)?(Supported|Contradicted|Unproven|Unknown)/i.exec(text);
  return soft?.[1] ?? null;
}

const CASES = [
  {
    id: "lab_transfer_nothing_to_do",
    claim: "Bench Quay's operator shortage has nothing to do with Bench Mesa because Quay itself never lost staff.",
    pack: [
      "SyntheticVerdict-Lab — laboratory analysis only. Do not mention Mini Fan or Birth.",
      "Bench Mesa had a staffing shortage. Work was reassigned from Mesa to Quay.",
      "Quay operators were committed to the reassigned work. Quay's current operator shortage resulted from that commitment.",
      "Quay itself never lost staff to attrition.",
      "Assess this claim:",
      "Bench Quay's operator shortage has nothing to do with Bench Mesa because Quay itself never lost staff.",
    ].join("\n"),
  },
  {
    id: "retail_unrelated_never_had",
    claim: "Store Cobalt's capacity shortage is unrelated to Store Argon because Cobalt never had a staffing failure.",
    pack: [
      "SyntheticVerdict-Retail — retail ops only. Do not mention Mini Fan or Birth.",
      "Store Argon had a staffing failure. Work redirected from Argon to Cobalt.",
      "Cobalt capacity was committed to that redirected work. Cobalt's current capacity shortage resulted from that redirect.",
      "Cobalt never had a staffing failure.",
      'Separate verdict on: "Store Cobalt\'s capacity shortage is unrelated to Store Argon because Cobalt never had a staffing failure."',
    ].join("\n"),
  },
  {
    id: "energy_no_causal_soft_draft",
    claim: "Nexus capacity shortage has no causal relationship to Prism because Nexus never had a thermal trip.",
    pack: [
      "SyntheticVerdict-Energy — energy analysis only. Do not mention Mini Fan or Birth.",
      "Prism had a thermal trip. Work reassigned from Prism to Nexus.",
      "Nexus capacity committed to reassigned load. Nexus current capacity shortage resulted from that commitment.",
      "Nexus never had a thermal trip.",
      "Assess this claim:",
      "Nexus capacity shortage has no causal relationship to Prism because Nexus never had a thermal trip.",
    ].join("\n"),
  },
  {
    id: "soft_supported_no_claim_markers",
    claim: "Harbor bed shortage has nothing to do with Cedar because Harbor never lost staff.",
    pack: [
      "SyntheticVerdict-Hosp — hospitality analysis only. Do not mention Mini Fan or Birth.",
      "Cedar staffing shortage. Work transferred to Harbor. Harbor bed shortage resulted from that transfer.",
      "Harbor never lost staff.",
      "Assess this claim:",
      "Harbor bed shortage has nothing to do with Cedar because Harbor never lost staff.",
    ].join("\n"),
  },
];

const rows = [];
for (const c of CASES) {
  const extracted = extractQuotedClaimsOnly(c.pack);
  const can = buildCanonicalCaseState(c.pack);
  const assessed = assessClaimAgainstCanonical(c.claim, can);
  const softDraft = [
    "### Conclusions",
    "Transfer path noted. Shortage is indirectly related.",
    "**Verdict:** Supported",
    `"${c.claim}"`,
    "Different direct mechanism implies unrelated.",
  ].join("\n");
  const claimDraft = [
    "### Conclusions",
    "Transfer path noted.",
    "### Claim 1",
    "**Verdict:** Supported",
    `"${c.claim}"`,
  ].join("\n");
  const polishedSoft = polishFinalVisibleAnswer(softDraft, c.pack);
  const polishedClaim = polishFinalVisibleAnswer(claimDraft, c.pack);
  const released = releaseExecutiveAnswer(softDraft, truth(), [], { userMessage: c.pack }).message;
  rows.push({
    id: c.id,
    extracted: extracted.length,
    canonicalOverall: assessed.overall,
    softFinal: explicitVerdict(polishedSoft),
    claimFinal: explicitVerdict(polishedClaim),
    releaseFinal: explicitVerdict(released),
    leftoverSupportedSoft: (polishedSoft.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length,
    leftoverSupportedRelease: (released.match(/\*\*Verdict:\*\*\s*Supported/gi) || []).length,
  });
  console.log(JSON.stringify(rows[rows.length - 1]));
}

mkdirSync(OUT, { recursive: true });
writeFileSync(path.join(OUT, "DETERMINISTIC_VERDICT_HARBOUR_CLASS_REPRO.json"), JSON.stringify({ generatedAt: new Date().toISOString(), rows }, null, 2));
console.log("WROTE DETERMINISTIC_VERDICT_HARBOUR_CLASS_REPRO.json");
