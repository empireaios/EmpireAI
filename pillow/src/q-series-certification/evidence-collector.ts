import { FACTORY_KEYS } from "../shared-runtime-core/paths.js";
import { isGkAuthorised } from "./mission-guard.js";
import { Q11_AUDIT_SOURCES, Q11_CERTIFICATION_SOURCES } from "./paths.js";
import type {
  AuditEngineHandle,
  CertificationEngineHandle,
  QSeriesCertificationDependencies,
} from "./integrations.js";
import type {
  AggregatedCertificationEvidence,
  AuditEvidenceRef,
  CertificationClassification,
  CertificationDecision,
  CertificationEvidenceRef,
  FactoryDiscoverySummary,
  GovernanceVerificationSummary,
  IntegrationVerificationSummary,
  ProductionReadinessVerification,
  QSeriesReadinessClassification,
  RuntimeVerificationSummary,
  WorkerVerificationSummary,
} from "./types.js";

type ReportLike = {
  reportId?: string;
  decision?: string;
  auditStatus?: string;
  certificationDecision?: string;
  missionId?: string;
};

function safeCall<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

function extractLatestReport(handle: AuditEngineHandle | CertificationEngineHandle | null | undefined): ReportLike | null {
  if (!handle) return null;
  if (typeof handle.getLatestReport === "function") {
    const latest = safeCall(() => handle.getLatestReport!());
    if (latest) return latest;
  }
  if (typeof handle.getState === "function") {
    const state = safeCall(() => handle.getState!()) as { latestReport?: ReportLike | null } | null;
    if (state?.latestReport) return state.latestReport;
  }
  if (typeof handle.getReports === "function") {
    const reports = safeCall(() => handle.getReports!()) ?? [];
    return reports.length ? (reports[reports.length - 1] as ReportLike) : null;
  }
  return null;
}

function classifyFromReport(report: ReportLike | null, bound: boolean): CertificationClassification {
  if (!bound) return "missing";
  if (!report) return "missing";
  const status = (report.auditStatus ?? report.decision ?? report.certificationDecision ?? "").toLowerCase();
  if (status.includes("fail")) return "failed";
  if (status.includes("partial")) return "partially_certified";
  if (status.includes("block")) return "blocked";
  if (status.includes("defer")) return "deferred";
  if (status.includes("certify") || status.includes("certified") || status.includes("pass") || status.includes("ready")) {
    return "certified";
  }
  return "partially_certified";
}

function extractGkSignals(deps: QSeriesCertificationDependencies) {
  const gk = deps.grandKingAcceptanceGate;
  if (!gk) {
    return { decision: "unknown", authorisation: "unknown", authorised: false, evidence: ["grandKingAcceptanceGate not injected"] };
  }
  const decision =
    safeCall(() => gk.getGrandKingDecision?.()) ??
    safeCall(() => gk.getLatestReport?.()?.grandKingDecision) ??
    safeCall(() => (gk.getState?.() as { grandKingDecision?: string })?.grandKingDecision) ??
    "unknown";
  const authorisation =
    safeCall(() => gk.getDeploymentAuthorisationStatus?.()) ??
    safeCall(() => gk.getLatestReport?.()?.deploymentAuthorisationStatus) ??
    safeCall(() => (gk.getState?.() as { deploymentAuthorisationStatus?: string })?.deploymentAuthorisationStatus) ??
    "unknown";
  const authorised = isGkAuthorised(decision, authorisation);
  return {
    decision: String(decision),
    authorisation: String(authorisation),
    authorised,
    evidence: [`grandKingDecision=${decision}`, `deploymentAuthorisationStatus=${authorisation}`, `gkAuthorised=${authorised}`],
  };
}

function extractPlmrtProductionActive(deps: QSeriesCertificationDependencies): { active: boolean; evidence: string[] } {
  const plmrt = deps.postLaunchMonitoring;
  if (!plmrt) {
    return { active: false, evidence: ["postLaunchMonitoring not injected — productionActiveMonitoring=false"] };
  }
  const state = safeCall(() => plmrt.getState?.()) as { productionActiveMonitoring?: boolean } | null;
  const latest = safeCall(() => plmrt.getLatestReport?.()) as { productionActiveMonitoring?: boolean } | null;
  const active = state?.productionActiveMonitoring ?? latest?.productionActiveMonitoring ?? false;
  return {
    active,
    evidence: [`postLaunchMonitoring.productionActiveMonitoring=${active}`],
  };
}

