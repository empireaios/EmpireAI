import type { RegisteredTool } from "../../../brain/types.js";
import { buildGlobalExecutionTimeline } from "../services/global-execution-timeline-service.js";

export const globalExecutionTimelineTools: RegisteredTool[] = [{
  name: "global_execution_timeline.dashboard",
  description: "REAL-058 Global execution timeline dashboard",
  module: "global-execution-timeline",
  authorityLevel: "L1",
  parameters: { type: "object", properties: { workspaceId: { type: "string" }, companyId: { type: "string" } } },
  handler: async (args) => buildGlobalExecutionTimeline(String(args.workspaceId ?? "ws_empire_1"), String(args.companyId ?? "co-grand-king")),
}];
