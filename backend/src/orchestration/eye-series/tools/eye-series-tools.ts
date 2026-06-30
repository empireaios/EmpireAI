import type { RegisteredTool } from "../../../brain/types.js";
import type { EyeId } from "../models/eye-series.js";
import {
  buildEyeSeriesDashboard,
  completeInvestigation,
  getEyeReport,
  getEyeSummary,
  listEyeReports,
  listInvestigationHistory,
  listKnowledgeGraph,
  runAllEyes,
  runEye,
  searchIntelligence,
  validateEyeSeries,
} from "../services/eye-series-service.js";

const EYE_TOOL_IDS: EyeId[] = [
  "product_eye",
  "marketplace_eye",
  "supplier_eye",
  "competitor_eye",
  "customer_eye",
  "seo_eye",
  "marketing_eye",
  "financial_eye",
  "risk_eye",
  "executive_eye",
];

function eyeHandler(eyeId: EyeId) {
  return async (args: Record<string, unknown>) => {
    const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
    const companyId = args.companyId ? String(args.companyId) : "co-grand-king";
    const action = args.action ? String(args.action) : "run";

    switch (action) {
      case "run":
        if (eyeId === "executive_eye") {
          return runAllEyes(workspaceId, companyId);
        }
        return runEye(eyeId as Exclude<EyeId, "executive_eye">, workspaceId, companyId);
      case "summary":
        return getEyeSummary(workspaceId, eyeId);
      case "list":
        return listEyeReports(workspaceId, eyeId);
      case "report":
        if (!args.reportId) throw new Error("reportId required");
        return getEyeReport(String(args.reportId));
      case "history":
        return listInvestigationHistory(workspaceId, eyeId);
      case "search":
        return searchIntelligence(workspaceId, String(args.query ?? ""), eyeId);
      default:
        throw new Error(`Unknown action: ${action}`);
    }
  };
}

export const eyeSeriesTools: RegisteredTool[] = [
  ...EYE_TOOL_IDS.map((eyeId) => ({
    name: eyeId,
    description: `${eyeId} — observe, investigate, recommend (observation-only). Actions: run, summary, list, report, history, search`,
    module: "eye-series" as const,
    authorityLevel: "L1" as const,
    parameters: {
      type: "object" as const,
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        action: { type: "string", enum: ["run", "summary", "list", "report", "history", "search"] },
        reportId: { type: "string" },
        query: { type: "string" },
      },
    },
    handler: eyeHandler(eyeId),
  })),
  {
    name: "knowledge_graph",
    description: "Empire Knowledge Graph — list observations with deduplication",
    module: "eye-series",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        eyeId: { type: "string" },
        limit: { type: "number" },
      },
    },
    handler: async (args) =>
      listKnowledgeGraph(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.eyeId ? (String(args.eyeId) as EyeId) : undefined,
        typeof args.limit === "number" ? args.limit : 100,
      ),
  },
  {
    name: "intelligence_search",
    description: "Search intelligence observations across all Eyes",
    module: "eye-series",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        query: { type: "string" },
        eyeId: { type: "string" },
      },
      required: ["query"],
    },
    handler: async (args) =>
      searchIntelligence(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.query),
        args.eyeId ? (String(args.eyeId) as EyeId) : undefined,
      ),
  },
  {
    name: "investigation_history",
    description: "List continuous investigation history",
    module: "eye-series",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        eyeId: { type: "string" },
        limit: { type: "number" },
      },
    },
    handler: async (args) =>
      listInvestigationHistory(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.eyeId ? (String(args.eyeId) as EyeId) : undefined,
        typeof args.limit === "number" ? args.limit : 50,
      ),
  },
  {
    name: "eye_series.dashboard",
    description: "Build Eye Series dashboard for Grand King",
    module: "eye-series",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildEyeSeriesDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "eye_series.validate_all",
    description: "Validate complete Eye Series E001-E010",
    module: "eye-series",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      validateEyeSeries(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];

export { buildEyeSeriesDashboard };
