import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import {
  buildApprovalRuntimeConfiguration,
  type ApprovalRuntimeConfiguration,
} from "./configuration.js";
import type { ApprovalRuntimeDependencies } from "./integrations.js";
import { ApprovalRuntimeController } from "./approval-runtime-controller.js";
import { ApprovalRuntimeManager } from "./approval-runtime-manager.js";
import { resetApvrtLogsForTesting } from "./apvrt-logging.js";
import { APPROVAL_RUNTIME_SYSTEM_PATH } from "./paths.js";
import { resetApvrtSequenceForTesting } from "./approval-store.js";
import type {
  ApprovalRuntimeCockpitSnapshot,
  ApprovalRuntimeState,
  ApvrtInput,
} from "./types.js";

export interface ApprovalRuntimeOptions {
  configuration?: Partial<ApprovalRuntimeConfiguration>;
  dependencies?: ApprovalRuntimeDependencies;
}

/**
 * Authoritative Q10-09 Approval Runtime — enterprise approval routing and governance service.
 *
 * APVRT registers policies, determines requirements, routes approvals deterministically,
 * enforces Pillow and Grand King stages, supports multi-stage/delegation/escalation,
 * records decisions append-only, resumes only after full approval, and produces Approval
 * Runtime Reports consumable by Q10-10 Monitoring Runtime — without fabricating decisions,
 * auto-approving restricted actions, exposing secrets, or bypassing Pillow/Grand King.
 */
export class ApprovalRuntime {
  private initializedAt: string | null = null;
  private readonly controller: ApprovalRuntimeController;
  private readonly manager: ApprovalRuntimeManager;

  constructor(
    private readonly bootstrap: EmpireBootstrapContext,
    options: ApprovalRuntimeOptions = {},
  ) {
    this.manager = new ApprovalRuntimeManager();
    if (options.dependencies) this.manager.bindIntegrations(options.dependencies);
    this.controller = new ApprovalRuntimeController(
      this.manager,
      buildApprovalRuntimeConfiguration(bootstrap.repositoryRoot, options.configuration),
    );
  }

  async initialize() {
    const doc = await new RepositoryReader(this.bootstrap.repositoryRoot).readText(
      APPROVAL_RUNTIME_SYSTEM_PATH,
    );
    if (!doc?.includes("Approval Runtime")) {
      throw new Error(
        `${APPROVAL_RUNTIME_SYSTEM_PATH} missing — Q10-09 system doc required.`,
      );
    }
    this.controller.initialize();
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  bindIntegrations(deps: ApprovalRuntimeDependencies = {}) {
    this.controller.bindIntegrations(deps);
  }

  getState(): ApprovalRuntimeState {
    if (!this.initializedAt) {
      throw new Error("Approval Runtime not initialized. Call initialize() first.");
    }
    const configuration = this.controller.getConfiguration();
    const engineRecord = this.controller.getManager().getEngineRecord();
    const latestReport = this.controller.getLatestReport();
    return {
      engineVersion: "PILLOW-APVRT-001",
      missionId: "Q10-09",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration,
      latestReport,
      engineRecord,
      health: {
        status: engineRecord?.healthStatus ?? "standby",
        healthScore: engineRecord?.healthStatus === "healthy" ? 85 : engineRecord ? 60 : 50,
        engineEnabled: configuration.enabled,
        lastOperationAt: latestReport?.runTimestamp ?? null,
        lastValidationDecision: latestReport?.validation.decision ?? null,
        totalPolicies: engineRecord?.totalPolicies ?? 0,
        totalRequests: engineRecord?.totalRequests ?? 0,
        lastReportId: engineRecord?.lastReportId ?? null,
        notes: [
          "Enterprise approval runtime only: explicit decisions, no fabricated approvals, no auto-approve restricted/grand_king, no Pillow/Grand King bypass, does not implement Q10-10+.",
        ],
      },
    };
  }

  connect(input: Record<string, unknown> = {}) {
    return this.controller.connect(input);
  }

  registerPolicy(input: ApvrtInput = {}) {
    return this.controller.registerPolicy(input);
  }

  determineRequirements(input: ApvrtInput = {}) {
    return this.controller.determineRequirements(input);
  }

  submitApprovalRequest(input: ApvrtInput = {}) {
    return this.controller.submitApprovalRequest(input);
  }

  routeApproval(input: ApvrtInput = {}) {
    return this.controller.routeApproval(input);
  }

  decide(input: ApvrtInput = {}) {
    return this.controller.decide(input);
  }

  resumeExecution(input: ApvrtInput = {}) {
    return this.controller.resumeExecution(input);
  }

  produceReport(input: ApvrtInput = {}) {
    return this.controller.produceReport(input);
  }

  submitReport(input: ApvrtInput = {}) {
    return this.controller.submitReport(input);
  }

  list(input: ApvrtInput = {}) {
    return this.controller.list(input);
  }

  validate(input: ApvrtInput = {}) {
    return this.controller.validate(input);
  }

  runDiagnostics() {
    return this.controller.diagnostics();
  }

  getReports() {
    return this.controller.getManager().getReports();
  }

  getHistory() {
    return this.controller.getHistory();
  }

  getAuditTrail() {
    return this.controller.getManager().getAuditTrail();
  }

  getIntegrations() {
    return this.controller.getManager().getIntegrations();
  }

  getQ1010ConsumableContract() {
    return this.controller.getQ1010ConsumableContract();
  }

  getCockpitSnapshot(): ApprovalRuntimeCockpitSnapshot {
    return this.controller.getCockpitSnapshot();
  }
}

export function createApprovalRuntime(
  bootstrap: EmpireBootstrapContext,
  options: ApprovalRuntimeOptions = {},
) {
  return new ApprovalRuntime(bootstrap, options);
}

export function resetApprovalRuntimeForTesting() {
  resetApvrtLogsForTesting();
  resetApvrtSequenceForTesting();
}
