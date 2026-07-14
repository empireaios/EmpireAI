import type { EmpireBootstrapContext } from "../bootstrap/types.js";
import { RepositoryReader } from "../bootstrap/repository-reader.js";
import type { VisualFoundationCertificationEngine } from "../visual-foundation-certification-engine/engine.js";
import type { UxIntelligenceCertificationEngine } from "../ux-intelligence-certification-engine/engine.js";
import type { AutonomousBuilderCertificationEngine } from "../autonomous-builder-certification-engine/engine.js";
import type { ExecutiveCollaborationCertificationEngine } from "../executive-collaboration-certification-engine/engine.js";
import type { ContinuousScreenObservationEngine } from "../continuous-screen-observation-engine/engine.js";
import type { AutonomousUxAuditEngine } from "../autonomous-ux-audit-engine/engine.js";
import type { UxOpportunityDiscoveryEngine } from "../ux-opportunity-discovery-engine/engine.js";
import type { ProductivityIntelligenceEngine } from "../productivity-intelligence-engine/engine.js";
import type { WorkflowEvolutionEngine } from "../workflow-evolution-engine/engine.js";
import type { AdaptiveInterfaceEngine } from "../adaptive-interface-engine/engine.js";
import type { ContinuousUxEvolutionEngine } from "../continuous-ux-evolution-engine/engine.js";
import type { ExecutiveWorkspaceIntelligenceEngine } from "../executive-workspace-intelligence-engine/engine.js";
import type { SelfImprovingUxEngine } from "../self-improving-ux-engine/engine.js";
import type { ApprovalWorkflowEngine } from "../approval-workflow/engine.js";
import {
  buildVisualIntelligenceCertificationConfiguration,
  type VisualIntelligenceCertificationConfiguration,
} from "./configuration.js";
import {
  appendCertificationLog,
  getCertificationLogs,
  resetCertificationLogsForTesting,
} from "./certification-logging.js";
import { VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH } from "./paths.js";
import type {
  CertificationCockpitSnapshot,
  VisualIntelligenceCertificationInput,
  VisualIntelligenceCertificationReport,
  VisualIntelligenceCertificationState,
} from "./types.js";
import { CertificationController } from "./certification-controller.js";
import { RecoveryManager } from "./recovery-manager.js";

export interface VisualIntelligenceCertificationEngineOptions {
  configuration?: Partial<VisualIntelligenceCertificationConfiguration>;
}

/**
 * Visual Intelligence Certification Engine (PILLOW-VIC-001 / T5-10).
 * Final certification of the complete T-Series Visual Intelligence architecture.
 * Safety: certify only — never approves or deploys UX changes automatically.
 */
export class VisualIntelligenceCertificationEngine {
  private initializedAt: string | null = null;
  private readonly controller: CertificationController;
  private readonly reader: RepositoryReader;

  constructor(
    private bootstrap: EmpireBootstrapContext,
    visualFoundationCertification: VisualFoundationCertificationEngine,
    uxIntelligenceCertification: UxIntelligenceCertificationEngine,
    autonomousBuilderCertification: AutonomousBuilderCertificationEngine,
    executiveCollaborationCertification: ExecutiveCollaborationCertificationEngine,
    continuousScreenObservation: ContinuousScreenObservationEngine,
    autonomousUxAudit: AutonomousUxAuditEngine,
    uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
    productivityIntelligence: ProductivityIntelligenceEngine,
    workflowEvolution: WorkflowEvolutionEngine,
    adaptiveInterface: AdaptiveInterfaceEngine,
    continuousUxEvolution: ContinuousUxEvolutionEngine,
    executiveWorkspaceIntelligence: ExecutiveWorkspaceIntelligenceEngine,
    selfImprovingUx: SelfImprovingUxEngine,
    approvalWorkflow: ApprovalWorkflowEngine,
    options: VisualIntelligenceCertificationEngineOptions = {},
  ) {
    const config = buildVisualIntelligenceCertificationConfiguration(
      bootstrap.repositoryRoot,
      options.configuration,
    );
    this.controller = new CertificationController(
      bootstrap.repositoryRoot,
      {
        visualFoundationCertification,
        uxIntelligenceCertification,
        autonomousBuilderCertification,
        executiveCollaborationCertification,
        continuousScreenObservation,
        autonomousUxAudit,
        uxOpportunityDiscovery,
        productivityIntelligence,
        workflowEvolution,
        adaptiveInterface,
        continuousUxEvolution,
        executiveWorkspaceIntelligence,
        selfImprovingUx,
        approvalWorkflow,
      },
      config,
    );
    this.reader = new RepositoryReader(bootstrap.repositoryRoot);
  }

  async initialize(): Promise<VisualIntelligenceCertificationState> {
    const doc = await this.reader.readText(VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH);
    if (!doc?.includes("Visual Intelligence Certification")) {
      throw new Error(
        `${VISUAL_INTELLIGENCE_CERTIFICATION_SYSTEM_PATH} missing — Visual Intelligence Certification requires T5-10 system doc.`,
      );
    }
    appendCertificationLog({
      event: "visual_intelligence_certification_ready",
      level: "info",
      details: "T5-10 Visual Intelligence Certification Engine initialized",
    });
    this.initializedAt = new Date().toISOString();
    return this.getState();
  }

