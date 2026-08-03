import type { WorkerAssignmentEngineConfiguration } from "./configuration.js";
import {
  ASSIGNABLE_LIFECYCLE_STATES,
  ASSIGNMENT_VERSION,
  AUTHORITY_RANK,
  WAE_METADATA_VERSION,
} from "./paths.js";
import type {
  AssignmentDecision,
  AssignmentRecord,
  AssignmentWorker,
  CandidateEvaluation,
  MissionRequirements,
  WorkerAssignmentCatalog,
  WorkerAssignmentInput,
} from "./types.js";

export type AssignmentEvaluationResult = {
  catalog: WorkerAssignmentCatalog;
  evaluations: CandidateEvaluation[];
  eligible: AssignmentWorker[];
  primary: AssignmentWorker | null;
  supporting: AssignmentWorker[];
  assignmentDecision: AssignmentDecision;
  rulesApplied: string[];
  rulesSatisfied: string[];
  rulesFailed: string[];
};

/** Pure Worker Assignment helpers for Q1-09. */
export class AssignmentBuilder {
  buildCatalog(
    config: WorkerAssignmentEngineConfiguration,
    workers: AssignmentWorker[],
    records: AssignmentRecord[],
  ): WorkerAssignmentCatalog {
    return {
      assignmentVersion: ASSIGNMENT_VERSION,
      factors: [...config.assignmentFactors],
      workers: workers.map(cloneWorker),
      records: records.map(cloneRecord),
      metadataVersion: WAE_METADATA_VERSION,
      executiveAuthority: "pillow",
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceTaskNegotiationProtocol: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
    };
  }

  normalizeRequirements(input: WorkerAssignmentInput): MissionRequirements {
    return {
      requiredSkills: unique(input.requiredSkills ?? []),
      requiredTools: unique(input.requiredTools ?? []),
      requiredAuthority: input.requiredAuthority?.trim() || "autonomous_worker_decision",
      requiredCertification: "certified",
      maxRisk: clamp(input.maxRisk ?? 0.6, 0, 1),
      maxCost: clamp(input.maxCost ?? 0.8, 0, 1),
      maxWorkload: clamp(input.maxWorkload ?? 0.85, 0, 1),
      dependencyIds: unique(input.dependencyIds ?? []),
      supportingWorkerCount: Math.max(0, Math.floor(input.supportingWorkerCount ?? 1)),
    };
  }

  evaluateWorker(
    worker: AssignmentWorker,
    requirements: MissionRequirements,
    factors: string[],
    responsibilityDomain?: string | null,
  ): CandidateEvaluation {
    const rejectionReasons: string[] = [];
    const evaluationNotes: string[] = [];
    const factorScores: Record<string, number> = {};

    if (worker.certificationStatus !== "certified") {
      rejectionReasons.push("Worker is not certified");
    }
    if (!worker.available) {
      rejectionReasons.push("Worker is unavailable");
    }
    if (!(ASSIGNABLE_LIFECYCLE_STATES as readonly string[]).includes(worker.lifecycleStatus)) {
      rejectionReasons.push(`Lifecycle status '${worker.lifecycleStatus}' is not assignable`);
    }
    if (!authoritySatisfied(worker.authorityLevel, requirements.requiredAuthority)) {
      rejectionReasons.push("Assignment would exceed worker authority / violate Authority Matrix");
    }
    if (
      responsibilityDomain &&
      worker.responsibilityDomains.length > 0 &&
      !worker.responsibilityDomains.includes(responsibilityDomain)
    ) {
      rejectionReasons.push("Worker does not respect Responsibility Matrix domain");
    }

    for (const factor of factors) {
      factorScores[factor] = this.scoreFactor(factor, worker, requirements, evaluationNotes);
    }

    if (worker.riskScore > requirements.maxRisk) {
      rejectionReasons.push("Execution risk exceeds mission maxRisk");
    }
    if (worker.costScore > requirements.maxCost) {
      rejectionReasons.push("Execution cost exceeds mission maxCost");
    }
    if (worker.workload > requirements.maxWorkload) {
      rejectionReasons.push("Current workload exceeds mission maxWorkload");
    }
    if (requirements.requiredSkills.length) {
      const missing = requirements.requiredSkills.filter((s) => !worker.skills.includes(s));
      if (missing.length === requirements.requiredSkills.length) {
        rejectionReasons.push("Worker lacks all required skills");
      } else if (missing.length) {
        evaluationNotes.push(`Partial skill coverage; missing=${missing.join(",")}`);
      }
    }
    if (requirements.requiredTools.length) {
      const missingTools = requirements.requiredTools.filter(
        (t) => !worker.approvedTools.includes(t),
      );
      if (missingTools.length) {
        rejectionReasons.push(`Missing required tools: ${missingTools.join(",")}`);
      }
    }
    if (requirements.dependencyIds.length) {
      const unmet = requirements.dependencyIds.filter((d) => !worker.dependencyIds.includes(d));
      if (unmet.length === requirements.dependencyIds.length && requirements.dependencyIds.length) {
        evaluationNotes.push("Worker has no overlapping declared dependencies");
      }
    }

    const scores = Object.values(factorScores);
    const totalScore =
      scores.length === 0 ? 0 : scores.reduce((sum, n) => sum + n, 0) / scores.length;

    return {
      workerId: worker.workerId,
      workerName: worker.workerName,
      eligible: rejectionReasons.length === 0,
      factorScores,
      totalScore: Number(totalScore.toFixed(4)),
      rejectionReasons,
      evaluationNotes,
    };
  }

