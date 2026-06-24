import { randomUUID } from "node:crypto";
import { getDatabase } from "../../brain/database.js";
import type { AuthorityLevel } from "../../brain/types.js";

export type DecisionStatus = "pending" | "approved" | "denied";

export type CeoDecisionRecord = {
  id: string;
  workspaceId: string;
  module: string;
  title: string;
  status: DecisionStatus;
  agentId: string;
  authorityLevel: AuthorityLevel;
  rationale: string | null;
  createdAt: string;
  resolvedAt: string | null;
};

type DecisionRow = {
  id: string;
  workspace_id: string;
  module: string;
  title: string;
  status: DecisionStatus;
  agent_id: string;
  authority_level: AuthorityLevel;
  rationale: string | null;
  created_at: string;
  resolved_at: string | null;
};

const DEFAULT_DECISIONS = [
  "Approve EU expansion for top commerce venture",
  "Increase daily ad cap on highest ROAS channel",
  "Pause underperforming SKU cluster",
];

function mapRow(row: DecisionRow): CeoDecisionRecord {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    module: row.module,
    title: row.title,
    status: row.status,
    agentId: row.agent_id,
    authorityLevel: row.authority_level,
    rationale: row.rationale,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export class DecisionRepository {
  listPending(workspaceId: string, module = "ai-ceo"): CeoDecisionRecord[] {
    const db = getDatabase();
    const rows = db
      .prepare(
        `SELECT * FROM decisions
         WHERE workspace_id = @workspaceId AND module = @module AND status = 'pending'
         ORDER BY created_at ASC`,
      )
      .all({ workspaceId, module }) as DecisionRow[];

    return rows.map(mapRow);
  }

  ensureDefaults(workspaceId: string, module = "ai-ceo"): void {
    const pending = this.listPending(workspaceId, module);
    if (pending.length > 0) return;

    for (const title of DEFAULT_DECISIONS) {
      this.create({
        workspaceId,
        module,
        title,
        agentId: "ai-ceo",
        authorityLevel: "L3",
      });
    }
  }

  create(input: {
    workspaceId: string;
    module?: string;
    title: string;
    agentId: string;
    authorityLevel: AuthorityLevel;
    rationale?: string;
  }): CeoDecisionRecord {
    const db = getDatabase();
    const id = randomUUID();
    const createdAt = new Date().toISOString();

    db.prepare(
      `INSERT INTO decisions
        (id, workspace_id, module, title, status, agent_id, authority_level, rationale, created_at, resolved_at)
       VALUES
        (@id, @workspaceId, @module, @title, 'pending', @agentId, @authorityLevel, @rationale, @createdAt, NULL)`,
    ).run({
      id,
      workspaceId: input.workspaceId,
      module: input.module ?? "ai-ceo",
      title: input.title,
      agentId: input.agentId,
      authorityLevel: input.authorityLevel,
      rationale: input.rationale ?? null,
      createdAt,
    });

    return {
      id,
      workspaceId: input.workspaceId,
      module: input.module ?? "ai-ceo",
      title: input.title,
      status: "pending",
      agentId: input.agentId,
      authorityLevel: input.authorityLevel,
      rationale: input.rationale ?? null,
      createdAt,
      resolvedAt: null,
    };
  }

  approve(workspaceId: string, decisionId: string): CeoDecisionRecord {
    return this.resolve(workspaceId, decisionId, "approved");
  }

  deny(workspaceId: string, decisionId: string): CeoDecisionRecord {
    return this.resolve(workspaceId, decisionId, "denied");
  }

  approveAll(workspaceId: string, module = "ai-ceo"): CeoDecisionRecord[] {
    const pending = this.listPending(workspaceId, module);
    return pending.map((decision) => this.approve(workspaceId, decision.id));
  }

  private resolve(
    workspaceId: string,
    decisionId: string,
    status: Exclude<DecisionStatus, "pending">,
  ): CeoDecisionRecord {
    const db = getDatabase();
    const existing = db
      .prepare(
        `SELECT * FROM decisions WHERE id = @decisionId AND workspace_id = @workspaceId`,
      )
      .get({ decisionId, workspaceId }) as DecisionRow | undefined;

    if (!existing) {
      throw new Error(`Decision not found: ${decisionId}`);
    }

    if (existing.status !== "pending") {
      throw new Error(`Decision already ${existing.status}: ${decisionId}`);
    }

    const resolvedAt = new Date().toISOString();
    db.prepare(
      `UPDATE decisions SET status = @status, resolved_at = @resolvedAt WHERE id = @decisionId`,
    ).run({ decisionId, status, resolvedAt });

    return mapRow({ ...existing, status, resolved_at: resolvedAt });
  }
}
