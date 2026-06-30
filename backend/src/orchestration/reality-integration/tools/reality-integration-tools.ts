import type { RegisteredTool } from "../../../brain/types.js";
import {
  buildConnectorHealthCenter,
  buildRealityIntegrationDashboard,
  buildRealityReadinessDashboard,
  buildProviderCapabilityMatrix,
  getProviderCapabilityMatrixEntry,
  listApprovalPolicies,
  assessApprovalRequired,
  buildCredentialGovernanceSummary,
  verifyCredential,
  connectProvider,
  connectorCost,
  connectorDependencies,
  connectorHealth,
  connectorHeartbeat,
  connectorRefresh,
  connectorValidate,
  disconnectProvider,
  getConnectorRegistryEntry,
  getConnectorRuntimeState,
  listConnectorRegistry,
  listRealityProviders,
  validateRealityIntegration,
} from "../services/reality-integration-service.js";
import { getCredentialVaultRepository } from "../repositories/sqlite-credential-vault-repository.js";
import { connectorGovernanceFlow } from "../services/connector-governance-service.js";
import { CONNECTION_LIFECYCLE_TRANSITIONS } from "../models/connection-lifecycle.js";

export const realityIntegrationTools: RegisteredTool[] = [
  {
    name: "reality_integration.connect",
    description: "Connect an external provider — connection only, no irreversible actions",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
        credentialType: { type: "string", enum: ["oauth", "api_key", "refresh_token", "secret"] },
        secretPayload: { type: "object" },
        scopes: { type: "array", items: { type: "string" } },
        actor: { type: "string" },
      },
      required: ["providerId", "credentialType", "secretPayload"],
    },
    handler: async (args) =>
      connectProvider({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        providerId: String(args.providerId),
        credentialType: String(args.credentialType) as "oauth" | "api_key" | "refresh_token" | "secret",
        secretPayload: (args.secretPayload ?? {}) as Record<string, unknown>,
        scopes: Array.isArray(args.scopes) ? args.scopes.map(String) : [],
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "reality_integration.disconnect",
    description: "Disconnect an external provider and revoke credentials",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        providerId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["providerId"],
    },
    handler: async (args) =>
      disconnectProvider(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "reality_integration.validate",
    description: "Validate a connected provider",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) =>
      connectorValidate(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      ),
  },
  {
    name: "reality_integration.heartbeat",
    description: "Send connector heartbeat and update health",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) =>
      connectorHeartbeat(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      ),
  },
  {
    name: "reality_integration.refresh",
    description: "Refresh connector credentials",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) =>
      connectorRefresh(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      ),
  },
  {
    name: "reality_integration.health",
    description: "Get connector health status",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) =>
      connectorHealth(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      ),
  },
  {
    name: "reality_integration.cost",
    description: "Get connector cost estimate",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) =>
      connectorCost(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      ),
  },
  {
    name: "reality_integration.dependencies",
    description: "List connector dependencies",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => ({ dependencies: connectorDependencies(String(args.providerId)) }),
  },
  {
    name: "reality_integration.registry.list",
    description: "List all registered reality integration providers",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { category: { type: "string" } },
    },
    handler: async (args) =>
      listConnectorRegistry().filter((entry) =>
        !args.category || entry.definition.category === args.category,
      ),
  },
  {
    name: "reality_integration.registry.get",
    description: "Get a provider registry entry",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => {
      const entry = getConnectorRegistryEntry(String(args.providerId));
      if (!entry) throw new Error(`Provider not found: ${args.providerId}`);
      return entry;
    },
  },
  {
    name: "reality_integration.vault.list",
    description: "List credential vault records for workspace (refs only, no secrets)",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      getCredentialVaultRepository().listByWorkspace(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
      ),
  },
  {
    name: "reality_integration.vault.revoke",
    description: "Revoke credentials by reference",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { credentialsRef: { type: "string" } },
      required: ["credentialsRef"],
    },
    handler: async (args) => {
      getCredentialVaultRepository().revokeCredential(String(args.credentialsRef));
      return { revoked: true, credentialsRef: args.credentialsRef };
    },
  },
  {
    name: "reality_integration.health_center",
    description: "Build connector health center (C016)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      buildConnectorHealthCenter(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "reality_integration.dashboard",
    description: "Build reality integration dashboard (C019)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildRealityIntegrationDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "reality_integration.governance.flow",
    description: "Get connector governance flow (C017)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => connectorGovernanceFlow(),
  },
  {
    name: "reality_integration.validate_all",
    description: "Validate complete reality integration foundation (C020)",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      validateRealityIntegration(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "reality_integration.runtime.get",
    description: "Get connector runtime state",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => {
      const state = getConnectorRuntimeState(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      );
      if (!state) throw new Error(`Runtime state not found: ${args.providerId}`);
      return state;
    },
  },
  {
    name: "reality_integration.providers.list",
    description: "List all reality provider definitions by category",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { category: { type: "string" } },
    },
    handler: async (args) =>
      listRealityProviders(
        args.category ? (String(args.category) as Parameters<typeof listRealityProviders>[0]) : undefined,
      ),
  },
  {
    name: "reality_integration.capability_matrix",
    description: "Provider capability matrix (REAL-001)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: { type: "object", properties: { providerId: { type: "string" } } },
    handler: async (args) =>
      args.providerId
        ? getProviderCapabilityMatrixEntry(String(args.providerId)) ?? buildProviderCapabilityMatrix()
        : buildProviderCapabilityMatrix(),
  },
  {
    name: "reality_integration.lifecycle",
    description: "Connection lifecycle standard and transitions (REAL-002)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ transitions: CONNECTION_LIFECYCLE_TRANSITIONS }),
  },
  {
    name: "reality_integration.approval.assess",
    description: "Assess human approval requirement for irreversible action (REAL-003)",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        action: { type: "string" },
        providerId: { type: "string" },
      },
      required: ["action"],
    },
    handler: async (args) =>
      assessApprovalRequired({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        action: String(args.action) as Parameters<typeof assessApprovalRequired>[0]["action"],
        providerId: args.providerId ? String(args.providerId) : undefined,
      }),
  },
  {
    name: "reality_integration.approval.policies",
    description: "List irreversible action approval policies (REAL-003)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: { type: "object", properties: {} },
    handler: async () => ({ policies: listApprovalPolicies() }),
  },
  {
    name: "reality_integration.credential.governance",
    description: "Credential governance summary (REAL-004)",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, credentialsRef: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      if (args.credentialsRef) {
        return verifyCredential(String(args.credentialsRef));
      }
      return buildCredentialGovernanceSummary(workspaceId);
    },
  },
  {
    name: "reality_integration.readiness",
    description: "Reality readiness dashboard for Mission Control (REAL-005)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, companyId: { type: "string" } },
      required: ["companyId"],
    },
    handler: async (args) =>
      buildRealityReadinessDashboard(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.companyId),
      ),
  },
  {
    name: "reality_integration.live_commerce",
    description: "Live Commerce Foundation dashboard (REAL-002A)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => {
      const { buildLiveCommerceFoundationDashboard } = await import("../services/live-commerce-foundation-service.js");
      return buildLiveCommerceFoundationDashboard(args.workspaceId ? String(args.workspaceId) : "ws_empire_1");
    },
  },
  {
    name: "reality_integration.operational_access",
    description: "Operational Access Registry EAR-001 (authoritative external platform access)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
    },
    handler: async (args) => {
      const workspaceId = args.workspaceId ? String(args.workspaceId) : "ws_empire_1";
      const { buildOperationalAccessRegistry, getOperationalAccessRecord } = await import("../services/operational-access-registry-service.js");
      if (args.providerId) {
        return getOperationalAccessRecord(workspaceId, String(args.providerId));
      }
      return buildOperationalAccessRegistry(workspaceId);
    },
  },
  {
    name: "reality_integration.capabilities.verify",
    description: "Verify provider operational capabilities (REAL-002A)",
    module: "reality-integration",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => {
      const { verifyProviderCapabilities } = await import("../services/provider-capability-verification-service.js");
      return verifyProviderCapabilities(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
      );
    },
  },
  {
    name: "reality_integration.activation.assess",
    description: "Assess runtime activation gates (CONNECTED + VERIFIED + founder approved)",
    module: "reality-integration",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" }, providerId: { type: "string" } },
      required: ["providerId"],
    },
    handler: async (args) => {
      const { assessRuntimeActivation } = await import("../services/runtime-activation-service.js");
      return assessRuntimeActivation(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        String(args.providerId),
        args.actor ? String(args.actor) : undefined,
      );
    },
  },
];

export { buildRealityIntegrationDashboard };
