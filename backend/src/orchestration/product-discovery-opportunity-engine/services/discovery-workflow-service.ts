import { randomUUID } from "node:crypto";

import { getDatabase } from "../../../brain/database.js";
import { getGovernanceEngine } from "../../../foundation/empire-governance/services/governance-engine.js";
import { captureSoulRuntimeEvent } from "../../../foundation/soul-runtime/services/soul-runtime-engine.js";
import type {
  DiscoveryDashboard,
  DiscoverySession,
  DiscoverySessionStage,
  ProductDiscoveryInput,
} from "../models/product-opportunity.js";
import { normalizeProductDiscoveryInput } from "../models/product-opportunity.js";
import { discoverProductOpportunities } from "./product-discovery-pipeline-service.js";

let repositoryInstance: SqliteProductDiscoveryRepository | null = null;

export function getProductDiscoveryRepository(): SqliteProductDiscoveryRepository {
  if (!repositoryInstance) {
    repositoryInstance = new SqliteProductDiscoveryRepository();
  }
  return repositoryInstance;
}

export function resetProductDiscoveryRepository(): void {
  repositoryInstance = null;
}

function mapRow(row: Record<string, unknown>): DiscoverySession {
  return JSON.parse(String(row.session_json)) as DiscoverySession;
}

export class SqliteProductDiscoveryRepository {
  saveSession(session: DiscoverySession): DiscoverySession {
    const db = getDatabase();
    const record = { ...session, updatedAt: new Date().toISOString() };
    db.prepare(
      `INSERT INTO product_discovery_sessions
        (session_id, workspace_id, company_id, stage, session_json, updated_at)
       VALUES
        (@sessionId, @workspaceId, @companyId, @stage, @sessionJson, @updatedAt)
       ON CONFLICT(session_id) DO UPDATE SET
         stage = excluded.stage,
         session_json = excluded.session_json,
         updated_at = excluded.updated_at`,
    ).run({
      sessionId: record.sessionId,
      workspaceId: record.workspaceId,
      companyId: record.companyId,
      stage: record.stage,
      sessionJson: JSON.stringify(record),
      updatedAt: record.updatedAt,
    });
    return record;
  }

  getSession(sessionId: string): DiscoverySession | null {
    const db = getDatabase();
    const row = db
      .prepare(`SELECT session_json FROM product_discovery_sessions WHERE session_id = @sessionId`)
      .get({ sessionId });
    return row ? mapRow(row as Record<string, unknown>) : null;
  }

  listSessions(workspaceId: string, companyId?: string): DiscoverySession[] {
    const db = getDatabase();
    let query = `SELECT session_json FROM product_discovery_sessions WHERE workspace_id = @workspaceId`;
    const params: Record<string, unknown> = { workspaceId };
    if (companyId) {
      query += ` AND company_id = @companyId`;
      params.companyId = companyId;
    }
    query += ` ORDER BY updated_at DESC`;
    const rows = db.prepare(query).all(params);
    return (rows as Record<string, unknown>[]).map(mapRow);
  }
}

export class ProductDiscoverySessionNotFoundError extends Error {
  constructor(sessionId: string) {
    super(`Discovery session not found: ${sessionId}`);
    this.name = "ProductDiscoverySessionNotFoundError";
  }
}

export class ProductDiscoverySessionBlockedError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductDiscoverySessionBlockedError";
  }
}

function captureDiscoverySoulRuntime(
  workspaceId: string,
  title: string,
  summary: string,
  actor: string,
  payload: Record<string, unknown>,
) {
  try {
    captureSoulRuntimeEvent({
      workspaceId,
      memoryKey: "businessMilestones",
      title,
      summary,
      source: "system",
      actor,
      payload,
    });
  } catch {
    // best-effort
  }
}

