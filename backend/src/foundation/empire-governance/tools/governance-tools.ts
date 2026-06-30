import type { RegisteredTool } from "../../../brain/types.js";
import type { GovernanceDecisionRequest } from "../models/governance-policy.js";
import {
  assessGovernanceDispatch,
  evaluateGovernanceDecision,
  getGovernanceEngine,
  initializeGovernancePolicies,
} from "../services/governance-engine.js";

export const governanceTools: RegisteredTool[] = [
  {
    name: "governance.evaluate",
    description: "Evaluate an Empire decision through Governance — required for all business rules",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        domain: { type: "string" },
        module: { type: "string" },
        action: { type: "string" },
        actorRole: { type: "string" },
        founderApproved: { type: "boolean" },
        payload: { type: "object" },
      },
      required: ["workspaceId", "domain", "module", "action"],
    },
    handler: async (args) =>
      evaluateGovernanceDecision({
        workspaceId: String(args.workspaceId),
        domain: args.domain as GovernanceDecisionRequest["domain"],
        module: String(args.module),
        action: String(args.action),
        actorRole: args.actorRole ? String(args.actorRole) : undefined,
        founderApproved: args.founderApproved === true,
        payload: (args.payload as Record<string, unknown>) ?? {},
      }),
  },
  {
    name: "governance.assess_dispatch",
    description: "Assess orchestrator dispatch through Governance",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        module: { type: "string" },
        action: { type: "string" },
        actorRole: { type: "string" },
        payload: { type: "object" },
      },
      required: ["workspaceId", "module", "action"],
    },
    handler: async (args) =>
      assessGovernanceDispatch(
        {
          module: String(args.module),
          action: String(args.action),
          workspaceId: String(args.workspaceId),
          payload: (args.payload as Record<string, unknown>) ?? {},
        },
        { actorRole: args.actorRole ? String(args.actorRole) : undefined },
      ),
  },
  {
    name: "governance.list_policies",
    description: "List governance policies for workspace",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        domain: { type: "string" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) => {
      initializeGovernancePolicies(String(args.workspaceId));
      return getGovernanceEngine().listPolicies(
        String(args.workspaceId),
        args.domain as GovernanceDecisionRequest["domain"] | undefined,
      );
    },
  },
  {
    name: "governance.check_capability",
    description: "Check whether a live capability is allowed under governance rules",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        domain: { type: "string" },
        module: { type: "string" },
        action: { type: "string" },
        actorRole: { type: "string" },
        founderApproved: { type: "boolean" },
      },
      required: ["workspaceId", "domain", "module", "action"],
    },
    handler: async (args) =>
      getGovernanceEngine().checkCapability({
        workspaceId: String(args.workspaceId),
        domain: args.domain as GovernanceDecisionRequest["domain"],
        module: String(args.module),
        action: String(args.action),
        actorRole: args.actorRole ? String(args.actorRole) : undefined,
        founderApproved: args.founderApproved === true,
      }),
  },
  {
    name: "governance.get_capabilities",
    description: "Get governance capability matrix for Grand King's Account",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => getGovernanceEngine().getCapabilities(String(args.workspaceId)),
  },
  {
    name: "governance.list_decisions",
    description: "List governance decision audit trail",
    module: "empire-governance",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["workspaceId"],
    },
    handler: async (args) =>
      getGovernanceEngine().listDecisions(
        String(args.workspaceId),
        args.limit ? Number(args.limit) : undefined,
      ),
  },
  {
    name: "governance.initialize",
    description: "Initialize default governance policies for workspace",
    module: "empire-governance",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
      required: ["workspaceId"],
    },
    handler: async (args) => ({
      policies: initializeGovernancePolicies(String(args.workspaceId)),
    }),
  },
];
