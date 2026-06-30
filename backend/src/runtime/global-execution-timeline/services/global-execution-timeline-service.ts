import { PROGRAM_CATALOG } from "../../../orchestration/master-completion-ledger/models/program-catalog.js";
import { listPipelineProducts, seedRevenuePipeline } from "../../../grand-king-revenue-pipeline/services/revenue-pipeline-runtime.js";
import type { GlobalExecutionTimeline, TimelineEvent } from "../models/global-execution-timeline.js";

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function pipelineStatus(state: string): TimelineEvent["status"] {
  if (["LIVE", "SCALING", "MONITORING"].includes(state)) return "COMPLETE";
  if (["KING_APPROVAL", "EXECUTIVE_REVIEW", "READY_TO_PUBLISH"].includes(state)) return "IN_PROGRESS";
  if (["ARCHIVED", "FAILED", "PAUSED"].includes(state)) return "BLOCKED";
  return "PLANNED";
}

/** REAL-058 — Global execution timeline (pipeline products + PROGRAM_CATALOG next missions). */
export function buildGlobalExecutionTimeline(
  workspaceId: string,
  companyId: string,
): GlobalExecutionTimeline {
  const now = new Date().toISOString();
  seedRevenuePipeline(workspaceId, companyId);
  const products = listPipelineProducts(workspaceId, companyId);

  const pipelineEvents: TimelineEvent[] = products.slice(0, 10).map((product, index) => ({
    eventId: `tl-pipeline-${product.productId}`,
    type: "pipeline" as const,
    title: `${product.title ?? product.productId} — ${product.state}`,
    scheduledAt: addDays(now, index * 3),
    status: pipelineStatus(product.state),
    sourceModule: "grand-king-revenue-pipeline",
    summary: `${product.marketplaceId ?? product.supplierPlatform ?? "marketplace TBD"} · score ${product.commercialScore ?? 0}`,
  }));

  const blockingPrograms = PROGRAM_CATALOG.filter((p) => p.blocksUsd100k);
  const programEvents: TimelineEvent[] = blockingPrograms.slice(0, 8).map((program, index) => ({
    eventId: `tl-program-${program.programId}`,
    type: "program" as const,
    title: program.nextCursorMission,
    scheduledAt: addDays(now, 7 + index * 5),
    status: program.baseCompletionPercent >= 85 ? "IN_PROGRESS" : "PLANNED",
    sourceModule: "master-completion-ledger",
    summary: `${program.name} · ${program.baseCompletionPercent}% complete`,
  }));

  const events = [...pipelineEvents, ...programEvents]
    .sort((a, b) => a.scheduledAt.localeCompare(b.scheduledAt));

  const upcomingCount = events.filter((e) => e.status === "PLANNED" || e.status === "IN_PROGRESS").length;

  return {
    moduleId: "global-execution-timeline",
    missionId: "REAL-058",
    workspaceId,
    companyId,
    events,
    eventCount: events.length,
    upcomingCount,
    reusedModules: ["grand-king-revenue-pipeline", "master-completion-ledger"],
    architectureComplete: true,
    computedAt: now,
  };
}
