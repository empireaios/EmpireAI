import type { RegisteredTool } from "../../../brain/types.js";
import {
  addIdentityAlias,
  getIdentityEntity,
  initializeIdentityRegistry,
  listIdentityEntities,
  listIdentityHistory,
  registerIdentityEntity,
  removeIdentityAlias,
  resolveIdentity,
  resolveIdentityDisplayName,
  updateIdentityDisplayName,
} from "../services/identity-registry-service.js";

export const identityRegistryTools: RegisteredTool[] = [
  {
    name: "identity_registry.resolve",
    description: "Resolve entity by canonical ID, alias, or display name",
    module: "identity-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        query: { type: "string" },
      },
      required: ["query"],
    },
    handler: async (args) =>
      resolveIdentity(String(args.query), args.workspaceId ? String(args.workspaceId) : undefined),
  },
  {
    name: "identity_registry.get",
    description: "Get identity entity by canonical ID",
    module: "identity-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { canonicalId: { type: "string" } },
      required: ["canonicalId"],
    },
    handler: async (args) => getIdentityEntity(String(args.canonicalId)),
  },
  {
    name: "identity_registry.get_display_name",
    description: "Get current display name for a canonical ID — modules must not hardcode names",
    module: "identity-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        workspaceId: { type: "string" },
      },
      required: ["canonicalId"],
    },
    handler: async (args) => ({
      canonicalId: String(args.canonicalId),
      displayName: resolveIdentityDisplayName(
        String(args.canonicalId),
        args.workspaceId ? String(args.workspaceId) : undefined,
      ),
    }),
  },
  {
    name: "identity_registry.register",
    description: "Register a new identity entity with canonical ID",
    module: "identity-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        entityType: { type: "string" },
        displayName: { type: "string" },
        aliases: { type: "array", items: { type: "string" } },
        workspaceId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["canonicalId", "entityType", "displayName"],
    },
    handler: async (args) =>
      registerIdentityEntity({
        canonicalId: String(args.canonicalId),
        entityType: args.entityType as Parameters<typeof registerIdentityEntity>[0]["entityType"],
        displayName: String(args.displayName),
        aliases: args.aliases as string[] | undefined,
        workspaceId: args.workspaceId ? String(args.workspaceId) : undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "identity_registry.update_display_name",
    description: "Update display name without changing canonical ID or architecture",
    module: "identity-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        displayName: { type: "string" },
        actor: { type: "string" },
      },
      required: ["canonicalId", "displayName"],
    },
    handler: async (args) =>
      updateIdentityDisplayName(
        String(args.canonicalId),
        String(args.displayName),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "identity_registry.add_alias",
    description: "Add alias to identity entity",
    module: "identity-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        alias: { type: "string" },
        actor: { type: "string" },
      },
      required: ["canonicalId", "alias"],
    },
    handler: async (args) =>
      addIdentityAlias(
        String(args.canonicalId),
        String(args.alias),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "identity_registry.remove_alias",
    description: "Remove alias from identity entity",
    module: "identity-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        alias: { type: "string" },
        actor: { type: "string" },
      },
      required: ["canonicalId", "alias"],
    },
    handler: async (args) =>
      removeIdentityAlias(
        String(args.canonicalId),
        String(args.alias),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "identity_registry.list",
    description: "List identity registry entities",
    module: "identity-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      listIdentityEntities(args.workspaceId ? String(args.workspaceId) : undefined),
  },
  {
    name: "identity_registry.list_history",
    description: "List identity change history for canonical ID",
    module: "identity-registry",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        canonicalId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["canonicalId"],
    },
    handler: async (args) =>
      listIdentityHistory(
        String(args.canonicalId),
        args.limit ? Number(args.limit) : undefined,
      ),
  },
  {
    name: "identity_registry.initialize",
    description: "Initialize default Empire identity entities",
    module: "identity-registry",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      entities: initializeIdentityRegistry(args.workspaceId ? String(args.workspaceId) : undefined),
    }),
  },
];
