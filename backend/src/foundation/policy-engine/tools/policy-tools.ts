import type { RegisteredTool } from "../../../brain/types.js";
import type { PolicyCategory, PolicyDecisionMode, PolicyExecutableEnforcement } from "../models/business-policy.js";
import {
  disablePolicy,
  enablePolicy,
  getExecutableBusinessPolicies,
  getPolicy,
  getPolicyForCategory,
  initializePolicies,
  listPolicies,
  listPolicyLifecycle,
  listWorkspacePolicyLifecycle,
  resolvePolicy,
  setProductSelectionMode,
  updatePolicy,
  upsertPolicy,
} from "../services/policy-engine-service.js";

export const policyTools: RegisteredTool[] = [
  {
    name: "policy.list",
    description: "List configurable business policies for workspace",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string" },
      },
    },
    handler: async (args) => ({
      policies: listPolicies(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.status as Parameters<typeof listPolicies>[1],
      ),
    }),
  },
  {
    name: "policy.get",
    description: "Get business policy by ID",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { policyId: { type: "string" } },
      required: ["policyId"],
    },
    handler: async (args) => getPolicy(String(args.policyId)),
  },
  {
    name: "policy.get_by_category",
    description: "Get active business policy for category (productSelection, adApproval, etc.)",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        category: { type: "string" },
      },
      required: ["category"],
    },
    handler: async (args) =>
      getPolicyForCategory(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.category),
      ),
  },
  {
    name: "policy.resolve",
    description: "Resolve a business decision from configurable policy — modules must not hardcode logic",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        category: { type: "string" },
        policyId: { type: "string" },
        module: { type: "string" },
        action: { type: "string" },
        context: { type: "object" },
        actor: { type: "string" },
        correlationId: { type: "string" },
      },
    },
    handler: async (args) =>
      resolvePolicy({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        category: args.category as PolicyCategory | undefined,
        policyId: args.policyId ? String(args.policyId) : undefined,
        module: args.module ? String(args.module) : undefined,
        action: args.action ? String(args.action) : undefined,
        context: args.context as Record<string, unknown> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
      }),
  },
  {
    name: "policy.upsert",
    description: "Create a new configurable business policy",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        policyId: { type: "string" },
        category: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        decisionMode: { type: "string" },
        config: { type: "object" },
        executableEnforcement: { type: "object" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["policyId", "category", "name", "description", "decisionMode"],
    },
    handler: async (args) =>
      upsertPolicy({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        policyId: String(args.policyId),
        category: args.category as PolicyCategory,
        name: String(args.name),
        description: String(args.description),
        decisionMode: args.decisionMode as PolicyDecisionMode,
        config: args.config as Record<string, unknown> | undefined,
        executableEnforcement: args.executableEnforcement as PolicyExecutableEnforcement | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "policy.update",
    description: "Update configurable business policy without changing core code",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        policyId: { type: "string" },
        name: { type: "string" },
        description: { type: "string" },
        decisionMode: { type: "string" },
        config: { type: "object" },
        executableEnforcement: { type: "object" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["policyId"],
    },
    handler: async (args) =>
      updatePolicy({
        policyId: String(args.policyId),
        name: args.name ? String(args.name) : undefined,
        description: args.description ? String(args.description) : undefined,
        decisionMode: args.decisionMode as PolicyDecisionMode | undefined,
        config: args.config as Record<string, unknown> | undefined,
        executableEnforcement: args.executableEnforcement as PolicyExecutableEnforcement | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "policy.set_product_selection_mode",
    description: "Switch product selection between manual and automatic",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        mode: { type: "string", enum: ["manual", "automatic"] },
        actor: { type: "string" },
      },
      required: ["mode"],
    },
    handler: async (args) =>
      setProductSelectionMode(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.mode as "manual" | "automatic",
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "policy.disable",
    description: "Disable a business policy",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        policyId: { type: "string" },
        reason: { type: "string" },
        actor: { type: "string" },
      },
      required: ["policyId"],
    },
    handler: async (args) =>
      disablePolicy(
        String(args.policyId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "policy.enable",
    description: "Enable a disabled business policy",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        policyId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["policyId"],
    },
    handler: async (args) =>
      enablePolicy(String(args.policyId), args.actor ? String(args.actor) : undefined),
  },
  {
    name: "policy.list_lifecycle",
    description: "List policy lifecycle events (CREATED, MODIFIED, DISABLED, ENABLED, RESOLVED)",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        policyId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["policyId"],
    },
    handler: async (args) => ({
      lifecycle: listPolicyLifecycle(
        String(args.policyId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "policy.list_governance_rules",
    description: "List governance rules compiled from active business policies",
    module: "policy-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      rules: getExecutableBusinessPolicies(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
      ),
    }),
  },
  {
    name: "policy.initialize",
    description: "Initialize default business policies for workspace",
    module: "policy-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      policies: initializePolicies(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
