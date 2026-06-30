import type { RegisteredTool } from "../../../brain/types.js";
import type { SoulRuntimeCaptureInput } from "../models/soul-runtime-event.js";
import {
  captureSoulRuntimeEvent,
  getSoulRuntimeEvent,
  listSoulRuntimeEvents,
} from "../services/soul-runtime-engine.js";

export const soulRuntimeTools: RegisteredTool[] = [
  {
    name: "soul_runtime.capture",
    description:
      "Capture a meaningful Empire event into the Soul File runtime memory (mission, doctrine, KPI, etc.)",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        memoryKey: {
          type: "string",
          enum: [
            "missionCompletions",
            "doctrineUpdates",
            "architectureUpdates",
            "businessMilestones",
            "capitalChanges",
            "lessonsLearned",
            "promises",
            "kpis",
            "futureRoadmap",
          ],
        },
        title: { type: "string" },
        summary: { type: "string" },
        correlationId: { type: "string" },
        payload: { type: "object" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "memoryKey", "title", "summary"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: args.memoryKey as SoulRuntimeCaptureInput["memoryKey"],
        title: String(args.title),
        summary: String(args.summary),
        source: "brain-tool",
        correlationId: args.correlationId ? String(args.correlationId) : undefined,
        payload: (args.payload as Record<string, unknown>) ?? {},
        actor: args.actor ? String(args.actor) : undefined,
      }),
  },
  {
    name: "soul_runtime.capture_mission_completion",
    description: "Record mission completion in Soul File runtime memory",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        missionId: { type: "string" },
        summary: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "missionId"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: "missionCompletions",
        title: `Mission ${String(args.missionId)} Complete`,
        summary: args.summary ? String(args.summary) : `Mission ${String(args.missionId)} completed`,
        source: "brain-tool",
        actor: args.actor ? String(args.actor) : undefined,
        payload: { missionId: String(args.missionId) },
        operationalState: {
          completedMissions: [String(args.missionId)],
        },
      }),
  },
  {
    name: "soul_runtime.capture_doctrine_update",
    description: "Record doctrine update in Soul File runtime memory",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "title", "summary"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: "doctrineUpdates",
        title: String(args.title),
        summary: String(args.summary),
        source: "brain-tool",
        actor: args.actor ? String(args.actor) : undefined,
        payload: {},
      }),
  },
  {
    name: "soul_runtime.capture_lesson",
    description: "Record a lesson learned in Soul File runtime memory",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "title", "summary"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: "lessonsLearned",
        title: String(args.title),
        summary: String(args.summary),
        source: "brain-tool",
        actor: args.actor ? String(args.actor) : undefined,
        payload: {},
      }),
  },
  {
    name: "soul_runtime.capture_promise",
    description: "Record a promise or commitment in Soul File runtime memory",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "title", "summary"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: "promises",
        title: String(args.title),
        summary: String(args.summary),
        source: "brain-tool",
        actor: args.actor ? String(args.actor) : undefined,
        payload: {},
      }),
  },
  {
    name: "soul_runtime.capture_roadmap_item",
    description: "Record a future roadmap item in Soul File runtime memory",
    module: "soul-runtime",
    authorityLevel: "L2",
    parameters: {
      type: "object",
      properties: {
        workspaceId: { type: "string" },
        title: { type: "string" },
        summary: { type: "string" },
        actor: { type: "string" },
      },
      required: ["workspaceId", "title", "summary"],
    },
    handler: async (args) =>
      captureSoulRuntimeEvent({
        workspaceId: String(args.workspaceId),
        memoryKey: "futureRoadmap",
        title: String(args.title),
        summary: String(args.summary),
        source: "brain-tool",
        actor: args.actor ? String(args.actor) : undefined,
        payload: {},
      }),
  },
  {
    name: "soul_runtime.list_events",
    description: "List Soul Runtime events captured for a workspace",
    module: "soul-runtime",
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
      listSoulRuntimeEvents(
        String(args.workspaceId),
        args.limit ? Number(args.limit) : undefined,
      ),
  },
  {
    name: "soul_runtime.get_event",
    description: "Get Soul Runtime event by ID",
    module: "soul-runtime",
    authorityLevel: "L1",
    parameters: {
      type: "object",
      properties: { eventId: { type: "string" } },
      required: ["eventId"],
    },
    handler: async (args) => getSoulRuntimeEvent(String(args.eventId)),
  },
];
