import type { RegisteredTool } from "../../brain/types.js";
import { DecisionEngine } from "../../brain/decision-engine.js";
import {
  activity,
  decisions,
  loadAiCeoView,
} from "../../domain/services/module-views.js";

const decisionEngine = new DecisionEngine();

export const aiCeoTools: RegisteredTool[] = [
  {
    name: "ai-ceo.approve_decision",
    description: "Founder approves a pending AI CEO strategic decision",
    module: "ai-ceo",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        decisionId: { type: "string" },
      },
      required: ["workspaceId", "decisionId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      const decisionId = String(args.decisionId);

      const decision = decisions.approve(workspaceId, decisionId);

      const evaluation = decisionEngine.evaluate({
        agentId: "founder",
        action: "ai-ceo.approve_decision",
        authorityLevel: "L2",
        rationale: `Founder approved: ${decision.title}`,
        founderApproved: true,
        metadata: { decisionId: decision.id },
      });

      activity.record({
        workspaceId,
        agentName: "Founder",
        action: `Approved CEO decision: ${decision.title}`,
        module: "ai-ceo",
        outcome: "Approved",
      });

      return {
        decision,
        evaluation,
        briefing: loadAiCeoView(workspaceId),
      };
    },
  },
  {
    name: "ai-ceo.approve_all",
    description: "Founder approves all pending AI CEO strategic decisions",
    module: "ai-ceo",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args, context) => {
      const workspaceId = String(args.workspaceId ?? context.workspaceId);
      const approved = decisions.approveAll(workspaceId);

      activity.record({
        workspaceId,
        agentName: "Founder",
        action: `Approved ${approved.length} CEO decisions`,
        module: "ai-ceo",
        outcome: "All approved",
      });

      return {
        approved,
        briefing: loadAiCeoView(workspaceId),
      };
    },
  },
];