function createSessionRecord(input: ProductDiscoveryInput, stage: DiscoverySessionStage): DiscoverySession {
  const normalized = normalizeProductDiscoveryInput(input);
  const timestamp = new Date().toISOString();
  return {
    sessionId: `discovery:${randomUUID()}`,
    workspaceId: normalized.workspaceId,
    companyId: normalized.companyId,
    accountType: normalized.accountType ?? "grand_king",
    stage,
    brand: normalized.brand,
    category: normalized.category,
    targetMarket: normalized.targetMarket ?? "US",
    budgetCents: normalized.budgetCents,
    existingSupplierNetwork: normalized.existingSupplierNetwork ?? [],
    opportunities: [],
    approvedOpportunityIds: [],
    actor: input.actor,
    correlationId: input.correlationId ?? `live005-${randomUUID()}`,
    metadata: { mission: "LIVE-005" },
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Grand King chooses brand + category — starts discovery session. */
export function startProductDiscoverySession(input: ProductDiscoveryInput): DiscoverySession {
  const session = createSessionRecord(input, "CATEGORY_CHOSEN");
  const saved = getProductDiscoveryRepository().saveSession(session);
  captureDiscoverySoulRuntime(
    input.workspaceId,
    `Discovery started: ${input.brand}`,
    `Category ${input.category} selected for product opportunity discovery`,
    input.actor ?? "product-discovery-engine",
    { sessionId: saved.sessionId, category: input.category },
  );
  return saved;
}

/** EA discovers ranked product opportunities. */
export function runProductDiscovery(sessionId: string): DiscoverySession {
  const repository = getProductDiscoveryRepository();
  const existing = repository.getSession(sessionId);
  if (!existing) {
    throw new ProductDiscoverySessionNotFoundError(sessionId);
  }

  const discovering = repository.saveSession({ ...existing, stage: "DISCOVERING" });
  const opportunities = discoverProductOpportunities({
    workspaceId: discovering.workspaceId,
    companyId: discovering.companyId,
    brand: discovering.brand,
    category: discovering.category,
    targetMarket: discovering.targetMarket,
    budgetCents: discovering.budgetCents,
    existingSupplierNetwork: discovering.existingSupplierNetwork,
    accountType: discovering.accountType,
    actor: discovering.actor,
    correlationId: discovering.correlationId,
  });

  const updated = repository.saveSession({
    ...discovering,
    stage: "AWAITING_APPROVAL",
    opportunities,
    metadata: {
      ...discovering.metadata,
      discoveredAt: new Date().toISOString(),
      opportunityCount: String(opportunities.length),
    },
  });

  captureDiscoverySoulRuntime(
    existing.workspaceId,
    "Product opportunities discovered",
    `EA ranked ${opportunities.length} opportunities for ${existing.brand}`,
    existing.actor ?? "product-discovery-engine",
    { sessionId, topOpportunity: opportunities[0]?.opportunityId },
  );

  return updated;
}

/** Grand King approves opportunities — governance gate applied. */
export function approveProductOpportunities(
  sessionId: string,
  opportunityIds: string[],
  actor?: string,
): DiscoverySession {
  const repository = getProductDiscoveryRepository();
  const existing = repository.getSession(sessionId);
  if (!existing) {
    throw new ProductDiscoverySessionNotFoundError(sessionId);
  }
  if (existing.opportunities.length === 0) {
    throw new ProductDiscoverySessionBlockedError("Run discovery before approving opportunities");
  }

  const governance = getGovernanceEngine();
  const verdict = governance.evaluateDecision({
    workspaceId: existing.workspaceId,
    domain: "grandKings",
    module: "product-discovery-opportunity-engine",
    action: "approve_opportunities",
    actor: actor ?? "founder",
    correlationId: existing.correlationId ?? sessionId,
    payload: { opportunityIds },
  });

  if (!verdict.allowed) {
    throw new ProductDiscoverySessionBlockedError(
      verdict.reason ?? "Governance blocked opportunity approval",
    );
  }

  const validIds = opportunityIds.filter((id) =>
    existing.opportunities.some((opp) => opp.opportunityId === id),
  );
  if (validIds.length === 0) {
    throw new ProductDiscoverySessionBlockedError("No valid opportunity IDs to approve");
  }

  const updated = repository.saveSession({
    ...existing,
    stage: "READY_FOR_PRODUCT_BUILD",
    approvedOpportunityIds: validIds,
    metadata: {
      ...existing.metadata,
      approvedAt: new Date().toISOString(),
      approvedBy: actor ?? "founder",
    },
  });

  captureDiscoverySoulRuntime(
    existing.workspaceId,
    "Grand King approved product opportunities",
    `Approved ${validIds.length} opportunity(ies) — READY FOR PRODUCT BUILD`,
    actor ?? "founder",
    { sessionId, opportunityIds: validIds },
  );

  return updated;
}

export function getDiscoverySession(sessionId: string): DiscoverySession | null {
  return getProductDiscoveryRepository().getSession(sessionId);
}

export function listDiscoverySessions(workspaceId: string, companyId?: string): DiscoverySession[] {
  return getProductDiscoveryRepository().listSessions(workspaceId, companyId);
}

export function buildDiscoveryDashboard(workspaceId: string, companyId: string): DiscoveryDashboard {
  const sessions = listDiscoverySessions(workspaceId, companyId);
  const latest = sessions[0] ?? null;
  const topOpportunities = latest?.opportunities.slice(0, 5) ?? [];

  let recommendedNextAction = "Start product discovery — choose brand and category.";
  if (latest) {
    switch (latest.stage) {
      case "CATEGORY_CHOSEN":
        recommendedNextAction = "Run EA discovery to rank product opportunities.";
        break;
      case "DISCOVERING":
        recommendedNextAction = "Discovery in progress…";
        break;
      case "AWAITING_APPROVAL":
        recommendedNextAction = topOpportunities[0]?.recommendedNextAction ?? "Review and approve top opportunities.";
        break;
      case "READY_FOR_PRODUCT_BUILD":
        recommendedNextAction = "Approved — proceed to Product Build phase.";
        break;
      default:
        recommendedNextAction = topOpportunities[0]?.recommendedNextAction ?? "Continue discovery workflow.";
    }
  }

  return {
    sessionId: latest?.sessionId,
    stage: latest?.stage,
    topOpportunities,
    recommendedNextAction,
    computedAt: new Date().toISOString(),
  };
}

export function discoverOpportunitiesForInput(input: ProductDiscoveryInput) {
  return discoverProductOpportunities(input);
}
