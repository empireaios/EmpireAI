/**
 * Executive birth-readiness diagnostics, not independent replacement certification.
 * Stored cycles, outcomes and sandbox harness passes can show partial engineering
 * evidence only. There is no independent certification receipt acceptance path.
 */

import { getBirthRecord } from "../birth.js";
import { hasCompleteSandboxCapabilityPass } from "./capability-run-evidence.js";
import { getLatestCapabilityTestRun, getLatestExecutiveCycle, listExecutiveCycles, listOutcomes } from "./store.js";

export type ReadinessStatus = "PROVEN" | "PARTIAL" | "NOT_PROVEN" | "FAILED";

export type BirthReadinessRow = {
  capability: string;
  status: ReadinessStatus;
  evidence: string;
};

export type BirthReadinessReport = {
  computedAt: string;
  workspaceId: string;
  birthTimestamp: string | null;
  technicallyReadyForGrandKingAuthorisation: boolean;
  rows: BirthReadinessRow[];
  mandatoryStillOpen: string[];
  notes: string[];
};

function row(capability: string, status: ReadinessStatus, evidence: string): BirthReadinessRow {
  return { capability, status,
    evidence: `${evidence}. Independent capability certification remains unverified; local diagnostics carry no certification credit.` };
}

export function evaluateExecutiveBirthReadiness(workspaceId: string): BirthReadinessReport {
  const birth = getBirthRecord(workspaceId);
  const cycles = listExecutiveCycles(workspaceId, 20);
  const liveCycles = cycles.filter((c) => c.mode === "live");
  const latest = getLatestExecutiveCycle(workspaceId);
  const outcomes = listOutcomes(workspaceId, 50);
  const capRun = getLatestCapabilityTestRun(workspaceId) as {
    results?: Array<{ id: string; status: string }>;
    summary?: { passed: number; failed: number; total: number };
  } | null;

  const capMap = new Map((capRun?.results ?? []).map((r) => [r.id, r.status]));
  const allCapPass = hasCompleteSandboxCapabilityPass(capRun);

  const hasFullStageLoop = Boolean(
    latest &&
      [
        "OBSERVE",
        "DIAGNOSE",
        "CRITIQUE",
        "GENERATE_ALTERNATIVES",
        "INVESTIGATE",
        "COMPARE",
        "DECIDE",
        "ACT_WITHIN_AUTHORITY",
        "MONITOR",
        "LEARN",
        "UPDATE_STRATEGY",
        "CONTINUE",
      ].every((s) => latest.stages.some((x) => x.stage === s)),
  );

  const rows: BirthReadinessRow[] = [
    row("independent replacement certification", "NOT_PROVEN", birth.authority.reason),
    row(
      "continuous executive loop",
      hasFullStageLoop ? "PARTIAL" : "NOT_PROVEN",
      liveCycles.length > 0
        ? `${liveCycles.length} stored cycles labelled live; latest=${latest?.cycleId}; the label is not independent operating evidence`
        : hasFullStageLoop
          ? "Sandbox/cycle structure present; live continuous ticks not yet proven"
          : "No executive cycle stage evidence",
    ),
    row(
      "self-critique",
      capMap.get("E") === "PASS" || capMap.get("B") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      `capability B=${capMap.get("B") ?? "n/a"}; E=${capMap.get("E") ?? "n/a"}`,
    ),
    row(
      "strategic hypothesis generation",
      (latest?.hypotheses.length ?? 0) > 0 || capMap.get("H") === "PASS"
        ? "PARTIAL"
        : "NOT_PROVEN",
      `latestHypotheses=${latest?.hypotheses.length ?? 0}`,
    ),
    row(
      "proactive investigation",
      capMap.get("H") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      `capability H=${capMap.get("H") ?? "n/a"}`,
    ),
    row(
      "economic prioritisation",
      (latest?.workQueue.length ?? 0) > 0 ? "PARTIAL" : "NOT_PROVEN",
      `workQueue=${latest?.workQueue.length ?? 0}`,
    ),
    row(
      "owner escalation",
      capMap.get("F") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      `capability F=${capMap.get("F") ?? "n/a"}`,
    ),
    row(
      "post-action monitoring",
      outcomes.some((o) => o.status === "MONITORED") || capMap.get("C") === "PASS"
        ? "PARTIAL"
        : "NOT_PROVEN",
      `monitoredOutcomes=${outcomes.filter((o) => o.status === "MONITORED").length}`,
    ),
    row(
      "outcome learning",
      outcomes.some((o) => Boolean(o.lesson)) || capMap.get("C") === "PASS"
        ? "PARTIAL"
        : "NOT_PROVEN",
      `lessons=${outcomes.filter((o) => o.lesson).length}`,
    ),
    row(
      "institutional memory",
      birth.gates.find((g) => g.id === "institutional_memory")?.passed
        ? "PARTIAL"
        : "NOT_PROVEN",
      birth.gates.find((g) => g.id === "institutional_memory")?.evidence ??
        "Institutional memory gate incomplete; restart durability still CQ-12",
    ),
    row(
      "cost control",
      "PARTIAL",
      "Tier map + Cost Guard mechanisms exist; this diagnostic does not establish current owner-limit configuration, enforcement or reconciled cost-per-decision",
    ),
    row(
      "restart recovery",
      capMap.get("G") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      "Stored objective/cycle records and sandbox checks do not prove this release survives a provider restart or redeploy",
    ),
    row(
      "runtime independence",
      liveCycles.length > 0 ? "PARTIAL" : "NOT_PROVEN",
      "Automation/server tick wired; full 24/7 Cursor-free proof still requires production soak",
    ),
    row(
      "proactive Grand King communication",
      capMap.get("F") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      "Escalation package format WHAT I FOUND… implemented; live owner delivery surface PARTIAL",
    ),
    row(
      "Commerce capability",
      "PARTIAL",
      "Presale SMART funnel + CQ-04/CQ-05 exist; publish/BUYABLE/first dollar not realised",
    ),
    row(
      "logistics strategy",
      capMap.get("A") === "PASS" ? "PARTIAL" : "NOT_PROVEN",
      `capability A=${capMap.get("A") ?? "n/a"} (sandbox; live connector investigation still required)`,
    ),
    row(
      "real-world connector visibility",
      "PARTIAL",
      "CJ/Amazon connectors exist for commissioning/presale; logistics alt investigations still require live warehouse/shipping reads",
    ),
  ];

  const mandatoryStillOpen = rows
    .filter((r) => r.status !== "PROVEN")
    .map((r) => `${r.capability}=${r.status}`);

  // No local diagnostic can satisfy independent certification or owner authority.
  // The immutable current authority remains the final fail-closed boundary.
  const technicallyReadyForGrandKingAuthorisation =
    birth.technicallyReady && mandatoryStillOpen.length === 0 && birth.birthTimestamp == null;

  return {
    computedAt: new Date().toISOString(),
    workspaceId,
    birthTimestamp: birth.birthTimestamp,
    technicallyReadyForGrandKingAuthorisation,
    rows,
    mandatoryStillOpen,
    notes: [
      birth.authority.reason,
      "This report does not declare Pillow born.",
      "Capability harness is primarily sandbox/runtime-structure proof; live soak and connector-backed logistics remain open.",
      `Legacy birth.technicallyReady=${birth.technicallyReady}; birthStatus=${birth.status}`,
      allCapPass
        ? "Sandbox capability tests A–H all PASS."
        : `Sandbox capability tests incomplete/failing: passed=${capRun?.summary?.passed ?? 0}/${capRun?.summary?.total ?? 0}`,
    ],
  };
}
