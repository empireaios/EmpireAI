import type { AffiliateFactoryCoreConfiguration } from "./configuration.js";
import {
  AFC_METADATA_VERSION,
  AFFILIATE_BUSINESS_PROJECT_VERSION,
  AFFILIATE_FACTORY_CORE_ID,
  AFFILIATE_FACTORY_CORE_IDENTITY,
  AFFILIATE_FACTORY_REPORT_VERSION,
  AFFILIATE_WORKER_ROLES,
  LIFECYCLE_STATUSES,
} from "./paths.js";
import type {
  AfcInput,
  AffiliateBusinessProject,
  AffiliateFactoryCoreCatalog,
  AffiliateFactoryCoreValidationReport,
  AffiliateFactoryReport,
  AffiliateNiche,
  AuditStatus,
  IntegrationHandshake,
  LifecycleStatus,
  ProgressSummary,
  ProjectStatus,
  Q802ConsumableContract,
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

/** Pure Affiliate Factory Core helpers for Q8-01 — orchestration only. */
export class AfcProjectBuilder {
  buildCatalog(
    config: AffiliateFactoryCoreConfiguration,
    projects: AffiliateBusinessProject[],
    reports: AffiliateFactoryReport[],
    integrations: IntegrationHandshake[],
  ): AffiliateFactoryCoreCatalog {
    return {
      projectVersion: AFFILIATE_BUSINESS_PROJECT_VERSION,
      reportVersion: AFFILIATE_FACTORY_REPORT_VERSION,
      workerId: config.workerId,
      affiliateNiches: [...config.affiliateNiches],
      lifecycleStatuses: [...config.lifecycleStatuses],
      workerRoles: [...config.workerRoles],
      projects: projects.map(cloneProject),
      reports: reports.map(cloneReport),
      integrations: integrations.map((i) => ({ ...i })),
      metadataVersion: AFC_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverDiscoverAffiliateProgrammes: true,
      neverGenerateAffiliateContent: true,
      neverLaunchBusinessesAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverBypassGrandKingApproval: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverImplementQ802OrLater: true,
    };
  }

  /** Create a brand-new affiliate business project (project_registered). */
  buildProject(
    input: AfcInput,
    config: AffiliateFactoryCoreConfiguration,
  ): AffiliateBusinessProject {
    projectSequence += 1;
    const now = new Date().toISOString();

    const affiliateBusinessId =
      input.affiliateBusinessId?.trim() || `afc-biz-${Date.now()}-${projectSequence}`;
    const businessName = input.businessName?.trim() || `Affiliate Business ${affiliateBusinessId}`;
    const businessCategory = normalizeType(
      input.businessCategory || input.niche || "unknown",
    ) as AffiliateNiche | string;
    const region = input.region?.trim() || "GLOBAL";
    const businessObjective =
      input.businessObjective?.trim() ||
      `Coordinate affiliate business lifecycle for ${businessName}.`;

    const traceabilityRefs = unique([`q8-01:affiliate_business:${affiliateBusinessId}`]);

    const project: AffiliateBusinessProject = {
      factoryProjectId: `afc-prj-${Date.now()}-${projectSequence}`,
      affiliateBusinessId,
      timestamp: now,
      businessName,
      businessCategory,
      region,
      businessObjective,
      lifecycleStatus: "project_registered",
      currentStatus: "active",
      workerStatusMatrix: [],
      dependencyGraph: [],
      readinessStatus: "unknown",
      outstandingTasks: unique([...(input.outstandingTasks ?? [])]),
      risks: unique([...(input.risks ?? [])]),
      executiveSummary:
        input.executiveSummary?.trim() ||
        `Affiliate Factory orchestration registered for ${businessName}.`,
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
      metadataVersion: AFC_METADATA_VERSION,
      projectVersion: AFFILIATE_BUSINESS_PROJECT_VERSION,
      workerId: config.workerId || AFFILIATE_FACTORY_CORE_IDENTITY.workerId,
      neverDiscoverAffiliateProgrammes: true,
      neverGenerateAffiliateContent: true,
      neverLaunchBusinessesAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ802OrLater: true,
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

  /** Register or re-register an affiliate business project (create + register combined). */
  registerAffiliateBusinessProject(
    input: AfcInput,
    config: AffiliateFactoryCoreConfiguration,
    existing?: AffiliateBusinessProject | null,
  ): AffiliateBusinessProject {
    if (!existing) {
      return this.buildProject(input, config);
    }
    const businessName = input.businessName?.trim() || existing.businessName;
    const businessCategory = normalizeType(
      input.businessCategory || input.niche || existing.businessCategory || "unknown",
    ) as AffiliateNiche | string;
    const region = input.region?.trim() || existing.region;

    const updated: AffiliateBusinessProject = {
      ...cloneProject(existing),
      businessName,
      businessCategory,
      region,
      businessObjective: input.businessObjective?.trim() || existing.businessObjective,
      metadata: { ...existing.metadata, ...(input.metadata ?? {}) },
      traceabilityRefs: unique([
        ...existing.traceabilityRefs,
        `q8-01:project:${existing.affiliateBusinessId}`,
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
    project: AffiliateBusinessProject,
    targetStage: LifecycleStatus | string,
  ): AffiliateBusinessProject {
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
        "Affiliate Factory Core cannot advance to operating before workers_coordinated",
      );
    }

    const nextStage = stageOrder[Math.max(nextIdx, 0)] ?? project.lifecycleStatus;
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      lifecycleStatus: nextStage,
      currentStatus: LIFECYCLE_TO_STATUS[nextStage] ?? project.currentStatus,
      readinessStatus: computeReadinessStatus({ ...project, lifecycleStatus: nextStage }),
      progressSummary: computeProgressSummary({ ...project, lifecycleStatus: nextStage }),
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q8-01:lifecycle_status:${nextStage}`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Refresh computed fields (readiness/progress/confidence) without mutating lifecycle. */
  refreshComputed(project: AffiliateBusinessProject): AffiliateBusinessProject {
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      readinessStatus: computeReadinessStatus(project),
      progressSummary: computeProgressSummary(project),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /**
   * Register structural worker role slots (placeholders only for future Q8-02+ workers).
   * Status starts assigned/unassigned strictly based on observed input — never fabricated.
   */
  coordinateWorkers(
    project: AffiliateBusinessProject,
    requestedRoles: string[],
    requestedWorkers: string[],
    statusUpdates: Array<{
      workerRole: string;
      workerId?: string | null;
      status?: WorkerStatus | null;
      notes?: string | null;
    }> = [],
  ): AffiliateBusinessProject {
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

    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      workerStatusMatrix,
      lifecycleStatus,
      currentStatus: LIFECYCLE_TO_STATUS[lifecycleStatus] ?? project.currentStatus,
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q8-01:worker_coordination:${workerStatusMatrix.length}_roles`,
      ]),
    };
    updated.readinessStatus = computeReadinessStatus(updated);
    updated.progressSummary = computeProgressSummary(updated);
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Record extensible dependency edges between worker role slots. */
  manageWorkerDependencies(
    project: AffiliateBusinessProject,
    edges: Array<{ fromRole: string; toRole: string; dependencyType?: string | null; notes?: string | null }>,
  ): AffiliateBusinessProject {
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
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      dependencyGraph,
      traceabilityRefs: unique([
        ...project.traceabilityRefs,
        `q8-01:dependency_graph:${dependencyGraph.length}_edges`,
      ]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Merge metadata fields — structural signal only. */
  maintainBusinessMetadata(
    project: AffiliateBusinessProject,
    metadata: Record<string, string>,
  ): AffiliateBusinessProject {
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      metadata: { ...project.metadata, ...metadata },
      traceabilityRefs: unique([...project.traceabilityRefs, "q8-01:metadata_maintained"]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  /** Structural executive summary echoing observed project state only. */
  buildExecutiveSummary(project: AffiliateBusinessProject): string {
    const workerCount = project.workerStatusMatrix.length;
    const readyCount = project.workerStatusMatrix.filter((e) => e.status === "ready").length;
    return (
      `Affiliate Factory Core orchestration for ${project.businessName} ` +
      `(${project.businessCategory}, region=${project.region}): lifecycle=${project.lifecycleStatus}, ` +
      `readiness=${project.readinessStatus}, workers=${readyCount}/${workerCount} ready, ` +
      `outstandingTasks=${project.outstandingTasks.length}, risks=${project.risks.length}.`
    );
  }

  applyExecutiveSummary(project: AffiliateBusinessProject): AffiliateBusinessProject {
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      executiveSummary: this.buildExecutiveSummary(project),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  applyAuditStatus(
    project: AffiliateBusinessProject,
    auditStatus: AuditStatus,
  ): AffiliateBusinessProject {
    const updated: AffiliateBusinessProject = {
      ...cloneProject(project),
      auditStatus,
      traceabilityRefs: unique([...project.traceabilityRefs, `q8-01:audit_status:${auditStatus}`]),
    };
    updated.confidenceScore = computeConfidenceScore(updated);
    return updated;
  }

  buildReport(
    project: AffiliateBusinessProject,
    validation: AffiliateFactoryCoreValidationReport | null,
  ): AffiliateFactoryReport {
    const confidenceScore = computeConfidenceScore(project);
    return {
      reportId: `afc-rpt-${Date.now()}`,
      timestamp: new Date().toISOString(),
      affiliateBusinessId: project.affiliateBusinessId,
      businessName: project.businessName,
      lifecycleStatus: project.lifecycleStatus,
      workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
      readinessStatus: project.readinessStatus,
      outstandingTasks: [...project.outstandingTasks],
      risks: [...project.risks],
      executiveSummary: project.executiveSummary,
      auditStatus: project.auditStatus,
      confidenceScore,
      metadataVersion: AFC_METADATA_VERSION,
      reportVersion: AFFILIATE_FACTORY_REPORT_VERSION,
      workerId: project.workerId,
      factoryId: AFFILIATE_FACTORY_CORE_ID,
      businessCategory: project.businessCategory,
      metadata: { ...project.metadata },
      dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
      progressSummary: { ...project.progressSummary },
      validation: validation ? { ...validation, errors: [...validation.errors], warnings: [...validation.warnings] } : null,
      runTimestamp: new Date().toISOString(),
      consumableByQ802: true,
      submittedToExecutiveReporting: project.submittedToExecutiveReporting,
      executiveReportId: project.executiveReportId,
      traceabilityRefs: [...project.traceabilityRefs],
      structuralSignalOnly: true,
      maskSensitiveValues: true,
      preserveCompleteTraceability: true,
      preserveFactoryAuditHistory: true,
      neverDiscoverAffiliateProgrammes: true,
      neverGenerateAffiliateContent: true,
      neverLaunchBusinessesAutomatically: true,
      neverFabricateWorkerStatus: true,
      neverOverrideApprovedArchitecture: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      neverBypassGrandKingApproval: true,
      neverImplementQ802OrLater: true,
    };
  }

  buildQ802ConsumableContract(config: AffiliateFactoryCoreConfiguration): Q802ConsumableContract {
    return {
      contractId: `afc-q802-contract-${AFC_METADATA_VERSION}`,
      contractVersion: AFC_METADATA_VERSION,
      producedBy: "affiliate-factory-core",
      missionId: "Q8-01",
      consumerMissionId: "Q8-02",
      exposedFields: [
        "affiliateBusinessId",
        "businessName",
        "businessCategory",
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
      workerRoleCatalog: [...config.workerRoles, ...AFFILIATE_WORKER_ROLES],
      lifecycleStatuses: [...config.lifecycleStatuses],
      notes: [
        "Affiliate Factory Core (Q8-01) is orchestration-only.",
        "It does not discover affiliate programmes, generate affiliate content, or launch businesses automatically.",
        "Q8-02 and later workers must consume this contract rather than reimplement Q8-01 orchestration.",
      ],
      neverImplementQ802OrLater: true,
      structuralSignalOnly: true,
    };
  }
}

let projectSequence = 0;

export function resetProjectSequenceForTesting() {
  projectSequence = 0;
}

/** Confidence 0–100 from observed fields only — never fabricates worker health. */
export function computeConfidenceScore(project: AffiliateBusinessProject): number {
  const checks: boolean[] = [
    !!project.factoryProjectId,
    !!project.affiliateBusinessId,
    !!project.businessName?.trim(),
    !!project.businessCategory && project.businessCategory !== "unknown",
    !!project.lifecycleStatus,
    project.lifecycleStatus !== "project_registered",
    project.workerStatusMatrix.length > 0,
    project.readinessStatus === "ready",
    project.outstandingTasks.length === 0,
    project.risks.length === 0,
    project.traceabilityRefs.some((r) => r.includes("q8-01")),
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
export function computeReadinessStatus(project: AffiliateBusinessProject): ReadinessStatus {
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
export function computeProgressSummary(project: AffiliateBusinessProject): ProgressSummary {
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

function cloneProject(project: AffiliateBusinessProject): AffiliateBusinessProject {
  return {
    ...project,
    workerStatusMatrix: project.workerStatusMatrix.map((e) => ({ ...e })),
    dependencyGraph: project.dependencyGraph.map((e) => ({ ...e })),
    outstandingTasks: [...project.outstandingTasks],
    risks: [...project.risks],
    metadata: { ...project.metadata },
    traceabilityRefs: [...project.traceabilityRefs],
    progressSummary: { ...project.progressSummary },
  };
}

function cloneReport(report: AffiliateFactoryReport): AffiliateFactoryReport {
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
