import type { RegisteredTool } from "../../brain/types.js";
import {
  buildLaunchCommandCenter,
  buildOperationFirstDollarDashboard,
  computeBusinessKpiSnapshot,
  generateDailyExecutiveBrief,
  getFirstDollarTrackerSummary,
  getLatestKpiSnapshot,
  listEmpireLearning,
  listMilestones,
  recordEmpireLearning,
  recordMilestone,
  recordRealBusinessEvent,
  syncPipelineMilestones,
} from "../services/operation-first-dollar-service.js";
import { getOperationFirstDollarRepository } from "../repositories/sqlite-operation-first-dollar-repository.js";

export const operationFirstDollarTools: RegisteredTool[] = [
  {
    name: "ofd.launch_command_center",
    description: "Business Launch Command Center — readiness, priorities, blockers (O001)",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildLaunchCommandCenter(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.first_dollar_tracker",
    description: "First Dollar Tracker — milestone progress and permanent history",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      getFirstDollarTrackerSummary(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.record_milestone",
    description: "Record First Dollar milestone — REAL milestones require externalReference",
    module: "operation-first-dollar",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        milestone: { type: "string" },
        source: { type: "string", enum: ["REAL", "SIMULATED"] },
        evidence: { type: "string" },
        externalReference: { type: "string" },
      },
      required: ["companyId", "milestone", "source"],
    },
    handler: async (args) =>
      recordMilestone({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        milestone: String(args.milestone) as Parameters<typeof recordMilestone>[0]["milestone"],
        source: String(args.source) as "REAL" | "SIMULATED",
        evidence: args.evidence ? String(args.evidence) : undefined,
        externalReference: args.externalReference ? String(args.externalReference) : undefined,
      }),
  },
  {
    name: "ofd.record_real_event",
    description: "Record verified real business event (sale, visitor, profit, etc.)",
    module: "operation-first-dollar",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        eventType: { type: "string" },
        amountUsd: { type: "number" },
        externalReference: { type: "string" },
        evidence: { type: "string" },
      },
      required: ["companyId", "eventType", "externalReference", "evidence"],
    },
    handler: async (args) =>
      recordRealBusinessEvent({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        eventType: String(args.eventType) as Parameters<typeof recordRealBusinessEvent>[0]["eventType"],
        amountUsd: typeof args.amountUsd === "number" ? args.amountUsd : undefined,
        externalReference: String(args.externalReference),
        evidence: String(args.evidence),
      }),
  },
  {
    name: "ofd.business_kpi",
    description: "Business KPI Engine — REAL vs SIMULATED metrics",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        refresh: { type: "boolean" },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      args.refresh
        ? computeBusinessKpiSnapshot(
            args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
            String(args.companyId),
          )
        : getLatestKpiSnapshot(
            args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
            String(args.companyId),
          ),
  },
  {
    name: "ofd.empire_learning.record",
    description: "Record institutional learning from real-world events",
    module: "operation-first-dollar",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        decision: { type: "string" },
        result: { type: "string" },
        whySucceeded: { type: "string" },
        whyFailed: { type: "string" },
        source: { type: "string", enum: ["REAL", "SIMULATED"] },
        eventType: { type: "string" },
      },
      required: ["companyId", "decision", "result", "source", "eventType"],
    },
    handler: async (args) =>
      recordEmpireLearning({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        companyId: String(args.companyId),
        decision: String(args.decision),
        result: String(args.result),
        whySucceeded: args.whySucceeded ? String(args.whySucceeded) : undefined,
        whyFailed: args.whyFailed ? String(args.whyFailed) : undefined,
        source: String(args.source) as "REAL" | "SIMULATED",
        eventType: String(args.eventType),
      }),
  },
  {
    name: "ofd.empire_learning.list",
    description: "List Empire Learning Repository records",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        source: { type: "string", enum: ["REAL", "SIMULATED"] },
      },
      required: ["companyId"],
    },
    handler: async (args) =>
      listEmpireLearning(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        args.source ? (String(args.source) as "REAL" | "SIMULATED") : undefined,
      ),
  },
  {
    name: "ofd.daily_executive_brief",
    description: "Generate Daily Executive Brief for Grand King",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      generateDailyExecutiveBrief(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.dashboard",
    description: "Operation First Dollar dashboard for Grand King",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildOperationFirstDollarDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.sync_pipeline",
    description: "Sync First Dollar milestones from LIVE pipeline state",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      syncPipelineMilestones(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.milestones.list",
    description: "List all First Dollar milestone records",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      listMilestones(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "ofd.briefs.history",
    description: "Daily executive brief history",
    module: "operation-first-dollar",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, limit: { type: "number" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      getOperationFirstDollarRepository().listBriefs(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
        typeof args.limit === "number" ? args.limit : 30,
      ),
  },
];

export { buildOperationFirstDollarDashboard };
