import { randomUUID } from "node:crypto";
import { getDatabase } from "../brain/database.js";
import type { RecoveryPlan, RecoveryStep, RiskRecord, SubsystemId } from "./types.js";

export class RecoveryPlanner {
  createPlan(risk: RiskRecord): RecoveryPlan {
    const steps = buildRecoverySteps(risk);
    const rollbackSteps = buildRollbackSteps(risk);

    const plan: RecoveryPlan = {
      id: randomUUID(),
      riskId: risk.id,
      title: `Recovery plan for ${risk.code}`,
      steps,
      rollbackSteps,
      createdAt: new Date().toISOString(),
    };

    const db = getDatabase();
    db.prepare(
      `INSERT INTO guardian_recovery_plans
        (id, risk_id, title, steps, rollback_steps, created_at)
       VALUES (@id, @riskId, @title, @steps, @rollbackSteps, @createdAt)`,
    ).run({
      id: plan.id,
      riskId: plan.riskId,
      title: plan.title,
      steps: JSON.stringify(plan.steps),
      rollbackSteps: JSON.stringify(plan.rollbackSteps),
      createdAt: plan.createdAt,
    });

    return plan;
  }

  getForRisk(riskId: string): RecoveryPlan | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT * FROM guardian_recovery_plans WHERE risk_id = @riskId ORDER BY created_at DESC LIMIT 1`)
      .get({ riskId }) as DbPlanRow | undefined;

    if (!row) return null;

    return {
      id: row.id,
      riskId: row.risk_id,
      title: row.title,
      steps: JSON.parse(row.steps) as RecoveryStep[],
      rollbackSteps: JSON.parse(row.rollback_steps) as RecoveryStep[],
      createdAt: row.created_at,
    };
  }
}

type DbPlanRow = {
  id: string;
  risk_id: string;
  title: string;
  steps: string;
  rollback_steps: string;
  created_at: string;
};

function buildRecoverySteps(risk: RiskRecord): RecoveryStep[] {
  const base: RecoveryStep[] = [
    {
      order: 1,
      action: "Isolate affected subsystem to prevent cascading failure",
      rationale: "Guardian containment protocol",
      rollback: "Re-enable subsystem after verification passes",
    },
    {
      order: 2,
      action: "Review audit logs for correlation ID and recent dispatch events",
      rationale: "Establish blast radius before retry",
    },
  ];

  const subsystemSteps: Partial<Record<SubsystemId | "guardian" | "system", RecoveryStep[]>> = {
    database: [
      {
        order: 3,
        action: "Run PRAGMA integrity_check and verify required tables exist",
        rationale: "Database doctrine requires integrity verification before writes",
      },
      {
        order: 4,
        action: "Restore from last known-good backup if integrity_check fails",
        rationale: "Prefer migration/restore over destructive repair",
        rollback: "Do not delete database files without backup confirmation",
      },
    ],
    "task-queue": [
      {
        order: 3,
        action: "Verify Redis connectivity and queue depth",
        rationale: "Task queue depends on Redis availability",
      },
      {
        order: 4,
        action: "Drain or retry failed jobs after subsystem health is green",
        rationale: "Recover async work without duplicating side effects",
      },
    ],
    "event-bus": [
      {
        order: 3,
        action: "Restart Redis pub/sub connections and verify event stream",
        rationale: "Real-time propagation requires healthy event bus",
      },
    ],
    "llm-layer": [
      {
        order: 3,
        action: "Confirm at least one LLM provider API key is configured",
        rationale: "Agent execution cannot proceed without provider availability",
      },
    ],
  };

  const specific = subsystemSteps[risk.subsystem] ?? [
    {
      order: 3,
      action: `Re-run Guardian health check for subsystem: ${risk.subsystem}`,
      rationale: "Confirm subsystem returns to healthy state",
    },
  ];

  return [...base, ...specific];
}

function buildRollbackSteps(risk: RiskRecord): RecoveryStep[] {
  return [
    {
      order: 1,
      action: "Halt new dispatches for affected module/action if instability persists",
      rationale: "Protect portfolio from repeated unsafe execution",
    },
    {
      order: 2,
      action: "Resolve Guardian risk record after manual verification",
      rationale: "Close the loop in audit trail",
      rollback: `Re-open risk ${risk.id} if regression detected`,
    },
  ];
}
