import type { CapitalFactoryCoreConfiguration } from "./configuration.js";
import {
  CAPFC_METADATA_VERSION,
  CAPITAL_PROJECT_VERSION,
  CAPITAL_FACTORY_CORE_ID,
  CAPITAL_FACTORY_CORE_IDENTITY,
  CAPITAL_FACTORY_REPORT_VERSION,
  CAPITAL_WORKER_ROLES,
  LIFECYCLE_STATUSES,
} from "./paths.js";
import type {
  CapfcInput,
  CapitalProject,
  CapitalFactoryCoreCatalog,
  CapitalFactoryCoreValidationReport,
  CapitalFactoryReport,
  CapitalCategory,
  AuditStatus,
  IntegrationHandshake,
  LifecycleStatus,
  ProgressSummary,
  ProjectStatus,
  Q902ConsumableContract,
  ReadinessStatus,
  WorkerDependencyEdge,
  WorkerStatus,
  WorkerStatusMatrixEntry,
} from "./types.js";

const LIFECYCLE_TO_STATUS: Record<string, ProjectStatus> = {
  project_registered: "active",
  workers_coordinated: "coordinating",
  preparation: "preparing",
  readiness_review: "in_readiness_review",
  operating: "operating",
  paused: "paused",
  completed: "completed",
  archived: "archived",
};

/** Pure Capital Factory Core helpers for Q9-01 — orchestration only. */
export class AfcProjectBuilder {
  buildCatalog(
    config: CapitalFactoryCoreConfiguration,
    projects: CapitalProject[],
    reports: CapitalFactoryReport[],
    integrations: IntegrationHandshake[],
  ): CapitalFactoryCoreCatalog {
    return {
      projectVersion: CAPITAL_PROJECT_VERSION,
      reportVersion: CAPITAL_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      capitalCategories: [...config.capitalCategories],
      lifecycleStatuses: [...config.lifecycleStatuses],
      workerRoles: [...config.workerRoles],
      projects: projects.map(cloneProject),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: CAPFC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverPerformAccounting: true,
      neverForecastFinances: true,
      neverExecuteInvestmentsAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ902OrLater: true,
    };
  }

