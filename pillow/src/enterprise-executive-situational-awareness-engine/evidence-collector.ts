import { nextFindingId } from "./audit-store.js";
import type { EnterpriseExecutiveSituationalAwarenessEngineDependencies } from "./integrations.js";
import type {
  AwarenessFinding,
  DeteriorationResult,
  DomainSummary,
  EesaeInput,
  PersistentAwarenessState,
  RootCauseInvestigation,
} from "./types.js";

export function evaluateSystemHealth(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
  input: EesaeInput = {},
): DomainSummary {
  const evidenceRefs: string[] = [];
  const notes: string[] = [];
  let summary = "No system health evidence bound — honest no-evidence state";
  let confidenceScore = 0.2;

  const monrt = deps.monitoringRuntime;
  if (monrt?.getState) {
    const state = monrt.getState();
    const healthStatus = state.health?.status ?? "unknown";
    const healthScore = state.health?.healthScore;
    evidenceRefs.push("monitoring_runtime:getState");
    if (healthScore != null) {
      summary = `Monitoring runtime health: ${healthStatus} (score ${healthScore})`;
      confidenceScore = Math.min(0.95, 0.4 + healthScore / 200);
    } else {
      summary = `Monitoring runtime health status: ${healthStatus}`;
      confidenceScore = 0.5;
    }
    notes.push("Derived from monitoringRuntime.getState() — not fabricated");
  }

  const recovery = deps.recoveryRuntime;
  if (recovery?.getState) {
    const rState = recovery.getState();
    evidenceRefs.push("recovery_runtime:getState");
    notes.push(`Recovery runtime status: ${rState.status ?? "unknown"}`);
    if (rState.activeRecoveries != null && rState.activeRecoveries > 0) {
      summary += `; active recoveries: ${rState.activeRecoveries}`;
    }
  }

  const orchestration = deps.pillowOrchestrationRuntime;
  if (orchestration?.getState) {
    const oState = orchestration.getState();
    evidenceRefs.push("pillow_orchestration_runtime:getState");
    notes.push(`Orchestration status: ${oState.status ?? "unknown"}`);
  }

  if (input.probeSnapshot?.systemHealth) {
    const probe = input.probeSnapshot.systemHealth as Record<string, unknown>;
    evidenceRefs.push("probeSnapshot:systemHealth");
    if (typeof probe.status === "string") {
      summary = `Probe snapshot system health: ${probe.status}`;
      confidenceScore = Math.max(confidenceScore, 0.55);
    }
  }

  return {
    domain: "system",
    summary,
    evidenceAvailable: evidenceRefs.length > 0,
    evidenceRefs,
    confidenceScore,
    notes,
  };
}

export function evaluatePerformanceIntelligence(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
  input: EesaeInput = {},
): { summary: DomainSummary; findings: AwarenessFinding[] } {
  const evidenceRefs: string[] = [];
  const notes: string[] = [];
  const findings: AwarenessFinding[] = [];
  let summary = "No performance evidence bound — honest no-evidence state";
  let confidenceScore = 0.2;

  const monrt = deps.monitoringRuntime;
  if (monrt?.generateAlerts) {
    const alerts = monrt.generateAlerts({});
    const alertList = alerts.alerts ?? [];
    evidenceRefs.push("monitoring_runtime:generateAlerts");
    if (alertList.length > 0) {
      summary = `Performance alerts from monitoring: ${alertList.length} alert(s)`;
      confidenceScore = 0.7;
      for (const alert of alertList) {
        if (alert.severity === "critical" || alert.severity === "high") {
          findings.push(buildFinding("performance", alert.severity === "critical" ? "critical" : "high", alert.message ?? "Performance alert", [`monitoring_runtime:alert:${alert.componentId ?? "unknown"}`]));
        }
      }
    } else {
      summary = "Monitoring runtime reports no active performance alerts";
      confidenceScore = 0.55;
    }
  } else if (monrt?.getState) {
    const state = monrt.getState();
    evidenceRefs.push("monitoring_runtime:getState");
    const totalAlerts = state.health?.totalAlerts ?? 0;
    summary = `Monitoring health totalAlerts: ${totalAlerts}`;
    confidenceScore = 0.5;
  }

  const queue = deps.queueRuntime;
  if (queue?.getState) {
    const qState = queue.getState();
    evidenceRefs.push("queue_runtime:getState");
    if (qState.queueDepth != null && qState.queueDepth > 100) {
      findings.push(buildFinding("performance", "high", `Queue depth elevated: ${qState.queueDepth}`, ["queue_runtime:queueDepth"]));
      summary += `; queue depth ${qState.queueDepth}`;
    }
  }

  const memory = deps.memoryRuntime;
  if (memory?.getState) {
    const mState = memory.getState();
    evidenceRefs.push("memory_runtime:getState");
    if (mState.pressure === "high") {
      findings.push(buildFinding("performance", "high", "Memory pressure high", ["memory_runtime:pressure"]));
    }
  }

  if (input.probeSnapshot?.performance) {
    const probe = input.probeSnapshot.performance as Record<string, unknown>;
    evidenceRefs.push("probeSnapshot:performance");
    if (typeof probe.latencyMs === "number" && probe.latencyMs > 500) {
      findings.push(buildFinding("performance", "medium", `Elevated latency: ${probe.latencyMs}ms`, ["probeSnapshot:latencyMs"]));
      summary = `Probe latency ${probe.latencyMs}ms`;
      confidenceScore = Math.max(confidenceScore, 0.6);
    }
  }

  return {
    summary: {
      domain: "performance",
      summary,
      evidenceAvailable: evidenceRefs.length > 0,
      evidenceRefs,
      confidenceScore,
      notes,
    },
    findings,
  };
}

