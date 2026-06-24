import { randomUUID } from "node:crypto";
import type { EmpireBrain } from "../brain/index.js";
import type { AuditLogger } from "../brain/audit/audit-logger.js";
import { getDatabase } from "../brain/database.js";
import type { DatabaseGuardian } from "./database-guardian.js";
import type {
  GuardianHealthReport,
  HealthStatus,
  SubsystemHealth,
  SubsystemId,
} from "./types.js";

export class HealthMonitor {
  constructor(
    private readonly dbGuardian: DatabaseGuardian,
    private readonly auditLogger: AuditLogger,
  ) {}

  async assess(brain: EmpireBrain): Promise<GuardianHealthReport> {
    const checkedAt = new Date().toISOString();
    const subsystems: SubsystemHealth[] = [];

    subsystems.push(this.checkDatabase());
    subsystems.push(this.checkOrchestrator(brain));
    subsystems.push(this.checkAgentManager(brain));
    subsystems.push(await this.checkTaskQueue(brain));
    subsystems.push(this.checkMemorySystem(brain));
    subsystems.push(await this.checkEventBus(brain));
    subsystems.push(this.checkDecisionEngine(brain));
    subsystems.push(this.checkWorkflowEngine(brain));
    subsystems.push(this.checkToolRegistry(brain));
    subsystems.push(this.checkLlmLayer(brain));
    subsystems.push(this.checkScheduler());
    subsystems.push(this.checkBackgroundWorkers(brain));
    subsystems.push(this.checkAuditLogs(brain));

    const dbReport = this.dbGuardian.verifyIntegrity();
    const overall = summarizeOverall(subsystems);
    const report: GuardianHealthReport = {
      overall,
      checkedAt,
      subsystems,
      openRisks: 0,
      databaseIntegrity: dbReport.ok ? "ok" : "failed",
      summary: buildSummary(overall, subsystems),
    };

    this.persistSnapshot(report);

    this.auditLogger.write({
      action: "guardian.health_check",
      actor: "guardian",
      workspaceId: "system",
      correlationId: `guardian:health:${Date.now()}`,
      metadata: {
        overall: report.overall,
        failed: subsystems.filter((s) => s.status === "failed").map((s) => s.id),
        degraded: subsystems.filter((s) => s.status === "degraded").map((s) => s.id),
      },
    });

    return report;
  }

  private persistSnapshot(report: GuardianHealthReport): void {
    const db = getDatabase();
    db.prepare(
      `INSERT INTO guardian_health_snapshots
        (id, overall_status, report, created_at)
       VALUES (@id, @overall, @report, @createdAt)`,
    ).run({
      id: randomUUID(),
      overall: report.overall,
      report: JSON.stringify(report),
      createdAt: report.checkedAt,
    });
  }

  private checkDatabase(): SubsystemHealth {
    const start = Date.now();
    try {
      const report = this.dbGuardian.verifyIntegrity();
      return {
        id: "database",
        status: report.ok ? "healthy" : "failed",
        message: report.ok
          ? "SQLite integrity check passed"
          : `Integrity failed: ${report.integrityCheck}`,
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
        metadata: report as unknown as Record<string, unknown>,
      };
    } catch (error) {
      return failed("database", error, start);
    }
  }