function extractEaprtDecision(deps: QSeriesCertificationDependencies): {
  decision: CertificationDecision | null;
  classification: CertificationClassification;
  evidence: string[];
} {
  const eaprt = deps.executiveAcceptancePack;
  if (!eaprt) {
    return { decision: null, classification: "missing", evidence: ["executiveAcceptancePack not injected"] };
  }
  const latest = extractLatestReport(eaprt);
  const decisionRaw = latest?.decision?.toLowerCase() ?? null;
  const decision =
    decisionRaw === "certify" || decisionRaw === "withhold" || decisionRaw === "escalate" || decisionRaw === "defer"
      ? (decisionRaw as CertificationDecision)
      : null;
  const classification = classifyFromReport(latest, true);
  return {
    decision,
    classification,
    evidence: [
      latest?.reportId ? `eaprt reportId=${latest.reportId}` : "eaprt no report yet",
      decision ? `eaprt decision=${decision}` : "eaprt decision missing",
    ],
  };
}

function classifyRuntimeStatus(status: string | undefined, bound: boolean): CertificationClassification {
  if (!bound) return "missing";
  if (!status) return "partially_certified";
  const s = status.toLowerCase();
  if (s.includes("fail") || s === "blocked") return "failed";
  if (s.includes("degrad")) return "partially_certified";
  if (s.includes("active") || s.includes("healthy") || s.includes("ready")) return "certified";
  return "partially_certified";
}

export function discoverFactories(deps: QSeriesCertificationDependencies): FactoryDiscoverySummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const raw = safeCall(() => deps.sharedRuntimeCore?.listFactories?.()) ?? [];
  evidence.push(`sharedRuntimeCore listFactories=${raw.length}`);

  const factories = raw.map((f) => {
    const factoryKey = String(f.factoryKey ?? f.id ?? f.factory ?? "unknown");
    const status = String(f.status ?? f.healthStatus ?? "unknown");
    const inCatalog = (FACTORY_KEYS as readonly string[]).includes(factoryKey);
    const classification: CertificationClassification = inCatalog
      ? status.toLowerCase().includes("fail") || status.toLowerCase() === "blocked"
        ? "failed"
        : status.toLowerCase().includes("active") || status.toLowerCase().includes("healthy")
          ? "certified"
          : "partially_certified"
      : "blocked";
    if (!inCatalog) evidence.push(`factory ${factoryKey} not in FACTORY_KEYS catalog`);
    return { factoryKey, status, classification };
  });

  if (raw.length === 0) {
    evidence.push("no factories discovered from sharedRuntimeCore — never invent factories");
  }

  return {
    computedAt: now,
    totalDiscovered: factories.length,
    catalogTotal: FACTORY_KEYS.length,
    factories,
    evidence,
  };
}

export function verifyWorkers(deps: QSeriesCertificationDependencies): WorkerVerificationSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const workers =
    safeCall(() => deps.workerRegistry?.listWorkers?.()) ??
    safeCall(() => deps.workerRegistry?.getWorkers?.()) ??
    [];
  evidence.push(`workerRegistry workers=${workers.length}`);

  let verifiedCount = 0;
  let failedCount = 0;
  let missingCount = 0;

  for (const w of workers) {
    const status = String(w.status ?? "unknown").toLowerCase();
    if (status.includes("fail") || status === "blocked") failedCount += 1;
    else if (status.includes("active") || status.includes("ready")) verifiedCount += 1;
    else missingCount += 1;
  }

  let classification: CertificationClassification = "missing";
  if (workers.length === 0) {
    classification = "missing";
    evidence.push("no workers from workerRegistry");
  } else if (failedCount > 0) {
    classification = "failed";
  } else if (missingCount > 0) {
    classification = "partially_certified";
  } else {
    classification = "certified";
  }

  return {
    computedAt: now,
    totalWorkers: workers.length,
    verifiedCount,
    failedCount,
    missingCount,
    classification,
    evidence,
  };
}

