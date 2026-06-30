import type { RegisteredTool } from "../../../brain/types.js";
import type { DoctrineExecutablePolicy } from "../models/doctrine.js";
import {
  deprecateDoctrine,
  getDoctrine,
  getExecutableDoctrinePolicies,
  initializeDoctrines,
  listDoctrineLifecycle,
  listDoctrines,
  listWorkspaceDoctrineLifecycle,
  modifyDoctrine,
  publishDoctrine,
  recordDoctrineReference,
  supersedeDoctrine,
} from "../services/doctrine-engine-service.js";

export const doctrineTools: RegisteredTool[] = [
  {
    name: "doctrine.list",
    description: "List Empire doctrines for workspace",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string" },
      },
    },
    handler: async (args) => ({
      doctrines: listDoctrines(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.status as Parameters<typeof listDoctrines>[1],
      ),
    }),
  },
  {
    name: "doctrine.get",
    description: "Get doctrine by ID",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { doctrineId: { type: "string" } },
      required: ["doctrineId"],
    },
    handler: async (args) => getDoctrine(String(args.doctrineId)),
  },
  {
    name: "doctrine.publish",
    description: "Publish a new Empire doctrine",
    module: "doctrine-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        doctrineId: { type: "string" },
        title: { type: "string" },
        statement: { type: "string" },
        executablePolicy: { type: "object" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["doctrineId", "title", "statement"],
    },
    handler: async (args) =>
      publishDoctrine({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        doctrineId: String(args.doctrineId),
        title: String(args.title),
        statement: String(args.statement),
        executablePolicy: args.executablePolicy as DoctrineExecutablePolicy | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "doctrine.modify",
    description: "Modify an active doctrine — increments version and records MODIFIED lifecycle",
    module: "doctrine-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        doctrineId: { type: "string" },
        title: { type: "string" },
        statement: { type: "string" },
        executablePolicy: { type: "object" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["doctrineId"],
    },
    handler: async (args) =>
      modifyDoctrine({
        doctrineId: String(args.doctrineId),
        title: args.title ? String(args.title) : undefined,
        statement: args.statement ? String(args.statement) : undefined,
        executablePolicy: args.executablePolicy as DoctrineExecutablePolicy | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "doctrine.deprecate",
    description: "Deprecate a doctrine — stops enforcement but preserves history",
    module: "doctrine-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        doctrineId: { type: "string" },
        reason: { type: "string" },
        actor: { type: "string" },
      },
      required: ["doctrineId"],
    },
    handler: async (args) =>
      deprecateDoctrine(
        String(args.doctrineId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "doctrine.supersede",
    description: "Mark doctrine as superseded by another doctrine",
    module: "doctrine-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        doctrineId: { type: "string" },
        supersededBy: { type: "string" },
        actor: { type: "string" },
      },
      required: ["doctrineId", "supersededBy"],
    },
    handler: async (args) =>
      supersedeDoctrine(
        String(args.doctrineId),
        String(args.supersededBy),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "doctrine.reference",
    description: "Record that a doctrine was referenced during an operation",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        doctrineId: { type: "string" },
        module: { type: "string" },
        action: { type: "string" },
        actor: { type: "string" },
        correlationId: { type: "string" },
      },
      required: ["doctrineId"],
    },
    handler: async (args) =>
      recordDoctrineReference(String(args.doctrineId), {
        module: args.module ? String(args.module) : undefined,
        action: args.action ? String(args.action) : undefined,
        actor: args.actor ? String(args.actor) : undefined,
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
      }),
  },
  {
    name: "doctrine.list_lifecycle",
    description: "List lifecycle events for a doctrine (CREATED, MODIFIED, DEPRECATED, SUPERSEDED, REFERENCED)",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        doctrineId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["doctrineId"],
    },
    handler: async (args) => ({
      lifecycle: listDoctrineLifecycle(
        String(args.doctrineId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "doctrine.list_workspace_lifecycle",
    description: "List all doctrine lifecycle events for workspace",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        limit: { type: "number" },
      },
    },
    handler: async (args) => ({
      lifecycle: listWorkspaceDoctrineLifecycle(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "doctrine.list_executable_policies",
    description: "List governance policies compiled from active doctrines",
    module: "doctrine-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      policies: getExecutableDoctrinePolicies(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
      ),
    }),
  },
  {
    name: "doctrine.initialize",
    description: "Initialize default Empire doctrines",
    module: "doctrine-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      doctrines: initializeDoctrines(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
