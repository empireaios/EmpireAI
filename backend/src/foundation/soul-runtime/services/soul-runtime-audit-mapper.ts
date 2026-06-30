import type { AuditAction, AuditLogEntry } from "../../../brain/types.js";
import type { SoulRuntimeMemoryKey } from "../../soul-file/models/soul-file-document.js";
import type { SoulRuntimeCaptureInput } from "../models/soul-runtime-event.js";

type AuditCaptureRule = {
  memoryKey: SoulRuntimeMemoryKey;
  title: (entry: AuditLogEntry) => string;
  summary: (entry: AuditLogEntry) => string;
  operationalState?: (entry: AuditLogEntry) => SoulRuntimeCaptureInput["operationalState"];
  continuity?: (entry: AuditLogEntry) => SoulRuntimeCaptureInput["continuity"];
};

const SKIP_AUDIT_ACTIONS = new Set<AuditAction>([
  "soul_file.initialized",
  "soul_file.evolved",
  "soul_file.exported",
  "soul_file.imported",
  "soul_runtime.captured",
  "governance.decision",
  "governance.policy_updated",
  "auth.login",
  "auth.logout",
  "auth.failed",
  "tool.execute",
  "llm.complete",
  "memory.write",
  "event.publish",
  "task.enqueue",
  "scheduler.schedule",
]);

function metaString(entry: AuditLogEntry, key: string): string | undefined {
  const value = entry.metadata[key];
  return value === undefined || value === null ? undefined : String(value);
}

function metaNumber(entry: AuditLogEntry, key: string): number | undefined {
  const value = entry.metadata[key];
  return typeof value === "number" ? value : undefined;
}

