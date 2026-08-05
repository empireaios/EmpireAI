import { isProductionActiveMonitoring } from "./mission-guard.js";
import { nextSessionId } from "./audit-store.js";
import type {
  AlertSummary,
  ApiMonitoringSummary,
  FactoryMonitoringSummary,
  GrandKingAcceptanceVerification,
  IncidentSummary,
  MonitoringSession,
  PostLaunchMonitoringAssessment,
  ProductionHealthSummary,
  RuntimeMonitoringSummary,
  WorkerMonitoringSummary,
  WorkflowMonitoringSummary,
} from "./types.js";
import type { PostLaunchMonitoringDependencies } from "./integrations.js";

function safeCall<T>(fn: (() => T) | undefined): T | null {
  if (typeof fn !== "function") return null;
  try {
    return fn();
  } catch {
    return null;
  }
}

export function resolveGrandKingSignals(deps: PostLaunchMonitoringDependencies): {
  grandKingDecision: string;
  deploymentAuthorisationStatus: string;
  evidence: string[];
} {
  const gkagt = deps.grandKingAcceptanceGate;
  if (!gkagt) {
    return {
      grandKingDecision: "unknown",
      deploymentAuthorisationStatus: "unknown",
      evidence: ["grandKingAcceptanceGate not injected"],
    };
  }
  const state = safeCall(() => gkagt.getState?.());
  const latest = safeCall(() => gkagt.getLatestReport?.());
  const decision =
    safeCall(() => gkagt.getGrandKingDecision?.()) ??
    state?.grandKingDecision ??
    latest?.grandKingDecision ??
    "unknown";
  const authStatus =
    safeCall(() => gkagt.getDeploymentAuthorisationStatus?.()) ??
    state?.deploymentAuthorisationStatus ??
    latest?.deploymentAuthorisationStatus ??
    "unknown";
  return {
    grandKingDecision: String(decision),
    deploymentAuthorisationStatus: String(authStatus),
    evidence: [`grandKingDecision=${decision}`, `deploymentAuthorisationStatus=${authStatus}`],
  };
}

export function verifyGrandKingAcceptanceGranted(
  deps: PostLaunchMonitoringDependencies,
  q1111Contract: { consumed: boolean; contractVersion: string | null; evidence: string },
): GrandKingAcceptanceVerification {
  const now = new Date().toISOString();
  const signals = resolveGrandKingSignals(deps);
  const granted = isProductionActiveMonitoring(signals.grandKingDecision, signals.deploymentAuthorisationStatus);
  return {
    verifiedAt: now,
    grandKingAcceptanceGranted: granted,
    productionActiveMonitoring: granted,
    grandKingDecision: signals.grandKingDecision as GrandKingAcceptanceVerification["grandKingDecision"],
    deploymentAuthorisationStatus:
      signals.deploymentAuthorisationStatus as GrandKingAcceptanceVerification["deploymentAuthorisationStatus"],
    q1111ContractConsumed: q1111Contract.consumed,
    contractVersion: q1111Contract.contractVersion,
    evidence: [...signals.evidence, q1111Contract.evidence],
  };
}

export function startMonitoringSession(productionActive: boolean): MonitoringSession {
  const now = new Date().toISOString();
  return {
    sessionId: nextSessionId(),
    startedAt: now,
    productionActiveMonitoring: productionActive,
    status: productionActive ? "active" : "blocked",
    evidence: productionActive
      ? ["Grand King approve + deployment authorised — production-active monitoring permitted"]
      : ["Grand King acceptance not granted — standby/blocked monitoring only; never fabricate live production health"],
  };
}

function buildAssessment(
  componentId: string,
  componentType: PostLaunchMonitoringAssessment["componentType"],
  productionActive: boolean,
  healthScore: number,
  incidentCount: number,
  errorCount: number,
  warningCount: number,
  evidence: string[],
): PostLaunchMonitoringAssessment {
  const now = new Date().toISOString();
  const alertStatus =
    incidentCount > 0 ? "critical" : warningCount > 0 ? "warning" : productionActive ? "none" : "unknown";
  const businessImpact =
    incidentCount > 0 ? "high" : warningCount > 0 ? "moderate" : productionActive ? "none" : "unknown";
  return {
    monitoringSessionId: nextSessionId(),
    componentId,
    componentType,
    productionStatus: productionActive ? (healthScore >= 70 ? "active" : "degraded") : "blocked",
    healthScore,
    incidentCount,
    errorCount,
    warningCount,
    alertStatus,
    businessImpact,
    supportingEvidence: evidence,
    auditReference: `plmrt:${componentType}:${componentId}`,
    timestamp: now,
  };
}

