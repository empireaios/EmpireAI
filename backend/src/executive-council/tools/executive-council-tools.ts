import type { RegisteredTool } from "../../brain/types.js";
import { DebateContextInputSchema } from "../models/executive-core.js";
import { runExecutiveDebate, listDebateSessions } from "../services/executive-debate-engine.js";
import { listRegisteredExecutives, initializeExecutiveRegistry } from "../services/executive-registry-service.js";
import { getExecutiveCouncilRuntime } from "../services/executive-council-runtime.js";
import { buildExecutiveHeadquartersDashboard } from "../services/executive-headquarters-service.js";
import { generateExecutiveMissions } from "../services/executive-mission-generator.js";

export const executiveCouncilTools: RegisteredTool[] = [
  {
    name: "executive_council.registry",
    description: "List registered executives (EC-002)",
    module: "executive-council",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      listRegisteredExecutives(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "executive_council.debate",
    description: "Run executive council debate (EC-003)",
    module: "executive-council",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" }, topic: { type: "string" }, summary: { type: "string" } }, required: ["companyId", "topic", "summary"] },
    handler: async (args) => {
      const { workspaceId, companyId, ...rest } = args as Record<string, unknown>;
      const context = DebateContextInputSchema.parse(rest);
      return runExecutiveDebate(
        workspaceId ? String(workspaceId) : "ws_empire_1",
        String(companyId),
        context,
      );
    },
  },
  {
    name: "executive_council.sessions",
    description: "List council debate sessions",
    module: "executive-council",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      listDebateSessions(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "executive_council.missions.generate",
    description: "Generate executive missions for King (EC-009)",
    module: "executive-council",
    authorityLevel: "L2",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      generateExecutiveMissions(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "executive_council.headquarters",
    description: "Executive Headquarters dashboard (EC-010)",
    module: "executive-council",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) => {
      const ws = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const companyId = String(args.companyId);
      initializeExecutiveRegistry(ws, companyId);
      return buildExecutiveHeadquartersDashboard(ws, companyId);
    },
  },
  {
    name: "executive_council.runtime",
    description: "Executive Council runtime status (EC-001)",
    module: "executive-council",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } }, required: ["companyId"] },
    handler: async (args) =>
      getExecutiveCouncilRuntime(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
];