  /** Create a brand-new capital project (project_registered). */
  buildProject(
    input: CapfcInput,
    config: CapitalFactoryCoreConfiguration,
  ): CapitalProject {
    projectSequence += 1;
    const now = new Date().toISOString();

    const capitalBusinessId =
      input.capitalBusinessId?.trim() || `capfc-biz-${Date.now()}-${projectSequence}`;
    const factoryProjectId = `capfc-prj-${Date.now()}-${projectSequence}`;
    const capitalProjectName = input.capitalProjectName?.trim() || `Capital ${capitalBusinessId}`;
    const capitalCategory = normalizeType(
      input.capitalCategory || input.niche || "unknown",
    ) as CapitalCategory | string;
    const region = input.region?.trim() || "GLOBAL";
    const financialPeriod =
      input.financialPeriod?.trim() || new Date().toISOString().slice(0, 7);
    const capitalObjective =
      input.capitalObjective?.trim() ||
      `Coordinate capital lifecycle for ${capitalProjectName}.`;

    const traceabilityRefs = unique([`q9-01:capital_business:${capitalBusinessId}`]);

    const project: CapitalProject = {
      factoryProjectId,
      capitalProjectId: factoryProjectId,
      capitalBusinessId,
      timestamp: now,
      financialPeriod,
      capitalProjectName,
      capitalCategory,
      capitalStatus: "registered",
      region,
      capitalObjective,
      lifecycleStatus: "project_registered",
      currentStatus: "active",
      workerStatusMatrix: [],
      dependencyGraph: [],
      capitalAllocationSummary: {
        capitalBusinessId,
        capitalCategory: String(capitalCategory),
        region,
        lifecycleStatus: "project_registered",
        allocationNotes: [
          "Structural capital allocation registry only — no accounting or investment execution",
        ],
        fabricated: false,
        evidencePresent: true,
      },
      readinessStatus: "unknown",
      outstandingTasks: unique([...(input.outstandingTasks ?? [])]),
      risks: unique([...(input.risks ?? [])]),
      executiveSummary:
        input.executiveSummary?.trim() ||
        `Capital Factory orchestration registered for ${capitalProjectName}.`,
      auditStatus: "not_audited",
      confidenceScore: 0,
      metadata: { ...(input.metadata ?? {}) },
      progressSummary: {
        stagesCompleted: 1,
        totalStages: LIFECYCLE_STATUSES.length,
        percentComplete: computePercentComplete("project_registered"),
        workersReady: 0,
        workersTotal: 0,
      },
      submittedToExecutiveReporting: false,
      executiveReportId: null,
      traceabilityRefs,
      metadataVersion: CAPFC_METADATA_VERSION,
      projectVersion: CAPITAL_PROJECT_VERSION,
      workerId: config.workerId || CAPITAL_FACTORY_CORE_IDENTITY.workerId,
      neverPerformAccounting: true,
      neverForecastFinances: true,
      neverExecuteInvestmentsAutomatically: true,
      neverFabricateFinancialStatus: true,
      neverFabricateWorkerStatus: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ902OrLater: true,
      preserveCompleteTraceability: true,
      preserveFactoryAuditHistory: true,
      neverExposeCredentials: true,
      neverExposeAuthenticationTokens: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
    project.confidenceScore = computeConfidenceScore(project);
    return project;
  }

  /** Register or re-register an capital project (create + register combined). */
  registerCapitalProject(
    input: CapfcInput,
    config: CapitalFactoryCoreConfiguration,
    existing?: CapitalProject | null,
  ): CapitalProject {
    if (!existing) {
      return this.buildProject(input, config);
    }
    const capitalProjectName = input.capitalProjectName?.trim() || existing.capitalProjectName;
    const capitalCategory = normalizeType(
      input.capitalCategory || input.niche || existing.capitalCategory || "unknown",
    ) as CapitalCategory | string;
    const region = input.region?.trim() || existing.region;

    const updated: CapitalProject = {
      ...cloneProject(existing),
      capitalProjectName,
      capitalCategory,
      region,
      capitalObjective: input.capitalObjective?.trim() || existing.capitalObjective,
      metadata: { ...existing.metadata, ...(input.metadata ?? {}) },
      traceabilityRefs: unique([
        ...existing.traceabilityRefs,
        `q9-01:project:${existing.capitalBusinessId}`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /**
   * Advance lifecycle stage. Never allows skipping directly to `operating` (or later)
   * unless `workers_coordinated` has already been reached — structural safety gate.
   */
  advanceLifecycle(
    project: CapitalProject,
    targetStage: LifecycleStatus | string,
  ): CapitalProject {
    const stageOrder = [...LIFECYCLE_STATUSES] as LifecycleStatus[];
    const currentIdx = stageOrder.indexOf(project.lifecycleStatus as LifecycleStatus);
    const requestedIdx = stageOrder.indexOf(targetStage as LifecycleStatus);
    const workersCoordinatedIdx = stageOrder.indexOf("workers_coordinated");
    const operatingIdx = stageOrder.indexOf("operating");

    let nextIdx =
      requestedIdx >= 0
        ? requestedIdx
        : currentIdx >= 0 && currentIdx < stageOrder.length - 1
          ? currentIdx + 1
          : currentIdx;

    if (nextIdx >= operatingIdx && currentIdx < workersCoordinatedIdx) {
      throw new Error(
        "Capital Factory Core cannot advance to operating before workers_coordinated",
      );
    }

    const nextStage = stageOrder[Math.max(nextIdx, 0)] ?? project.lifecycleStatus;
    const capitalStatus = mapCapitalStatus(nextStage);
    const updated: CapitalProject = {
      ...cloneProject(project),
      lifecycleStatus: nextStage,
      capitalStatus,
      currentStatus: LIFECYCLE_TO_STATUS[nextStage] ?? project.currentStatus,
      capitalAllocationSummary: {
        ...cloneProject(project).capitalAllocationSummary,
        lifecycleStatus: String(nextStage),
        allocationNotes: unique([
          ...cloneProject(project).capitalAllocationSummary.allocationNotes,
          `Lifecycle advanced to ${nextStage}`,
        ]),
        fabricated: false,
        evidencePresent: true,
      },
      readinessStatus: computeReadinessStatus({ ...project, lifecycleStatus: nextStage }),
      progressSummary: computeProgressSummary({ ...project, lifecycleStatus: nextStage }),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q9-01:lifecycle_status:${nextStage}`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Refresh computed fields (readiness/progress/confidence) without mutating lifecycle. */
  refreshComputed(project: CapitalProject): CapitalProject {
    const updated: CapitalProject = {
      ...cloneProject(project),
      readinessStatus: computeReadinessStatus(project),
      progressSummary: computeProgressSummary(project),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /**
   * Register structural worker role slots (placeholders only for future Q9-02+ workers).
   * Status starts assigned/unassigned strictly based on observed input — never fabricated.
   */
  coordinateWorkers(
    project: CapitalProject,
    requestedRoles: string[],
    requestedWorkers: string[],
    statusUpdates: Array<{
      workerRole: string;
      workerId?: string | null;
      status?: WorkerStatus | null;
      notes?: string | null;
    }> = [],
  ): CapitalProject {
    const matrix = new Map<string, WorkerStatusMatrixEntry>(
      project.workerStatusMatrix.map((entry) => [entry.workerRole, { ...entry }]),
    );

    requestedRoles.forEach((role, idx) => {
      const normalizedRole = normalizeType(role);
      const workerId = requestedWorkers[idx]?.trim() || null;
      const existing = matrix.get(normalizedRole);
      matrix.set(normalizedRole, {
        workerRole: normalizedRole,
        workerId: workerId ?? existing?.workerId ?? null,
        status: workerId ? "assigned" : (existing?.status ?? "unassigned"),
        notes: existing?.notes ?? "registered_structural_role_slot",
      });
    });

    for (const update of statusUpdates) {
      const normalizedRole = normalizeType(update.workerRole);
      const existing = matrix.get(normalizedRole);
      matrix.set(normalizedRole, {
        workerRole: normalizedRole,
        workerId: update.workerId?.trim() || existing?.workerId || null,
        status: (update.status as WorkerStatus) ?? existing?.status ?? "unassigned",
        notes: update.notes?.trim() || existing?.notes || "status_update",
      });
    }

    const workerStatusMatrix = [...matrix.values()];
    const anyCoordinated = workerStatusMatrix.length > 0;
    const lifecycleStatus =
      anyCoordinated && project.lifecycleStatus === "project_registered"
        ? "workers_coordinated"
        : project.lifecycleStatus;

    const updated: CapitalProject = {
      ...cloneProject(project),
      workerStatusMatrix,
      lifecycleStatus,
      currentStatus: LIFECYCLE_TO_STATUS[lifecycleStatus] ?? project.currentStatus,
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q9-01:worker_coordination:${workerStatusMatrix.length}_roles`,
      ]),
    };
    updated.readinessStatus = computeReadinessStatus(updated);
    updated.progressSummary = computeProgressSummary(updated);
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Record extensible dependency edges between worker role slots. */
  manageWorkerDependencies(
    project: CapitalProject,
    edges: Array<{ fromRole: string; toRole: string; dependencyType?: string | null; notes?: string | null }>,
  ): CapitalProject {
    const existingKeys = new Set(
      project.dependencyGraph.map((e) => `${e.fromRole}->${e.toRole}:${e.dependencyType}`),
    );
    const newEdges: WorkerDependencyEdge[] = [];
    for (const edge of edges) {
      const fromRole = normalizeType(edge.fromRole);
      const toRole = normalizeType(edge.toRole);
      const dependencyType = edge.dependencyType?.trim() || "sequential";
      const key = `${fromRole}->${toRole}:${dependencyType}`;
      if (!fromRole || !toRole || existingKeys.has(key)) continue;
      existingKeys.add(key);
      newEdges.push({
        fromRole,
        toRole,
        dependencyType,
        notes: edge.notes?.trim() || "dependency_edge_recorded",
      });
    }

    const dependencyGraph = [...project.dependencyGraph, ...newEdges];
    const updated: CapitalProject = {
      ...cloneProject(project),
      dependencyGraph,
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q9-01:dependency_graph:${dependencyGraph.length}_edges`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Merge metadata fields — structural signal only. */
  maintainBusinessMetadata(
    project: CapitalProject,
    metadata: Record<string, string>,
  ): CapitalProject {
    const updated: CapitalProject = {
      ...cloneProject(project),
      metadata: { ...project.metadata, ...metadata },
      traceabilityRefs: unique([...project.traceabilityRefs, "q9-01:metadata_maintained"]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Structural executive summary echoing observed project state only. */
  buildExecutiveSummary(project: CapitalProject): string {
    const workerCount = project.workerStatusMatrix.length;
    const readyCount = project.workerStatusMatrix.filter((e) => e.status === "ready").length;
    return (
      `Capital Factory Core orchestration for ${project.capitalProjectName} ` +
      `(${project.capitalCategory}, region=${project.region}): lifecycle=${project.lifecycleStatus}, ` +
      `readiness=${project.readinessStatus}, workers=${readyCount}/${workerCount} ready, ` +
      `outstandingTasks=${project.outstandingTasks.length}, risks=${project.risks.length}.`
    );
  }

  applyExecutiveSummary(project: CapitalProject): CapitalProject {
    const updated: CapitalProject = {
      ...cloneProject(project),
      executiveSummary: this.buildExecutiveSummary(project),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyAuditStatus(
    project: CapitalProject,
    auditStatus: AuditStatus,
  ): CapitalProject {
    const updated: CapitalProject = {
      ...cloneProject(project),
      auditStatus,
      traceabilityRefs: unique([...project.traceabilityRefs, `q9-01:audit_status:${auditStatus}`]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  buildReport(
    project: CapitalProject,
    validation: CapitalFactoryCoreValidationReport | null,
  ): CapitalFactoryReport {
    const confidenceScore = computeConfidenceScore(project);
    return {
      reportId: `capfc-rpt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      capitalProjectId: project.capitalProjectId || project.factoryProjectId,
      financialPeriod: project.financialPeriod,
      capitalStatus: project.capitalStatus,
      capitalBusinessId: project.capitalBusinessId,
      capitalProjectName: project.capitalProjectName,
      lifecycleStatus: project.lifecycleStatus,
      workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
      capitalAllocationSummary: {
        ...project.capitalAllocationSummary,
        allocationNotes: [...project.capitalAllocationSummary.allocationNotes],
        fabricated: false,
      },
      readinessStatus: project.readinessStatus,
      outstandingTasks: [...project.outstandingTasks],
      risks: [...project.risks],
      executiveSummary: project.executiveSummary,
      auditStatus: project.auditStatus,
      confidenceScore,
      metadataVersion: CAPFC_METADATA_VERSION,
      reportVersion: CAPITAL_FACTORY_REPORT_VERSION,
      workerId: project.workerId,
      factoryId: CAPITAL_FACTORY_CORE_ID,
      capitalCategory: project.capitalCategory,
      metadata: { ...project.metadata },
      dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
      progressSummary: { ...project.progressSummary },
      validation: validation ? { ...validation, errors: [...validation.errors], warnings: [...validation.warnings] } : null,
      runTimestamp: new Date().toISOString(),
      consumableByQ902: true,
      submittedToExecutiveReporting: project.submittedToExecutiveReporting,
      executiveReportId: project.executiveReportId,
      traceabilityRefs: [...project.traceabilityRefs],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveFactoryAuditHistory: true,
      neverPerformAccounting: true,
      neverForecastFinances: true,
      neverExecuteInvestmentsAutomatically: true,
      neverFabricateFinancialStatus: true,
      neverFabricateWorkerStatus: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ902OrLater: true,
    };
  }

  buildQ902ConsumableContract(config: CapitalFactoryCoreConfiguration): Q902ConsumableContract {
    return {
      contractId: `capfc-q902-contract-${CAPFC_METADATA_VERSION}`,
      contractVersion: CAPFC_METADATA_VERSION,
      producedBy: "capital-factory-core",
      missionId: "Q9-01",
      consumerMissionId: "Q9-02",
      exposedFields: [
        "capitalBusinessId",
        "capitalProjectName",
        "capitalCategory",
        "lifecycleStatus",
        "workerStatusMatrix",
        "dependencyGraph",
        "readinessStatus",
        "outstandingTasks",
        "risks",
        "executiveSummary",
        "confidenceScore",
        "metadataVersion",
      ],
      workerRoleCatalog: [...config.workerRoles, ...CAPITAL_WORKER_ROLES],
      lifecycleStatuses: [...config.lifecycleStatuses],
      notes: [
        "Capital Factory Core (Q9-01) is orchestration-only.",
        "It does not perform accounting, forecast finances, or execute investments automatically.",
        "Q9-02 and later workers must consume this contract rather than reimplement Q9-01 orchestration.",
      ],
      neverImplementQ902OrLater: true,
      structuralSignalOnly: true,
    };
  }
}

let projectSequence = 0;

export function resetProjectSequenceForTesting() {
  projectSequence = 0;
}

/** Confidence 0–100 from observed fields only — never fabricates worker health. */
export function computeConfidenceScore(project: CapitalProject): number {
  const checks: boolean[] = [
    !!project.factoryProjectId,
    !!project.capitalBusinessId,
    !!project.capitalProjectName?.trim(),
    !!project.capitalCategory && project.capitalCategory !== "unknown",
    !!project.lifecycleStatus,
    project.lifecycleStatus !== "project_registered",
    project.workerStatusMatrix.length > 0,
    project.readinessStatus === "ready",
    project.outstandingTasks.length === 0,
    project.risks.length === 0,
    project.traceabilityRefs.some((r) => r.includes("q9-01")),
    !!project.executiveSummary?.trim(),
    project.auditStatus === "passed",
    Object.keys(project.metadata).length > 0,
  ];
  const weight = 100 / checks.length;
  let score = 0;
  for (const ok of checks) if (ok) score += weight;
  return Math.min(100, Math.round(score));
}

/** Readiness derived strictly from lifecycle + worker matrix completeness — never fabricated. */
export function computeReadinessStatus(project: CapitalProject): ReadinessStatus {
  const matrix = project.workerStatusMatrix;
  if (matrix.length === 0) return "unknown";
  if (matrix.some((e) => e.status === "blocked")) return "blocked";
  const readyCount = matrix.filter((e) => e.status === "ready").length;
  const activeCount = matrix.filter((e) => e.status === "ready" || e.status === "assigned").length;
  if (readyCount === matrix.length) return "ready";
  if (activeCount > 0) return "partial";
  return "not_ready";
}

/** Progress observed strictly from lifecycle position + worker matrix — never fabricated. */
export function computeProgressSummary(project: CapitalProject): ProgressSummary {
  const stageOrder = [...LIFECYCLE_STATUSES];
  const currentIdx = Math.max(stageOrder.indexOf(project.lifecycleStatus as LifecycleStatus), 0);
  const workersReady = project.workerStatusMatrix.filter((e) => e.status === "ready").length;
  return {
    stagesCompleted: currentIdx + 1,
    totalStages: stageOrder.length,
    percentComplete: computePercentComplete(project.lifecycleStatus),
    workersReady,
    workersTotal: project.workerStatusMatrix.length,
  };
}

function computePercentComplete(lifecycleStatus: LifecycleStatus | string): number {
  const stageOrder = [...LIFECYCLE_STATUSES];
  const idx = Math.max(stageOrder.indexOf(lifecycleStatus as LifecycleStatus), 0);
  return Math.round(((idx + 1) / stageOrder.length) * 100);
}

function normalizeType(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function mapCapitalStatus(lifecycleStatus: LifecycleStatus | string): string {
  switch (lifecycleStatus) {
    case "project_registered":
      return "registered";
    case "workers_coordinated":
    case "preparation":
      return "allocated";
    case "readiness_review":
      return "monitoring";
    case "operating":
      return "ready";
    case "paused":
      return "paused";
    case "completed":
    case "archived":
      return "closed";
    default:
      return "unknown";
  }
}

function cloneProject(project: CapitalProject): CapitalProject {
  return {
    ...project,
    capitalProjectId: project.capitalProjectId || project.factoryProjectId,
    financialPeriod: project.financialPeriod || new Date().toISOString().slice(0, 7),
    capitalStatus: project.capitalStatus || mapCapitalStatus(project.lifecycleStatus),
    capitalAllocationSummary: {
      ...(project.capitalAllocationSummary ?? {
        capitalBusinessId: project.capitalBusinessId,
        capitalCategory: String(project.capitalCategory),
        region: project.region,
        lifecycleStatus: String(project.lifecycleStatus),
        allocationNotes: [],
        fabricated: false as const,
        evidencePresent: true,
      }),
      allocationNotes: [...(project.capitalAllocationSummary?.allocationNotes ?? [])],
      fabricated: false,
    },
    workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
    dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
    outstandingTasks: [...project.outstandingTasks],
    risks: [...project.risks],
    metadata: { ...project.metadata },
    traceabilityRefs: [...project.traceabilityRefs],
    neverFabricateFinancialStatus: true,
    progressSummary: { ...project.progressSummary },
  };
}

function cloneReport(report: CapitalFactoryReport): CapitalFactoryReport {
  return {
    ...report,
    workerStatusMatrix: report.workerStatusMatrix.map((e) => ({ ...e })),
    dependencyGraph: report.dependencyGraph.map((e) => ({ ...e })),
    outstandingTasks: [...report.outstandingTasks],
    risks: [...report.risks],
    metadata: { ...report.metadata },
    traceabilityRefs: [...report.traceabilityRefs],
    progressSummary: { ...report.progressSummary },
    validation: report.validation
      ? { ...report.validation, errors: [...report.validation.errors], warnings: [...report.validation.warnings] }
      : null,
  };
}
