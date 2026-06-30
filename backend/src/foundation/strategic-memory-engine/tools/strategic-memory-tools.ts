import type { RegisteredTool } from "../../../brain/types.js";
import type { StrategicMemoryCategory } from "../models/strategic-memory.js";
import {
  archiveStrategicMemory,
  getStrategicMemory,
  getStrategicMemorySummary,
  initializeStrategicMemory,
  listStrategicMemories,
  listStrategicMemoryLifecycle,
  modifyStrategicMemory,
  recallStrategicMemories,
  recordStrategicMemory,
  supersedeStrategicMemory,
} from "../services/strategic-memory-engine-service.js";

export const strategicMemoryTools: RegisteredTool[] = [
  {
    name: "strategic_memory.list",
    description: "List long-term strategic memories for the Empire",
    module: "strategic-memory-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        category: { type: "string" },
        status: { type: "string" },
      },
    },
    handler: async (args) => ({
      memories: listStrategicMemories(args.workspaceId ? String(args.workspaceId) : "ws_empire_1", {
        category: args.category as StrategicMemoryCategory | undefined,
        status: args.status as "ACTIVE" | "ARCHIVED" | "SUPERSEDED" | undefined,
      }),
    }),
  },
  {
    name: "strategic_memory.get",
    description: "Get strategic memory by ID",
    module: "strategic-memory-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { memoryId: { type: "string" } },
      required: ["memoryId"],
    },
    handler: async (args) => getStrategicMemory(String(args.memoryId)),
  },
  {
    name: "strategic_memory.get_summary",
    description: "Get strategic memory summary by category",
    module: "strategic-memory-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) =>
      getStrategicMemorySummary(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
  },
  {
    name: "strategic_memory.record",
    description: "Record a long-term strategic memory (failure, success, lesson, etc.)",
    module: "strategic-memory-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        memoryId: { type: "string" },
        category: { type: "string" },
        title: { type: "string" },
        insight: { type: "string" },
        context: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        source: { type: "string" },
        importance: { type: "number" },
        metadata: { type: "object" },
        actor: { type: "string" },
      },
      required: ["memoryId", "category", "title", "insight"],
    },
    handler: async (args) =>
      recordStrategicMemory({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        memoryId: String(args.memoryId),
        category: args.category as StrategicMemoryCategory,
        title: String(args.title),
        insight: String(args.insight),
        context: args.context ? String(args.context) : undefined,
        tags: args.tags as string[] | undefined,
        source: args.source ? String(args.source) : undefined,
        importance: args.importance ? Number(args.importance) : undefined,
        metadata: args.metadata as Record<string, string> | undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "strategic_memory.recall",
    description: "Recall strategic memories by category, query, or tags",
    module: "strategic-memory-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        category: { type: "string" },
        query: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        limit: { type: "number" },
        actor: { type: "string" },
      },
    },
    handler: async (args) => ({
      memories: recallStrategicMemories({
        workspaceId: args.workspaceId ? String(args.workspaceId) : "ws_empire_1",
        category: args.category as StrategicMemoryCategory | undefined,
        query: args.query ? String(args.query) : undefined,
        tags: args.tags as string[] | undefined,
        limit: args.limit ? Number(args.limit) : undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
    }),
  },
  {
    name: "strategic_memory.modify",
    description: "Modify a strategic memory entry",
    module: "strategic-memory-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        memoryId: { type: "string" },
        title: { type: "string" },
        insight: { type: "string" },
        context: { type: "string" },
        tags: { type: "array", items: { type: "string" } },
        importance: { type: "number" },
        actor: { type: "string" },
      },
      required: ["memoryId"],
    },
    handler: async (args) =>
      modifyStrategicMemory({
        memoryId: String(args.memoryId),
        title: args.title ? String(args.title) : undefined,
        insight: args.insight ? String(args.insight) : undefined,
        context: args.context ? String(args.context) : undefined,
        tags: args.tags as string[] | undefined,
        importance: args.importance ? Number(args.importance) : undefined,
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "strategic_memory.archive",
    description: "Archive a strategic memory — record preserved",
    module: "strategic-memory-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        memoryId: { type: "string" },
        reason: { type: "string" },
        actor: { type: "string" },
      },
      required: ["memoryId"],
    },
    handler: async (args) =>
      archiveStrategicMemory(
        String(args.memoryId),
        args.actor ? String(args.actor) : undefined,
        args.reason ? String(args.reason) : undefined,
      ),
  },
  {
    name: "strategic_memory.supersede",
    description: "Mark strategic memory as superseded by a newer memory",
    module: "strategic-memory-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        memoryId: { type: "string" },
        supersededBy: { type: "string" },
        actor: { type: "string" },
      },
      required: ["memoryId", "supersededBy"],
    },
    handler: async (args) =>
      supersedeStrategicMemory(
        String(args.memoryId),
        String(args.supersededBy),
        args.actor ? String(args.actor) : undefined,
      ),
  },
  {
    name: "strategic_memory.list_lifecycle",
    description: "List lifecycle events for a strategic memory",
    module: "strategic-memory-engine",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: {
        memoryId: { type: "string" },
        limit: { type: "number" },
      },
      required: ["memoryId"],
    },
    handler: async (args) => ({
      lifecycle: listStrategicMemoryLifecycle(
        String(args.memoryId),
        args.limit ? Number(args.limit) : undefined,
      ),
    }),
  },
  {
    name: "strategic_memory.initialize",
    description: "Initialize default Empire strategic memories",
    module: "strategic-memory-engine",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: { workspaceId: { type: "string" } },
    },
    handler: async (args) => ({
      memories: initializeStrategicMemory(args.workspaceId ? String(args.workspaceId) : "ws_empire_1"),
    }),
  },
];
