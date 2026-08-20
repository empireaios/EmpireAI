/**
 * Reasoning Core Simplification — L0 Atomic Reliability Ladder
 * Deterministic canonical-state tests (no sealed entities; randomized).
 * Target: 100/100 per category.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildCanonicalCaseState,
  extractQuotedClaimsOnly,
  verdictClaimAgainstCanonical,
} from "../../orchestration/pillow-host/executive-canonical-state.js";
import { polishFinalVisibleAnswer } from "../../orchestration/pillow-host/executive-response-polish.js";
import {
  assessClaimEnumeration,
  parseClaimObligationsFromContractTasks,
} from "../../orchestration/pillow-host/executive-conclusion-ledger.js";
import { parseExecutiveTaskContract } from "../../orchestration/pillow-host/executive-task-contract.js";
import { packEstablishesOccurrenceThenLaterReversal } from "../../orchestration/pillow-host/executive-event-state.js";

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

const CODES = ["ZX-11", "QR-42", "HT-77", "PX-19", "NV-55", "LM-08", "BT-33", "SK-90"] as const;
const NAMES = [
  "North Pier Module",
  "Cedar Transit Unit",
  "Summit Controller",
  "Harbour Assembly",
  "Ridge Thermal Pack",
  "Valley Sensor Hub",
] as const;

describe("Reasoning Core Simplification — L0 Atomic", () => {
  it("A ENTITY_IDENTITY 100/100", () => {
    let pass = 0;
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(1000 + i);
      const codeA = pick(rng, CODES);
      let codeB = pick(rng, CODES);
      while (codeB === codeA) codeB = pick(rng, CODES);
      const nameA = pick(rng, NAMES);
      const nameB = pick(rng, NAMES.filter((n) => n !== nameA));
      const pack = [
        "Synthetic analysis only.",
        `Verified asset registry: ${codeA} = ${nameA}. ${codeB} = ${nameB}. They are distinct.`,
        `Provide a separate verdict on each quoted claim:`,
        `1. "${codeA} is definitely ${nameB}."`,
        `2. "${codeA} is ${nameA}."`,
      ].join("\n");
      const state = buildCanonicalCaseState(pack);
      const v1 = verdictClaimAgainstCanonical(`${codeA} is definitely ${nameB}.`, state);
      const v2 = verdictClaimAgainstCanonical(`${codeA} is ${nameA}.`, state);
      if (v1.verdict === "contradicted" && v2.verdict === "supported") pass += 1;
      else assert.fail(`seed=${i} v1=${v1.verdict} v2=${v2.verdict} ents=${JSON.stringify(state.entities)}`);
    }
    assert.equal(pass, 100);
  });

  it("B FORECAST_VS_REALISED 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(2000 + i);
      const forecast = 1000 + Math.floor(rng() * 8000);
      const realised = Math.floor(forecast / (2 + Math.floor(rng() * 4)));
      const pack = `Synthetic. Forecast $${forecast}. Realised $${realised}. Claim: "Forecast equals realised."`;
      const state = buildCanonicalCaseState(pack);
      const v = verdictClaimAgainstCanonical("Forecast equals realised.", state);
      assert.equal(v.verdict, "contradicted", `seed=${i}`);
    }
  });

  it("C POPULATION_SCOPE 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(3000 + i);
      const deployed = 80 + Math.floor(rng() * 80);
      const measuredValid = Math.floor(deployed * (0.5 + rng() * 0.3));
      const pct = 5 + Math.floor(rng() * 20);
      const pack = [
        "Synthetic industrial analysis.",
        `${deployed} deployed sites. ${measuredValid} currently valid measured. ${pct}% average reduction across the ${measuredValid} valid measured sites.`,
        `Claim: "All ${deployed} deployed sites demonstrate a ${pct}% saving."`,
      ].join(" ");
      const state = buildCanonicalCaseState(pack);
      const v = verdictClaimAgainstCanonical(
        `All ${deployed} deployed sites demonstrate a ${pct}% saving.`,
        state,
      );
      assert.equal(v.verdict, "contradicted", `seed=${i} ${JSON.stringify(state.population)} ${v.justification}`);
    }
  });

  it("D HISTORICAL_OCCURRENCE 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const pack = [
        "Synthetic logistics analysis.",
        "22 shipments were physically completed and recorded complete. Later full refunds for SLA breach.",
        `Claim: "The completed shipment never historically occurred because of a later refund."`,
      ].join(" ");
      assert.equal(packEstablishesOccurrenceThenLaterReversal(pack), true);
      const state = buildCanonicalCaseState(pack);
      const v = verdictClaimAgainstCanonical(
        "The completed shipment never historically occurred because of a later refund.",
        state,
      );
      assert.equal(v.verdict, "contradicted", `seed=${i}`);
    }
  });

  it("E EVIDENCE_PRECEDENCE 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(5000 + i);
      const code = pick(rng, CODES);
      const trueName = pick(rng, NAMES);
      const falseName = pick(rng, NAMES.filter((n) => n !== trueName));
      const pack = [
        "Synthetic.",
        `Planning file co-occurrence suggested ${code} near ${falseName}.`,
        `Verified asset registry: ${code} = ${trueName}.`,
        `Claim: "${code} is ${falseName}."`,
      ].join(" ");
      const state = buildCanonicalCaseState(pack);
      // Registry should win
      assert.equal(state.entities[code]?.name, trueName, `seed=${i}`);
      assert.equal(state.entities[code]?.authority, "verified_registry", `seed=${i}`);
      const v = verdictClaimAgainstCanonical(`${code} is ${falseName}.`, state);
      assert.equal(v.verdict, "contradicted", `seed=${i}`);
    }
  });

  it("F CLAIM_COMPLETENESS 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(6000 + i);
      const n = 3 + Math.floor(rng() * 5); // 3–7
      const lines = [
        `SyntheticCanaryL0-${i} — separate verdict on each of the ${n} quoted claims in original order.`,
      ];
      for (let c = 1; c <= n; c++) {
        lines.push(`${c}. "Claim body number ${c} about metric ${c + i}."`);
      }
      const ask = lines.join("\n");
      const quotes = extractQuotedClaimsOnly(ask);
      assert.equal(quotes.length, n, `seed=${i} got ${quotes.length}`);
      const contract = parseExecutiveTaskContract(ask);
      assert.equal(contract.expectedClaims, n, `seed=${i}`);
      // Section headings must not inflate claim count
      const mixed = [
        ask,
        "Cover: forecast vs realised; identity; synthesis.",
        "1) Reconcile totals.",
        "2) Classify identity.",
      ].join("\n");
      assert.equal(extractQuotedClaimsOnly(mixed).length, n, `seed=${i} schema misread`);
      const draft = Array.from({ length: n }, (_, j) =>
        j === 1 ? "" : `### Claim ${j + 1}\n**Verdict:** Unproven\n`,
      ).join("\n");
      const polished = polishFinalVisibleAnswer(draft, ask, contract);
      const claims = parseClaimObligationsFromContractTasks(contract.tasks);
      const report = assessClaimEnumeration(polished, claims);
      assert.equal(report.missing.length, 0, `seed=${i} missing=${report.missing}`);
      assert.equal(report.duplicate.length, 0, `seed=${i}`);
    }
  });

  it("G TEMPORAL_UPDATE 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(7000 + i);
      const code = pick(rng, CODES);
      const oldName = pick(rng, NAMES);
      const newName = pick(rng, NAMES.filter((n) => n !== oldName));
      const pack = [
        "Synthetic.",
        `Historical note: ${code} listed as ${oldName}.`,
        `Later verified registry update: ${code} = ${newName}.`,
      ].join(" ");
      const state = buildCanonicalCaseState(pack);
      // Last/registry binding wins for identity
      assert.ok(state.entities[code], `seed=${i}`);
      assert.equal(state.entities[code]!.name, newName, `seed=${i} ${JSON.stringify(state.entities)}`);
    }
  });

  it("H FINANCIAL_RECONCILIATION 100/100", () => {
    for (let i = 0; i < 100; i++) {
      const rng = mulberry32(8000 + i);
      const gross = 200 + Math.floor(rng() * 5000);
      const refund = Math.floor(gross * (0.1 + rng() * 0.4));
      const pack = `Synthetic. Gross $${gross}. Refund $${refund}. Compute net.`;
      const state = buildCanonicalCaseState(pack);
      assert.equal(state.financial.net, gross - refund, `seed=${i}`);
      const netProp = state.propositions.find((p) => p.id === "finance.net");
      assert.ok(netProp, `seed=${i}`);
      assert.equal(netProp!.value, String(gross - refund));
    }
  });
});