export function evaluateBusinessIntelligence(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
): DomainSummary {
  const evidenceRefs: string[] = [];
  const notes: string[] = [];
  let summary = "No business intelligence evidence bound — honest no-evidence state";
  let confidenceScore = 0.15;

  const commerce = deps.commerceIntelligence;
  if (commerce?.getSnapshot) {
    const snap = commerce.getSnapshot();
    evidenceRefs.push("commerce_intelligence:getSnapshot");
    const parts: string[] = [];
    if (snap.revenue != null) parts.push(`revenue=${snap.revenue}`);
    if (snap.orders != null) parts.push(`orders=${snap.orders}`);
    if (snap.conversions != null) parts.push(`conversions=${snap.conversions}`);
    if (parts.length > 0) {
      summary = `Commerce intelligence: ${parts.join(", ")}`;
      confidenceScore = 0.75;
    }
    if (snap.evidenceRefs?.length) {
      evidenceRefs.push(...snap.evidenceRefs);
    }
    notes.push("Business metrics from injected commerceIntelligence only");
  } else if (deps.empireKnowledgeEngine?.getSnapshot) {
    const snap = deps.empireKnowledgeEngine.getSnapshot();
    evidenceRefs.push("empire_knowledge_engine:getSnapshot");
    if (Object.keys(snap).length > 0) {
      summary = "Empire knowledge snapshot available — no commerce metrics in snapshot";
      confidenceScore = 0.4;
    }
  }

  return {
    domain: "business",
    summary,
    evidenceAvailable: evidenceRefs.length > 0 && summary.includes("revenue=") || summary.includes("orders="),
    evidenceRefs,
    confidenceScore,
    notes: [...notes, "Never fabricates revenue/orders/conversions"],
  };
}

export function evaluateAiWorkforceIntelligence(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
): { summary: DomainSummary; findings: AwarenessFinding[] } {
  const evidenceRefs: string[] = [];
  const notes: string[] = [];
  const findings: AwarenessFinding[] = [];
  let summary = "No workforce intelligence evidence bound — honest no-evidence state";
  let confidenceScore = 0.15;

  const registry = deps.workerRegistry;
  if (registry?.listWorkers) {
    const workers = registry.listWorkers();
    evidenceRefs.push("worker_registry:listWorkers");
    const failed = workers.filter((w) => w.status === "failed" || (w.failureCount ?? 0) > 0);
    summary = `Workforce: ${workers.length} worker(s), ${failed.length} with failures`;
    confidenceScore = 0.65;
    for (const w of failed) {
      findings.push(
        buildFinding(
          "workforce",
          (w.failureCount ?? 0) >= 3 ? "critical" : "medium",
          `Worker ${w.workerId ?? "unknown"} failures: ${w.failureCount ?? 0}`,
          [`worker_registry:${w.workerId ?? "unknown"}`],
        ),
      );
    }
    notes.push("Workforce data from workerRegistry only");
  }

  return {
    summary: {
      domain: "workforce",
      summary,
      evidenceAvailable: evidenceRefs.length > 0,
      evidenceRefs,
      confidenceScore,
      notes,
    },
    findings,
  };
}