export function verifyRuntimes(deps: QSeriesCertificationDependencies): RuntimeVerificationSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const runtimeDefs: Array<{ runtimeId: string; handle: object | null | undefined }> = [
    { runtimeId: "sharedRuntimeCore", handle: deps.sharedRuntimeCore },
    { runtimeId: "monitoringRuntime", handle: deps.monitoringRuntime },
    { runtimeId: "recoveryRuntime", handle: deps.recoveryRuntime },
    { runtimeId: "auditRuntime", handle: deps.auditRuntime },
    { runtimeId: "apiRuntime", handle: deps.apiRuntime },
    { runtimeId: "queueRuntime", handle: deps.queueRuntime },
    { runtimeId: "schedulingRuntime", handle: deps.schedulingRuntime },
  ];

  const runtimes = runtimeDefs.map(({ runtimeId, handle }) => {
    const bound = !!handle;
    const state = bound ? (safeCall(() => (handle as { getState?: () => { status?: string } }).getState?.()) as { status?: string } | null) : null;
    const status = state?.status ?? (bound ? "unknown" : "not_bound");
    const classification = classifyRuntimeStatus(status, bound);
    if (bound) evidence.push(`${runtimeId} bound status=${status}`);
    else evidence.push(`${runtimeId} not bound`);
    return { runtimeId, bound, status: String(status), classification };
  });

  const boundCount = runtimes.filter((r) => r.bound).length;
  const healthyCount = runtimes.filter((r) => r.classification === "certified").length;
  const failedCount = runtimes.filter((r) => r.classification === "failed").length;
  const missingCount = runtimes.filter((r) => r.classification === "missing").length;

  let classification: CertificationClassification = "partially_certified";
  if (failedCount > 0) classification = "failed";
  else if (missingCount === runtimes.length) classification = "missing";
  else if (healthyCount >= 3) classification = "certified";

  return {
    computedAt: now,
    runtimesChecked: runtimes.length,
    boundCount,
    healthyCount,
    failedCount,
    missingCount,
    classification,
    runtimes,
    evidence,
  };
}

export function verifyCrossFactoryOrchestration(deps: QSeriesCertificationDependencies): IntegrationVerificationSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const por = deps.pillowOrchestrationRuntime;
  const orchestrationBound = !!por;
  let structuralSignalPresent = false;

  if (por) {
    const topology = safeCall(() => por.getTopology?.());
    const state = safeCall(() => por.getState?.());
    structuralSignalPresent = !!(topology || state);
    evidence.push(
      structuralSignalPresent
        ? "pillowOrchestrationRuntime structural signal present (POR topology/state)"
        : "pillowOrchestrationRuntime bound but no structural signal",
    );
  } else {
    evidence.push("pillowOrchestrationRuntime not injected — cross-factory orchestration unverified");
  }

  const classification: CertificationClassification = !orchestrationBound
    ? "missing"
    : structuralSignalPresent
      ? "certified"
      : "partially_certified";

  return {
    computedAt: now,
    structuralSignalPresent,
    orchestrationBound,
    classification,
    evidence,
  };
}

export function verifyGovernanceCompliance(deps: QSeriesCertificationDependencies): GovernanceVerificationSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const gk = extractGkSignals(deps);
  evidence.push(...gk.evidence);

  const pccrtLatest = extractLatestReport(deps.productionCertificationCore);
  const pccrtClassification = classifyFromReport(pccrtLatest, !!deps.productionCertificationCore);
  evidence.push(`productionCertificationCore classification=${pccrtClassification}`);

  const auditClassifications = {} as Record<(typeof Q11_AUDIT_SOURCES)[number], CertificationClassification>;
  const auditHandleMap: Record<(typeof Q11_AUDIT_SOURCES)[number], AuditEngineHandle | null | undefined> = {
    "worker-readiness-audit": deps.workerReadinessAudit,
    "pillow-command-audit": deps.pillowCommandAudit,
    "business-factory-audit": deps.businessFactoryAudit,
    "security-audit": deps.securityAudit,
    "performance-audit": deps.performanceAudit,
    "recovery-audit": deps.recoveryAudit,
    "financial-readiness-audit": deps.financialReadinessAudit,
  };

  for (const source of Q11_AUDIT_SOURCES) {
    const handle = auditHandleMap[source];
    const bound = !!handle;
    const latest = extractLatestReport(handle);
    if (source === "financial-readiness-audit" && !bound) {
      auditClassifications[source] = "missing";
      evidence.push("Q11-08 Financial Readiness Audit (FINART) not injected — record missing");
    } else {
      auditClassifications[source] = classifyFromReport(latest, bound);
      evidence.push(`${source} classification=${auditClassifications[source]}`);
    }
  }

  const auditValues = Object.values(auditClassifications);
  let classification: CertificationClassification = "certified";
  if (auditValues.includes("failed") || pccrtClassification === "failed") classification = "failed";
  else if (auditValues.includes("blocked") || pccrtClassification === "blocked") classification = "blocked";
  else if (auditValues.includes("missing") || pccrtClassification === "missing") classification = "missing";
  else if (auditValues.includes("partially_certified") || pccrtClassification === "partially_certified") {
    classification = "partially_certified";
  }
  if (!gk.authorised) classification = classification === "certified" ? "blocked" : classification;

  return {
    computedAt: now,
    pccrtClassification,
    auditClassifications,
    gkDecision: gk.decision,
    gkAuthorisation: gk.authorisation,
    gkAuthorised: gk.authorised,
    classification,
    evidence,
  };
}