export function monitorWorkers(
  deps: PostLaunchMonitoringDependencies,
  productionActive: boolean,
): WorkerMonitoringSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const assessments: PostLaunchMonitoringAssessment[] = [];

  const registryWorkers =
    safeCall(() => deps.workerRegistry?.listWorkers?.()) ??
    safeCall(() => deps.workerRegistry?.getWorkers?.()) ??
    [];

  const monrtList = safeCall(() => deps.monitoringRuntime?.list?.({ validated: true })) as
    | { components?: Array<Record<string, unknown>> }
    | null;
  const monrtComponents = monrtList?.components ?? [];

  if (!deps.workerRegistry) evidence.push("workerRegistry not injected");
  else evidence.push(`workerRegistry workers=${registryWorkers.length}`);

  if (!deps.monitoringRuntime) evidence.push("monitoringRuntime not injected");
  else evidence.push(`monitoringRuntime list components=${monrtComponents.length}`);

  const workerIds = new Set<string>();
  for (const w of registryWorkers) {
    const id = String(w.workerId ?? w.id ?? "unknown-worker");
    workerIds.add(id);
    const monrtMatch = monrtComponents.find((c) => c.componentId === id || c.componentId === w.workerId);
    const errorCount = monrtMatch ? Number(monrtMatch.errorCount ?? 0) : 0;
    const warningCount = monrtMatch ? Number(monrtMatch.warningCount ?? 0) : 0;
    assessments.push(
      buildAssessment(
        id,
        "worker",
        productionActive,
        monrtMatch ? Number(monrtMatch.healthScore ?? 80) : productionActive ? 50 : 0,
        0,
        errorCount,
        warningCount,
        monrtMatch ? [`monrt evidence for ${id}`] : [`registry-only evidence for ${id}`],
      ),
    );
  }

  const healthyCount = assessments.filter((a) => a.healthScore >= 70).length;
  const degradedCount = assessments.filter((a) => a.healthScore > 0 && a.healthScore < 70).length;
  const blockedCount = assessments.filter((a) => a.productionStatus === "blocked").length;

  return {
    computedAt: now,
    totalWorkers: registryWorkers.length,
    monitoredCount: assessments.length,
    healthyCount,
    degradedCount,
    blockedCount,
    assessments,
    evidence,
  };
}

export function monitorFactories(
  deps: PostLaunchMonitoringDependencies,
  productionActive: boolean,
): FactoryMonitoringSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const assessments: PostLaunchMonitoringAssessment[] = [];

  const factories = safeCall(() => deps.sharedRuntimeCore?.listFactories?.()) ?? [];
  if (!deps.sharedRuntimeCore) evidence.push("sharedRuntimeCore not injected");
  else evidence.push(`sharedRuntimeCore listFactories=${factories.length}`);

  for (const factory of factories) {
    const id = String(factory.factoryKey ?? factory.factoryId ?? factory.id ?? "unknown-factory");
    assessments.push(
      buildAssessment(
        id,
        "factory",
        productionActive,
        productionActive ? 75 : 0,
        0,
        0,
        0,
        [`factory registry evidence for ${id}`],
      ),
    );
  }

  return {
    computedAt: now,
    totalFactories: factories.length,
    monitoredCount: assessments.length,
    healthyCount: assessments.filter((a) => a.healthScore >= 70).length,
    degradedCount: assessments.filter((a) => a.healthScore > 0 && a.healthScore < 70).length,
    assessments,
    evidence,
  };
}