  getState(): VisualIntelligenceCertificationState {
    if (!this.initializedAt) {
      throw new Error(
        "Visual Intelligence Certification Engine not initialized. Call initialize() first.",
      );
    }
    const config = this.controller.getConfiguration();
    const performance = this.controller.getPerformance();
    const health = this.controller.getHealthMonitor().buildReport({
      config,
      status: this.controller.getStatus(),
      consecutiveFailures: this.controller.getRecoveryManager().getConsecutiveFailures(),
      recoveryAttempts: this.controller.getRecoveryManager().getRecoveryAttempts(),
    });

    return {
      engineVersion: "PILLOW-VIC-001",
      missionId: "T5-10",
      status: this.controller.getStatus(),
      initializedAt: this.initializedAt,
      configuration: config,
      latestReport: this.controller.getLatestReport(),
      health,
      performance,
    };
  }

  async certifyVisualIntelligence(
    input: VisualIntelligenceCertificationInput = {},
  ): Promise<VisualIntelligenceCertificationReport> {
    return this.controller.certifyVisualIntelligence(input);
  }

  getLatestReport(): VisualIntelligenceCertificationReport | null {
    return this.controller.getLatestReport();
  }

  updateConfiguration(
    overrides: Partial<VisualIntelligenceCertificationConfiguration>,
  ): VisualIntelligenceCertificationState {
    const next = buildVisualIntelligenceCertificationConfiguration(this.bootstrap.repositoryRoot, {
      ...this.controller.getConfiguration(),
      ...overrides,
    });
    this.controller.updateConfiguration(next);
    return this.getState();
  }

  validateForSupervisorSync(): {
    valid: boolean;
    health: "healthy" | "degraded" | "blocked";
    readinessScore: number;
    notes: string[];
  } {
    const state = this.getState();
    const report = state.latestReport;
    const score = report
      ? report.finalCertificationDecision === "pass"
        ? 100
        : report.finalCertificationDecision === "conditional"
          ? 70
          : 40
      : state.health.healthScore;

    return {
      valid: state.health.status !== "failed",
      health: score >= 75 ? "healthy" : score >= 50 ? "degraded" : "blocked",
      readinessScore: score,
      notes: [
        `Certification status: ${state.status}`,
        report
          ? `Last decision: ${report.finalCertificationDecision} · confidence=${report.confidenceScore}`
          : "No certification run yet",
        report
          ? `Programmes: ${report.capabilityValidationSummary.programmesPassed}/${report.capabilityValidationSummary.programmesValidated}`
          : "Awaiting first certification",
        report
          ? `T5 missions: ${report.capabilityValidationSummary.t5MissionsPassed}/${report.capabilityValidationSummary.t5MissionsValidated}`
          : "",
        ...state.health.notes,
      ].filter(Boolean),
    };
  }

  getCockpitSnapshot(): CertificationCockpitSnapshot {
    const state = this.getState();
    const report = state.latestReport;
    const programmesPassed = report?.programmeResults.filter((p) => p.passed).length ?? 0;
    const programmesFailed = report
      ? report.programmeResults.length - programmesPassed
      : 0;
    const t5Passed = report?.t5MissionResults.filter((m) => m.passed).length ?? 0;
    const t5Failed = report ? report.t5MissionResults.length - t5Passed : 0;

    return {
      certificationStatus: state.status,
      healthStatus: state.health.status,
      lastDecision: report?.finalCertificationDecision ?? state.health.lastCertificationDecision,
      programmesPassed,
      programmesFailed,
      t5MissionsPassed: t5Passed,
      t5MissionsFailed: t5Failed,
      endToEndPassed: report?.endToEndValidationResult.passed ?? false,
      grandKingAuthorityPreserved:
        report?.governanceComplianceResult.grandKingAuthorityPreserved ?? true,
      confidenceScore: report?.confidenceScore ?? 0,
      totalCertifications: state.performance.totalCertifications,
      recentLogs: getCertificationLogs(8, state.configuration).map(
        (l) => `${l.event}: ${l.details}`,
      ),
    };
  }
}

export function createVisualIntelligenceCertificationEngine(
  bootstrap: EmpireBootstrapContext,
  visualFoundationCertification: VisualFoundationCertificationEngine,
  uxIntelligenceCertification: UxIntelligenceCertificationEngine,
  autonomousBuilderCertification: AutonomousBuilderCertificationEngine,
  executiveCollaborationCertification: ExecutiveCollaborationCertificationEngine,
  continuousScreenObservation: ContinuousScreenObservationEngine,
  autonomousUxAudit: AutonomousUxAuditEngine,
  uxOpportunityDiscovery: UxOpportunityDiscoveryEngine,
  productivityIntelligence: ProductivityIntelligenceEngine,
  workflowEvolution: WorkflowEvolutionEngine,
  adaptiveInterface: AdaptiveInterfaceEngine,
  continuousUxEvolution: ContinuousUxEvolutionEngine,
  executiveWorkspaceIntelligence: ExecutiveWorkspaceIntelligenceEngine,
  selfImprovingUx: SelfImprovingUxEngine,
  approvalWorkflow: ApprovalWorkflowEngine,
  options?: VisualIntelligenceCertificationEngineOptions,
): VisualIntelligenceCertificationEngine {
  return new VisualIntelligenceCertificationEngine(
    bootstrap,
    visualFoundationCertification,
    uxIntelligenceCertification,
    autonomousBuilderCertification,
    executiveCollaborationCertification,
    continuousScreenObservation,
    autonomousUxAudit,
    uxOpportunityDiscovery,
    productivityIntelligence,
    workflowEvolution,
    adaptiveInterface,
    continuousUxEvolution,
    executiveWorkspaceIntelligence,
    selfImprovingUx,
    approvalWorkflow,
    options,
  );
}

export function resetVisualIntelligenceCertificationForTesting(): void {
  resetCertificationLogsForTesting();
  new RecoveryManager().reset();
}
