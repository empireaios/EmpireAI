/**
 * Pillow Capability Test harness (safe sandbox).
 * Does NOT inject expected answers into the executive loop.
 * Scores whether Pillow independently diagnoses/strategises.
 */

import { randomUUID } from "node:crypto";

import { ALL_CAPABILITY_SCENARIOS } from "./capability-scenarios.js";
import { runExecutiveOperatingCycle } from "./cycle-runner.js";
import {
  getCurrentObjective,
  getLatestExecutiveCycle,
  persistCapabilityTestRun,
} from "./store.js";
import type { ExecutiveCycleRecord } from "./types.js";

export type CapabilityTestId = "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H";

export type CapabilityTestResult = {
  id: CapabilityTestId;
  title: string;
  status: "PASS" | "FAIL";
  checks: Array<{ name: string; pass: boolean; detail: string }>;
  cycleId: string;
  disposition: string;
};

function check(
  name: string,
  pass: boolean,
  detail: string,
): { name: string; pass: boolean; detail: string } {
  return { name, pass, detail };
}

function stageSummaries(cycle: ExecutiveCycleRecord): string {
  return cycle.stages.map((s) => `${s.stage}:${s.summary}`).join(" || ");
}

function scoreA(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  const logistics = cycle.stages.find((s) => s.stage === "INVESTIGATE")?.artifacts
    .logistics as { triggered?: boolean; alternatives?: Array<{ id: string }>; hardCodedUsWarehouse?: boolean } | undefined;
  const altIds = new Set((logistics?.alternatives ?? []).map((a) => a.id));
  return [
    check("logistics_triggered", Boolean(logistics?.triggered), `triggered=${logistics?.triggered}`),
    check(
      "fulfilment_alternatives_present",
      (logistics?.alternatives?.length ?? 0) >= 3,
      `count=${logistics?.alternatives?.length ?? 0}`,
    ),
    check(
      "no_hardcoded_us_warehouse_rule",
      logistics?.hardCodedUsWarehouse === false,
      `hardCodedUsWarehouse=${logistics?.hardCodedUsWarehouse}`,
    ),
    check(
      "considers_abandon_or_substitute_or_shipping",
      altIds.has("alt_abandon") ||
        altIds.has("alt_domestic_substitute") ||
        altIds.has("alt_shipping_method"),
      [...altIds].join(","),
    ),
    check(
      "disposition_investigates_logistics",
      /LOGISTICS|INVESTIGATE/i.test(cycle.decision.disposition),
      cycle.decision.disposition,
    ),
  ];
}

function scoreB(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  const kinds = new Set(cycle.hypotheses.map((h) => h.kind));
  return [
    check("price_hypothesis", kinds.has("pricing_competition"), [...kinds].join(",")),
    check(
      "premium_recognised",
      (cycle.situation.pricePremiumPct ?? 0) >= 25 && kinds.has("pricing_competition"),
      `premium=${cycle.situation.pricePremiumPct}`,
    ),
    check(
      "not_blind_approve",
      !/APPROVE/i.test(cycle.decision.disposition),
      cycle.decision.disposition,
    ),
  ];
}

function scoreC(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  const text = stageSummaries(cycle).toLowerCase();
  return [
    check(
      "outcome_not_task_complete",
      /outcome|zero sales|economic/i.test(text + cycle.decision.rationale),
      cycle.decision.disposition,
    ),
    check(
      "no_hardcoded_reprice_only",
      cycle.decision.disposition !== "REPRICE",
      cycle.decision.disposition,
    ),
    check(
      "investigation_or_diagnose",
      /INVESTIGATE|DIAGNOSE|OUTCOME/i.test(cycle.decision.disposition),
      cycle.decision.disposition,
    ),
  ];
}

function scoreD(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  const kinds = new Set(cycle.hypotheses.map((h) => h.kind));
  return [
    check("margin_reassess", kinds.has("margin_economics") || /REASSESS|ECONOMICS/i.test(cycle.decision.disposition), cycle.decision.disposition),
    check("supplier_alternative_considered", kinds.has("supplier_sourcing"), [...kinds].join(",")),
  ];
}

function scoreE(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  const kinds = new Set(cycle.hypotheses.map((h) => h.kind));
  return [
    check("demand_challenge", kinds.has("demand_evidence"), [...kinds].join(",")),
    check(
      "challenges_prior_approve",
      /HOLD|INVESTIGATE|EVIDENCE/i.test(cycle.decision.disposition),
      cycle.decision.disposition,
    ),
    check(
      "contradiction_recognised",
      /UNKNOWN demand|premium|contradict|conflict/i.test(cycle.decision.rationale),
      cycle.decision.rationale,
    ),
  ];
}