export function verifyProductionReadiness(deps: QSeriesCertificationDependencies): ProductionReadinessVerification {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const eaprt = extractEaprtDecision(deps);
  evidence.push(...eaprt.evidence);

  const gk = extractGkSignals(deps);
  evidence.push(...gk.evidence);

  const plmrt = extractPlmrtProductionActive(deps);
  evidence.push(...plmrt.evidence);

  const finart = deps.financialReadinessAudit;
  let finartConsumable = false;
  if (finart && typeof finart.getQ1109ConsumableContract === "function") {
    const contract = safeCall(() => finart.getQ1109ConsumableContract!()) as { consumerMissionId?: string } | null;
    finartConsumable = contract?.consumerMissionId === "Q11-09";
    evidence.push(finartConsumable ? "FINART Q1109 contract consumable" : "FINART contract not consumable");
  } else {
    evidence.push("Q11-08 Financial Readiness Audit (FINART) missing — not consumable");
  }

  let classification: CertificationClassification = "blocked";
  if (eaprt.decision === "certify" && gk.authorised && plmrt.active && finartConsumable) {
    classification = "certified";
  } else if (eaprt.classification === "failed") {
    classification = "failed";
  } else if (eaprt.classification === "missing" || !gk.authorised || !plmrt.active || !finartConsumable) {
    classification = "blocked";
  } else {
    classification = "partially_certified";
  }

  return {
    computedAt: now,
    eaprtDecision: eaprt.decision,
    eaprtClassification: eaprt.classification,
    gkAuthorised: gk.authorised,
    plmrtProductionActive: plmrt.active,
    finartConsumable,
    classification,
    evidence,
  };
}

const AUDIT_HANDLE_MAP: Record<(typeof Q11_AUDIT_SOURCES)[number], (d: QSeriesCertificationDependencies) => AuditEngineHandle | null | undefined> = {
  "worker-readiness-audit": (d) => d.workerReadinessAudit,
  "pillow-command-audit": (d) => d.pillowCommandAudit,
  "business-factory-audit": (d) => d.businessFactoryAudit,
  "security-audit": (d) => d.securityAudit,
  "performance-audit": (d) => d.performanceAudit,
  "recovery-audit": (d) => d.recoveryAudit,
  "financial-readiness-audit": (d) => d.financialReadinessAudit,
};