export function monitorWorkflows(
  deps: PostLaunchMonitoringDependencies,
  productionActive: boolean,
): WorkflowMonitoringSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const topology =
    safeCall(() => deps.pillowOrchestrationRuntime?.getTopology?.()) ??
    safeCall(() => deps.pillowOrchestrationRuntime?.getCatalog?.());
  const structuralSignalPresent = topology != null;
  if (!deps.pillowOrchestrationRuntime) evidence.push("pillowOrchestrationRuntime not injected");
  else evidence.push(structuralSignalPresent ? "structural topology/catalog present" : "no structural signal");

  const workflowCount = Array.isArray(topology)
    ? topology.length
    : topology && typeof topology === "object" && Array.isArray((topology as { workflows?: unknown[] }).workflows)
      ? ((topology as { workflows: unknown[] }).workflows.length)
      : structuralSignalPresent
        ? 1
        : 0;

  const assessments: PostLaunchMonitoringAssessment[] = [];
  if (structuralSignalPresent) {
    assessments.push(
      buildAssessment(
        "pillow-orchestration-structural",
        "workflow",
        productionActive,
        productionActive ? 80 : 0,
        0,
        0,
        0,
        evidence,
      ),
    );
  }

  return { computedAt: now, structuralSignalPresent, workflowCount, assessments, evidence };
}

export function monitorRuntimeServices(
  deps: PostLaunchMonitoringDependencies,
  productionActive: boolean,
): RuntimeMonitoringSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const assessments: PostLaunchMonitoringAssessment[] = [];

  const monrtState = safeCall(() => deps.monitoringRuntime?.getState?.()) as Record<string, unknown> | null;
  const srcState = safeCall(() => deps.sharedRuntimeCore?.getState?.()) as Record<string, unknown> | null;

  if (deps.monitoringRuntime) {
    evidence.push(`monitoringRuntime status=${String(monrtState?.status ?? "unknown")}`);
    assessments.push(
      buildAssessment("monitoring-runtime", "runtime_service", productionActive, productionActive ? 85 : 0, 0, 0, 0, evidence.slice()),
    );
  } else evidence.push("monitoringRuntime not injected");

  if (deps.sharedRuntimeCore) {
    evidence.push(`sharedRuntimeCore present`);
    assessments.push(
      buildAssessment("shared-runtime-core", "runtime_service", productionActive, productionActive ? 85 : 0, 0, 0, 0, ["sharedRuntimeCore bound"]),
    );
  }

  return { computedAt: now, runtimeServicesMonitored: assessments.length, assessments, evidence };
}

export function monitorApiIntegrations(
  deps: PostLaunchMonitoringDependencies,
  productionActive: boolean,
): ApiMonitoringSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const assessments: PostLaunchMonitoringAssessment[] = [];
  const bound = !!deps.apiRuntime;

  if (bound) {
    const catalog = safeCall(() => deps.apiRuntime?.getCatalog?.());
    evidence.push(`apiRuntime bound catalog=${catalog ? "present" : "empty"}`);
    assessments.push(
      buildAssessment("api-runtime", "api", productionActive, productionActive ? 80 : 0, 0, 0, 0, evidence),
    );
  } else {
    evidence.push("apiRuntime optional — not injected");
  }

  return { computedAt: now, apiIntegrationsMonitored: assessments.length, bound, assessments, evidence };
}

export function detectIncidents(deps: PostLaunchMonitoringDependencies): IncidentSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const incidents: Array<Record<string, unknown>> = [];

  const monrt = deps.monitoringRuntime;
  if (!monrt) {
    evidence.push("monitoringRuntime not injected — no incident signals invented");
    return { computedAt: now, incidentCount: 0, criticalCount: 0, incidents, evidence };
  }

  const listResult = safeCall(() => monrt.list?.({ validated: true })) as
    | { anomalies?: Array<Record<string, unknown>>; alerts?: Array<Record<string, unknown>> }
    | null;
  const detectResult = safeCall(() => monrt.detectAnomalies?.({ validated: true })) as
    | { anomalies?: Array<Record<string, unknown>> }
    | null;

  const anomalies = detectResult?.anomalies ?? listResult?.anomalies ?? [];
  const alerts = listResult?.alerts ?? [];

  for (const a of anomalies) incidents.push({ ...a, source: "anomaly" });
  for (const a of alerts.filter((x) => x.severity === "critical")) incidents.push({ ...a, source: "critical_alert" });

  evidence.push(`incidents from monitoring evidence only: count=${incidents.length}`);
  const criticalCount = incidents.filter((i) => i.severity === "critical" || i.source === "critical_alert").length;

  return { computedAt: now, incidentCount: incidents.length, criticalCount, incidents, evidence };
}

export function detectAbnormalWorkerBehaviour(
  workerSummary: WorkerMonitoringSummary,
): PostLaunchMonitoringAssessment[] {
  return workerSummary.assessments.filter(
    (a) => a.componentType === "worker" && (a.errorCount > 0 || a.warningCount > 2 || a.healthScore < 50),
  );
}

