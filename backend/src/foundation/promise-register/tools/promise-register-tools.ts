import type { RegisteredTool } from "../../../brain/types.js";
import {
  addPromiseDependency,
  fulfillPromise,
  getPromise,
  getPromiseDependencyGraph,
  initializePromiseRegister,
  listPromiseLifecycle,
  listPromises,
  listWorkspacePromiseLifecycle,
  markPromiseObsolete,
  modifyPromise,
  registerPromise,
  removePromiseDependency,
  supersedePromise,
  updatePromiseProgress,
} from "../services/promise-register-service.js";

export const promiseRegisterTools: RegisteredTool[] = [
  {
    name: "promise_register.list",
    description: "List every promise made to the King — no promise disappears from the register",
    module: "promise-register",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        status: { type: "string" },
      },
    },
    handler: async (args) => ({
      promises: listPromises(
        args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        args.status as Parameters<typeof listPromises>[1],
      ),
    }),
  },
  {
    name: "promise_register.get",
    description: "Get promise by ID",
    module: "promise-register",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { promiseId: { type: "string" } },
      required: ["promiseId"],
    },
    handler: async (args) => getPromise(String(args.promiseId)),
  },
  {
    name: "promise_register.register",
    description: "Register a new promise made to the King",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        promiseId: { type: "string" },
        title: { type: "string" },
        statement: { type: "string" },
        madeToKingId: { type: "string" },
        dependencies: { type: "array", items: { type: "string" } },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["promiseId", "title", "statement"],
    },
    handler: async (args) =>
      registerPromise({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        promiseId: String(args.promiseId),
        title: String(args.title),
        statement: String(args.statement),
        madeToKingId: args.madeToKingId ? String(args.madeToKingId) : undefined,
        dependencies: args.dependencies as string[] | undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "promise_register.update_progress",
    description: "Update promise progress and status",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        progressPercent: { type: "number" },
        progressNotes: { type: "string" },
        status: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId", "progressPercent"],
    },
    handler: async (args) =>
      updatePromiseProgress({
        promiseId: String(args.promiseId),
        progressPercent: Number(args.progressPercent),
        progressNotes: args.progressNotes ? String(args.progressNotes) : undefined,
        status: args.status as "PENDING" | "IN_PROGRESS" | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "promise_register.modify",
    description: "Modify promise title or statement",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        title: { type: "string" },
        statement: { type: "string" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["promiseId"],
    },
    handler: async (args) =>
      modifyPromise({
        promiseId: String(args.promiseId),
        title: args.title ? String(args.title) : undefined,
        statement: args.statement ? String(args.statement) : undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "promise_register.add_dependency",
    description: "Add dependency between promises",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        dependencyId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId", "dependencyId"],
    },
    handler: async (args) =>
      addPromiseDependency(
        String(args.promiseId),
        String(args.dependencyId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "promise_register.remove_dependency",
    description: "Remove dependency from promise",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        dependencyId: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId", "dependencyId"],
    },
    handler: async (args) =>
      removePromiseDependency(
        String(args.promiseId),
        String(args.dependencyId),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "promise_register.fulfill",
    description: "Mark promise as fulfilled — requires dependencies fulfilled first",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        notes: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId"],
    },
    handler: async (args) =>
      fulfillPromise(
        String(args.promiseId),
        args.actor ? String(args.actor) : undefined,
        args.notes ? String(args.notes) : undefined,
      ),
  },
  {
    name: "promise_register.mark_obsolete",
    description: "Mark promise as obsolete — promise remains in register",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        reason: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId"],
    },
    handler: async (args) =>
      markPromiseObsolete(
        String(args.promiseId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "promise_register.supersede",
    description: "Mark promise as superseded by another promise",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        supersededBy: { type: "string" },
        actor: { type: "string" },
      },
      required: ["promiseId", "supersededBy"],
    },
    handler: async (args) =>
      supersedePromise(
        String(args.promiseId),
        String(args.supersededBy),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "promise_register.list_lifecycle",
    description: "List lifecycle events for a promise",
    module: "promise-register",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        promiseId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["promiseId"],
    },
    handler: async (args) => ({
      lifecycle: listPromiseLifecycle(
        String(args.promiseId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "promise_register.dependency_graph",
    description: "Get promise dependency graph for workspace",
    module: "promise-register",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      getPromiseDependencyGraph(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "promise_register.initialize",
    description: "Initialize default promises to the King",
    module: "promise-register",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      promises: initializePromiseRegister(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
