/**
 * G5-08 — EKLS Outcome Integration Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import {
  getAutomationLearningRecord,
  getRelatedAutomationExecutions,
  previewOutcomePolicy,
  searchAutomationLearning,
} from "../services/ekls-outcome-service.js";

export const eklsOutcomeTools: RegisteredTool[] = [
  {
    name: "business_automation.get_learning",
    description: "Retrieve EKLS learning record for automation execution — Pillow-governed retrieve",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
      },
      required: ["executionId"],
    },
    handler: async (args) => getAutomationLearningRecord(String(args.executionId)),
  },
  {
    name: "business_automation.search_learning",
    description: "Search automation learning records for workspace — Pillow-governed EKLS retrieve",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        actorId: { type: "string" },
        workflowId: { type: "string" },
        executionId: { type: "string" },
      },
      required: ["workspaceId", "actorId"],
    },
    handler: async (args, context) =>
      searchAutomationLearning({
        workspaceId: args.workspaceId ? String(args.workspaceId) : context.workspaceId,
        actorId: args.actorId ? String(args.actorId) : context.agentId,
        workflowId: args.workflowId ? String(args.workflowId) : undefined,
        executionId: args.executionId ? String(args.executionId) : undefined,
      }),
  },
  {
    name: "business_automation.related_executions",
    description: "Find related automation executions from EKLS outcome history",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        executionId: { type: "string" },
      },
      required: ["executionId"],
    },
    handler: async (args) => getRelatedAutomationExecutions(String(args.executionId)),
  },
  {
    name: "business_automation.outcome_policy_preview",
    description: "Preview REG-AUTOMATION-REPORT/MONITOR/POLICY outcome learning resolution",
    module: "business-automation",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workflowId: { type: "string" },
        policyRegistryId: { type: "string" },
      },
      required: ["workflowId"],
    },
    handler: async (args) =>
      previewOutcomePolicy({
        workflowId: String(args.workflowId),
        policyRegistryId: args.policyRegistryId ? String(args.policyRegistryId) : undefined,
      }),
  },
];
