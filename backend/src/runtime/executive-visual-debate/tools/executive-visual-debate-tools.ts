import type { RegisteredTool } from "../../../brain/types.js";
import { buildExecutiveVisualDebate } from "../services/executive-visual-debate-service.js";

export const executiveVisualDebateTools: RegisteredTool[] = [
  {
    name: "executive_visual_debate.build",
    description: "REAL-007 visual executive debate with Soul synthesis",
    module: "executive-visual-debate",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        companyId: { type: "string" },
        topic: { type: "string" },
        summary: { type: "string" },
        subjectType: { type: "string" },
      },
      required: ["topic", "summary"],
    },
    handler: async (args) =>
      buildExecutiveVisualDebate(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.companyId ? String(args.companyId) : "co-grand-king",
        {
          topic: String(args.topic),
          summary: String(args.summary),
          subjectType: (args.subjectType as "product" | "marketplace" | "general") ?? "general",
        },
      ),
  },
];
