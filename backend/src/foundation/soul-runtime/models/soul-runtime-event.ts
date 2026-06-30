import { z } from "zod";

import { SOUL_RUNTIME_MEMORY_KEYS } from "../../soul-file/models/soul-file-document.js";

export const SOUL_RUNTIME_EVENT_SOURCES = [
  "audit",
  "api",
  "brain-tool",
  "system",
] as const;

export type SoulRuntimeEventSource = (typeof SOUL_RUNTIME_EVENT_SOURCES)[number];

export const soulRuntimeEventSchema = z.object({
  eventId: z.string().min(1),
  workspaceId: z.string().min(1),
  memoryKey: z.enum(SOUL_RUNTIME_MEMORY_KEYS),
  title: z.string().min(1),
  summary: z.string().min(1),
  source: z.enum(SOUL_RUNTIME_EVENT_SOURCES),
  correlationId: z.string().optional(),
  auditAction: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  soulFileVersion: z.number().int().min(1).optional(),
  recordedAt: z.string().datetime({ offset: true }),
});

export type SoulRuntimeEvent = z.infer<typeof soulRuntimeEventSchema>;

export const soulRuntimeCaptureInputSchema = z.object({
  workspaceId: z.string().min(1),
  memoryKey: z.enum(SOUL_RUNTIME_MEMORY_KEYS),
  title: z.string().min(1),
  summary: z.string().min(1),
  source: z.enum(SOUL_RUNTIME_EVENT_SOURCES).default("api"),
  correlationId: z.string().optional(),
  auditAction: z.string().optional(),
  payload: z.record(z.unknown()).default({}),
  actor: z.string().optional(),
  operationalState: z
    .object({
      activeMissions: z.array(z.string()).optional(),
      completedMissions: z.array(z.string()).optional(),
      grandKingsAccountStatus: z.string().optional(),
    })
    .optional(),
  continuity: z.object({ narrative: z.string().optional() }).optional(),
  metadata: z.record(z.string()).optional(),
});

export type SoulRuntimeCaptureInput = z.infer<typeof soulRuntimeCaptureInputSchema>;