const AUDIT_CAPTURE_RULES: Partial<Record<AuditAction, AuditCaptureRule[]>> = {
  "first_revenue_validation.completed": [
    {
      memoryKey: "missionCompletions",
      title: () => "First Revenue Validation Complete",
      summary: (entry) =>
        `Sandbox revenue cycle validated — productionReady=${String(entry.metadata.productionReady ?? false)}`,
      operationalState: () => ({
        completedMissions: ["M110"],
        grandKingsAccountStatus: "FIRST_REVENUE_VALIDATED",
      }),
    },
    {
      memoryKey: "businessMilestones",
      title: () => "First Revenue Sandbox Milestone",
      summary: (entry) =>
        `Revenue ${metaNumber(entry, "revenueCents") ?? 0}¢ · Profit ${metaNumber(entry, "profitCents") ?? 0}¢`,
    },
    {
      memoryKey: "kpis",
      title: () => "Revenue Validation KPI",
      summary: (entry) =>
        `Stages passed: ${String(entry.metadata.allStagesPassed ?? false)} · Ledger verified: ${String(entry.metadata.ledgerVerified ?? false)}`,
    },
  ],
  "grand_kings_revenue.cycle_run": [
    {
      memoryKey: "kpis",
      title: () => "Grand King's Revenue Cycle KPI",
      summary: (entry) =>
        `Health score ${metaNumber(entry, "overallHealthScore") ?? "unknown"} · Cycle ${metaString(entry, "cycleId") ?? "n/a"}`,
    },
    {
      memoryKey: "capitalChanges",
      title: () => "Revenue Cycle Capital Snapshot",
      summary: () => "Operational revenue cycle completed — capital and KPI lifecycles synchronized",
    },
  ],
  "grand_kings_revenue.kpi_snapshot": [
    {
      memoryKey: "kpis",
      title: () => "KPI Snapshot Recorded",
      summary: (entry) =>
        `Overall health ${metaNumber(entry, "overallHealthScore") ?? "unknown"}`,
    },
  ],
  "production_deploy.executed": [
    {
      memoryKey: "businessMilestones",
      title: () => "Production Store Deployed",
      summary: (entry) =>
        `Deployment ${metaString(entry, "deploymentId") ?? "n/a"} · URL ${metaString(entry, "productionUrl") ?? "pending"}`,
    },
    {
      memoryKey: "architectureUpdates",
      title: () => "Production Deployment Architecture",
      summary: () => "Storefront deployed to production infrastructure",
    },
  ],
  "production_deploy.rolled_back": [
    {
      memoryKey: "lessonsLearned",
      title: () => "Production Rollback",
      summary: (entry) =>
        `Rollback executed for deployment ${metaString(entry, "deploymentId") ?? "n/a"}`,
    },
  ],
  "guardian.health_check": [
    {
      memoryKey: "architectureUpdates",
      title: () => "Architecture Health Check",
      summary: (entry) => `Guardian status: ${metaString(entry, "overall") ?? "checked"}`,
    },
  ],
  "guardian.block": [
    {
      memoryKey: "doctrineUpdates",
      title: () => "Protect The Empire — Action Blocked",
      summary: (entry) => metaString(entry, "reason") ?? "Guardian blocked a live action",
    },
    {
      memoryKey: "lessonsLearned",
      title: () => "Guardian Intervention",
      summary: (entry) => `Blocked: ${metaString(entry, "code") ?? "unknown"}`,
    },
  ],
  "live_payment.succeeded": [
    {
      memoryKey: "businessMilestones",
      title: () => "Live Payment Succeeded",
      summary: (entry) =>
        `Payment ${metaString(entry, "paymentId") ?? "n/a"} · ${metaNumber(entry, "amountCents") ?? 0}¢`,
    },
    {
      memoryKey: "capitalChanges",
      title: () => "Revenue Capital Inflow",
      summary: (entry) => `Sale recorded · ${metaNumber(entry, "amountCents") ?? 0}¢`,
    },
  ],
  "revenue_loop.payment_received": [
    {
      memoryKey: "businessMilestones",
      title: () => "Revenue Loop Payment",
      summary: (entry) => `Store ${metaString(entry, "storeId") ?? "n/a"} received payment`,
    },
    {
      memoryKey: "capitalChanges",
      title: () => "Revenue Loop Capital",
      summary: (entry) => `Profit ${metaNumber(entry, "profitCents") ?? 0}¢`,
    },
  ],
  "meta_ads.campaign_launched": [
    {
      memoryKey: "businessMilestones",
      title: () => "Meta Campaign Launched",
      summary: (entry) => `Campaign ${metaString(entry, "campaignId") ?? "n/a"} live`,
    },
  ],
  "product_publishing.catalog_published": [
    {
      memoryKey: "businessMilestones",
      title: () => "Product Catalog Published",
      summary: (entry) =>
        `Store ${metaString(entry, "storeId") ?? "n/a"} · ${metaNumber(entry, "productCount") ?? 0} products`,
    },
  ],
  "customer_order.delivered": [
    {
      memoryKey: "businessMilestones",
      title: () => "Customer Order Delivered",
      summary: (entry) => `Pipeline ${metaString(entry, "pipelineId") ?? "n/a"} delivered`,
    },
  ],
};

/** Maps audit log entries to Soul Runtime capture inputs. */
export function mapAuditEntryToCaptures(entry: AuditLogEntry): SoulRuntimeCaptureInput[] {
  if (SKIP_AUDIT_ACTIONS.has(entry.action)) {
    return [];
  }

  const rules = AUDIT_CAPTURE_RULES[entry.action];
  if (!rules?.length) {
    return [];
  }

  return rules.map((rule) => ({
    workspaceId: entry.workspaceId,
    memoryKey: rule.memoryKey,
    title: rule.title(entry),
    summary: rule.summary(entry),
    source: "audit" as const,
    correlationId: entry.correlationId,
    auditAction: entry.action,
    payload: {
      ...entry.metadata,
      actor: entry.actor,
      companyId: entry.companyId,
      agentId: entry.agentId,
    },
    actor: entry.actor,
    operationalState: rule.operationalState?.(entry),
    continuity: rule.continuity?.(entry),
  }));
}