export function aggregateCertificationEvidence(deps: QSeriesCertificationDependencies): AggregatedCertificationEvidence {
  const now = new Date().toISOString();
  const auditRefs: AuditEvidenceRef[] = Q11_AUDIT_SOURCES.map((source) => {
    const handle = AUDIT_HANDLE_MAP[source](deps);
    const bound = !!handle;
    const latest = extractLatestReport(handle);
    const classification =
      source === "financial-readiness-audit" && !bound ? "missing" : classifyFromReport(latest, bound);
    const evidence =
      source === "financial-readiness-audit" && !bound
        ? ["Q11-08 Financial Readiness Audit not implemented / not injected"]
        : bound
          ? [`${source}: handle bound`, latest?.reportId ? `reportId=${latest.reportId}` : "no report yet"]
          : [`${source}: not injected`];
    return { source, bound, reportId: latest?.reportId ?? null, classification, evidence };
  });

  const certHandleMap: Record<(typeof Q11_CERTIFICATION_SOURCES)[number], CertificationEngineHandle | null | undefined> = {
    "production-certification-core": deps.productionCertificationCore,
    "shared-runtime-certification": deps.sharedRuntimeCertification,
  };

  const certificationRefs: CertificationEvidenceRef[] = Q11_CERTIFICATION_SOURCES.map((source) => {
    const handle = certHandleMap[source];
    const bound = !!handle;
    const latest = extractLatestReport(handle);
    const classification = classifyFromReport(latest, bound);
    return {
      source,
      bound,
      reportId: latest?.reportId ?? null,
      classification,
      evidence: bound
        ? [`${source}: handle bound`, latest?.reportId ? `reportId=${latest.reportId}` : "no report yet"]
        : [`${source}: not injected`],
    };
  });

  const finartMissing = !deps.financialReadinessAudit;
  const allRefs = [...auditRefs, ...certificationRefs];
  return {
    computedAt: now,
    auditRefs,
    certificationRefs,
    finartMissing,
    certifiedCount: allRefs.filter((r) => r.classification === "certified").length,
    failedCount: allRefs.filter((r) => r.classification === "failed").length,
    missingCount: allRefs.filter((r) => r.classification === "missing").length,
    blockedCount: allRefs.filter((r) => r.classification === "blocked").length,
    evidence: allRefs.flatMap((r) => r.evidence),
  };
}

export type ReadinessInputs = {
  factorySummary: FactoryDiscoverySummary;
  workerSummary: WorkerVerificationSummary;
  runtimeSummary: RuntimeVerificationSummary;
  integrationSummary: IntegrationVerificationSummary;
  governanceSummary: GovernanceVerificationSummary;
  productionSummary: ProductionReadinessVerification;
  aggregated: AggregatedCertificationEvidence;
  deferCertification?: boolean;
};

export function classifyQSeriesReadiness(inputs: ReadinessInputs): QSeriesReadinessClassification {
  const now = new Date().toISOString();
  const rationale: string[] = [];
  const evidence = [
    ...inputs.factorySummary.evidence,
    ...inputs.workerSummary.evidence,
    ...inputs.runtimeSummary.evidence,
    ...inputs.aggregated.evidence,
  ];

  if (inputs.deferCertification) {
    return {
      computedAt: now,
      overallClassification: "deferred",
      readinessScore: 0,
      rationale: ["certification explicitly deferred"],
      evidence,
    };
  }

  const classifications = [
    inputs.workerSummary.classification,
    inputs.runtimeSummary.classification,
    inputs.integrationSummary.classification,
    inputs.governanceSummary.classification,
    inputs.productionSummary.classification,
    ...inputs.factorySummary.factories.map((f) => f.classification),
  ];

  let overallClassification: CertificationClassification = "certified";
  if (classifications.includes("failed") || inputs.aggregated.failedCount > 0) {
    overallClassification = "failed";
    rationale.push("critical factory/worker/runtime evidence Failed");
  } else if (classifications.includes("blocked") || inputs.productionSummary.classification === "blocked") {
    overallClassification = "blocked";
    rationale.push("production readiness chain blocked (FINART/EAPRT/GK/PLMRT)");
  } else if (classifications.includes("missing") || inputs.aggregated.missingCount > 0) {
    overallClassification = "missing";
    rationale.push("critical evidence Missing (including FINART when not injected)");
  } else if (classifications.includes("partially_certified")) {
    overallClassification = "partially_certified";
    rationale.push("partial certification evidence observed");
  }

  const readinessScore = computeReadinessScore(inputs, overallClassification);
  return { computedAt: now, overallClassification, readinessScore, rationale, evidence };
}

