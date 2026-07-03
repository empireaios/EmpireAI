/**
 * G7-09 — Executive KPI intelligence.
 */

import type { RegistryLoaderContext } from "../../../registry/types/registry-types.js";
import type { ExecutiveKpiId, ExecutiveKpiSnapshot, EmpireHealthScore } from "../contracts/operational-intelligence-types.js";
import { EXECUTIVE_KPI_IDS } from "../contracts/operational-intelligence-types.js";
import {
  deriveIntelligenceSignalFromRef,
  mapKpiRefToLabel,
  parseKpiFromRef,
  resolveOperationalIntelligenceDependencies,
} from "../registry/operational-intelligence-registry-resolver.js";

function computeGrade(score: number): EmpireHealthScore["grade"] {
  if (score >= 90) return "A";
  if (score >= 75) return "B";
  if (score >= 60) return "C";
  if (score >= 45) return "D";
  return "F";
}

export function computeExecutiveKpiSnapshots(context: RegistryLoaderContext = {}): ExecutiveKpiSnapshot[] {
  const deps = resolveOperationalIntelligenceDependencies(context);
  const now = new Date().toISOString();
  const snapshots: ExecutiveKpiSnapshot[] = [];

  for (const kpiId of EXECUTIVE_KPI_IDS) {
    const matchingRef = deps.kpiMetricRefs.find((ref) => parseKpiFromRef(ref) === kpiId);
    const ref = matchingRef ?? `kpi:${kpiId}`;
    const signal = deriveIntelligenceSignalFromRef(ref);

    snapshots.push({
      kpiId,
      label: mapKpiRefToLabel(ref),
      value: Math.round(signal * 100),
      unit: kpiId.includes("rate") || kpiId.includes("roi") || kpiId.includes("score") ? "%" : "index",
      trend: signal >= 0.65 ? "up" : signal >= 0.4 ? "stable" : "down",
      ruleReference: ref,
      computedAt: now,
    });
  }

  return snapshots;
}

export function computeEmpireHealthScore(context: RegistryLoaderContext = {}): EmpireHealthScore {
  const snapshots = computeExecutiveKpiSnapshots(context);
  const now = new Date().toISOString();

  const kpiContributions = snapshots.map((snap) => ({
    kpiId: snap.kpiId,
    contribution: Math.round(snap.value / snapshots.length),
  }));

  const score = Math.round(
    kpiContributions.reduce((sum, entry) => sum + entry.contribution, 0),
  );

  return {
    score,
    grade: computeGrade(score),
    kpiContributions,
    computedAt: now,
  };
}

export function getKpiSnapshot(kpiId: ExecutiveKpiId, context: RegistryLoaderContext = {}): ExecutiveKpiSnapshot | undefined {
  return computeExecutiveKpiSnapshots(context).find((s) => s.kpiId === kpiId);
}
