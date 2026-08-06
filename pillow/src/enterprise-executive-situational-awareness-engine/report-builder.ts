import { EESAE_METADATA_VERSION, EESAE_REPORT_VERSION } from "./paths.js";
import type {
  BoundaryValidation,
  DomainSummary,
  EesaeValidation,
  GovernanceValidation,
  GrandKingBriefing,
  PersistentAwarenessState,
  SituationalAwarenessReport,
} from "./types.js";
import type { AwarenessFinding, ExecutiveRecommendation } from "./types.js";

export function buildReport(input: {
  reportId: string;
  workerId: string;
  executiveSummary: string;
  domainSummaries: DomainSummary[];
  deteriorationDetected: boolean;
  findings: AwarenessFinding[];
  recommendations: ExecutiveRecommendation[];
  briefingForGrandKing: string;
  confidenceScore: number;
  digitalSoulAligned: boolean;
  boundaryValidation: BoundaryValidation;
  governanceValidation: GovernanceValidation;
  validation: EesaeValidation;
  historyRefs: string[];
}): SituationalAwarenessReport {
  const now = new Date().toISOString();
  return {
    reportId: input.reportId,
    reportVersion: EESAE_REPORT_VERSION,
    metadataVersion: EESAE_METADATA_VERSION,
    engineId: "PILLOW-EESAE-001",
    timestamp: now,
    runTimestamp: now,
    workerId: input.workerId,
    missionId: "EESAE-01",
    executiveSummary: input.executiveSummary,
    domainSummaries: input.domainSummaries.map((d) => ({ ...d, evidenceRefs: [...d.evidenceRefs], notes: [...d.notes] })),
    deteriorationDetected: input.deteriorationDetected,
    findings: input.findings.map((f) => ({ ...f, evidence: [...f.evidence] })),
    recommendations: input.recommendations.map((r) => ({ ...r, evidenceRefs: [...r.evidenceRefs], findingIds: [...r.findingIds] })),
    briefingForGrandKing: input.briefingForGrandKing,
    confidenceScore: input.confidenceScore,
    neverFabricateMetrics: true,
    neverSilentDeterioration: true,
    constitutionalDutyActive: true,
    digitalSoulAligned: input.digitalSoulAligned,
    boundaryValidation: input.boundaryValidation,
    governanceValidation: input.governanceValidation,
    validation: input.validation,
    historyRefs: [...input.historyRefs],
  };
}

export function buildGrandKingBriefing(
  state: PersistentAwarenessState,
  findings: AwarenessFinding[],
): GrandKingBriefing {
  const criticalFindings = findings.filter((f) => f.severity === "critical" && !f.acknowledged);
  const openEscalations = state.escalations.filter((e) => !e.acknowledged);
  const topRecommendations = state.recommendations.slice(0, 5);

  const summaryParts = [
    `Awareness state ${state.stateId} at ${state.timestamp}.`,
    `Open findings: ${state.openFindings.length}.`,
    criticalFindings.length > 0 ? `CRITICAL unacknowledged: ${criticalFindings.length}.` : "No unacknowledged critical findings.",
    state.systemHealthSummary,
  ];

  return {
    briefingId: `eesae-brief-${state.stateId}`,
    timestamp: new Date().toISOString(),
    missionId: "EESAE-01",
    summary: summaryParts.join(" "),
    criticalFindings,
    openEscalations,
    topRecommendations,
    constitutionalDutyActive: true,
    neverFabricateMetrics: true,
  };
}

export function buildBriefingText(state: PersistentAwarenessState, deteriorationDetected: boolean): string {
  const lines = [
    "=== Grand King Situational Awareness Briefing ===",
    `State: ${state.stateId} | Confidence: ${(state.confidenceScore * 100).toFixed(0)}%`,
    "",
    "System: " + state.systemHealthSummary,
    "Performance: " + state.performanceSummary,
    "Business: " + state.businessSummary,
    "Workforce: " + state.workforceSummary,
    "Self-awareness: " + state.selfAwarenessSummary,
    "",
  ];
  if (deteriorationDetected) {
    lines.push("⚠ DETERIORATION DETECTED — requires executive attention");
  }
  const critical = state.openFindings.filter((f) => f.severity === "critical" && !f.acknowledged);
  if (critical.length > 0) {
    lines.push(`Critical unacknowledged findings (${critical.length}):`);
    for (const f of critical) {
      lines.push(`  - ${f.title}`);
    }
  }
  if (state.recommendations.length > 0) {
    lines.push("", "Top recommendations:");
    for (const r of state.recommendations.slice(0, 3)) {
      lines.push(`  ${r.priority}. ${r.title}`);
    }
  }
  lines.push("", "Constitutional duty: continuous executive situational awareness ACTIVE");
  lines.push("Never fabricate metrics | Never silent on critical deterioration");
  return lines.join("\n");
}

export function buildCatalog(
  workerId: string,
  reports: SituationalAwarenessReport[],
  states: PersistentAwarenessState[],
  integrations: import("./types.js").IntegrationHandshake[],
  openFindings: number,
) {
  return {
    workerId,
    reports: reports.map((r) => ({
      reportId: r.reportId,
      timestamp: r.timestamp,
      confidenceScore: r.confidenceScore,
    })),
    awarenessStates: states.map((s) => ({
      stateId: s.stateId,
      timestamp: s.timestamp,
      confidenceScore: s.confidenceScore,
    })),
    integrations,
    openFindings,
  };
}

export function buildExecutiveSummary(state: PersistentAwarenessState, deteriorationDetected: boolean): string {
  const parts = [
    `Enterprise situational awareness cycle complete. Confidence ${(state.confidenceScore * 100).toFixed(0)}%.`,
    `${state.openFindings.length} open finding(s).`,
  ];
  if (deteriorationDetected) parts.push("Deterioration detected from prior state.");
  parts.push("Evidence-based only — no fabricated metrics.");
  return parts.join(" ");
}
