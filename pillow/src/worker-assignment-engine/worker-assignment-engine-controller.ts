import type { WorkerAssignmentEngineConfiguration } from "./configuration.js";
import { WorkerAssignmentEngineCore } from "./worker-assignment-engine-core.js";
import type {
  EngineStatus,
  WorkerAssignmentInput,
  WorkerAssignmentRunReport,
} from "./types.js";

export class WorkerAssignmentEngineController {
  private status: EngineStatus = "idle";
  private latestReport: WorkerAssignmentRunReport | null = null;

  constructor(
    private readonly manager: WorkerAssignmentEngineCore,
    private readonly config: WorkerAssignmentEngineConfiguration,
  ) {}

  initialize() {
    this.manager.ensureSeeded(this.config);
    this.status = "active";
  }

  getStatus() {
    return this.status;
  }

  getManager() {
    return this.manager;
  }

  getConfiguration() {
    return {
      ...this.config,
      assignmentFactors: [...this.config.assignmentFactors],
      assignmentRules: [...this.config.assignmentRules],
      seedWorkers: this.config.seedWorkers.map((w) => ({
        ...w,
        skills: [...w.skills],
        approvedTools: [...w.approvedTools],
        dependencyIds: [...w.dependencyIds],
        responsibilityDomains: [...w.responsibilityDomains],
        neverExecuteWorkerTasks: true as const,
      })),
      seedRecords: this.config.seedRecords.map((r) => ({
        ...r,
        missionRequirements: {
          ...r.missionRequirements,
          requiredSkills: [...r.missionRequirements.requiredSkills],
          requiredTools: [...r.missionRequirements.requiredTools],
          dependencyIds: [...r.missionRequirements.dependencyIds],
        },
        candidateWorkers: [...r.candidateWorkers],
        evaluationCriteria: [...r.evaluationCriteria],
        supportingWorkers: [...r.supportingWorkers],
        riskAssessment: {
          ...r.riskAssessment,
          notes: [...r.riskAssessment.notes],
        },
        evaluations: r.evaluations.map((e) => ({
          ...e,
          factorScores: { ...e.factorScores },
          rejectionReasons: [...e.rejectionReasons],
          evaluationNotes: [...e.evaluationNotes],
        })),
        neverExecuteWorkerTasks: true as const,
        neverReplaceWorkforceOrchestrator: true as const,
        neverReplaceTaskNegotiationProtocol: true as const,
        neverOverridePillow: true as const,
        neverOverrideGrandKing: true as const,
        preserveAuditability: true as const,
        preserveTraceability: true as const,
        structuralSignalOnly: true as const,
        maskSensitiveValues: true as const,
      })),
    };
  }

  getLatestReport() {
    return this.latestReport;
  }

  connect(input: Record<string, unknown> = {}) {
    this.status = "connecting";
    return this.finish(this.manager.connect(input, this.config));
  }

  submitMission(input: WorkerAssignmentInput = {}) {
    this.status = "active";
    return this.finish(this.manager.submitMission(input, this.config));
  }

  discoverEligible(input: WorkerAssignmentInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.discoverEligible(input, this.config));
  }

  evaluateCandidates(input: WorkerAssignmentInput = {}) {
    this.status = "evaluating";
    return this.finish(this.manager.evaluateCandidates(input, this.config));
  }

  recommendPrimary(input: WorkerAssignmentInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendPrimary(input, this.config));
  }

  recommendSupporting(input: WorkerAssignmentInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendSupporting(input, this.config));
  }

  recommendAssignment(input: WorkerAssignmentInput = {}) {
    this.status = "recommending";
    return this.finish(this.manager.recommendAssignment(input, this.config));
  }

  produce(input: WorkerAssignmentInput = {}) {
    this.status = "active";
    return this.finish(this.manager.produce(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: WorkerAssignmentInput = {}) {
    this.status = "validating";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: WorkerAssignmentRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