  recommend(
    workers: AssignmentWorker[],
    evaluations: CandidateEvaluation[],
    requirements: MissionRequirements,
  ): { primary: AssignmentWorker | null; supporting: AssignmentWorker[] } {
    const eligibleIds = new Set(
      evaluations.filter((e) => e.eligible).map((e) => e.workerId),
    );
    const ranked = evaluations
      .filter((e) => e.eligible)
      .slice()
      .sort((a, b) => b.totalScore - a.totalScore || a.workerId.localeCompare(b.workerId));
    const byId = new Map(workers.map((w) => [w.workerId, w]));
    const primary = ranked[0] ? byId.get(ranked[0].workerId) ?? null : null;
    const supporting: AssignmentWorker[] = [];
    for (const evaluation of ranked.slice(1)) {
      if (supporting.length >= requirements.supportingWorkerCount) break;
      const worker = byId.get(evaluation.workerId);
      if (worker && eligibleIds.has(worker.workerId)) supporting.push(worker);
    }
    return { primary, supporting };
  }

  buildRecord(params: {
    input: WorkerAssignmentInput;
    requirements: MissionRequirements;
    workers: AssignmentWorker[];
    evaluations: CandidateEvaluation[];
    primary: AssignmentWorker | null;
    supporting: AssignmentWorker[];
  }): AssignmentRecord {
    assignmentSequence += 1;
    const overallRisk = params.primary?.riskScore ?? 1;
    const estimatedCost = params.primary
      ? Number(
          (
            params.primary.costScore +
            params.supporting.reduce((s, w) => s + w.costScore * 0.35, 0)
          ).toFixed(4),
        )
      : 0;
    const confidenceScore = params.primary
      ? Number(
          Math.min(
            1,
            (params.evaluations.find((e) => e.workerId === params.primary!.workerId)?.totalScore ??
              0) *
              0.7 +
              params.primary.historicalPerformance * 0.3,
          ).toFixed(4),
        )
      : 0;
    const reason = params.primary
      ? [
          `Primary=${params.primary.workerId}`,
          `score=${params.evaluations.find((e) => e.workerId === params.primary!.workerId)?.totalScore ?? 0}`,
          `skills=${params.primary.skills.join("|")}`,
          `lifecycle=${params.primary.lifecycleStatus}`,
          `cert=${params.primary.certificationStatus}`,
          params.supporting.length
            ? `supporting=${params.supporting.map((w) => w.workerId).join("|")}`
            : "supporting=none",
        ].join("; ")
      : "No eligible primary worker found under mandatory assignment rules";

    return {
      assignmentId:
        params.input.assignmentId?.trim() ||
        `wae-${Date.now()}-${assignmentSequence}`,
      timestamp: new Date().toISOString(),
      missionId: params.input.missionId?.trim() || `mission-${assignmentSequence}`,
      businessId: params.input.businessId?.trim() || "empireai",
      missionRequirements: {
        ...params.requirements,
        requiredSkills: [...params.requirements.requiredSkills],
        requiredTools: [...params.requirements.requiredTools],
        dependencyIds: [...params.requirements.dependencyIds],
      },
      candidateWorkers: params.workers.map((w) => w.workerId),
      evaluationCriteria: Object.keys(params.evaluations[0]?.factorScores ?? {}),
      selectedPrimaryWorker: params.primary?.workerId ?? null,
      supportingWorkers: params.supporting.map((w) => w.workerId),
      assignmentReason: reason,
      riskAssessment: {
        overallRisk,
        riskBand: overallRisk <= 0.3 ? "low" : overallRisk <= 0.6 ? "medium" : "high",
        notes: params.primary
          ? [`Primary risk=${params.primary.riskScore}`]
          : ["No primary selected"],
      },
      estimatedCost,
      confidenceScore,
      metadataVersion: WAE_METADATA_VERSION,
      evaluations: params.evaluations.map(cloneEvaluation),
      neverExecuteWorkerTasks: true,
      neverReplaceWorkforceOrchestrator: true,
      neverReplaceTaskNegotiationProtocol: true,
      neverOverridePillow: true,
      neverOverrideGrandKing: true,
      preserveAuditability: true,
      preserveTraceability: true,
      structuralSignalOnly: true,
      maskSensitiveValues: true,
    };
  }