export function generateAlerts(
  deps: PostLaunchMonitoringDependencies,
  incidentSummary: IncidentSummary,
  productionActive: boolean,
): AlertSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const alerts: Array<Record<string, unknown>> = [];

  const genResult = safeCall(() => deps.monitoringRuntime?.generateAlerts?.({ validated: true })) as
    | { alerts?: Array<Record<string, unknown>> }
    | null;
  if (genResult?.alerts) {
    for (const a of genResult.alerts) alerts.push(a);
    evidence.push(`alerts from monitoringRuntime.generateAlerts count=${alerts.length}`);
  } else if (incidentSummary.incidents.length > 0) {
    for (const inc of incidentSummary.incidents) {
      alerts.push({ alertId: `plmrt-alert-${alerts.length + 1}`, severity: inc.severity ?? "warning", incidentRef: inc });
    }
    evidence.push(`alerts derived from incident evidence count=${alerts.length}`);
  } else {
    evidence.push(productionActive ? "no alerts — no incident evidence" : "standby — no production alerts generated");
  }

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return { computedAt: now, alertCount: alerts.length, criticalCount, warningCount, alerts, evidence };
}

export function produceProductionHealthSummary(
  productionActive: boolean,
  workerSummary: WorkerMonitoringSummary,
  factorySummary: FactoryMonitoringSummary,
  incidentSummary: IncidentSummary,
  alertSummary: AlertSummary,
): ProductionHealthSummary {
  const now = new Date().toISOString();
  const allAssessments = [...workerSummary.assessments, ...factorySummary.assessments];
  const totalErrors = allAssessments.reduce((s, a) => s + a.errorCount, 0);
  const totalWarnings = allAssessments.reduce((s, a) => s + a.warningCount, 0);
  const avgHealth =
    allAssessments.length > 0
      ? Math.round(allAssessments.reduce((s, a) => s + a.healthScore, 0) / allAssessments.length)
      : productionActive
        ? 50
        : 0;

  const businessImpact =
    incidentSummary.criticalCount > 0
      ? "critical"
      : incidentSummary.incidentCount > 0
        ? "high"
        : totalWarnings > 0
          ? "moderate"
          : productionActive
            ? "none"
            : "unknown";

  return {
    computedAt: now,
    productionActiveMonitoring: productionActive,
    overallHealthScore: productionActive ? avgHealth : 0,
    overallProductionStatus: productionActive ? (avgHealth >= 70 ? "active" : "degraded") : "blocked",
    totalIncidents: incidentSummary.incidentCount,
    totalErrors,
    totalWarnings,
    businessImpact,
    evidence: [
      `productionActiveMonitoring=${productionActive}`,
      `incidents=${incidentSummary.incidentCount}`,
      `alerts=${alertSummary.alertCount}`,
    ],
  };
}

export function computeConfidenceScore(
  verification: GrandKingAcceptanceVerification,
  healthSummary: ProductionHealthSummary,
  q1111Consumed: boolean,
): number {
  let score = 0.5;
  if (q1111Consumed) score += 0.1;
  if (verification.grandKingAcceptanceGranted) score += 0.2;
  if (healthSummary.productionActiveMonitoring) score += 0.1;
  if (healthSummary.totalIncidents === 0) score += 0.05;
  if (healthSummary.overallHealthScore >= 70) score += 0.05;
  return Math.min(0.99, Math.round(score * 100) / 100);
}

export function buildOutstandingRisks(
  verification: GrandKingAcceptanceVerification,
  incidentSummary: IncidentSummary,
  healthSummary: ProductionHealthSummary,
): string[] {
  const risks: string[] = [];
  if (!verification.grandKingAcceptanceGranted) {
    risks.push("Grand King acceptance not granted — production-active monitoring blocked");
    if (verification.grandKingDecision === "pending") risks.push("Grand King decision pending");
    if (verification.deploymentAuthorisationStatus === "blocked") risks.push("Deployment authorisation blocked");
  }
  if (incidentSummary.criticalCount > 0) risks.push(`${incidentSummary.criticalCount} critical incident(s) detected`);
  if (healthSummary.totalErrors > 0) risks.push(`${healthSummary.totalErrors} worker/runtime error signal(s)`);
  if (!verification.q1111ContractConsumed) risks.push("Q1111 consumable contract not consumed from GKAGT");
  return risks;
}
