import type { TaskNegotiationProtocolConfiguration } from "./configuration.js";
import { TaskNegotiationProtocolCore } from "./task-negotiation-protocol-core.js";
import type {
  EngineStatus,
  TaskNegotiationProtocolInput,
  TaskNegotiationProtocolRunReport,
} from "./types.js";

export class TaskNegotiationProtocolController {
  private status: EngineStatus = "idle";
  private latestReport: TaskNegotiationProtocolRunReport | null = null;

  constructor(
    private readonly manager: TaskNegotiationProtocolCore,
    private readonly config: TaskNegotiationProtocolConfiguration,
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
      negotiationOutcomes: [...this.config.negotiationOutcomes],
      seedNegotiations: this.config.seedNegotiations.map((r) => ({
        ...r,
        candidateWorkers: [...r.candidateWorkers],
        capabilityAssessment: r.capabilityAssessment.map((c) => ({
          ...c,
          declaredCapabilities: [...c.declaredCapabilities],
        })),
        ownershipDecision: { ...r.ownershipDecision },
        supportingWorkers: [...r.supportingWorkers],
        dependencyGraph: r.dependencyGraph.map((d) => ({ ...d })),
        handoffs: r.handoffs.map((h) => ({ ...h })),
        conflicts: [...r.conflicts],
        requiredCapabilities: [...r.requiredCapabilities],
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

  receiveTask(input: TaskNegotiationProtocolInput = {}) {
    this.status = "negotiating";
    return this.finish(this.manager.receiveTask(input, this.config));
  }

  identifyCandidates(input: TaskNegotiationProtocolInput = {}) {
    this.status = "negotiating";
    return this.finish(this.manager.identifyCandidates(input, this.config));
  }

  declareCapability(input: TaskNegotiationProtocolInput = {}) {
    this.status = "negotiating";
    return this.finish(this.manager.declareCapability(input, this.config));
  }

  declineWork(input: TaskNegotiationProtocolInput = {}) {
    this.status = "negotiating";
    return this.finish(this.manager.declineWork(input, this.config));
  }

  resolveOwnership(input: TaskNegotiationProtocolInput = {}) {
    this.status = "resolving";
    return this.finish(this.manager.resolveOwnership(input, this.config));
  }

  negotiate(input: TaskNegotiationProtocolInput = {}) {
    this.status = "negotiating";
    return this.finish(this.manager.negotiateTask(input, this.config));
  }

  detectConflicts(input: TaskNegotiationProtocolInput = {}) {
    this.status = "resolving";
    return this.finish(this.manager.detectConflicts(input, this.config));
  }

  escalate(input: TaskNegotiationProtocolInput = {}) {
    this.status = "escalating";
    return this.finish(this.manager.escalate(input, this.config));
  }

  list() {
    this.status = "active";
    return this.finish(this.manager.list(this.config));
  }

  validate(input: TaskNegotiationProtocolInput = {}) {
    this.status = "active";
    return this.finish(this.manager.validate(input, this.config));
  }

  diagnostics() {
    return this.finish(this.manager.diagnostics(this.config));
  }

  private finish(report: TaskNegotiationProtocolRunReport) {
    this.latestReport = report;
    this.status = report.validation.decision === "fail" ? "failed" : "active";
    return report;
  }
}
