import { FACTORY_KEYS } from "../shared-runtime-core/paths.js";
import { isGkAuthorised } from "./mission-guard.js";
import { Q11_MISSION_INVENTORY, Q_SERIES_COMPLETION_RUNTIME_VERSION } from "./paths.js";
import type { QSeriesCompletionDependencies } from "./integrations.js";
import type {
  AggregatedCompletionEvidence,
  CertificationCompletionSummary,
  CompletionClassification,
  CompletionReadinessClassification,
  FactoryCompletionSummary,
  FinalCompletionDecision,
  GovernanceCompletionSummary,
  MissionCompletionSummary,
  MissionEngineInventoryEntry,
  ProductionReadinessCompletion,
  RuntimeCompletionSummary,
  WorkerCompletionSummary,
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

function extractLatestReport(handle: { getLatestReport?: () => ReportLike | null; getState?: () => unknown } | null | undefined): ReportLike | null {
  if (!handle) return null;
  if (typeof handle.getLatestReport === "function") {
    const latest = safeCall(() => handle.getLatestReport!());
    if (latest) return latest;
  }
  if (typeof handle.getState === "function") {
    const state = safeCall(() => handle.getState!()) as { latestReport?: ReportLike | null } | null;
    if (state?.latestReport) return state.latestReport;
  }
  return null;
}

function classifyFromReport(report: ReportLike | null, bound: boolean): CompletionClassification {
  if (!bound) return "missing";
  if (!report) return "missing";
  const status = (report.auditStatus ?? report.decision ?? report.certificationDecision ?? "").toLowerCase();
  if (status.includes("fail")) return "failed";
  if (status.includes("partial")) return "partially_complete";
  if (status.includes("block")) return "blocked";
  if (status.includes("defer")) return "deferred";
  if (status.includes("certify") || status.includes("certified") || status.includes("pass") || status.includes("ready") || status.includes("complete")) {
    return "complete";
  }
  return "partially_complete";
}

function extractGkSignals(deps: QSeriesCompletionDependencies) {
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

function extractPlmrtProductionActive(deps: QSeriesCompletionDependencies): { active: boolean; evidence: string[] } {
  const plmrt = deps.postLaunchMonitoring;
  if (!plmrt) {
    return { active: false, evidence: ["postLaunchMonitoring not injected — productionActiveMonitoring=false"] };
  }
  const state = safeCall(() => plmrt.getState?.()) as { productionActiveMonitoring?: boolean } | null;
  const latest = safeCall(() => plmrt.getLatestReport?.()) as { productionActiveMonitoring?: boolean } | null;
  const active = state?.productionActiveMonitoring ?? latest?.productionActiveMonitoring ?? false;
  return { active, evidence: [`postLaunchMonitoring.productionActiveMonitoring=${active}`] };
}

function extractEaprtDecision(deps: QSeriesCompletionDependencies): {
  decision: string | null;
  classification: CompletionClassification;
  evidence: string[];
} {
  const eaprt = deps.executiveAcceptancePack;
  if (!eaprt) {
    return { decision: null, classification: "missing", evidence: ["executiveAcceptancePack not injected"] };
  }
  const latest = extractLatestReport(eaprt);
  const decision = latest?.decision?.toLowerCase() ?? null;
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

function classifyRuntimeStatus(status: string | undefined, bound: boolean): CompletionClassification {
  if (!bound) return "missing";
  if (!status) return "partially_complete";
  const s = status.toLowerCase();
  if (s.includes("fail") || s === "blocked") return "failed";
  if (s.includes("degrad")) return "partially_complete";
  if (s.includes("active") || s.includes("healthy") || s.includes("ready")) return "complete";
  return "partially_complete";
}

function getDepHandle(deps: QSeriesCompletionDependencies, depKey: string): object | null | undefined {
  return (deps as Record<string, object | null | undefined>)[depKey];
}

export function verifyMissionCompletion(deps: QSeriesCompletionDependencies): MissionCompletionSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const inventory: MissionEngineInventoryEntry[] = [];
  let presentCount = 0;
  let missingCount = 0;
  let finartMissing = false;

  for (const entry of Q11_MISSION_INVENTORY) {
    const handle = getDepHandle(deps, entry.depKey);
    const handleInjected = !!handle;
    const sessionPresent = handleInjected;
    let classification: CompletionClassification = handleInjected ? "complete" : "missing";
    const entryEvidence: string[] = [];

    if (entry.missionId === "Q11-08" && !handleInjected) {
      finartMissing = true;
      classification = "missing";
      entryEvidence.push("Q11-08 Financial Readiness Audit (FINART) not injected — recorded missing honestly");
      evidence.push(`mission ${entry.missionId} FINART missing`);
    } else if (handleInjected) {
      presentCount += 1;
      entryEvidence.push(`${entry.label} handle injected for ${entry.missionId}`);
      evidence.push(`mission ${entry.missionId} engine handle present`);
    } else {
      missingCount += 1;
      entryEvidence.push(`${entry.label} handle not injected for ${entry.missionId}`);
      evidence.push(`mission ${entry.missionId} engine handle missing`);
    }

    inventory.push({
      missionId: entry.missionId,
      engineKey: entry.depKey,
      label: entry.label,
      handleInjected,
      sessionPresent,
      classification,
      evidence: entryEvidence,
    });
  }

  let classification: CompletionClassification = "complete";
  if (finartMissing) classification = "partially_complete";
  else if (missingCount > 0) classification = "missing";

  return {
    computedAt: now,
    requiredMissions: Q11_MISSION_INVENTORY.length,
    presentCount,
    missingCount: finartMissing ? missingCount + 1 : missingCount,
    finartMissing,
    inventory,
    classification,
    evidence,
  };
}

export function verifyWorkforceCapabilities(deps: QSeriesCompletionDependencies): {
  factorySummary: FactoryCompletionSummary;
  workerSummary: WorkerCompletionSummary;
} {
  const now = new Date().toISOString();
  const factoryEvidence: string[] = [];
  const raw = safeCall(() => deps.sharedRuntimeCore?.listFactories?.()) ?? [];
  factoryEvidence.push(`sharedRuntimeCore listFactories=${raw.length}`);

  const factories = raw.map((f) => {
    const factoryKey = String(f.factoryKey ?? f.id ?? f.factory ?? "unknown");
    const status = String(f.status ?? f.healthStatus ?? "unknown");
    const inCatalog = (FACTORY_KEYS as readonly string[]).includes(factoryKey);
    const classification: CompletionClassification = inCatalog
      ? status.toLowerCase().includes("fail") || status.toLowerCase() === "blocked"
        ? "failed"
        : status.toLowerCase().includes("active") || status.toLowerCase().includes("healthy")
          ? "complete"
          : "partially_complete"
      : "blocked";
    if (!inCatalog) factoryEvidence.push(`factory ${factoryKey} not in FACTORY_KEYS catalog`);
    return { factoryKey, status, classification };
  });

  if (raw.length === 0) {
    factoryEvidence.push("no factories discovered from sharedRuntimeCore — never invent factories");
  }

  const factorySummary: FactoryCompletionSummary = {
    computedAt: now,
    totalDiscovered: factories.length,
    catalogTotal: FACTORY_KEYS.length,
    factories,
    evidence: factoryEvidence,
  };

  const workerEvidence: string[] = [];
  const workers =
    safeCall(() => deps.workerRegistry?.listWorkers?.()) ??
    safeCall(() => deps.workerRegistry?.getWorkers?.()) ??
    [];
  workerEvidence.push(`workerRegistry workers=${workers.length}`);

  let operationalCount = 0;
  let failedCount = 0;
  let missingCount = 0;

  for (const w of workers) {
    const status = String(w.status ?? "unknown").toLowerCase();
    if (status.includes("fail") || status === "blocked") failedCount += 1;
    else if (status.includes("active") || status.includes("ready")) operationalCount += 1;
    else missingCount += 1;
  }

  let workerClassification: CompletionClassification = "missing";
  if (workers.length === 0) {
    workerClassification = "missing";
    workerEvidence.push("no workers from workerRegistry");
  } else if (failedCount > 0) {
    workerClassification = "failed";
  } else if (missingCount > 0) {
    workerClassification = "partially_complete";
  } else {
    workerClassification = "complete";
  }

  const workerSummary: WorkerCompletionSummary = {
    computedAt: now,
    totalWorkers: workers.length,
    operationalCount,
    failedCount,
    missingCount,
    classification: workerClassification,
    evidence: workerEvidence,
  };

  return { factorySummary, workerSummary };
}

export function verifyRuntimeIntegration(deps: QSeriesCompletionDependencies): RuntimeCompletionSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const runtimeDefs: Array<{ runtimeId: string; handle: object | null | undefined }> = [
    { runtimeId: "sharedRuntimeCore", handle: deps.sharedRuntimeCore },
    { runtimeId: "monitoringRuntime", handle: deps.monitoringRuntime },
    { runtimeId: "recoveryRuntime", handle: deps.recoveryRuntime },
    { runtimeId: "auditRuntime", handle: deps.auditRuntime },
    { runtimeId: "apiRuntime", handle: deps.apiRuntime },
    { runtimeId: "pillowOrchestrationRuntime", handle: deps.pillowOrchestrationRuntime },
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
  const healthyCount = runtimes.filter((r) => r.classification === "complete").length;
  const failedCount = runtimes.filter((r) => r.classification === "failed").length;
  const missingCount = runtimes.filter((r) => r.classification === "missing").length;

  let classification: CompletionClassification = "partially_complete";
  if (failedCount > 0) classification = "failed";
  else if (missingCount === runtimes.length) classification = "missing";
  else if (healthyCount >= 3) classification = "complete";

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

export function verifyGovernanceCompliance(deps: QSeriesCompletionDependencies): GovernanceCompletionSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const gk = extractGkSignals(deps);
  evidence.push(...gk.evidence);

  const pccrtLatest = extractLatestReport(deps.productionCertificationCore);
  const pccrtClassification = classifyFromReport(pccrtLatest, !!deps.productionCertificationCore);
  evidence.push(`productionCertificationCore classification=${pccrtClassification}`);

  const pillowSignalsPresent =
    !!deps.pillowCommandAudit ||
    !!deps.productionCertificationCore ||
    pccrtClassification !== "missing";
  evidence.push(`pillowSignalsPresent=${pillowSignalsPresent}`);

  let classification: CompletionClassification = "complete";
  if (pccrtClassification === "failed") classification = "failed";
  else if (pccrtClassification === "blocked") classification = "blocked";
  else if (pccrtClassification === "missing") classification = "missing";
  else if (!gk.authorised) classification = "blocked";

  return {
    computedAt: now,
    pccrtClassification,
    gkDecision: gk.decision,
    gkAuthorisation: gk.authorisation,
    gkAuthorised: gk.authorised,
    pillowSignalsPresent,
    classification,
    evidence,
  };
}

export function verifyCertificationCompletion(
  deps: QSeriesCompletionDependencies,
  q1113Consumed = false,
): CertificationCompletionSummary {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const qscrt = deps.qSeriesCertification;
  const qscrtBound = !!qscrt;

  let qscrtCertificationDecision: string | null = null;
  if (qscrt) {
    const latest = safeCall(() => qscrt.getLatestReport?.());
    const state = safeCall(() => qscrt.getState?.()) as {
      latestReport?: { certificationDecision?: string };
      health?: { lastCertificationDecision?: string | null };
    } | null;
    qscrtCertificationDecision =
      latest?.certificationDecision ??
      state?.latestReport?.certificationDecision ??
      state?.health?.lastCertificationDecision ??
      null;
    evidence.push(
      qscrtCertificationDecision
        ? `qSeriesCertification certificationDecision=${qscrtCertificationDecision}`
        : "qSeriesCertification no certificationDecision yet",
    );
  } else {
    evidence.push("qSeriesCertification not injected — QSCRT required for completion");
  }

  evidence.push(`q1113ContractConsumed=${q1113Consumed}`);

  let classification: CompletionClassification = "missing";
  if (!qscrtBound) {
    classification = "missing";
  } else if (qscrtCertificationDecision === "certify") {
    classification = "complete";
  } else if (qscrtCertificationDecision === "withhold" || qscrtCertificationDecision === "defer") {
    classification = "blocked";
  } else if (qscrtCertificationDecision === "escalate") {
    classification = "failed";
  } else {
    classification = "partially_complete";
  }

  return {
    computedAt: now,
    qscrtBound,
    qscrtCertificationDecision,
    qscrtClassification: classification,
    q1113ContractConsumed: q1113Consumed,
    classification,
    evidence,
  };
}

export function verifyProductionReadiness(deps: QSeriesCompletionDependencies): ProductionReadinessCompletion {
  const now = new Date().toISOString();
  const evidence: string[] = [];
  const eaprt = extractEaprtDecision(deps);
  evidence.push(...eaprt.evidence);

  const gk = extractGkSignals(deps);
  evidence.push(...gk.evidence);

  const plmrt = extractPlmrtProductionActive(deps);
  evidence.push(...plmrt.evidence);

  const finartPresent = !!deps.financialReadinessAudit;
  evidence.push(
    finartPresent
      ? "Q11-08 Financial Readiness Audit (FINART) handle injected"
      : "Q11-08 Financial Readiness Audit (FINART) missing — not consumable",
  );

  let classification: CompletionClassification = "blocked";
  if (eaprt.decision === "certify" && gk.authorised && plmrt.active && finartPresent) {
    classification = "complete";
  } else if (eaprt.classification === "failed") {
    classification = "failed";
  } else if (eaprt.decision !== "certify" || !gk.authorised || !plmrt.active || !finartPresent) {
    classification = "blocked";
  } else {
    classification = "partially_complete";
  }

  return {
    computedAt: now,
    eaprtDecision: eaprt.decision,
    eaprtClassification: eaprt.classification,
    gkAuthorised: gk.authorised,
    plmrtProductionActive: plmrt.active,
    finartPresent,
    classification,
    evidence,
  };
}

export type CompletionInputs = {
  missionSummary: MissionCompletionSummary;
  factorySummary: FactoryCompletionSummary;
  workerSummary: WorkerCompletionSummary;
  runtimeSummary: RuntimeCompletionSummary;
  governanceSummary: GovernanceCompletionSummary;
  certificationSummary: CertificationCompletionSummary;
  productionSummary: ProductionReadinessCompletion;
  deferCompletion?: boolean;
};

export function aggregateFinalCompletionEvidence(
  deps: QSeriesCompletionDependencies,
  inputs: CompletionInputs,
): AggregatedCompletionEvidence {
  const now = new Date().toISOString();
  const missionInventoryComplete = !inputs.missionSummary.finartMissing && inputs.missionSummary.missingCount === 0;
  const finartMissing = inputs.missionSummary.finartMissing;
  const qscrtCertified = inputs.certificationSummary.qscrtCertificationDecision === "certify";
  const productionChainGreen =
    inputs.productionSummary.eaprtDecision === "certify" &&
    inputs.productionSummary.gkAuthorised &&
    inputs.productionSummary.plmrtProductionActive &&
    inputs.productionSummary.finartPresent;

  const summaries = [
    inputs.missionSummary.classification,
    inputs.workerSummary.classification,
    inputs.runtimeSummary.classification,
    inputs.governanceSummary.classification,
    inputs.certificationSummary.classification,
    inputs.productionSummary.classification,
  ];

  return {
    computedAt: now,
    missionInventoryComplete,
    finartMissing,
    qscrtCertified,
    productionChainGreen,
    completeCount: summaries.filter((s) => s === "complete").length,
    incompleteCount: summaries.filter((s) => s === "partially_complete" || s === "missing").length,
    blockedCount: summaries.filter((s) => s === "blocked").length,
    evidence: [
      ...inputs.missionSummary.evidence.slice(0, 5),
      ...inputs.certificationSummary.evidence,
      ...inputs.productionSummary.evidence.slice(0, 3),
      `missionInventoryComplete=${missionInventoryComplete}`,
      `qscrtCertified=${qscrtCertified}`,
      `productionChainGreen=${productionChainGreen}`,
    ],
  };
}

export function classifyCompletionReadiness(
  inputs: CompletionInputs & { aggregated: AggregatedCompletionEvidence },
): CompletionReadinessClassification {
  const now = new Date().toISOString();
  const rationale: string[] = [];
  const evidence = [
    ...inputs.missionSummary.evidence,
    ...inputs.workerSummary.evidence,
    ...inputs.runtimeSummary.evidence,
    ...inputs.aggregated.evidence,
  ];

  if (inputs.deferCompletion) {
    return {
      computedAt: now,
      overallClassification: "deferred",
      readinessScore: 0,
      rationale: ["completion explicitly deferred"],
      evidence,
    };
  }

  const classifications = [
    inputs.missionSummary.classification,
    inputs.workerSummary.classification,
    inputs.runtimeSummary.classification,
    inputs.governanceSummary.classification,
    inputs.certificationSummary.classification,
    inputs.productionSummary.classification,
  ];

  let overallClassification: CompletionClassification = "complete";
  if (classifications.includes("failed")) {
    overallClassification = "failed";
    rationale.push("critical workforce/runtime evidence Failed");
  } else if (inputs.missionSummary.finartMissing) {
    overallClassification = "partially_complete";
    rationale.push("Q11-08 FINART missing — mission inventory incomplete");
  } else if (classifications.includes("blocked") || inputs.productionSummary.classification === "blocked") {
    overallClassification = "blocked";
    rationale.push("production readiness chain blocked (FINART/EAPRT/GK/PLMRT/QSCRT)");
  } else if (classifications.includes("missing")) {
    overallClassification = "missing";
    rationale.push("critical evidence Missing");
  } else if (classifications.includes("partially_complete")) {
    overallClassification = "partially_complete";
    rationale.push("partial completion evidence observed");
  }

  const readinessScore = computeCompletionScore(inputs, overallClassification);
  return { computedAt: now, overallClassification, readinessScore, rationale, evidence };
}

export function produceFinalCompletionDecision(
  readiness: CompletionReadinessClassification,
  missionSummary: MissionCompletionSummary,
  certificationSummary: CertificationCompletionSummary,
  productionSummary: ProductionReadinessCompletion,
  workerSummary: WorkerCompletionSummary,
  runtimeSummary: RuntimeCompletionSummary,
  deferCompletion?: boolean,
): FinalCompletionDecision {
  if (deferCompletion) return "defer";

  const qscrtBlocked = certificationSummary.qscrtCertificationDecision !== "certify";
  const finartBlocked = missionSummary.finartMissing;
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
    runtimeSummary.classification === "missing";

  if (criticalFailed) return "escalate";
  if (finartBlocked && !qscrtBlocked && !eaprtBlocked) return "incomplete";
  if (qscrtBlocked || finartBlocked || eaprtBlocked || gkBlocked || plmrtBlocked) return "withhold";

  if (
    readiness.overallClassification === "complete" &&
    productionSummary.classification === "complete" &&
    certificationSummary.classification === "complete" &&
    !missionSummary.finartMissing &&
    !qscrtBlocked
  ) {
    return "complete";
  }

  if (missionSummary.finartMissing || missionSummary.missingCount > 0) return "incomplete";
  return "withhold";
}

export function computeCompletionScore(
  inputs: CompletionInputs & { aggregated: AggregatedCompletionEvidence },
  overallClassification: CompletionClassification,
): number {
  if (overallClassification === "failed") return 0;
  if (overallClassification === "blocked" || overallClassification === "missing") return 0.2;
  if (overallClassification === "deferred") return 0;
  if (overallClassification === "partially_complete") return 0.45;

  const total = 6;
  const complete = inputs.aggregated.completeCount;
  const base = complete / total;
  const productionBonus =
    inputs.productionSummary.gkAuthorised && inputs.productionSummary.plmrtProductionActive ? 0.15 : 0;
  const qscrtBonus = inputs.certificationSummary.qscrtCertificationDecision === "certify" ? 0.15 : 0;
  return Math.min(1, Math.max(0, base * 0.7 + productionBonus + qscrtBonus));
}

export function buildOutstandingIssues(
  missionSummary: MissionCompletionSummary,
  certificationSummary: CertificationCompletionSummary,
  productionSummary: ProductionReadinessCompletion,
  governanceSummary: GovernanceCompletionSummary,
  readiness: CompletionReadinessClassification,
): string[] {
  const issues: string[] = [];
  if (missionSummary.finartMissing) {
    issues.push("Q11-08 Financial Readiness Audit (FINART) missing from mission inventory");
  }
  if (certificationSummary.qscrtCertificationDecision !== "certify") {
    issues.push(
      `Q Series Certification decision not certify (${certificationSummary.qscrtCertificationDecision ?? "missing"})`,
    );
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
  issues.push(...readiness.rationale);
  return [...new Set(issues)];
}

export function buildCompletionRecords(
  missionSummary: MissionCompletionSummary,
  factorySummary: FactoryCompletionSummary,
  workerSummary: WorkerCompletionSummary,
  runtimeSummary: RuntimeCompletionSummary,
  governanceSummary: GovernanceCompletionSummary,
  certificationSummary: CertificationCompletionSummary,
  productionSummary: ProductionReadinessCompletion,
  finalDecision: FinalCompletionDecision,
): import("./types.js").QSeriesCompletionRecord[] {
  const now = new Date().toISOString();
  return [
    {
      completionId: `qscpt-completion-001`,
      programmeVersion: Q_SERIES_COMPLETION_RUNTIME_VERSION,
      missionCompletionSummary: missionSummary,
      factoryCompletionSummary: factorySummary,
      workerCompletionSummary: workerSummary,
      runtimeCompletionSummary: runtimeSummary,
      governanceStatus: governanceSummary,
      certificationStatus: certificationSummary,
      productionStatus: productionSummary,
      finalCompletionDecision: finalDecision,
      supportingEvidence: [...missionSummary.evidence, ...certificationSummary.evidence].slice(0, 8),
      auditReference: "q11-13:q-series-completion:programme",
      completionTimestamp: now,
    },
  ];
}

export { Q_SERIES_COMPLETION_RUNTIME_VERSION };