  private checkOrchestrator(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    try {
      brain.toolRegistry.require("dashboard.load_view");
      return {
        id: "orchestrator",
        status: "healthy",
        message: "Core load toolchain registered",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return failed("orchestrator", error, start);
    }
  }

  private checkAgentManager(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const agents = brain.agentManager.list();
    const status: HealthStatus = agents.length >= 11 ? "healthy" : "degraded";

    return {
      id: "agent-manager",
      status,
      message: `${agents.length} agents registered`,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private async checkTaskQueue(brain: EmpireBrain): Promise<SubsystemHealth> {
    const start = Date.now();
    if (brain.redisMode === "degraded") {
      const stats = await brain.taskQueue.getStats();
      return {
        id: "task-queue",
        status: "degraded",
        message: "In-memory stub queue (Redis unavailable)",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
        metadata: stats,
      };
    }

    try {
      await brain.redis!.ping();
      const stats = await brain.taskQueue.getStats();
      return {
        id: "task-queue",
        status: "healthy",
        message: "Queue reachable",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
        metadata: stats,
      };
    } catch (error) {
      return failed("task-queue", error, start);
    }
  }

  private checkMemorySystem(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    try {
      const record = brain.memoryStore.upsert({
        scope: "workspace",
        workspaceId: "guardian-health",
        key: "health_probe",
        value: { ok: true, at: new Date().toISOString() },
        ttlSeconds: 60,
      });

      const read = brain.memoryStore.get({
        scope: "workspace",
        workspaceId: "guardian-health",
        key: "health_probe",
      });

      return {
        id: "memory-system",
        status: read?.id === record.id ? "healthy" : "failed",
        message: read?.id === record.id ? "Read/write probe passed" : "Read/write mismatch",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return failed("memory-system", error, start);
    }
  }

  private async checkEventBus(brain: EmpireBrain): Promise<SubsystemHealth> {
    const start = Date.now();
    if (brain.redisMode === "degraded") {
      await brain.eventBus.publish({
        type: "signal",
        source: "guardian",
        workspaceId: "guardian-health",
        correlationId: `guardian:event:${Date.now()}`,
        payload: { probe: true },
      });

      return {
        id: "event-bus",
        status: "degraded",
        message: "Local in-memory event bus (Redis unavailable)",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    }

    try {
      await brain.redis!.ping();
      await brain.eventBus.publish({
        type: "signal",
        source: "guardian",
        workspaceId: "guardian-health",
        correlationId: `guardian:event:${Date.now()}`,
        payload: { probe: true },
      });

      return {
        id: "event-bus",
        status: "healthy",
        message: "Event publish probe passed",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return failed("event-bus", error, start);
    }
  }

  private checkDecisionEngine(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const auto = brain.decisionEngine.evaluate({
      agentId: "guardian",
      action: "probe",
      authorityLevel: "L0",
      rationale: "Health probe",
    });
    const gated = brain.decisionEngine.evaluate({
      agentId: "guardian",
      action: "probe-l3",
      authorityLevel: "L3",
      rationale: "Approval probe",
    });

    const ok =
      brain.decisionEngine.canExecute(auto) &&
      !brain.decisionEngine.canExecute(gated);

    return {
      id: "decision-engine",
      status: ok ? "healthy" : "failed",
      message: ok ? "Authority gates behaving correctly" : "Authority gate mismatch",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private checkWorkflowEngine(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const workflow = brain.workflowEngine.get("manufacture-company");
    return {
      id: "workflow-engine",
      status: workflow ? "healthy" : "failed",
      message: workflow ? "Core workflows registered" : "Missing core workflows",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private checkToolRegistry(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const tools = brain.toolRegistry.list();
    return {
      id: "tool-registry",
      status: tools.length >= 20 ? "healthy" : "degraded",
      message: `${tools.length} tools registered`,
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private checkLlmLayer(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const available = brain.llmRouter.listAvailable();
    return {
      id: "llm-layer",
      status: available.length > 0 ? "healthy" : "degraded",
      message:
        available.length > 0
          ? `Providers available: ${available.join(", ")}`
          : "No LLM providers configured (agent runs will fail)",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
      metadata: { providers: available },
    };
  }

  private checkScheduler(): SubsystemHealth {
    const start = Date.now();
    return {
      id: "scheduler",
      status: "healthy",
      message: "Scheduler module loaded",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private checkBackgroundWorkers(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    const running = brain.workerPool.isActive();
    return {
      id: "background-workers",
      status: running ? "healthy" : "degraded",
      message: running ? "Worker pool active" : "Worker pool not started",
      checkedAt: new Date().toISOString(),
      latencyMs: Date.now() - start,
    };
  }

  private checkAuditLogs(brain: EmpireBrain): SubsystemHealth {
    const start = Date.now();
    try {
      const correlationId = `guardian:audit:${Date.now()}`;
      brain.auditLogger.write({
        action: "guardian.health_check",
        actor: "guardian",
        workspaceId: "guardian-health",
        correlationId,
        metadata: { probe: true },
      });

      const rows = brain.auditLogger.query({
        workspaceId: "guardian-health",
        correlationId,
        limit: 1,
      });

      return {
        id: "audit-logs",
        status: rows.length === 1 ? "healthy" : "failed",
        message: rows.length === 1 ? "Audit write/query probe passed" : "Audit query failed",
        checkedAt: new Date().toISOString(),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      return failed("audit-logs", error, start);
    }
  }
}

function failed(id: SubsystemId, error: unknown, start: number): SubsystemHealth {
  return {
    id,
    status: "failed",
    message: error instanceof Error ? error.message : "Unknown error",
    checkedAt: new Date().toISOString(),
    latencyMs: Date.now() - start,
  };
}

function summarizeOverall(subsystems: SubsystemHealth[]): HealthStatus {
  if (subsystems.some((s) => s.status === "failed")) return "failed";
  if (subsystems.some((s) => s.status === "degraded")) return "degraded";
  return "healthy";
}

function buildSummary(overall: HealthStatus, subsystems: SubsystemHealth[]): string {
  const failed = subsystems.filter((s) => s.status === "failed").length;
  const degraded = subsystems.filter((s) => s.status === "degraded").length;
  return `Guardian overall=${overall}; failed=${failed}; degraded=${degraded}; total=${subsystems.length}`;
}
