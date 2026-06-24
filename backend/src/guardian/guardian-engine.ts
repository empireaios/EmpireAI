import type { EmpireBrain } from "../brain/index.js";
import type { AuditLogger } from "../brain/audit/audit-logger.js";
import type { OrchestratorDispatchRequest } from "../brain/types.js";
import { ActionGuard } from "./action-guard.js";
import { DatabaseGuardian } from "./database-guardian.js";
import { HealthMonitor } from "./health-monitor.js";
import { RecoveryPlanner } from "./recovery-planner.js";
import { RiskRegistry } from "./risk-registry.js";
import type {
  GuardianAssessmentContext,
  GuardianHealthReport,
  GuardianVerdict,
  RiskRecord,
} from "./types.js";

export class GuardianBlockedError extends Error {
  constructor(
    message: string,
    readonly verdict: GuardianVerdict,
  ) {
    super(message);
    this.name = "GuardianBlockedError";
  }
}

export class GuardianEngine {
  readonly dbGuardian = new DatabaseGuardian();
  readonly risks = new RiskRegistry();
  readonly recovery = new RecoveryPlanner();
  readonly actionGuard: ActionGuard;
  readonly healthMonitor: HealthMonitor;

  private lastHealthReport: GuardianHealthReport | null = null;

  constructor(private readonly auditLogger: AuditLogger) {
    this.actionGuard = new ActionGuard(this.dbGuardian);
    this.healthMonitor = new HealthMonitor(this.dbGuardian, auditLogger);
  }

  assessDispatch(
    request: OrchestratorDispatchRequest,
    options?: { toolAuthorityLevel?: string },
  ): GuardianVerdict {
    const context: GuardianAssessmentContext = {
      module: request.module,
      action: request.action,
      workspaceId: request.workspaceId,
      companyId: request.companyId,
      payload: request.payload,
      correlationId: request.correlationId,
      toolAuthorityLevel: options?.toolAuthorityLevel,
    };

    const verdict = this.actionGuard.assess(context);
    if (!verdict.allowed) {
      const risk = this.recordBlockedAction(verdict, context);
      const plan = this.recovery.createPlan(risk);
      verdict.riskId = risk.id;
      verdict.recoveryPlanId = plan.id;

      this.auditLogger.write({
        action: "guardian.block",
        actor: "guardian",
        workspaceId: request.workspaceId,
        companyId: request.companyId,
        correlationId: request.correlationId ?? `guardian:block:${Date.now()}`,
        metadata: { code: verdict.code, reason: verdict.reason, riskId: risk.id },
      });
    }

    return verdict;
  }

  async checkHealth(
    brain: EmpireBrain,
    options?: { recordRisks?: boolean },
  ): Promise<GuardianHealthReport> {
    const report = await this.healthMonitor.assess(brain);
    report.openRisks = this.risks.countOpen();
    this.lastHealthReport = report;

    if (options?.recordRisks !== false && report.overall !== "healthy") {
      this.risks.record({
        severity: report.overall === "failed" ? "high" : "medium",
        subsystem: "guardian",
        code: "SUBSYSTEM_HEALTH",
        message: report.summary,
        metadata: {
          failed: report.subsystems.filter((s) => s.status === "failed").map((s) => s.id),
        },
      });
    }

    return report;
  }

  getLastHealthReport(): GuardianHealthReport | null {
    return this.lastHealthReport;
  }

  listOpenRisks(): RiskRecord[] {
    return this.risks.listOpen();
  }

  resolveRisk(riskId: string): boolean {
    const resolved = this.risks.resolve(riskId);
    if (resolved) {
      this.auditLogger.write({
        action: "guardian.risk_resolved",
        actor: "guardian",
        workspaceId: "system",
        correlationId: `guardian:resolve:${riskId}`,
        metadata: { riskId },
      });
    }
    return resolved;
  }

  private recordBlockedAction(
    verdict: GuardianVerdict,
    context: GuardianAssessmentContext,
  ): RiskRecord {
    return this.risks.record({
      severity: verdict.code === "DATABASE_INTEGRITY" ? "critical" : "high",
      subsystem: "guardian",
      code: verdict.code,
      message: verdict.reason,
      correlationId: context.correlationId,
      metadata: {
        module: context.module,
        action: context.action,
        workspaceId: context.workspaceId,
      },
    });
  }
}