export function evaluateCertificationDecision(
  readiness: QSeriesReadinessClassification,
  productionSummary: ProductionReadinessVerification,
  aggregated: AggregatedCertificationEvidence,
  workerSummary: WorkerVerificationSummary,
  runtimeSummary: RuntimeVerificationSummary,
  deferCertification?: boolean,
): CertificationDecision {
  if (deferCertification) return "defer";

  const finartBlocked = productionSummary.finartConsumable === false;
  const eaprtBlocked =
    productionSummary.eaprtDecision === null ||
    productionSummary.eaprtDecision === "withhold" ||
    productionSummary.eaprtDecision === "escalate" ||
    productionSummary.eaprtClassification === "failed" ||
    productionSummary.eaprtClassification === "missing";
  const gkBlocked = !productionSummary.gkAuthorised;
  const plmrtBlocked = !productionSummary.plmrtProductionActive;
  const criticalFailed =
    workerSummary.classification === "failed" ||
    workerSummary.classification === "missing" ||
    runtimeSummary.classification === "failed" ||
    runtimeSummary.classification === "missing" ||
    aggregated.failedCount > 0;

  if (criticalFailed) return "escalate";
  if (finartBlocked || eaprtBlocked || gkBlocked || plmrtBlocked) return "withhold";

  if (
    readiness.overallClassification === "certified" &&
    productionSummary.classification === "certified" &&
    !finartBlocked &&
    !eaprtBlocked &&
    !gkBlocked &&
    !plmrtBlocked
  ) {
    return "certify";
  }

  if (readiness.overallClassification === "partially_certified") return "withhold";
  return "withhold";
}

export function computeReadinessScore(
  inputs: ReadinessInputs,
  overallClassification: CertificationClassification,
): number {
  if (overallClassification === "failed") return 0;
  if (overallClassification === "blocked" || overallClassification === "missing") return 0.2;
  if (overallClassification === "deferred") return 0;
  if (overallClassification === "partially_certified") return 0.55;

  const total = inputs.aggregated.auditRefs.length + inputs.aggregated.certificationRefs.length;
  const certified = inputs.aggregated.certifiedCount;
  const base = total > 0 ? certified / total : 0.5;
  const productionBonus =
    inputs.productionSummary.gkAuthorised && inputs.productionSummary.plmrtProductionActive ? 0.2 : 0;
  return Math.min(1, Math.max(0, base * 0.8 + productionBonus));
}

export function buildOutstandingIssues(
  productionSummary: ProductionReadinessVerification,
  governanceSummary: GovernanceVerificationSummary,
  aggregated: AggregatedCertificationEvidence,
  readiness: QSeriesReadinessClassification,
): string[] {
  const issues: string[] = [];
  if (!productionSummary.finartConsumable) {
    issues.push("Q11-08 Financial Readiness Audit (FINART) missing or not consumable");
  }
  if (productionSummary.eaprtDecision !== "certify") {
    issues.push(`Executive Acceptance Pack decision not certify (${productionSummary.eaprtDecision ?? "missing"})`);
  }
  if (!productionSummary.gkAuthorised) {
    issues.push(`Grand King not approve+authorised (${governanceSummary.gkDecision}/${governanceSummary.gkAuthorisation})`);
  }
  if (!productionSummary.plmrtProductionActive) {
    issues.push("Post-Launch Monitoring productionActiveMonitoring !== true");
  }
  if (aggregated.failedCount > 0) {
    issues.push(`Q11 audit/certification failed count=${aggregated.failedCount}`);
  }
  if (aggregated.missingCount > 0) {
    issues.push(`Q11 audit/certification missing count=${aggregated.missingCount}`);
  }
  issues.push(...readiness.rationale);
  return [...new Set(issues)];
}

export function buildCertificationRecords(
  factorySummary: FactoryDiscoverySummary,
  workerSummary: WorkerVerificationSummary,
  runtimeSummary: RuntimeVerificationSummary,
  integrationSummary: IntegrationVerificationSummary,
  governanceSummary: GovernanceVerificationSummary,
  productionSummary: ProductionReadinessVerification,
  readiness: QSeriesReadinessClassification,
): import("./types.js").QSeriesCertificationRecord[] {
  const now = new Date().toISOString();
  return factorySummary.factories.map((f, idx) => ({
    certificationId: `qscrt-cert-${String(idx + 1).padStart(3, "0")}`,
    factoryId: f.factoryKey,
    workerSummary,
    runtimeSummary,
    integrationStatus: integrationSummary,
    governanceStatus: governanceSummary,
    productionStatus: productionSummary,
    certificationStatus: f.classification,
    readinessScore: readiness.readinessScore,
    supportingEvidence: [...factorySummary.evidence, ...workerSummary.evidence].slice(0, 5),
    auditReference: `q11-12:q-series-certification:${f.factoryKey}`,
    certificationTimestamp: now,
  }));
}