export function evaluateSelfAwareness(
  deps: EnterpriseExecutiveSituationalAwarenessEngineDependencies,
): DomainSummary {
  const evidenceRefs: string[] = [];
  const notes: string[] = [];
  let summary = "Self-awareness evaluation: complexity and simplification questions pending evidence";
  let confidenceScore = 0.3;

  const pcf = deps.programmeCertificationFactory;
  if (pcf?.getState) {
    const state = pcf.getState();
    evidenceRefs.push("programme_certification_factory:getState");
    const healthScore = state.health?.healthScore ?? 0;
    summary = `Programme certification health score ${healthScore} — monitor constitutional programme completeness`;
    confidenceScore = 0.5;
    notes.push("Self-awareness includes programme health signal when bound");
  }

  if (deps.intelligenceContext?.getSnapshot) {
    evidenceRefs.push("intelligence_context:getSnapshot");
    notes.push("Intelligence context snapshot consulted for self-awareness");
    confidenceScore = Math.max(confidenceScore, 0.45);
  }

  notes.push("Questions: Is complexity increasing? Are cycles slowing? What can be simplified?");

  return {
    domain: "self",
    summary,
    evidenceAvailable: evidenceRefs.length > 0,
    evidenceRefs,
    confidenceScore,
    notes,
  };
}

export function detectDeterioration(
  prior: PersistentAwarenessState | null,
  current: PersistentAwarenessState,
): DeteriorationResult {
  const criticalDeltas: string[] = [];
  const evidenceRefs: string[] = [];
  const notes: string[] = [];

  if (!prior) {
    return {
      deteriorationDetected: current.openFindings.some((f) => f.severity === "critical" || f.severity === "high"),
      criticalDeltas: current.openFindings.filter((f) => f.severity === "critical").map((f) => f.title),
      evidenceRefs: current.evidenceRefs,
      comparedStateIds: [null, current.stateId],
      notes: ["No prior state — initial baseline"],
    };
  }

  const priorCritical = new Set(prior.openFindings.filter((f) => f.severity === "critical").map((f) => f.findingId));
  const currentCritical = current.openFindings.filter((f) => f.severity === "critical");

  for (const finding of currentCritical) {
    if (!priorCritical.has(finding.findingId)) {
      criticalDeltas.push(`New critical finding: ${finding.title}`);
      evidenceRefs.push(...finding.evidence);
    }
  }

  if (current.confidenceScore < prior.confidenceScore - 0.15) {
    criticalDeltas.push(`Confidence dropped from ${prior.confidenceScore.toFixed(2)} to ${current.confidenceScore.toFixed(2)}`);
    evidenceRefs.push(...current.evidenceRefs);
  }

  const deteriorationDetected = criticalDeltas.length > 0 || current.openFindings.length > prior.openFindings.length;

  if (deteriorationDetected) {
    notes.push("Deterioration detected — never silent when evidence exists");
  }

  return {
    deteriorationDetected,
    criticalDeltas,
    evidenceRefs: [...new Set(evidenceRefs)],
    comparedStateIds: [prior.stateId, current.stateId],
    notes,
  };
}

export function investigateRootCauses(finding: AwarenessFinding | null): RootCauseInvestigation {
  const investigationId = `eesae-inv-${Date.now()}`;
  if (!finding) {
    return {
      investigationId,
      findingId: null,
      probableCauses: ["Insufficient finding context"],
      evidence: [],
      businessImpact: "unknown — no finding",
      urgency: "low",
    };
  }
  return {
    investigationId,
    findingId: finding.findingId,
    probableCauses: finding.probableRootCauses.length > 0
      ? finding.probableRootCauses
      : inferProbableCauses(finding),
    evidence: finding.evidence,
    businessImpact: finding.businessImpact,
    urgency: finding.urgency,
  };
}