  evaluate(
    input: WorkerAssignmentInput,
    config: WorkerAssignmentEngineConfiguration,
    workers: AssignmentWorker[],
    records: AssignmentRecord[],
    planErrors: string[] = [],
  ): AssignmentEvaluationResult {
    const requirements = this.normalizeRequirements(input);
    const evaluations = workers.map((w) =>
      this.evaluateWorker(
        w,
        requirements,
        config.assignmentFactors,
        input.responsibilityDomain,
      ),
    );
    const eligible = workers.filter((w) =>
      evaluations.some((e) => e.workerId === w.workerId && e.eligible),
    );
    const { primary, supporting } = this.recommend(workers, evaluations, requirements);
    const catalog = this.buildCatalog(config, workers, records);
    const rules = unique(input.rules ?? config.assignmentRules);
    const violated = new Set(unique(input.violatedRules ?? []));
    const satisfied: string[] = [];
    const failed: string[] = [];
    for (const rule of rules) {
      const ok = this.ruleSatisfied(rule, input, catalog, evaluations, primary, planErrors, violated);
      if (ok) satisfied.push(rule);
      else failed.push(rule);
    }

    let assignmentDecision: AssignmentDecision = "valid";
    if (failed.length === 0 && planErrors.length === 0 && primary) assignmentDecision = "valid";
    else if (!primary || failed.length + planErrors.length <= Math.ceil(rules.length / 3)) {
      assignmentDecision = "partially_valid";
    } else assignmentDecision = "invalid";

    return {
      catalog,
      evaluations,
      eligible,
      primary,
      supporting,
      assignmentDecision,
      rulesApplied: rules,
      rulesSatisfied: satisfied,
      rulesFailed: failed,
    };
  }

  private scoreFactor(
    factor: string,
    worker: AssignmentWorker,
    requirements: MissionRequirements,
    notes: string[],
  ): number {
    switch (factor) {
      case "skills": {
        if (!requirements.requiredSkills.length) return 0.75;
        const hits = requirements.requiredSkills.filter((s) => worker.skills.includes(s)).length;
        return hits / requirements.requiredSkills.length;
      }
      case "certification":
        return worker.certificationStatus === "certified" ? 1 : 0;
      case "availability":
        return worker.available &&
          (ASSIGNABLE_LIFECYCLE_STATES as readonly string[]).includes(worker.lifecycleStatus)
          ? worker.lifecycleStatus === "idle"
            ? 1
            : worker.lifecycleStatus === "active"
              ? 0.9
              : 0.55
          : 0;
      case "current_workload":
        return Number(Math.max(0, 1 - worker.workload).toFixed(4));
      case "authority":
        return authoritySatisfied(worker.authorityLevel, requirements.requiredAuthority)
          ? 1 - authorityRank(worker.authorityLevel) * 0.05
          : 0;
      case "required_tools": {
        if (!requirements.requiredTools.length) return 0.8;
        const hits = requirements.requiredTools.filter((t) =>
          worker.approvedTools.includes(t),
        ).length;
        return hits / requirements.requiredTools.length;
      }
      case "dependencies": {
        if (!requirements.dependencyIds.length) return 0.8;
        const hits = requirements.dependencyIds.filter((d) =>
          worker.dependencyIds.includes(d),
        ).length;
        if (!hits) {
          notes.push("No dependency overlap");
          return 0.4;
        }
        return hits / requirements.dependencyIds.length;
      }
      case "risk":
        return Number(Math.max(0, 1 - worker.riskScore).toFixed(4));
      case "cost":
        return Number(Math.max(0, 1 - worker.costScore).toFixed(4));
      case "historical_performance":
        return clamp(worker.historicalPerformance, 0, 1);
      default:
        return 0.5;
    }
  }

