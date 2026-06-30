import type { RegisteredTool } from "../../../brain/types.js";
import type { DecisionAlternative, DecisionCategory, DecisionTradeoff } from "../models/empire-decision.js";
import {
  approveDecision,
  deprecateDecision,
  getDecision,
  initializeDecisionRegistry,
  listDecisionLifecycle,
  listDecisions,
  modifyDecision,
  proposeDecision,
  recordDecision,
  supersedeDecision,
} from "../services/decision-registry-service.js";

export const decisionRegistryTools: RegisteredTool[] = [
  {
    name: "decision_registry.list",
    description: "List every major architectural and strategic decision — none disappear",
    module: "decision-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string" },
        category: { type: "string" },
      },
    },
    handler: async (args) => ({
      decisions: listDecisions(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", {
        status: args.status as "PROPOSED" | "APPROVED" | "SUPERSEDED" | "DEPRECATED" | undefined,
        category: args.category as DecisionCategory | undefined,
      }),
    }),
  },
  {
    name: "decision_registry.get",
    description: "Get decision by ID with reason, alternatives, tradeoffs, approver, and timestamp",
    module: "decision-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { decisionId: { type: "string" } },
      required: ["decisionId"],
    },
    handler: async (args) => getDecision(String(args.decisionId)),
  },
  {
    name: "decision_registry.record",
    description: "Record an approved architectural or strategic decision",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        decisionId: { type: "string" },
        title: { type: "string" },
        category: { type: "string" },
        decision: { type: "string" },
        reason: { type: "string" },
        alternatives: { type: "array" },
        tradeoffs: { type: "array" },
        approver: { type: "string" },
        approvedAt: { type: "string" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["decisionId", "title", "category", "decision", "reason", "approver"],
    },
    handler: async (args) =>
      recordDecision({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        decisionId: String(args.decisionId),
        title: String(args.title),
        category: args.category as DecisionCategory,
        decision: String(args.decision),
        reason: String(args.reason),
        alternatives: args.alternatives as DecisionAlternative[] | undefined,
        tradeoffs: args.tradeoffs as DecisionTradeoff[] | undefined,
        approver: String(args.approver),
        approvedAt: args.approvedAt ? String(args.approvedAt) : undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "decision_registry.propose",
    description: "Propose a decision pending founder approval",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        decisionId: { type: "string" },
        title: { type: "string" },
        category: { type: "string" },
        decision: { type: "string" },
        reason: { type: "string" },
        alternatives: { type: "array" },
        tradeoffs: { type: "array" },
        approver: { type: "string" },
        actor: { type: "string" },
      },
      required: ["decisionId", "title", "category", "decision", "reason", "approver"],
    },
    handler: async (args) =>
      proposeDecision({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        decisionId: String(args.decisionId),
        title: String(args.title),
        category: args.category as DecisionCategory,
        decision: String(args.decision),
        reason: String(args.reason),
        alternatives: args.alternatives as DecisionAlternative[] | undefined,
        tradeoffs: args.tradeoffs as DecisionTradeoff[] | undefined,
        approver: String(args.approver),
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "decision_registry.approve",
    description: "Approve a proposed decision",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        decisionId: { type: "string" },
        approver: { type: "string" },
        actor: { type: "string" },
      },
      required: ["decisionId", "approver"],
    },
    handler: async (args) =>
      approveDecision(
        String(args.decisionId),
        String(args.approver),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "decision_registry.modify",
    description: "Modify a decision record (creates new version)",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        decisionId: { type: "string" },
        title: { type: "string" },
        decision: { type: "string" },
        reason: { type: "string" },
        alternatives: { type: "array" },
        tradeoffs: { type: "array" },
        actor: { type: "string" },
      },
      required: ["decisionId"],
    },
    handler: async (args) =>
      modifyDecision({
        decisionId: String(args.decisionId),
        title: args.title ? String(args.title) : undefined,
        decision: args.decision ? String(args.decision) : undefined,
        reason: args.reason ? String(args.reason) : undefined,
        alternatives: args.alternatives as DecisionAlternative[] | undefined,
        tradeoffs: args.tradeoffs as DecisionTradeoff[] | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "decision_registry.supersede",
    description: "Mark decision as superseded by a newer decision",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        decisionId: { type: "string" },
        supersededBy: { type: "string" },
        actor: { type: "string" },
      },
      required: ["decisionId", "supersededBy"],
    },
    handler: async (args) =>
      supersedeDecision(
        String(args.decisionId),
        String(args.supersededBy),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "decision_registry.deprecate",
    description: "Deprecate a decision — record preserved in registry",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        decisionId: { type: "string" },
        reason: { type: "string" },
        actor: { type: "string" },
      },
      required: ["decisionId"],
    },
    handler: async (args) =>
      deprecateDecision(
        String(args.decisionId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "decision_registry.list_lifecycle",
    description: "List lifecycle events for a decision",
    module: "decision-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        decisionId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["decisionId"],
    },
    handler: async (args) => ({
      lifecycle: listDecisionLifecycle(
        String(args.decisionId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "decision_registry.initialize",
    description: "Initialize default Empire architectural decisions",
    module: "decision-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      decisions: initializeDecisionRegistry(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