export function estimateBusinessImpactAndUrgency(finding: AwarenessFinding): {
  businessImpact: string;
  urgency: AwarenessFinding["urgency"];
} {
  const impactMap: Record<string, string> = {
    performance: "Operational latency and reliability may affect executive throughput",
    business: "Revenue or conversion exposure if commerce signals degrade",
    workforce: "Worker failures may delay mission execution",
    system: "Infrastructure degradation may cascade across runtimes",
    self: "Governance or complexity drift may reduce long-term empire value",
    governance: "Governance misalignment may block Grand King decisions",
  };
  return {
    businessImpact: finding.businessImpact || impactMap[finding.domain] || "Impact requires executive review",
    urgency: finding.severity === "critical" ? "critical" : finding.severity === "high" ? "high" : finding.severity === "medium" ? "medium" : "low",
  };
}

function buildFinding(
  domain: AwarenessFinding["domain"],
  severity: AwarenessFinding["severity"],
  title: string,
  evidence: string[],
): AwarenessFinding {
  const now = new Date().toISOString();
  const impact = estimateBusinessImpactAndUrgency({
    findingId: "",
    domain,
    severity,
    title,
    evidence,
    probableRootCauses: [],
    businessImpact: "",
    urgency: "medium",
    recommendedActions: [],
    acknowledged: false,
    escalated: false,
    firstDetectedAt: now,
    lastEscalatedAt: null,
  });
  return {
    findingId: nextFindingId(),
    domain,
    severity,
    title,
    evidence,
    probableRootCauses: inferProbableCauses({ domain, title, evidence } as AwarenessFinding),
    businessImpact: impact.businessImpact,
    urgency: impact.urgency,
    recommendedActions: [`Review evidence: ${evidence.join(", ")}`, "Escalate to Grand King if unacknowledged"],
    acknowledged: false,
    escalated: false,
    firstDetectedAt: now,
    lastEscalatedAt: null,
  };
}

function inferProbableCauses(finding: Pick<AwarenessFinding, "domain" | "title" | "evidence">): string[] {
  const causes: string[] = [];
  if (finding.domain === "performance") causes.push("Runtime latency or queue backlog", "Resource pressure");
  if (finding.domain === "workforce") causes.push("Worker failure loop", "Mission queue overload");
  if (finding.domain === "system") causes.push("Infrastructure degradation", "Recovery cycle active");
  if (finding.evidence.some((e) => e.includes("queue"))) causes.push("Queue saturation");
  if (causes.length === 0) causes.push("Requires evidence-based investigation");
  return causes;
}

export function buildAwarenessState(input: {
  stateId: string;
  systemHealth: DomainSummary;
  performance: DomainSummary;
  business: DomainSummary;
  workforce: DomainSummary;
  selfAwareness: DomainSummary;
  findings: AwarenessFinding[];
  escalations: import("./types.js").EscalationRecord[];
  recommendations: import("./types.js").ExecutiveRecommendation[];
}): PersistentAwarenessState {
  const evidenceRefs = [
    ...input.systemHealth.evidenceRefs,
    ...input.performance.evidenceRefs,
    ...input.business.evidenceRefs,
    ...input.workforce.evidenceRefs,
    ...input.selfAwareness.evidenceRefs,
  ];
  const scores = [
    input.systemHealth.confidenceScore,
    input.performance.confidenceScore,
    input.business.confidenceScore,
    input.workforce.confidenceScore,
    input.selfAwareness.confidenceScore,
  ].filter((s) => s > 0);
  const confidenceScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0.2;

  return {
    stateId: input.stateId,
    timestamp: new Date().toISOString(),
    systemHealthSummary: input.systemHealth.summary,
    performanceSummary: input.performance.summary,
    businessSummary: input.business.summary,
    workforceSummary: input.workforce.summary,
    selfAwarenessSummary: input.selfAwareness.summary,
    openFindings: input.findings.map((f) => ({ ...f })),
    escalations: input.escalations.map((e) => ({ ...e })),
    recommendations: input.recommendations.map((r) => ({ ...r })),
    longTermEmpireValueNotes: [
      "Continuous executive situational awareness is permanent Digital Soul constitutional duty",
      "Evidence-based recommendations only — never auto-modify production",
    ],
    evidenceRefs: [...new Set(evidenceRefs)],
    confidenceScore,
  };
}
