/**
 * Full-pipeline raw-prompt compound claim authority.
 * PASS only when explicit claim verdicts are correct — not narrative alone.
 * Includes negative controls the oracle must FAIL.
 * Does not encode sealed examination content.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const NODES = ["Ridge", "Harbor", "Summit", "Delta", "Alpha", "Beta", "Gamma", "West"] as const;
const DOMAINS = [
  "operations",
  "logistics",
  "finance",
  "software",
  "manufacturing",
  "healthcare",
  "hospitality",
  "energy",
] as const;
const MECHS = [
  "sealant",
  "coolant-valve",
  "router-firmware",
  "billing-code",
  "sterilizer",
  "transformer",
] as const;

function truth(): ExecutiveTruthSnapshot {
  return {
    product: {
      name: "EmpireAI",
      firstSale: false,
      realisedOrders: 0,
      publishedListings: 0,
      expectedProfitDisplay: "$2.00",
      expectedProfitTruthClass: "ESTIMATED",
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    financial: {
      realisedOrders: 0,
      realisedRevenue: 0,
      realisedTruthClass: "CURRENT_VERIFIED",
    },
    birth: {
      status: "TECHNICALLY_READY_AWAITING_GRAND_KING",
      technicallyReady: true,
      birthTimestamp: null,
      gatesPassedCount: 12,
      gatesTotal: 12,
      truthClass: "CURRENT_VERIFIED",
    },
    deploy: {
      gitCommitSha: "deadbeef0123456789abcdef",
      serviceOnlineHint: "assume_online_if_answering",
      truthClass: "CURRENT_VERIFIED",
    },
    authority: {
      pillowMayPublish: false,
      pillowMaySupplierSpend: false,
      pillowMayAuthoriseBirth: false,
      pillowMayExecuteProductionDeploy: false,
      chatHasToolCallingLoop: false,
      executableNow: ["Answer questions"],
      requiresGrandKing: ["Authorise Birth"],
      truthClass: "CURRENT_VERIFIED",
    },
    demandEvidence: "UNKNOWN",
    notes: [],
  } as unknown as ExecutiveTruthSnapshot;
}

/** Explicit verdict for claim index — not narrative Contradict elsewhere. */
function explicitVerdictForClaim(text: string, index: number): string | null {
  const claimHdr = new RegExp(
    `Claim\\s*${index}\\b[\\s\\S]{0,500}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "i",
  );
  const numbered = new RegExp(
    `(?:^|\\n)\\s*${index}\\.\\s*[\\s\\S]{0,400}?\\*\\*Verdict:\\*\\*\\s*(?:\\*\\*)?(Supported|Contradicted|Unproven)`,
    "im",
  );
  return claimHdr.exec(text)?.[1] || numbered.exec(text)?.[1] || null;
}

function gradeExplicitClaimVerdicts(
  visible: string,
  expected: Array<{ index: number; verdict: "Contradicted" | "Supported" | "Unproven" }>,
): { ok: boolean; reasons: string[] } {
  const reasons: string[] = [];
  for (const e of expected) {
    const v = explicitVerdictForClaim(visible, e.index);
    if (!v) reasons.push(`claim_${e.index}_VERDICT_MISSING`);
    else if (v.toLowerCase() !== e.verdict.toLowerCase()) {
      reasons.push(`claim_${e.index}_got_${v}_want_${e.verdict}`);
    }
  }
  return { ok: reasons.length === 0, reasons };
}

function buildWrongDraft(claims: string[]): string {
  const lines = [
    "### 1 Established",
    "Actor currently eligible. Historical impairment cleared. Indirect causal connection established.",
    "### 3 Claim audit",
  ];
  claims.forEach((c, i) => {
    lines.push(`${i + 1}. "${c}"`);
    lines.push("");
    lines.push("**Verdict:** Supported");
    lines.push("");
    lines.push("Temptation reverse.");
  });
  lines.push("### 4 Summary");
  lines.push("Keep earlier conclusions.");
  return lines.join("\n");
}

describe("Raw-prompt full-pipeline compound claim authority", () => {
  it("negative controls: narrative correct + wrong explicit verdict MUST FAIL oracle", () => {
    let falsePass = 0;
    const cases = [
      {
        text: [
          "Ridge is currently eligible. Historical failure cleared.",
          "This contradicts remaining-block claims.",
          "### Claim 1",
          "**Verdict:** Supported",
          "",
          '"Ridge should remain blocked because it failed earlier today."',
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
      {
        text: [
          "Harbor linked to Ridge via redirect. Contradicts unrelatedness.",
          '1. "Harbor problem is unrelated to Ridge because Harbor has no sealant failure."',
          "**Verdict:** Supported",
        ].join("\n"),
        expected: [{ index: 1, verdict: "Contradicted" as const }],
      },
    ];
    for (const c of cases) {
      const g = gradeExplicitClaimVerdicts(c.text, c.expected);
      if (g.ok) falsePass += 1;
    }
    assert.equal(falsePass, 0, `NEGATIVE_CONTROL_FALSE_PASS=${falsePass}`);
  });

  it("100 raw user-shaped prompts through releaseExecutiveAnswer; explicit verdicts graded", () => {
    let pass = 0;
    const failures: string[] = [];
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(120000 + i);
      const domain = DOMAINS[i % DOMAINS.length]!;
      const mech = pick(rng, MECHS);
      const a = pick(rng, NODES);
      let b = pick(rng, NODES);
      while (b === a) b = pick(rng, NODES);
      const mode = i % 5;

      // Mix quoted / unquoted / soft eligibility language — real user shapes.
      const eligLine =
        mode === 0
          ? `Candidate ${a} currently satisfies every eligibility gate and is currently eligible.`
          : mode === 1
            ? `${a} is currently eligible for dispatch.`
            : `${a} cleared its earlier outage and is cleared for dispatch today.`;

      const claim1 = `${a} should remain blocked because it failed earlier today.`;
      const claim2 = `${b} problem is unrelated to ${a} because ${b} has no ${mech} failure.`;
      const claim3 = `${a} remains ineligible because historical impairment still controls.`;

      const claimBlock =
        mode % 2 === 0
          ? [
              "Audit these claims separately:",
              `1. ${claim1}`,
              `2. ${claim2}`,
              `3. ${claim3}`,
            ].join("\n")
          : [
              "Give separate verdicts on:",
              `1. "${claim1}"`,
              `2. "${claim2}"`,
              `3. "${claim3}"`,
            ].join("\n");

      const pack = [
        `SyntheticCanaryRawPipe-${domain}-${i} — ${domain} analysis only. Do not mention Mini Fan or Birth.`,
        eligLine,
        `Earlier today ${a} had a temporary failure; that failure has cleared.`,
        `Inventory was redirected from ${a} to ${b} after ${a}'s earlier failure.`,
        `${b}'s current capacity problem resulted from that redirected inventory.`,
        `${b} has no ${mech} failure.`,
        "Answer with conclusions first, then a claim audit.",
        claimBlock,
        "Summarize without reversing the established conclusions.",
      ].join("\n");

      const draft = buildWrongDraft([claim1, claim2, claim3]);
      const released = releaseExecutiveAnswer(draft, truth(), [], { userMessage: pack });
      const g = gradeExplicitClaimVerdicts(released.message, [
        { index: 1, verdict: "Contradicted" },
        { index: 2, verdict: "Contradicted" },
        { index: 3, verdict: "Contradicted" },
      ]);
      if (g.ok) pass += 1;
      else if (failures.length < 8) {
        failures.push(`i=${i} mode=${mode} ${g.reasons.join(";")} :: ${released.message.slice(0, 280)}`);
      }
    }
    assert.equal(
      pass,
      100,
      `RAW_USER_PROMPT_PASS=${pass}/100\n${failures.join("\n")}`,
    );
  });
});
