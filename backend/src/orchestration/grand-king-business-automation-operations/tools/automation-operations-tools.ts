/**
 * G7-03 — Grand King business automation operations Brain tools.
 */

import type { RegisteredTool } from "../../../brain/types.js";
import { buildCockpitAutomationOperationsView } from "../contracts/automation-operations-cockpit-contracts.js";
import {
  cancelAutomationOperation,
  getAutomationOperation,
  getAutomationOperationDependencies,
  getAutomationOperationHealth,
  getAutomationOperationSummary,
  getAutomationOperationsOverview,
  getExecutiveAutomationDashboard,
  initializeAutomationOperations,
  listAutomationOperations,
  pauseAutomationOperation,
  resumeAutomationOperation,
  startAutomationOperation,
} from "../services/grand-king-business-automation-operations-service.js";

export const grandKingBusinessAutomationOperationsTools: RegisteredTool[] = [
  {
    name: "automation_operations_overview",
    description: "G7-03 — Grand King business automation operations overview and Cockpit view",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => {
      const overview = getAutomationOperationsOverview();
      const dependencies = getAutomationOperationDependencies();
      const dashboard = getExecutiveAutomationDashboard();
      const summary = getAutomationOperationSummary();
      return {
        overview,
        cockpitView: buildCockpitAutomationOperationsView({
          overview,
          ...dashboard,
          dependencies,
          executiveSummary: summary,
        }),
      };
    },
  },
  {
    name: "automation_operation_status",
    description: "G7-03 — Automation operation status by ID",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { automationOperationId: { type: "string" } },
      required: ["automationOperationId"],
    },
    handler: async (args) => {
      const operation = getAutomationOperation(String(args.automationOperationId));
      if (!operation) return { error: "Automation operation not found" };
      return { operation };
    },
  },
  {
    name: "start_automation_operation",
    description: "G7-03 — Start an automation operation",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        automationOperationId: { type: "string" },
      },
      required: ["actorId", "automationOperationId"],
    },
    handler: async (args) =>
      startAutomationOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        automationOperationId: String(args.automationOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "pause_automation_operation",
    description: "G7-03 — Pause an automation operation",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        automationOperationId: { type: "string" },
      },
      required: ["actorId", "automationOperationId"],
    },
    handler: async (args) =>
      pauseAutomationOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        automationOperationId: String(args.automationOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "resume_automation_operation",
    description: "G7-03 — Resume an automation operation",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        automationOperationId: { type: "string" },
      },
      required: ["actorId", "automationOperationId"],
    },
    handler: async (args) =>
      resumeAutomationOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        automationOperationId: String(args.automationOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "cancel_automation_operation",
    description: "G7-03 — Cancel an automation operation",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        actorId: { type: "string" },
        ownerId: { type: "string" },
        automationOperationId: { type: "string" },
      },
      required: ["actorId", "automationOperationId"],
    },
    handler: async (args) =>
      cancelAutomationOperation({
        actorId: String(args.actorId),
        ownerId: String(args.ownerId ?? "grand-king"),
        automationOperationId: String(args.automationOperationId),
        pillowGovernance: true,
      }),
  },
  {
    name: "automation_operation_health",
    description: "G7-03 — Automation operation health",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { automationOperationId: { type: "string" } },
      required: ["automationOperationId"],
    },
    handler: async (args) => getAutomationOperationHealth(String(args.automationOperationId)),
  },
  {
    name: "automation_operation_dependencies",
    description: "G7-03 — Automation operation registry dependencies",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => getAutomationOperationDependencies(),
  },
  {
    name: "automation_operation_summary",
    description: "G7-03 — Grand King business automation operations executive summary",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ summary: getAutomationOperationSummary() }),
  },
  {
    name: "initialize_grand_king_automation_operations",
    description: "G7-03 — Initialize automation operations from registry",
    module: "grand-king-business-automation-operations",
    authorityLevel: "L2",
    parameters: { type: "object", properties: {} },
    handler: async () => initializeAutomationOperations(),
  },
];