  private ruleSatisfied(
    rule: string,
    input: WorkerAssignmentInput,
    catalog: WorkerAssignmentCatalog,
    evaluations: CandidateEvaluation[],
    primary: AssignmentWorker | null,
    planErrors: string[],
    violated: Set<string>,
  ): boolean {
    if (violated.has(rule)) return false;
    if (planErrors.length) return false;
    switch (rule) {
      case "never_assign_uncertified_workers":
        return !primary || primary.certificationStatus === "certified";
      case "never_assign_unavailable_workers":
        return !primary || (primary.available &&
          (ASSIGNABLE_LIFECYCLE_STATES as readonly string[]).includes(primary.lifecycleStatus));
      case "never_exceed_worker_authority":
      case "never_violate_authority_matrix":
        return (
          !primary ||
          authoritySatisfied(
            primary.authorityLevel,
            input.requiredAuthority?.trim() || "autonomous_worker_decision",
          )
        );
      case "respect_responsibility_matrix":
        return (
          !input.responsibilityDomain ||
          !primary ||
          primary.responsibilityDomains.includes(input.responsibilityDomain)
        );
      case "respect_worker_lifecycle_status":
        return evaluations
          .filter((e) => e.eligible)
          .every((e) => {
            const worker = catalog.workers.find((w) => w.workerId === e.workerId);
            return (
              !!worker &&
              (ASSIGNABLE_LIFECYCLE_STATES as readonly string[]).includes(worker.lifecycleStatus)
            );
          });
      case "respect_worker_certification_status":
        return evaluations
          .filter((e) => e.eligible)
          .every((e) => {
            const worker = catalog.workers.find((w) => w.workerId === e.workerId);
            return worker?.certificationStatus === "certified";
          });
      default:
        return input.overridePillow !== true;
    }
  }
}

let assignmentSequence = 0;

export function resetAssignmentSequenceForTesting() {
  assignmentSequence = 0;
}

function authorityRank(level: string): number {
  const idx = (AUTHORITY_RANK as readonly string[]).indexOf(level);
  return idx >= 0 ? idx : AUTHORITY_RANK.length;
}

function authoritySatisfied(workerLevel: string, required: string): boolean {
  return authorityRank(workerLevel) >= authorityRank(required);
}

function clamp(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function unique(values: string[]) {
  return Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
}

function cloneWorker(worker: AssignmentWorker): AssignmentWorker {
  return {
    ...worker,
    skills: [...worker.skills],
    approvedTools: [...worker.approvedTools],
    dependencyIds: [...worker.dependencyIds],
    responsibilityDomains: [...worker.responsibilityDomains],
    neverExecuteWorkerTasks: true,
  };
}

function cloneEvaluation(evaluation: CandidateEvaluation): CandidateEvaluation {
  return {
    ...evaluation,
    factorScores: { ...evaluation.factorScores },
    rejectionReasons: [...evaluation.rejectionReasons],
    evaluationNotes: [...evaluation.evaluationNotes],
  };
}

function cloneRecord(record: AssignmentRecord): AssignmentRecord {
  return {
    ...record,
    missionRequirements: {
      ...record.missionRequirements,
      requiredSkills: [...record.missionRequirements.requiredSkills],
      requiredTools: [...record.missionRequirements.requiredTools],
      dependencyIds: [...record.missionRequirements.dependencyIds],
    },
    candidateWorkers: [...record.candidateWorkers],
    evaluationCriteria: [...record.evaluationCriteria],
    supportingWorkers: [...record.supportingWorkers],
    riskAssessment: {
      ...record.riskAssessment,
      notes: [...record.riskAssessment.notes],
    },
    evaluations: record.evaluations.map(cloneEvaluation),
  };
}
