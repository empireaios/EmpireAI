import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { synthesizeChronologyObligation } from "../../orchestration/pillow-host/executive-chronology-evidence.js";
import { parseExecutiveTaskContract, synthesizeTaskUnitAnswer } from "../../orchestration/pillow-host/executive-task-contract.js";
import { releaseExecutiveAnswer } from "../../orchestration/pillow-host/executive-release-gate.js";
import type { ExecutiveTruthSnapshot } from "../../orchestration/pillow-host/executive-truth-types.js";

const truth = {
  computedAt: "2026-09-20T00:00:00Z", workspaceId: "ws_chronology", provenance: "live_sqlite_commissioning_kpi_birth",
  product: {commissioningId: "opc", asin: "B0TEST", productName: "Live Widget", supplier: "SupplierX", marketplace: "Amazon US", selectionAuthority: "pillow", cursorSelected: false, stage: "COMMISSIONING", pillowRecommendation: "INVESTIGATE", truthClass: "CURRENT_VERIFIED"},
  financial: {orders: 0, realisedRevenueUsd: 0, buyableListings: 0, publishedListings: 0, expectedProfitDisplay: null, expectedProfitTruthClass: "UNKNOWN", realisedTruthClass: "CURRENT_VERIFIED"},
  birth: {status: "NOT_BORN", technicallyReady: false, birthTimestamp: null, gatesPassedCount: 0, gatesTotal: 12, truthClass: "CURRENT_VERIFIED"},
  deploy: {gitCommitSha: "test-sha", serviceOnlineHint: "assume_online_if_answering", truthClass: "CURRENT_VERIFIED"},
  authority: {pillowMayPublish: false, pillowMaySupplierSpend: false, pillowMayAuthoriseBirth: false, pillowMayExecuteProductionDeploy: false, chatHasToolCallingLoop: false, executableNow: ["Answer", "Recommend"], requiresGrandKing: ["Spend", "Publish", "Birth", "Deploy"], truthClass: "CURRENT_VERIFIED"},
  demandEvidence: "UNKNOWN", notes: [],
} as ExecutiveTruthSnapshot;

const titles = ["Event sequence", "Causality assessment", "Conflicting observations", "Missing information", "Supported finding", "Checks next"];
function promptWith(events: string[]) {
  return ["Synthetic industrial incident analysis only.", "Answer in exactly 6 numbered sections:", ...titles.map((title, i) => `${i + 1}) ${title}`), ...events].join("\n");
}

describe("chronology evidence retains its task and source boundaries", () => {
  for (const [name, stamps] of [
    ["clock times", ["07:05", "07:30", "08:00"]],
    ["seconds and AM/PM", ["7:05:03 AM", "7:30:45 AM", "8:00:00 AM"]],
    ["ISO dates only", ["2026-08-01", "2026-08-02", "2026-08-03"]],
    ["written dates only", ["1 August 2026", "2 August 2026", "3 August 2026"]],
  ] as const) {
    it(`${name}: evidence is not an extra task and all six requested parts survive release`, () => {
      const events = [`${stamps[0]} Compressor K stopped.`, `${stamps[1]} Reserve motor activated.`, `${stamps[2]} Output returned.`];
      const prompt = promptWith(events);
      const contract = parseExecutiveTaskContract(prompt);
      assert.equal(contract.tasks.filter((task) => /^t\d+$/.test(task.id)).length, 6);
      assert.deepEqual(contract.tasks.filter((task) => /^t\d+$/.test(task.id)).map((task) => task.sourceSpan), titles);
      const result = releaseExecutiveAnswer("", truth, [], { userMessage: prompt });
      assert.equal(result.released, true);
      assert.equal(result.telemetry.finalRevalidationPass, true);
      assert.equal(result.telemetry.failClosedUsed, false);
      assert.deepEqual([...result.message.matchAll(/^([1-6])[.)]\s+(.+)$/gm)].map((match) => match[2]), titles, result.message);
      for (const event of events) assert.ok(result.message.includes(event), event);
      assert.match(result.message, /order alone does not establish a causal chain/i);
      assert.doesNotMatch(result.message, /target marketplace|Grand King|Live Widget|Mini Fan|Birth|cannot release this answer/i);
    });
  }
  it("does not take over ordinary commercial questions or packs without chronology evidence", () => {
    assert.equal(synthesizeChronologyObligation("Timeline", "Plan a supplier investigation timeline."), null);
    assert.equal(synthesizeChronologyObligation("Recommendation", promptWith(["08:00 Motor stopped.", "09:00 Motor restarted."])), null);
    assert.equal(synthesizeChronologyObligation("Conclusion", "08:00 Invoice received.\n09:00 Invoice paid.\nCalculate profit."), null);
  });
  it("reports an explicit causal assertion as source evidence, without certifying it", () => {
    const prompt = promptWith(["08:00 Relay damage caused a shutdown.", "09:00 Operator restored the relay."]);
    const answer = synthesizeChronologyObligation("Causal chain", prompt)!;
    assert.match(answer, /explicitly states these causal assertions, which still require corroboration/);
    assert.match(answer, /08:00 Relay damage caused a shutdown/);
  });
  it("does not replace authority obligations or an explicit claim audit with chronology synthesis", () => {
    const source = promptWith(["08:00 Relay stopped.", "09:00 Relay restarted."]);
    for (const [id, kind] of [["t2", "authority_analysis"], ["claim_1", "premise_audit"]] as const) {
      const result = synthesizeTaskUnitAnswer(
        {id, kind, text: "Causal chain", sourceSpan: "Causal chain", subject: "Causal chain", requiredOperation: "audit_claim_truth", required: true},
        truth,
        {scopeType: "SYNTHETIC_ANALYSIS", userMessage: source},
      );
      assert.doesNotMatch(result, /Chronological order alone does not establish a causal chain/);
    }
  });
  it("identifies same-sample contradictory readings through the complete release path", () => {
    const prompt = promptWith([
      "08:00 Sensor A, vessel V, sample S reports pressure 10 bar.",
      "08:00 Sensor A, vessel V, sample S reports pressure 0 bar.",
      "08:05 Controller reset.",
    ]);
    const result = releaseExecutiveAnswer("", truth, [], {userMessage: prompt});
    assert.equal(result.telemetry.finalRevalidationPass, true);
    const conflicts = result.message.split("3. Conflicting observations")[1]?.split("4. Missing information")[0] ?? "";
    assert.match(conflicts, /10 bar/);
    assert.match(conflicts, /0 bar/);
    assert.match(conflicts, /cannot both describe the same measurement/);
    assert.match(conflicts, /does not establish which is correct/);
    const finding = result.message.split("5. Supported finding")[1]?.split("6. Checks next")[0] ?? "";
    assert.match(finding, /conflicting numeric reports/);
    assert.match(finding, /No single disputed reading/);
  });
  it("does not call different times, samples, sensors or units a measured contradiction", () => {
    const first = "08:00 Sensor A, sample S reports pressure 10 bar.";
    for (const other of [
      "08:01 Sensor A, sample S reports pressure 0 bar.",
      "08:00 Sensor B, sample S reports pressure 0 bar.",
      "08:00 Sensor A, sample T reports pressure 0 bar.",
      "08:00 Sensor A, sample S reports pressure 0 psi.",
      first,
    ]) {
      const answer = synthesizeChronologyObligation("Contradictions", promptWith([first, other]))!;
      assert.match(answer, /Partial contradiction check/);
      assert.match(answer, /cannot certify that the records are consistent/);
      assert.doesNotMatch(answer, /cannot both describe the same measurement/);
    }
  });
});
