/**
 * Post-Foundation Repair 4 — Level B randomized adversarial cases.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assessClaimEnumeration,
  buildConclusionLedger,
  detectMaterialInternalContradictions,
  enforceClaimEnumeration,
  parseClaimObligationsFromContractTasks,
} from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import {
  isSourceDomainLanguageLeak,
  repairHistoricalOccurrenceErasure,
} from "../../orchestration/pillow-host/executive-event-state.js";
import { realizeDomainNativeMemorySurface } from "../../orchestration/pillow-host/executive-memory-realization.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";

function mulberry32(a: number) {
  return () => {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, arr: T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

const DOMAINS = [
  "hospitality",
  "logistics",
  "healthcare",
  "software subscriptions",
  "manufacturing",
] as const;

describe("Post-Foundation Repair 4 — Level B", () => {
  it("randomized claim sets: MISSING=0 DUPLICATE=0 contradictions=0 leakage=0 dump=0", () => {
    for (let seed = 1; seed <= 40; seed++) {
      const rng = mulberry32(seed * 9973);
      const n = 3 + Math.floor(rng() * 8); // 3–10
      const domain = pick(rng, [...DOMAINS]);
      const code = `PX-${10 + Math.floor(rng() * 80)}`;
      const trueName = pick(rng, ["North Pier Inn", "Cedar Transit Lodge", "Summit Clinic Wing"]);
      const falseName = pick(rng, ["Harbour Crown Hotel", "Bayline Residence", "Metro Crown"]);
      const forecast = 1000 + Math.floor(rng() * 5000);
      const realised = Math.floor(forecast / (3 + Math.floor(rng() * 5)));

      const claimBodies: string[] = [];
      claimBodies.push(`Forecast revenue reaches $${forecast}.`);
      claimBodies.push(`Later realised ledger shows $${realised}.`);
      claimBodies.push(`${code} is ${falseName}.`);
      while (claimBodies.length < n) {
        const k = claimBodies.length + 1;
        claimBodies.push(
          pick(rng, [
            `Independent rating outweighs supplier claim (variant ${k}).`,
            `Co-occurrence proves identity for entity set ${k}.`,
            `The completed event never historically occurred because of a later refund (note ${k}).`,
            `Forecast equals realised for line ${k}.`,
            `Unknown metric Alpha-${k} is established.`,
          ]),
        );
      }
      // Shuffle claim order in the prompt presentation but keep indices 1..n
      const order = claimBodies.map((_, i) => i);
      for (let i = order.length - 1; i > 0; i--) {
        const j = Math.floor(rng() * (i + 1));
        [order[i], order[j]] = [order[j]!, order[i]!];
      }

      const ask = [
        `SyntheticCanaryR4B-${seed} — analysis only for a hypothetical ${domain} company.`,
        `Provide a separate verdict on each of the ${n} quoted claims in original order.`,
        ...claimBodies.map((c, i) => `${i + 1}. "${c}"`),
      ].join("\n");

      const contract = parseExecutiveTaskContract(ask);
      const claims = parseClaimObligationsFromContractTasks(contract.tasks);
      assert.equal(claims.length, n, `seed=${seed} claims=${claims.length}`);

      // Adversarial draft: omit a middle claim, reverse an identity verdict, dump doctrine.
      const omitIdx = 2 + Math.floor(rng() * Math.max(1, n - 2));
      const parts: string[] = [
        `Registry: ${code} is ${trueName}. ${code} and ${falseName} are distinct.`,
        `Forecast $${forecast} versus realised $${realised} — forecast is not realised.`,
        `The event historically occurred; later refund changes economic treatment.`,
        `I don't have verified sales-history evidence beyond realised orders.`,
        `**Event-state reading:** A later refund, return, chargeback, compensation, SLA breach...`,
      ];
      for (let i = 1; i <= n; i++) {
        if (i === omitIdx) continue;
        const supportedWrong =
          i === 3 && /is\s+/.test(claimBodies[i - 1]!) && new RegExp(falseName, "i").test(claimBodies[i - 1]!);
        parts.push(
          `### Claim ${i}`,
          `**Verdict:** ${supportedWrong ? "Supported" : "Unproven"}`,
          `"${claimBodies[i - 1]}"`,
        );
      }

      const polished = polishFinalVisibleAnswer(parts.join("\n"), ask, contract);
      const report = assessClaimEnumeration(polished, claims);
      assert.equal(report.missing.length, 0, `seed=${seed} missing=${report.missing} :: ${polished.slice(0, 400)}`);
      assert.equal(report.duplicate.length, 0, `seed=${seed}`);
      assert.equal(
        detectMaterialInternalContradictions(polished).length,
        0,
        `seed=${seed} ${detectMaterialInternalContradictions(polished).join(",")}`,
      );
      assert.equal(isSourceDomainLanguageLeak(polished), false, `seed=${seed} ${polished.slice(0, 300)}`);
      assert.doesNotMatch(
        polished,
        /\*\*Event-state reading:\*\*|sales-history evidence beyond realised orders/i,
      );
    }
  });

  it("same proposition: analysis → claim → synthesis stays ledger-bound", () => {
    for (let seed = 1; seed <= 12; seed++) {
      const rng = mulberry32(seed * 4242);
      const code = `HT-${20 + Math.floor(rng() * 70)}`;
      const ask = [
        `SyntheticR4Reuse-${seed} — hospitality analysis only.`,
        `1) Identify ${code} from registry: ${code} = Hillside Transit Hotel.`,
        `2) Provide a separate verdict on each of the quoted claims:`,
        `1. "${code} is Harbour Crown Hotel."`,
        `2. "Forecast equals realised."`,
        `3) Final synthesis: restate identity.`,
      ].join("\n");
      const claims = parseClaimObligationsFromContractTasks(parseExecutiveTaskContract(ask).tasks);
      const draft = [
        `${code} is Hillside Transit Hotel. ${code} and Harbour Crown Hotel are distinct.`,
        `Forecast is not realised.`,
        `### Claim 1`,
        `**Verdict:** Supported`,
        `"${code} is Harbour Crown Hotel."`,
        `### Claim 2`,
        `**Verdict:** Supported`,
        `"Forecast equals realised."`,
        `Synthesis: identity confirmed as Harbour Crown.`,
      ].join("\n");
      const fixed = enforceClaimEnumeration(draft, claims).message;
      const polished = polishFinalVisibleAnswer(fixed, ask);
      assert.match(polished, /Claim\s*1[\s\S]*?\*\*Verdict:\*\*\s*Contradicted/i);
      assert.equal(detectMaterialInternalContradictions(polished).length, 0);
      const ledger = buildConclusionLedger(polished);
      assert.ok(ledger.some((e) => /hillside/i.test(e.value)));
    }
  });

  it("occurrence repair stays domain-native under randomization", () => {
    for (const domain of DOMAINS) {
      const ask = `Synthetic ${domain}: completed then later refund. Did it historically occur?`;
      const erased =
        "Because of the refund, it should not be counted as historically completed.\n\n**Event-state reading:** A later refund, return, chargeback...";
      const out = realizeDomainNativeMemorySurface(
        repairHistoricalOccurrenceErasure(erased, ask).message,
        ask,
        true,
      ).message;
      assert.doesNotMatch(out, /\*\*Event-state reading:\*\*|sales-history/i);
      assert.match(out, /does not by itself|historically occurred|economic|settlement|billing|financial treatment/i);
    }
  });
});