function scoreF(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  return [
    check(
      "investigates_without_spend",
      cycle.hypotheses.length > 0,
      `hypotheses=${cycle.hypotheses.length}`,
    ),
    check(
      "escalates_before_crossing_gate",
      cycle.decision.authority === "requires_grand_king" && Boolean(cycle.escalation),
      `authority=${cycle.decision.authority}`,
    ),
    check(
      "escalation_package_complete",
      Boolean(
        cycle.escalation?.whatIFound &&
          cycle.escalation.whyItMatters &&
          cycle.escalation.whatINeedYouToDecide &&
          cycle.escalation.whatIWillDoNext,
      ),
      cycle.escalation ? "package present" : "missing",
    ),
    check(
      "did_not_authorise_spend",
      !/SPEND_EXECUTED|PUBLISH/i.test(cycle.decision.disposition),
      cycle.decision.disposition,
    ),
  ];
}

function scoreG(cycle: ExecutiveCycleRecord, workspaceId: string): CapabilityTestResult["checks"] {
  const objective = getCurrentObjective(workspaceId);
  const latest = getLatestExecutiveCycle(workspaceId);
  return [
    check("cycle_persisted", latest?.cycleId === cycle.cycleId, `latest=${latest?.cycleId}`),
    check(
      "objective_persisted",
      Boolean(objective?.lastCycleId === cycle.cycleId && objective.objective),
      objective?.objective ?? "missing",
    ),
    check(
      "outcome_linked",
      Boolean(cycle.outcomeId),
      `outcomeId=${cycle.outcomeId}`,
    ),
  ];
}

function scoreH(cycle: ExecutiveCycleRecord): CapabilityTestResult["checks"] {
  return [
    check(
      "proactive_without_owner_prompt",
      cycle.hypotheses.length > 0 || cycle.decision.disposition !== "CONTINUE_MONITORING",
      `hypotheses=${cycle.hypotheses.length}; disposition=${cycle.decision.disposition}`,
    ),
    check(
      "useful_investigation_identified",
      Boolean(cycle.selectedWork || cycle.hypotheses[0]),
      cycle.selectedWork?.title ?? cycle.hypotheses[0]?.question ?? "none",
    ),
  ];
}

export function runPillowCapabilityTests(workspaceId: string): {
  runId: string;
  completedAt: string;
  results: CapabilityTestResult[];
  summary: { passed: number; failed: number; total: number };
} {
  const runId = randomUUID();
  const results: CapabilityTestResult[] = [];

  const run = (
    id: CapabilityTestId,
    title: string,
    situation: (typeof ALL_CAPABILITY_SCENARIOS)[CapabilityTestId],
    score: (cycle: ExecutiveCycleRecord) => CapabilityTestResult["checks"],
    persist = false,
  ) => {
    const cycle = runExecutiveOperatingCycle({
      workspaceId,
      situation,
      mode: "sandbox",
      persist,
      recordFlight: false,
    });
    const checks = score(cycle);
    const status = checks.every((c) => c.pass) ? "PASS" : "FAIL";
    results.push({
      id,
      title,
      status,
      checks,
      cycleId: cycle.cycleId,
      disposition: cycle.decision.disposition,
    });
  };

  run("A", "Logistics strategy", ALL_CAPABILITY_SCENARIOS.A, scoreA);
  run("B", "Price / competition", ALL_CAPABILITY_SCENARIOS.B, scoreB);
  run("C", "No sales post-launch", ALL_CAPABILITY_SCENARIOS.C, scoreC);
  run("D", "Supplier cost deterioration", ALL_CAPABILITY_SCENARIOS.D, scoreD);
  run("E", "Contradictory evidence", ALL_CAPABILITY_SCENARIOS.E, scoreE);
  run("F", "Owner authority gate", ALL_CAPABILITY_SCENARIOS.F, scoreF);
  run("G", "Continuity persistence", ALL_CAPABILITY_SCENARIOS.G, (c) => scoreG(c, workspaceId), true);
  run("H", "Proactive opportunity", ALL_CAPABILITY_SCENARIOS.H, scoreH);

  const completedAt = new Date().toISOString();
  const summary = {
    passed: results.filter((r) => r.status === "PASS").length,
    failed: results.filter((r) => r.status === "FAIL").length,
    total: results.length,
  };
  const record = { runId, workspaceId, completedAt, results, summary };
  persistCapabilityTestRun({ runId, workspaceId, completedAt, record });
  return { runId, completedAt, results, summary };
}
